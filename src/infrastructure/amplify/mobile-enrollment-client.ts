import { generateClient } from 'aws-amplify/api';
import { configureAmplify } from './configure-amplify';
import { logDev, logDevError } from '../../config/dev-log';

type EnrollmentGraphqlInput = {
  query: string;
  variables?: Record<string, unknown>;
  authMode?: string;
};

type EnrollmentGraphqlClient = {
  graphql: (input: EnrollmentGraphqlInput) => Promise<unknown>;
};

let client: EnrollmentGraphqlClient | null = null;

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
    logDevError('[mobile-enrollment-client] graphql_exception', error);
    throw error;
  }

  logDev('[mobile-enrollment-client] response', result.data ?? null);

  const hasUsableData = result.data != null;
  if (result.errors?.length) {
    logDevError('[mobile-enrollment-client] graphql_errors', result.errors);
    if (!hasUsableData) {
      throw new Error(
        result.errors.map((e) => e.message ?? 'Error de conexión con el servidor').join('; ')
      );
    }
    // AppSync puede devolver errores de serialización aunque la mutación ya persistió en DynamoDB.
  }
  if (!result.data) {
    throw new Error('Respuesta inválida del servidor.');
  }
  return result.data;
}
