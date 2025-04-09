import AWS from 'aws-sdk';

// Configure AWS
AWS.config.update({
  region: process.env.AWS_REGION || process.env.REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Create Cognito and SES clients
const cognitoISP = new AWS.CognitoIdentityServiceProvider();
const ses = new AWS.SES();

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const userPoolId = process.env.NEXT_PUBLIC_USER_POOL_ID;
    
    if (!userPoolId) {
      return res.status(400).json({
        success: false,
        message: 'Missing User Pool ID in environment variables'
      });
    }

    // Step 1: Get current user pool configuration
    const currentConfig = await cognitoISP.describeUserPool({
      UserPoolId: userPoolId
    }).promise();
    
    console.log('Current user pool configuration:', JSON.stringify(currentConfig, null, 2));

    // Step 2: Verify the email identity in SES if not already verified
    const emailIdentity = 'email@footyai.app';
    try {
      const verificationStatus = await ses.getIdentityVerificationAttributes({
        Identities: [emailIdentity]
      }).promise();
      
      console.log('Email verification status:', verificationStatus);
      
      if (!verificationStatus.VerificationAttributes?.[emailIdentity] || 
          verificationStatus.VerificationAttributes[emailIdentity].VerificationStatus !== 'Success') {
        // Verify the email
        await ses.verifyEmailIdentity({
          EmailAddress: emailIdentity
        }).promise();
        console.log(`Verification email sent to ${emailIdentity}`);
      }
    } catch (sesError) {
      console.error('Error checking/verifying SES identity:', sesError);
      // Continue anyway - we'll handle this later
    }

    // Step 3: Update the user pool to:
    // 1. Use SES for sending emails 
    // 2. Enable auto verification for email
    const updateParams = {
      UserPoolId: userPoolId,
      // Set up the email configuration with SES
      EmailConfiguration: {
        SourceArn: `arn:aws:ses:${process.env.AWS_REGION || 'us-east-1'}:${currentConfig.UserPool.Arn.split(':')[4]}:identity/${emailIdentity}`,
        From: `Trofai <${emailIdentity}>`,
        ReplyToEmailAddress: emailIdentity,
        EmailSendingAccount: 'DEVELOPER'
      },
      // Enable auto verification for email
      AutoVerifiedAttributes: ['email'],
      // Update email verification message with HTML formatting
      VerificationMessageTemplate: {
        DefaultEmailOption: 'CONFIRM_WITH_CODE',
        EmailMessage: `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4caf50; color: white; padding: 10px; text-align: center; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .code { font-size: 24px; font-weight: bold; text-align: center; 
                     margin: 20px 0; padding: 10px; background-color: #e9f5e9; 
                     border: 1px solid #62d76b; border-radius: 4px; letter-spacing: 3px; }
              .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Trofai Account Verification</h1>
              </div>
              <div class="content">
                <p>Hello,</p>
                <p>Thank you for registering with Trofai. To complete your account setup, please use the verification code below:</p>
                
                <div class="code">{####}</div>
                
                <p>Please enter this code on the verification page to complete your account setup.</p>
                <p>If you continue to experience issues, please contact our support team.</p>
              </div>
              <div class="footer">
                <p>This email was sent from an unmonitored address. Please do not reply to this email.</p>
                <p>&copy; 2023 Trofai. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
        `,
        EmailSubject: 'Your Trofai Verification Code'
      }
    };
    
    console.log('Updating user pool with:', JSON.stringify(updateParams, null, 2));
    
    await cognitoISP.updateUserPool(updateParams).promise();
    console.log('Successfully updated user pool configuration');
    
    // Step 4: Test sending a verification email
    const testEmail = req.body.email;
    if (testEmail) {
      try {
        // Try to create a user to test email verification
        const testUser = {
          UserPoolId: userPoolId,
          Username: testEmail,
          TemporaryPassword: `Test${Math.floor(Math.random() * 1000000)}!`,
          UserAttributes: [
            {
              Name: 'email',
              Value: testEmail
            },
            {
              Name: 'email_verified',
              Value: 'false'
            }
          ]
        };
        
        try {
          // Check if user exists first
          await cognitoISP.adminGetUser({
            UserPoolId: userPoolId,
            Username: testEmail
          }).promise();
          
          // User exists, reset the user's email verification
          await cognitoISP.adminUpdateUserAttributes({
            UserPoolId: userPoolId,
            Username: testEmail,
            UserAttributes: [
              {
                Name: 'email_verified',
                Value: 'false'
              }
            ]
          }).promise();
          
          // Resend verification code
          await cognitoISP.adminCreateUser({
            ...testUser,
            MessageAction: 'RESEND'
          }).promise();
          
        } catch (userError) {
          if (userError.code === 'UserNotFoundException') {
            // Create new user
            await cognitoISP.adminCreateUser(testUser).promise();
          } else {
            throw userError;
          }
        }
        
        console.log(`Test verification email sent to ${testEmail}`);
      } catch (testError) {
        console.error('Error sending test verification email:', testError);
        // Don't fail the entire operation because of test failure
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Cognito configured to use SES for sending emails with auto verification enabled',
      configuration: {
        userPoolId,
        emailSender: emailIdentity,
        region: process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
        autoVerification: true
      },
      testEmailSent: testEmail ? true : false
    });
  } catch (error) {
    console.error('Error setting up Cognito with SES:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error configuring Cognito with SES',
      error: error.toString(),
      stack: error.stack
    });
  }
} 