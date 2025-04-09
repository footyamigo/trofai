# PowerShell script to set up AWS infrastructure for Trofai

# Set environment variables
$env:AWS_ACCESS_KEY_ID = "AKIA5WUI3VMW4XKJCJOU"
$env:AWS_SECRET_ACCESS_KEY = "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"
$env:AWS_DEFAULT_REGION = "us-east-1"

Write-Host "========================================="
Write-Host "SETTING UP AWS INFRASTRUCTURE FOR TROFAI"
Write-Host "========================================="

# Step 1: Create Cognito User Pool
Write-Host "Step 1: Setting up Cognito User Pool..."
Write-Host "Creating Cognito User Pool..."

$userPoolCmd = 'aws cognito-idp create-user-pool --pool-name "trofai-user-pool" --auto-verified-attributes email --policies "PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false}" --mfa-configuration OFF --output json'
$userPoolResult = Invoke-Expression $userPoolCmd

if (-not $?) {
    Write-Host "Error creating User Pool. Exiting."
    exit 1
}

$userPoolData = $userPoolResult | ConvertFrom-Json
$userPoolId = $userPoolData.UserPool.Id
Write-Host "User Pool ID: $userPoolId"

# Create Cognito User Pool Client
Write-Host "Creating Cognito User Pool Client..."
$clientCmd = "aws cognito-idp create-user-pool-client --user-pool-id $userPoolId --client-name 'trofai-client' --no-generate-secret --explicit-auth-flows ALLOW_USER_SRP_AUTH ALLOW_USER_PASSWORD_AUTH ALLOW_REFRESH_TOKEN_AUTH --prevent-user-existence-errors ENABLED --output json"
$clientResult = Invoke-Expression $clientCmd

if (-not $?) {
    Write-Host "Error creating User Pool Client. Exiting."
    exit 1
}

$clientData = $clientResult | ConvertFrom-Json
$clientId = $clientData.UserPoolClient.ClientId
Write-Host "Client ID: $clientId"

# Update .env.local file with new values
Write-Host "Updating .env.local file with Cognito values..."
$envContent = Get-Content .env.local
$envContent = $envContent -replace "NEXT_PUBLIC_USER_POOL_ID=.*", "NEXT_PUBLIC_USER_POOL_ID=$userPoolId"
$envContent = $envContent -replace "NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=.*", "NEXT_PUBLIC_USER_POOL_WEB_CLIENT_ID=$clientId"
$envContent | Set-Content .env.local

# Step 2: Create DynamoDB Tables
Write-Host "`nStep 2: Setting up DynamoDB Tables..."

# Create Users Table
Write-Host "Creating Users Table..."
$usersCmd = @"
aws dynamodb create-table 
  --table-name trofai-users 
  --attribute-definitions 
    AttributeName=userId,AttributeType=S 
    AttributeName=email,AttributeType=S 
    AttributeName=username,AttributeType=S 
  --key-schema 
    AttributeName=userId,KeyType=HASH 
  --global-secondary-indexes '[{"IndexName":"email-index","KeySchema":[{"AttributeName":"email","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"username-index","KeySchema":[{"AttributeName":"username","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]'
  --billing-mode PAY_PER_REQUEST
"@
try {
    Invoke-Expression ($usersCmd -replace "`n", " ")
} catch {
    Write-Host "Warning: Users table creation failed. It might already exist."
}

# Create Properties Table
Write-Host "Creating Properties Table..."
$propsCmd = @"
aws dynamodb create-table 
  --table-name trofai-properties 
  --attribute-definitions 
    AttributeName=propertyId,AttributeType=S 
    AttributeName=userId,AttributeType=S 
    AttributeName=createdAt,AttributeType=S 
    AttributeName=address,AttributeType=S 
  --key-schema 
    AttributeName=propertyId,KeyType=HASH 
    AttributeName=userId,KeyType=RANGE 
  --global-secondary-indexes '[{"IndexName":"userId-createdAt-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"address-index","KeySchema":[{"AttributeName":"address","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]'
  --billing-mode PAY_PER_REQUEST
"@
try {
    Invoke-Expression ($propsCmd -replace "`n", " ")
} catch {
    Write-Host "Warning: Properties table creation failed. It might already exist."
}

# Create Designs Table
Write-Host "Creating Designs Table..."
$designsCmd = @"
aws dynamodb create-table 
  --table-name trofai-designs 
  --attribute-definitions 
    AttributeName=designId,AttributeType=S 
    AttributeName=userId,AttributeType=S 
    AttributeName=createdAt,AttributeType=S 
    AttributeName=propertyId,AttributeType=S 
  --key-schema 
    AttributeName=designId,KeyType=HASH 
    AttributeName=userId,KeyType=RANGE 
  --global-secondary-indexes '[{"IndexName":"userId-createdAt-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"propertyId-index","KeySchema":[{"AttributeName":"propertyId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]'
  --billing-mode PAY_PER_REQUEST
"@
try {
    Invoke-Expression ($designsCmd -replace "`n", " ")
} catch {
    Write-Host "Warning: Designs table creation failed. It might already exist."
}

# Create Captions Table
Write-Host "Creating Captions Table..."
$captionsCmd = @"
aws dynamodb create-table 
  --table-name trofai-captions 
  --attribute-definitions 
    AttributeName=captionId,AttributeType=S 
    AttributeName=userId,AttributeType=S 
    AttributeName=createdAt,AttributeType=S 
    AttributeName=designId,AttributeType=S 
    AttributeName=propertyId,AttributeType=S 
  --key-schema 
    AttributeName=captionId,KeyType=HASH 
    AttributeName=userId,KeyType=RANGE 
  --global-secondary-indexes '[{"IndexName":"userId-createdAt-index","KeySchema":[{"AttributeName":"userId","KeyType":"HASH"},{"AttributeName":"createdAt","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"designId-index","KeySchema":[{"AttributeName":"designId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}},{"IndexName":"propertyId-index","KeySchema":[{"AttributeName":"propertyId","KeyType":"HASH"}],"Projection":{"ProjectionType":"ALL"}}]'
  --billing-mode PAY_PER_REQUEST
"@
try {
    Invoke-Expression ($captionsCmd -replace "`n", " ")
} catch {
    Write-Host "Warning: Captions table creation failed. It might already exist."
}

# Step 3: Create S3 Bucket
Write-Host "`nStep 3: Setting up S3 Bucket..."
$bucketName = "trofai-assets"

# Check if bucket exists
$bucketExists = $false
try {
    aws s3api head-bucket --bucket $bucketName 2>$null
    $bucketExists = $true
    Write-Host "Bucket $bucketName already exists"
} catch {
    Write-Host "Creating new bucket: $bucketName"
}

if (-not $bucketExists) {
    # Create the bucket
    aws s3api create-bucket --bucket $bucketName --region us-east-1

    # Set bucket policy to allow public access
    aws s3api put-public-access-block --bucket $bucketName --public-access-block-configuration BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false

    # Enable CORS
    $corsCmd = @"
aws s3api put-bucket-cors --bucket $bucketName --cors-configuration '{"CORSRules":[{"AllowedHeaders":["*"],"AllowedMethods":["GET","PUT","POST","DELETE","HEAD"],"AllowedOrigins":["*"],"MaxAgeSeconds":3000}]}'
"@
    Invoke-Expression $corsCmd

    # Update .env.local file with new bucket name
    $envContent = Get-Content .env.local
    $envContent = $envContent -replace "NEXT_PUBLIC_S3_BUCKET=.*", "NEXT_PUBLIC_S3_BUCKET=$bucketName"
    $envContent = $envContent -replace "S3_BUCKET_NAME=.*", "S3_BUCKET_NAME=$bucketName"
    $envContent | Set-Content .env.local

    Write-Host "S3 bucket $bucketName created and configured"
}

Write-Host "`n========================================="
Write-Host "AWS INFRASTRUCTURE SETUP COMPLETED"
Write-Host "========================================="
Write-Host
Write-Host "Configuration has been updated in .env.local"
Write-Host "You can now start your application with: npm run dev" 