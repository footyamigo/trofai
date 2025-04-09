#!/bin/bash

# Export AWS credentials from .env file
export AWS_ACCESS_KEY_ID=AKIA5WUI3VMW4XKJCJOU
export AWS_SECRET_ACCESS_KEY=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
export AWS_DEFAULT_REGION=us-east-1

# Create Users Table
echo "Creating Users Table..."
aws dynamodb create-table \
  --table-name trofai-users \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
    AttributeName=username,AttributeType=S \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"email-index\",
        \"KeySchema\": [{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      },
      {
        \"IndexName\": \"username-index\",
        \"KeySchema\": [{\"AttributeName\":\"username\",\"KeyType\":\"HASH\"}],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      }
    ]" \
  --billing-mode PAY_PER_REQUEST

# Create Properties Table
echo "Creating Properties Table..."
aws dynamodb create-table \
  --table-name trofai-properties \
  --attribute-definitions \
    AttributeName=propertyId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
    AttributeName=address,AttributeType=S \
  --key-schema \
    AttributeName=propertyId,KeyType=HASH \
    AttributeName=userId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"userId-createdAt-index\",
        \"KeySchema\": [
          {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      },
      {
        \"IndexName\": \"address-index\",
        \"KeySchema\": [{\"AttributeName\":\"address\",\"KeyType\":\"HASH\"}],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      }
    ]" \
  --billing-mode PAY_PER_REQUEST

# Create Designs Table
echo "Creating Designs Table..."
aws dynamodb create-table \
  --table-name trofai-designs \
  --attribute-definitions \
    AttributeName=designId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
    AttributeName=propertyId,AttributeType=S \
  --key-schema \
    AttributeName=designId,KeyType=HASH \
    AttributeName=userId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"userId-createdAt-index\",
        \"KeySchema\": [
          {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      },
      {
        \"IndexName\": \"propertyId-index\",
        \"KeySchema\": [{\"AttributeName\":\"propertyId\",\"KeyType\":\"HASH\"}],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      }
    ]" \
  --billing-mode PAY_PER_REQUEST

# Create Captions Table
echo "Creating Captions Table..."
aws dynamodb create-table \
  --table-name trofai-captions \
  --attribute-definitions \
    AttributeName=captionId,AttributeType=S \
    AttributeName=userId,AttributeType=S \
    AttributeName=createdAt,AttributeType=S \
    AttributeName=designId,AttributeType=S \
    AttributeName=propertyId,AttributeType=S \
  --key-schema \
    AttributeName=captionId,KeyType=HASH \
    AttributeName=userId,KeyType=RANGE \
  --global-secondary-indexes \
    "[
      {
        \"IndexName\": \"userId-createdAt-index\",
        \"KeySchema\": [
          {\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},
          {\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}
        ],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      },
      {
        \"IndexName\": \"designId-index\",
        \"KeySchema\": [{\"AttributeName\":\"designId\",\"KeyType\":\"HASH\"}],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      },
      {
        \"IndexName\": \"propertyId-index\",
        \"KeySchema\": [{\"AttributeName\":\"propertyId\",\"KeyType\":\"HASH\"}],
        \"Projection\": {\"ProjectionType\":\"ALL\"}
      }
    ]" \
  --billing-mode PAY_PER_REQUEST

echo "Setup complete. All DynamoDB tables have been created." 