import { imagekit } from './src/config/imagekit';
import fs from 'fs';

async function testUpload() {
  try {
    fs.writeFileSync('test.apk', 'dummy apk content');
    const fileBuffer = fs.readFileSync('test.apk');
    console.log('Uploading APK to ImageKit...');
    
    const result = await imagekit.upload({
      file: fileBuffer,
      fileName: `apk_${Date.now()}_test.apk`,
      folder: '/elitestore/apks'
    });
    
    console.log('Upload Success:', result);
  } catch (error) {
    console.error('Upload Failed:', error);
  }
}

testUpload();
