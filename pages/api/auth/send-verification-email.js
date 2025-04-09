import AWS from 'aws-sdk';

// Configure AWS - supporting variables with and without AWS_ prefix
AWS.config.update({
  region: process.env.AWS_REGION || process.env.REGION || process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || process.env.SECRET_ACCESS_KEY
  }
});

// Create SES and Cognito clients
const ses = new AWS.SES();
const cognitoISP = new AWS.CognitoIdentityServiceProvider();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }
    
    console.log('Processing verification request for:', email);
    
    // First, request a new code from Cognito (this will send the standard email with the actual code)
    const cognitoParams = {
      ClientId: process.env.NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID,
      Username: email
    };

    try {
      // Get the verification code from Cognito
      const resendResult = await cognitoISP.resendConfirmationCode(cognitoParams).promise();
      console.log('Verification code requested from Cognito:', resendResult);

      // Now send our own branded email to notify the user where to look for the code
      const sesParams = {
        Source: 'email@footyai.app',
        Destination: {
          ToAddresses: [email]
        },
        Message: {
          Subject: {
            Data: 'Your Trofai Account Verification'
          },
          Body: {
            Html: {
              Data: `
                <html>
                  <head>
                    <style>
                      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                      .header { background-color: #4caf50; color: white; padding: 10px; text-align: center; }
                      .content { padding: 20px; background-color: #f9f9f9; }
                      .important { font-size: 18px; font-weight: bold; text-align: center; 
                              margin: 20px 0; padding: 10px; background-color: #e9f5e9; 
                              border: 1px solid #62d76b; border-radius: 4px; }
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
                        <p>Thank you for registering with Trofai.</p>
                        
                        <div class="important">
                          Your verification code has been sent separately by AWS Cognito.<br>
                          Please check your inbox (and spam folder) for an email from <strong>no-reply@verificationemail.com</strong>
                        </div>
                        
                        <p>Enter the code from that email to complete your account verification.</p>
                        <p>If you continue to experience issues, please contact our support team.</p>
                      </div>
                      <div class="footer">
                        <p>This email was sent from an unmonitored address. Please do not reply to this email.</p>
                        <p>&copy; ${new Date().getFullYear()} Trofai. All rights reserved.</p>
                      </div>
                    </div>
                  </body>
                </html>
              `
            },
            Text: {
              Data: `
                Your Trofai Account Verification
                
                Hello,
                
                Thank you for registering with Trofai.
                
                IMPORTANT: Your verification code has been sent separately by AWS Cognito.
                Please check your inbox (and spam folder) for an email from no-reply@verificationemail.com
                
                Enter the code from that email to complete your account verification.
                
                If you continue to experience issues, please contact our support team.
                
                This email was sent from an unmonitored address. Please do not reply to this email.
                
                © ${new Date().getFullYear()} Trofai. All rights reserved.
              `
            }
          }
        }
      };
      
      // Send the email via SES
      console.log('Sending notification email via SES to:', email);
      const emailResult = await ses.sendEmail(sesParams).promise();
      console.log('Notification email sent via SES, MessageId:', emailResult.MessageId);

      return res.status(200).json({ 
        success: true, 
        message: 'Verification code has been sent. Please check your email inbox and spam folder.',
        emailId: emailResult.MessageId
      });
    } catch (cognitoError) {
      console.error('Cognito error when resending code:', cognitoError);
      
      // Special case: if the user is already confirmed, we should inform them
      if (cognitoError.code === 'NotAuthorizedException' && 
          cognitoError.message.includes('already confirmed')) {
        return res.status(400).json({
          success: false,
          message: 'Your account is already confirmed. Please sign in directly.'
        });
      }
      
      throw cognitoError; // Re-throw for the outer catch block to handle
    }
  } catch (error) {
    console.error('Error sending verification email:', error);
    
    // Handle different error types
    if (error.code === 'UserNotFoundException') {
      return res.status(404).json({ 
        success: false, 
        message: 'No user found with this email address' 
      });
    }
    
    if (error.code === 'LimitExceededException') {
      return res.status(429).json({ 
        success: false, 
        message: 'Too many attempts. Please try again later' 
      });
    }
    
    if (error.code === 'MessageRejected') {
      return res.status(400).json({ 
        success: false, 
        message: 'Email could not be sent. Please verify that your email address is correct.' 
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: error.message || 'Error sending verification email'
    });
  }
} 