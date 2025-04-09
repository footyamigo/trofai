#!/bin/bash

# Export AWS credentials from .env file
export AWS_ACCESS_KEY_ID=AKIA5WUI3VMW4XKJCJOU
export AWS_SECRET_ACCESS_KEY=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
export AWS_DEFAULT_REGION=us-east-1

# Create S3 bucket
BUCKET_NAME="trofai-assets"
echo "Creating S3 bucket: $BUCKET_NAME"

# Check if bucket exists
aws s3api head-bucket --bucket $BUCKET_NAME 2>/dev/null
if [ $? -eq 0 ]; then
    echo "Bucket $BUCKET_NAME already exists"
else
    # Create the bucket
    aws s3api create-bucket \
      --bucket $BUCKET_NAME \
      --region us-east-1

    # Set bucket policy to allow public access
    aws s3api put-public-access-block \
      --bucket $BUCKET_NAME \
      --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

    # Enable CORS
    aws s3api put-bucket-cors \
      --bucket $BUCKET_NAME \
      --cors-configuration '{
        "CORSRules": [
          {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": ["*"],
            "MaxAgeSeconds": 3000
          }
        ]
      }'

    # Update .env.local file with new bucket name
    sed -i "s/NEXT_PUBLIC_S3_BUCKET=.*/NEXT_PUBLIC_S3_BUCKET=$BUCKET_NAME/g" .env.local
    sed -i "s/S3_BUCKET_NAME=.*/S3_BUCKET_NAME=$BUCKET_NAME/g" .env.local

    echo "S3 bucket $BUCKET_NAME created and configured"
fi

echo "S3 setup complete. Bucket URL: https://$BUCKET_NAME.s3.amazonaws.com" 