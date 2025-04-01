const fs = require('fs');
const archiver = require('archiver');
const path = require('path');

// Create a file to stream archive data to
const output = fs.createWriteStream(path.join(__dirname, 'webhook-lambda.zip'));
const archive = archiver('zip', {
  zlib: { level: 9 } // Compression level
});

// Listen for all archive data to be written
output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Lambda function has been zipped successfully');
});

// Good practice to catch warnings
archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('Warning:', err);
  } else {
    throw err;
  }
});

// Handle errors
archive.on('error', function(err) {
  throw err;
});

// Pipe archive data to the file
archive.pipe(output);

// Add the Lambda function files
archive.file('temp-lambda-function/index.js', { name: 'index.js' });
archive.file('temp-lambda-function/package.json', { name: 'package.json' });

// Finalize the archive
archive.finalize(); 