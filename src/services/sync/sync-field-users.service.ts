import type { AppActor } from '../../domain/models/app-actor';
import {
  canSyncMasterConfig,
  SYNC_ACCESS_DENIED_MESSAGE,
} from '../../domain/identity/sync-access';
import { userRepository } from '../../data/repositories';
import { ensureSyncIdentity, getMobileDataClient } from '../../infrastructure/amplify/sync-identity';
import type { FieldUserMobileSyncRow, SyncFieldUsersResult } from './sync-field-users.types';

const LIST_FIELD_USERS_FOR_MOBILE = /* GraphQL */ `
  query ListFieldUsersForMobile {
    listFieldUsersForMobile {
      id
      username
      displayName
      role
      isActive
      notes
      metadataJson
      mobilePasswordHash
      updatedAt
    }
  }
`;

function mapGraphQLErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : 'Error desconocido de sincronización';
  const lowered = msg.toLowerCase();
  if (
    lowered.includes('network') ||
    lowered.includes('offline') ||
    lowered.includes('timed out') ||
    lowered.includes('internet')
  ) {
    return 'Sin conexión a internet. Se mantienen los usuarios locales.';
  }
  if (lowered.includes('not authorized') || lowered.includes('unauthorized')) {
    return 'No tiene permisos para sincronizar usuarios de campo.';
  }
  return msg;
}

function parseFieldUsers(data: unknown): FieldUserMobileSyncRow[] {
  const root = data as { listFieldUsersForMobile?: FieldUserMobileSyncRow[] | null };
  const rows = root.listFieldUsersForMobile ?? [];
  return rows.filter(
    (row): row is FieldUserMobileSyncRow =>
      Boolean(row?.id && row.username && row.mobilePasswordHash && row.role)
  );
}

async function fetchFieldUsersFromCloud(): Promise<FieldUserMobileSyncRow[]> {
  await ensureSyncIdentity();
  const client = getMobileDataClient();
  const result = (await client.graphql({ query: LIST_FIELD_USERS_FOR_MOBILE })) as {
    data?: { listFieldUsersForMobile?: FieldUserMobileSyncRow[] };
    errors?: Array<{ message?: string }>;
  };

  if (result.errors?.length) {
    throw new Error(result.errors.map((e) => e.message ?? 'Error GraphQL').join('; '));
  }
  if (!result.data) {
    throw new Error('Respuesta inválida de AppSync al sincronizar usuarios de campo.');
  }

  return parseFieldUsers(result.data);
}

export async function syncFieldUsers(actor: AppActor): Promise<SyncFieldUsersResult> {
  if (!canSyncMasterConfig(actor.role)) {
    throw new Error(SYNC_ACCESS_DENIED_MESSAGE);
  }

  try {
    const cloudUsers = await fetchFieldUsersFromCloud();
    const now = new Date().toISOString();

    const syncResult = await userRepository.syncProvisionedUsers(
      cloudUsers.map((row) => ({
        cloudUserId: row.id,
        username: row.username.trim().toLowerCase(),
        displayName: row.displayName.trim() || row.username,
        role: row.role,
        isActive: row.isActive !== false,
        passwordHash: row.mobilePasswordHash,
        provisionedAt: row.updatedAt ?? now,
      }))
    );

    return {
      ...syncResult,
      lastSyncAt: now,
    };
  } catch (err) {
    throw new Error(mapGraphQLErrorMessage(err));
  }
}
