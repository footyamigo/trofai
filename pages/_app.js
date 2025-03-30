import '../styles/globals.css';

// Validate essential environment variables on startup
const requiredVars = {
  ROBORABBIT_API_KEY: process.env.ROBORABBIT_API_KEY,
  TASK_UID: process.env.TASK_UID,
  BANNERBEAR_API_KEY: process.env.BANNERBEAR_API_KEY,
  BANNERBEAR_TEMPLATE_UID: process.env.BANNERBEAR_TEMPLATE_UID,
  BANNERBEAR_TEMPLATE_SET_UID: process.env.BANNERBEAR_TEMPLATE_SET_UID,
};

// Check if any required vars are missing
const missingVars = Object.entries(requiredVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(
    `⚠️ Missing environment variables: ${missingVars.join(', ')}\n` +
    `Please ensure these are set in your .env file or environment.`
  );
}

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp; 