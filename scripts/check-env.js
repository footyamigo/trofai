// Script to verify environment variables during build
require('dotenv').config();

console.log('🔍 Starting environment variable check...\n');

// Print current working directory and available files
console.log('Current directory:', process.cwd());
console.log('Files in directory:', require('fs').readdirSync(process.cwd()));

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

// Print all environment variables (excluding sensitive ones)
console.log('\n📋 All Environment Variables:');
Object.keys(process.env)
  .filter(key => !key.includes('SECRET') && !key.includes('KEY') && !key.includes('PASSWORD'))
  .sort()
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });

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

// Check for .env file
try {
  const envFile = require('fs').readFileSync('.env', 'utf8');
  console.log('\n📋 .env file exists with', envFile.split('\n').length, 'lines');
} catch (error) {
  console.log('\n⚠️ No .env file found');
}

if (missingRequired.length > 0) {
  console.error('\n❌ Error: Missing required environment variables:');
  missingRequired.forEach(varName => console.error(`  - ${varName}`));
  process.exit(1);
} else {
  console.log('\n✅ All required environment variables are set!');
} 