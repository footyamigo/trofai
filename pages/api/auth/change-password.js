import { 
    CognitoIdentityProviderClient, 
    AdminInitiateAuthCommand, 
    AdminSetUserPasswordCommand 
} from "@aws-sdk/client-cognito-identity-provider";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import tables from '../../../src/aws/dynamoDbSchema'; // Adjust path if needed

// --- AWS Clients Initialization ---
// Client requires AWS credentials with Cognito Admin permissions 
// (e.g., cognito-idp:AdminInitiateAuth, cognito-idp:AdminSetUserPassword)
const cognitoClient = new CognitoIdentityProviderClient({ 
    region: process.env.NEXT_PUBLIC_AWS_REGION, 
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,      // Ensure these are backend admin credentials
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const dynamoClient = new DynamoDBClient({
  region: process.env.NEXT_PUBLIC_AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

// --- Helper to get User Info (including Cognito Username) from Session ---
const getUserDetailsFromSession = async (session) => {
  if (!session) return null;
  try {
    const command = new QueryCommand({
      TableName: tables.users.tableName,
      IndexName: tables.users.indexes.bySession.indexName, // Assuming you have a session index
      KeyConditionExpression: '#sess = :session',
      ExpressionAttributeNames: { '#sess': 'session' },
      ExpressionAttributeValues: { ':session': session },
      // Fetch userId (which should be the Cognito Username) and potentially other needed fields
      ProjectionExpression: 'userId' 
    });
    const response = await docClient.send(command);
    if (response.Items && response.Items.length > 0) {
      // Assuming user.userId in your DynamoDB table IS the Cognito Username
      return { cognitoUsername: response.Items[0].userId }; 
    }
  } catch (error) {
    console.error('Error validating session in DynamoDB:', error);
  }
  return null;
};


export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed' });
  }

  const { currentPassword, newPassword } = req.body;
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');

  if (!sessionToken) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Session token missing.' });
  }

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current password and new password are required.' });
  }

  // 1. Validate session and get Cognito username
  const userDetails = await getUserDetailsFromSession(sessionToken);
  if (!userDetails || !userDetails.cognitoUsername) {
    return res.status(401).json({ success: false, message: 'Unauthorized: Invalid session.' });
  }
  const cognitoUsername = userDetails.cognitoUsername;

  try {
    // 2. Verify Current Password using Admin flow
    console.log(`Verifying current password for user: ${cognitoUsername}`);
    const authCommand = new AdminInitiateAuthCommand({
        AuthFlow: 'ADMIN_USER_PASSWORD_AUTH',
        ClientId: process.env.COGNITO_USER_POOL_CLIENT_ID, // Use non-public variable
        UserPoolId: process.env.COGNITO_USER_POOL_ID,     // Use non-public variable
        AuthParameters: {
            USERNAME: cognitoUsername,
            PASSWORD: currentPassword,
        },
    });
    // We only care if this succeeds or throws. We don't need the result.
    await cognitoClient.send(authCommand);
    console.log(`Current password verified for user: ${cognitoUsername}`);

    // 3. Set New Password using Admin command
    console.log(`Setting new password for user: ${cognitoUsername}`);
    const setPasswordCommand = new AdminSetUserPasswordCommand({
        Password: newPassword,
        UserPoolId: process.env.COGNITO_USER_POOL_ID, // Use non-public variable
        Username: cognitoUsername,
        Permanent: true, // Make the new password permanent
    });
    await cognitoClient.send(setPasswordCommand);
    console.log(`New password set successfully for user: ${cognitoUsername}`);

    return res.status(200).json({ success: true, message: 'Password changed successfully.' });

  } catch (error) {
    console.error(`Error changing password for ${cognitoUsername}:`, error);
    
    let userMessage = 'Failed to change password.';
    if (error.name === 'NotAuthorizedException') {
        // This error can be thrown by AdminInitiateAuth if password is wrong
        userMessage = 'Incorrect current password. Please try again.';
    } else if (error.name === 'UserNotFoundException') {
        userMessage = 'User not found. Invalid session or account issue.'; 
    } else if (error.name === 'LimitExceededException') {
        userMessage = 'Password change attempt limit exceeded. Please try again later.';
    } else if (error.name === 'InvalidPasswordException') {
        // This error is thrown by AdminSetUserPassword if the new password is invalid
        userMessage = 'New password does not meet the requirements. Please ensure it is strong enough.';
    } else if (error.name === 'InvalidParameterException' && error.message.includes('USERNAME')){
        // Specific check if AdminInitiateAuth failed due to missing user
         userMessage = 'User not found. Invalid session or account issue.'; 
    }
    
    // Return status 400 for most user-correctable errors, 500 for others
    const statusCode = (error.name === 'NotAuthorizedException' || error.name === 'InvalidPasswordException') ? 400 : 500;
    // Don't expose unexpected error names directly
    const errorName = ['NotAuthorizedException', 'UserNotFoundException', 'LimitExceededException', 'InvalidPasswordException', 'InvalidParameterException'].includes(error.name) ? error.name : 'ServerError';
    
    return res.status(statusCode).json({ success: false, message: userMessage, error: errorName });
  }
} 