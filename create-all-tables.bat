@echo off
echo Creating all DynamoDB tables...

call create-users-table.bat
call create-properties-table.bat
call create-designs-table.bat
call create-captions-table.bat

echo All DynamoDB tables created successfully. 