import { Request, Response } from 'express';
import { imagekit } from '../config/imagekit';
import { sendSuccess, sendError } from '../utils';
import crypto from 'crypto';

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No file provided', 400);
      return;
    }

    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: `image_${Date.now()}_${req.file.originalname}`,
      folder: '/elitestore/images'
    });

    sendSuccess(res, { url: result.url, fileId: result.fileId }, 'Image uploaded');
  } catch (error) {
    sendError(res, 'Image upload failed', 500);
  }
};

export const uploadApk = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      sendError(res, 'No file provided', 400);
      return;
    }

    // Calculate SHA256 checksum
    const hash = crypto.createHash('sha256');
    hash.update(req.file.buffer);
    const checksum = hash.digest('hex');

    const result = await imagekit.upload({
      file: req.file.buffer,
      fileName: `apk_${Date.now()}_${req.file.originalname}`,
      folder: '/elitestore/apks'
    });

    sendSuccess(res, { 
      url: result.url, 
      fileId: result.fileId,
      fileSize: req.file.size,
      checksum 
    }, 'APK uploaded');
  } catch (error) {
    sendError(res, 'APK upload failed', 500);
  }
};
