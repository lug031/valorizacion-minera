import { getSqlExecutor } from '../db/database';
import { createSqliteConfigRepository } from './sqlite-config-repository';
import { createSqliteDraftRepository } from './sqlite-draft-repository';
import { createSqliteUserRepository } from './sqlite-user-repository';
import { createSqliteDeviceRepository } from './sqlite-device-repository';
import { createSqliteValuationRepository } from './sqlite-valuation-repository';
import { createValuationAppService } from '../../services/valuation/valuation-app-service';
import type { ConfigRepository } from './config-repository';
import type { ValuationRepository } from './valuation-repository';
import type { UserRepository } from './sqlite-user-repository';
import type { DraftRepository } from './sqlite-draft-repository';

let initialized = false;

export const configRepository: ConfigRepository = createSqliteConfigRepository(getSqlExecutor);
export const valuationRepository: ValuationRepository =
  createSqliteValuationRepository(getSqlExecutor);

export const valuationAppService = createValuationAppService(valuationRepository);
export const userRepository: UserRepository = createSqliteUserRepository(getSqlExecutor);
export const deviceRepository = createSqliteDeviceRepository(getSqlExecutor);
export const draftRepository: DraftRepository = createSqliteDraftRepository(getSqlExecutor);

/** Inicializa SQLite, migraciones y seed (idempotente). */
export async function initDataLayer(): Promise<void> {
  if (initialized) return;
  await getSqlExecutor();
  initialized = true;
}

export function isDataLayerReady(): boolean {
  return initialized;
}
