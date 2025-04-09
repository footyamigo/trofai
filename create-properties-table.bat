@echo off
echo Creating properties table...

set AWS_ACCESS_KEY_ID=AKIA5WUI3VMW4XKJCJOU
set AWS_SECRET_ACCESS_KEY=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
set AWS_DEFAULT_REGION=us-east-1

aws dynamodb create-table ^
  --table-name trofai-properties ^
  --attribute-definitions ^
    AttributeName=propertyId,AttributeType=S ^
    AttributeName=userId,AttributeType=S ^
    AttributeName=createdAt,AttributeType=S ^
    AttributeName=address,AttributeType=S ^
  --key-schema ^
    AttributeName=propertyId,KeyType=HASH ^
    AttributeName=userId,KeyType=RANGE ^
  --billing-mode PAY_PER_REQUEST ^
  --global-secondary-indexes "[{\"IndexName\":\"userId-createdAt-index\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"address-index\",\"KeySchema\":[{\"AttributeName\":\"address\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"
  
echo Properties table creation completed. 