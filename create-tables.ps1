# Set AWS credentials
$env:AWS_ACCESS_KEY_ID = "AKIA5WUI3VMW4XKJCJOU"
$env:AWS_SECRET_ACCESS_KEY = "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"
$env:AWS_DEFAULT_REGION = "us-east-1"

Write-Host "Creating DynamoDB tables..."

# Create Users Table
Write-Host "Creating trofai-users table..."
aws dynamodb create-table `
    --table-name trofai-users `
    --attribute-definitions `
        AttributeName=userId,AttributeType=S `
        AttributeName=email,AttributeType=S `
        AttributeName=username,AttributeType=S `
    --key-schema `
        AttributeName=userId,KeyType=HASH `
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
    --global-secondary-indexes `
        "[{
            \"IndexName\": \"email-index\",
            \"KeySchema\": [{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        },{
            \"IndexName\": \"username-index\",
            \"KeySchema\": [{\"AttributeName\":\"username\",\"KeyType\":\"HASH\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        }]"

# Create Properties Table
Write-Host "Creating trofai-properties table..."
aws dynamodb create-table `
    --table-name trofai-properties `
    --attribute-definitions `
        AttributeName=propertyId,AttributeType=S `
        AttributeName=userId,AttributeType=S `
        AttributeName=createdAt,AttributeType=S `
        AttributeName=address,AttributeType=S `
    --key-schema `
        AttributeName=propertyId,KeyType=HASH `
        AttributeName=userId,KeyType=RANGE `
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
    --global-secondary-indexes `
        "[{
            \"IndexName\": \"userId-createdAt-index\",
            \"KeySchema\": [
                {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
                {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
            ],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        },{
            \"IndexName\": \"address-index\",
            \"KeySchema\": [{\"AttributeName\":\"address\",\"KeyType\":\"HASH\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        }]"

# Create Designs Table
Write-Host "Creating trofai-designs table..."
aws dynamodb create-table `
    --table-name trofai-designs `
    --attribute-definitions `
        AttributeName=designId,AttributeType=S `
        AttributeName=userId,AttributeType=S `
        AttributeName=createdAt,AttributeType=S `
        AttributeName=propertyId,AttributeType=S `
    --key-schema `
        AttributeName=designId,KeyType=HASH `
        AttributeName=userId,KeyType=RANGE `
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
    --global-secondary-indexes `
        "[{
            \"IndexName\": \"userId-createdAt-index\",
            \"KeySchema\": [
                {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
                {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
            ],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        },{
            \"IndexName\": \"propertyId-index\",
            \"KeySchema\": [{\"AttributeName\":\"propertyId\",\"KeyType\":\"HASH\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        }]"

# Create Captions Table
Write-Host "Creating trofai-captions table..."
aws dynamodb create-table `
    --table-name trofai-captions `
    --attribute-definitions `
        AttributeName=captionId,AttributeType=S `
        AttributeName=userId,AttributeType=S `
        AttributeName=createdAt,AttributeType=S `
        AttributeName=designId,AttributeType=S `
        AttributeName=propertyId,AttributeType=S `
    --key-schema `
        AttributeName=captionId,KeyType=HASH `
        AttributeName=userId,KeyType=RANGE `
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 `
    --global-secondary-indexes `
        "[{
            \"IndexName\": \"userId-createdAt-index\",
            \"KeySchema\": [
                {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
                {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
            ],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        },{
            \"IndexName\": \"designId-index\",
            \"KeySchema\": [{\"AttributeName\":\"designId\",\"KeyType\":\"HASH\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        },{
            \"IndexName\": \"propertyId-index\",
            \"KeySchema\": [{\"AttributeName\":\"propertyId\",\"KeyType\":\"HASH\"}],
            \"Projection\": {\"ProjectionType\":\"ALL\"},
            \"ProvisionedThroughput\": {\"ReadCapacityUnits\": 5, \"WriteCapacityUnits\": 5}
        }]"

Write-Host "DynamoDB tables created successfully." 