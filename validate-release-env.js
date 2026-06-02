const REQUIRED_KEYS = [
  'EXPO_PUBLIC_AWS_REGION',
  'EXPO_PUBLIC_AWS_USER_POOL_ID',
  'EXPO_PUBLIC_AWS_USER_POOL_CLIENT_ID',
  'EXPO_PUBLIC_AWS_APPSYNC_ENDPOINT',
  'EXPO_PUBLIC_AWS_APPSYNC_API_KEY',
];

const BLOCKED_TRUE_FLAGS = ['EXPO_PUBLIC_ENABLE_DEV_SEED'];
const BLOCKED_FALSE_FLAGS = ['EXPO_PUBLIC_REQUIRE_DEVICE_ENROLLMENT'];

function readEnv(key) {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
}

function looksLikeDemoValue(value) {
  const lowered = value.toLowerCase();
  return (
    lowered.includes('demo') ||
    lowered.includes('test') ||
    lowered.includes('example') ||
    lowered === 'admin' ||
    lowered === 'admin123' ||
    lowered === 'operador' ||
    lowered === 'operador123'
  );
}

function isTruthyFlag(value) {
  const lowered = value.toLowerCase();
  return lowered === '1' || lowered === 'true' || lowered === 'yes';
}

function isFalsyFlag(value) {
  const lowered = value.toLowerCase();
  return lowered === '0' || lowered === 'false' || lowered === 'no';
}

function validateReleaseEnv() {
  const errors = [];

  for (const key of REQUIRED_KEYS) {
    const value = readEnv(key);
    if (!value) {
      errors.push(`Falta variable requerida: ${key}`);
      continue;
    }
    if (looksLikeDemoValue(value)) {
      errors.push(`Valor no permitido en release para ${key}: parece credencial demo/test`);
    }
  }

  for (const key of BLOCKED_TRUE_FLAGS) {
    const value = readEnv(key);
    if (value && isTruthyFlag(value)) {
      errors.push(`${key}=true no está permitido para release`);
    }
  }

  for (const key of BLOCKED_FALSE_FLAGS) {
    const value = readEnv(key);
    if (value && isFalsyFlag(value)) {
      errors.push(`${key}=false no está permitido para release`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ Validación de release falló:');
    for (const err of errors) console.error(`- ${err}`);
    process.exit(1);
  }

  console.log('✅ Validación de release OK');
}

if (require.main === module) {
  validateReleaseEnv();
}

module.exports = {
  validateReleaseEnv,
};
