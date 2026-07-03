import ImageKit from 'imagekit';
import dotenv from 'dotenv';
import multer from 'multer';

dotenv.config();

export const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY || 'your_public_key',
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || 'your_private_key',
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || 'https://ik.imagekit.io/your_imagekit_id'
});

const storage = multer.memoryStorage();
export const upload = multer({ storage });
