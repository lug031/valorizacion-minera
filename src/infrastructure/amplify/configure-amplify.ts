import { Amplify } from 'aws-amplify';
import { requirePublicEnv } from '../../config/runtime-env';

let configured = false;

export function configureAmplify(): void {
  if (configured) return;

  const endpoint = requirePublicEnv(
    'EXPO_PUBLIC_AWS_APPSYNC_ENDPOINT',
    'EXPO_PUBLIC_APPSYNC_ENDPOINT'
  );
  const region = requirePublicEnv('EXPO_PUBLIC_AWS_REGION');
  const userPoolId = requirePublicEnv(
    'EXPO_PUBLIC_AWS_USER_POOL_ID',
    'EXPO_PUBLIC_USER_POOL_ID'
  );
  const userPoolClientId = requirePublicEnv(
    'EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID',
    'EXPO_PUBLIC_USER_POOL_CLIENT_ID'
  );

  Amplify.configure({
    API: {
      GraphQL: {
        endpoint,
        region,
        defaultAuthMode: 'userPool',
      },
    },
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
      },
    },
  });

  configured = true;
}
