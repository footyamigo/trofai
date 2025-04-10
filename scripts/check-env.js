// Script to verify environment variables during build
console.log('🔍 Checking environment variables...\n');

const requiredVars = [
  'FIRECRAWL_API_KEY',
  'BANNERBEAR_API_KEY',
  'ACCESS_KEY_ID',
  'SECRET_ACCESS_KEY',
  'REGION'
];

const optionalVars = [
  'BANNERBEAR_TEMPLATE_UID',
  'BANNERBEAR_TEMPLATE_SET_UID',
  'BANNERBEAR_WEBHOOK_URL',
  'NEXT_PUBLIC_S3_BUCKET',
  'USE_FIRECRAWL'
];

console.log('Environment Variables Available:', 
  Object.keys(process.env)
    .filter(key => !key.includes('SECRET') && !key.includes('KEY'))
    .join(', ')
);

console.log('\n📋 Required Variables Status:');
const missingRequired = [];
requiredVars.forEach(varName => {
  const isSet = !!process.env[varName];
  console.log(`${isSet ? '✅' : '❌'} ${varName}: ${isSet ? 'Set' : 'Not Set'}`);
  if (!isSet) missingRequired.push(varName);
});

console.log('\n📋 Optional Variables Status:');
optionalVars.forEach(varName => {
  const isSet = !!process.env[varName];
  console.log(`${isSet ? '✅' : '⚠️'} ${varName}: ${isSet ? 'Set' : 'Not Set'}`);
});

if (missingRequired.length > 0) {
  console.error('\n❌ Error: Missing required environment variables:');
  missingRequired.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
} 