const cloudinary = require('cloudinary').v2;

const cloud_name = 'bsr9ntoc';
const api_key = '233362255129786';
const api_secret = '_ic_c9BgL-apDbln7sPX5eoGx3g';
const preset = 'FusionHRMS';

const testBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function test1() {
  console.log('--- Test 1: Config with cloud_name, api_key, api_secret ---');
  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true
  });

  try {
    const res = await cloudinary.uploader.upload(testBase64);
    console.log('Test 1 SUCCESS! URL:', res.secure_url);
    return true;
  } catch (err) {
    console.log('Test 1 ERROR:', err.message, err.http_code);
  }
}

async function test2() {
  console.log('--- Test 2: Config with CLOUDINARY_URL ---');
  process.env.CLOUDINARY_URL = `cloudinary://${api_key}:${api_secret}@${cloud_name}`;
  cloudinary.config(true);

  try {
    const res = await cloudinary.uploader.upload(testBase64, {
      folder: 'HRMS/logos'
    });
    console.log('Test 2 SUCCESS! URL:', res.secure_url);
    return true;
  } catch (err) {
    console.log('Test 2 ERROR:', err.message, err.http_code);
  }
}

async function test3() {
  console.log('--- Test 3: Upload with preset & signed credentials ---');
  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true
  });

  try {
    const res = await cloudinary.uploader.upload(testBase64, {
      upload_preset: preset
    });
    console.log('Test 3 SUCCESS! URL:', res.secure_url);
    return true;
  } catch (err) {
    console.log('Test 3 ERROR:', err.message, err.http_code);
  }
}

async function test4() {
  console.log('--- Test 4: Direct REST upload with upload_preset & api_key signature ---');
  const https = require('https');
  const crypto = require('crypto');

  const timestamp = Math.floor(Date.now() / 1000);
  const strToSign = `timestamp=${timestamp}&upload_preset=${preset}${api_secret}`;
  const signature = crypto.createHash('sha1').update(strToSign).digest('hex');

  const boundary = '----WebKitFormBoundary' + Math.random().toString(16).substring(2);
  let body = '';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="file"\r\n\r\n' + testBase64 + '\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="api_key"\r\n\r\n' + api_key + '\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="timestamp"\r\n\r\n' + timestamp + '\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="upload_preset"\r\n\r\n' + preset + '\r\n';
  body += '--' + boundary + '\r\n';
  body += 'Content-Disposition: form-data; name="signature"\r\n\r\n' + signature + '\r\n';
  body += '--' + boundary + '--\r\n';

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.cloudinary.com',
      path: `/v1_1/${cloud_name}/image/upload`,
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': Buffer.byteLength(body)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log('Test 4 Status:', res.statusCode, 'Body:', data);
        resolve();
      });
    });
    req.write(body);
    req.end();
  });
}

(async () => {
  await test1();
  await test2();
  await test3();
  await test4();
})();
