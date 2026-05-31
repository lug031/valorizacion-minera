import { generateClient } from 'aws-amplify/api';
import { configureAmplify } from './configure-amplify';

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
  const result = (await getMobileEnrollmentClient().graphql({
    query,
    variables,
    authMode: 'apiKey',
  })) as {
    data?: TData;
    errors?: Array<{ message?: string }>;
  };

  if (result.errors?.length) {
    throw new Error(result.errors.map((e) => e.message ?? 'Error GraphQL').join('; '));
  }
  if (!result.data) {
    throw new Error('Respuesta inválida de AppSync.');
  }
  return result.data;
}
