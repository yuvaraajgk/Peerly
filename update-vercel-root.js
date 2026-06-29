#!/usr/bin/env node
/**
 * Script to update Vercel project root directory via API
 * This requires a Vercel access token
 */

const https = require('https');

const projectId = 'prj_GTzVgVg67YfbYuQTK2McR1ESSPpU';
const teamId = 'team_Y5r0TeNWmW9GTzmQLwvxnBGl';
const newRootDirectory = 'client';

// Get token from environment or prompt user
const token = process.env.VERCEL_TOKEN;

if (!token) {
  console.error('❌ Error: VERCEL_TOKEN environment variable not set');
  console.log('\nTo get your token:');
  console.log('1. Go to https://vercel.com/account/tokens');
  console.log('2. Create a new token');
  console.log('3. Run: export VERCEL_TOKEN=your_token_here');
  console.log('4. Then run this script again');
  process.exit(1);
}

const data = JSON.stringify({
  rootDirectory: newRootDirectory,
});

const options = {
  hostname: 'api.vercel.com',
  path: `/v9/projects/${projectId}?teamId=${teamId}`,
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  let responseData = '';

  res.on('data', (chunk) => {
    responseData += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('✅ Successfully updated root directory to "client"');
      const response = JSON.parse(responseData);
      console.log('Project:', response.name);
      console.log('Root Directory:', response.rootDirectory);
    } else {
      console.error('❌ Error updating project:', res.statusCode);
      console.error('Response:', responseData);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error);
});

req.write(data);
req.end();
