@echo off
echo Creating designs table...

set AWS_ACCESS_KEY_ID=AKIA5WUI3VMW4XKJCJOU
set AWS_SECRET_ACCESS_KEY=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
set AWS_DEFAULT_REGION=us-east-1

aws dynamodb create-table ^
  --table-name trofai-designs ^
  --attribute-definitions ^
    AttributeName=designId,AttributeType=S ^
    AttributeName=userId,AttributeType=S ^
    AttributeName=createdAt,AttributeType=S ^
    AttributeName=propertyId,AttributeType=S ^
  --key-schema ^
    AttributeName=designId,KeyType=HASH ^
    AttributeName=userId,KeyType=RANGE ^
  --billing-mode PAY_PER_REQUEST ^
  --global-secondary-indexes "[{\"IndexName\":\"userId-createdAt-index\",\"KeySchema\":[{\"AttributeName\":\"userId\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"createdAt\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"propertyId-index\",\"KeySchema\":[{\"AttributeName\":\"propertyId\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"
  
echo Designs table creation completed. 