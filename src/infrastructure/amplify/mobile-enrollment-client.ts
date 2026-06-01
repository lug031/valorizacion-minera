import { generateClient } from 'aws-amplify/api';
import { configureAmplify } from './configure-amplify';
import { readPublicEnv } from '../../config/runtime-env';

type EnrollmentGraphqlInput = {
  query: string;
  variables?: Record<string, unknown>;
  authMode?: string;
};

type EnrollmentGraphqlClient = {
  graphql: (input: EnrollmentGraphqlInput) => Promise<unknown>;
};

let client: EnrollmentGraphqlClient | null = null;

function maskApiKey(apiKey?: string): string {
  if (!apiKey) return 'missing';
  return `${apiKey.slice(0, 6)}...`;
}

function sanitizeVariables(variables?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!variables) return undefined;
  const clone: Record<string, unknown> = { ...variables };
  if (typeof clone.password === 'string') {
    clone.password = '***REDACTED***';
  }
  return clone;
}

export function getMobileEnrollmentClient(): EnrollmentGraphqlClient {
  configureAmplify();
  if (!client) {
    client = generateClient() as EnrollmentGraphqlClient;
  }
  return client;
}
export async function runEnrollmentGraphql<TData>(
  query: string,
  variables?: Record<string, unknown>
): Promise<TData> {
  const authMode = 'apiKey';
  const endpoint = readPublicEnv('EXPO_PUBLIC_AWS_APPSYNC_ENDPOINT', 'EXPO_PUBLIC_APPSYNC_ENDPOINT');
  const apiKey = readPublicEnv('EXPO_PUBLIC_AWS_APPSYNC_API_KEY', 'EXPO_PUBLIC_APPSYNC_API_KEY');
  const safeVariables = sanitizeVariables(variables);

  console.log(
    '[mobile-enrollment-client] request',
    JSON.stringify({
      endpoint,
      authMode,
      apiKeyPrefix: maskApiKey(apiKey),
      query,
      variables: safeVariables,
    })
  );

  let result: {
    data?: TData;
    errors?: Array<{ message?: string; [key: string]: unknown }>;
  };

  try {
    result = (await getMobileEnrollmentClient().graphql({
      query,
      variables,
      authMode,
    })) as {
      data?: TData;
      errors?: Array<{ message?: string; [key: string]: unknown }>;
    };
  } catch (error) {
    console.error(
      '[mobile-enrollment-client] graphql_exception',
      JSON.stringify({
        endpoint,
        authMode,
        apiKeyPrefix: maskApiKey(apiKey),
        query,
        variables: safeVariables,
        errorName: error instanceof Error ? error.name : 'UnknownError',
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      })
    );
    throw error;
  }

  console.log(
    '[mobile-enrollment-client] response',
    JSON.stringify({
      endpoint,
      authMode,
      apiKeyPrefix: maskApiKey(apiKey),
      data: result.data ?? null,
      errors: result.errors ?? [],
    })
  );

  if (result.errors?.length) {
    console.error(
      '[mobile-enrollment-client] graphql_errors',
      JSON.stringify({
        endpoint,
        authMode,
        apiKeyPrefix: maskApiKey(apiKey),
        errors: result.errors,
      })
    );
    throw new Error(result.errors.map((e) => e.message ?? 'Error GraphQL').join('; '));
  }
  if (!result.data) {
    throw new Error('Respuesta inválida de AppSync.');
  }
  return result.data;
}
