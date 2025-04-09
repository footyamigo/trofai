#!/bin/bash

# Export AWS credentials from .env file
export AWS_ACCESS_KEY_ID=AKIA5WUI3VMW4XKJCJOU
export AWS_SECRET_ACCESS_KEY=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
export AWS_DEFAULT_REGION=us-east-1

# Create Cognito User Pool
echo "Creating Cognito User Pool..."
USER_POOL_ID=$(aws cognito-idp create-user-pool \
  --pool-name "trofai-user-pool" \
  --auto-verified-attributes email \
  --schema Name=email,Required=true,AttributeDataType=String,Mutable=true \
  --password-policy MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false \
  --mfa-configuration OFF \
  --query "UserPool.Id" \
  --output text)

echo "User Pool ID: $USER_POOL_ID"

# Create Cognito User Pool Client
echo "Creating Cognito User Pool Client..."
CLIENT_ID=$(aws cognito-idp create-user-pool-client \
  --user-pool-id $USER_POOL_ID \
  --client-name "trofai-client" \
  --no-generate-secret \
  --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH \
  --prevent-user-existence-errors ENABLED \
  --query "UserPoolClient.ClientId" \
  --output text)

echo "Client ID: $CLIENT_ID"

# Update .env.local file with new values
echo "Updating .env.local file..."
sed -i "s/NEXT_PUBLIC_USER_POOL_ID=.*/NEXT_PUBLIC_USER_POOL_ID=$USER_POOL_ID/g" .env.local
sed -i "s/NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=.*/NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=$CLIENT_ID/g" .env.local

echo "Setup complete. Your Cognito User Pool and Client have been created."
echo "Updated .env.local with the new values." 