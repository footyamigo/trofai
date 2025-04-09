@echo off
echo Creating users table...

set AWS_ACCESS_KEY_ID=AKIA5WUI3VMW4XKJCJOU
set AWS_SECRET_ACCESS_KEY=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
set AWS_DEFAULT_REGION=us-east-1

aws dynamodb create-table ^
  --table-name trofai-users ^
  --attribute-definitions ^
    AttributeName=userId,AttributeType=S ^
    AttributeName=email,AttributeType=S ^
    AttributeName=username,AttributeType=S ^
  --key-schema AttributeName=userId,KeyType=HASH ^
  --billing-mode PAY_PER_REQUEST ^
  --global-secondary-indexes "[{\"IndexName\":\"email-index\",\"KeySchema\":[{\"AttributeName\":\"email\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}},{\"IndexName\":\"username-index\",\"KeySchema\":[{\"AttributeName\":\"username\",\"KeyType\":\"HASH\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]"
  
echo Users table creation completed. 