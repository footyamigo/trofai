#!/bin/bash

# Make all scripts executable
chmod +x setup-cognito.sh
chmod +x setup-dynamodb.sh
chmod +x setup-s3.sh

echo "========================================="
echo "SETTING UP AWS INFRASTRUCTURE FOR TROFAI"
echo "========================================="

echo "Step 1: Setting up Cognito User Pool"
./setup-cognito.sh

echo
echo "Step 2: Setting up DynamoDB Tables"
./setup-dynamodb.sh

echo
echo "Step 3: Setting up S3 Bucket"
./setup-s3.sh

echo
echo "========================================="
echo "AWS INFRASTRUCTURE SETUP COMPLETED"
echo "========================================="
echo
echo "Configuration has been updated in .env.local"
echo "You can now start your application with: npm run dev" 