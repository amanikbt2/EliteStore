import { Request, Response } from 'express';
import App from '../models/App';
import Version from '../models/Version';
import Category from '../models/Category';
import { sendSuccess, sendError } from '../utils';

export const getApps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query: any = { status: 'published' };

    if (category) {
      const cat = await Category.findOne({ slug: category as string });
      if (cat) query.category = cat._id;
    }

    if (search) {
      query.$text = { $search: search as string };
    }

    const apps = await App.find(query)
      .populate('category', 'name slug icon')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 });

    const total = await App.countDocuments(query);

    sendSuccess(res, { apps, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, 'Apps fetched');
  } catch (error) {
    sendError(res, 'Error fetching apps', 500);
  }
};

export const getAppByPackageName = async (req: Request, res: Response): Promise<void> => {
  try {
    const app = await App.findOne({ packageName: req.params.packageName, status: 'published' })
      .populate('category', 'name slug icon');
    
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    const latestVersion = await Version.findOne({ appId: app._id, status: 'active' }).sort({ versionCode: -1 });
    
    sendSuccess(res, { app, latestVersion }, 'App fetched');
  } catch (error) {
    sendError(res, 'Error fetching app', 500);
  }
};

export const checkUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageName } = req.params;
    
    const app = await App.findOne({ packageName });
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    const latestVersion = await Version.findOne({ appId: app._id, status: 'active' }).sort({ versionCode: -1 });
    
    if (!latestVersion) {
      sendError(res, 'No version available', 404);
      return;
    }

    sendSuccess(res, {
      latestVersion: latestVersion.versionName,
      versionCode: latestVersion.versionCode,
      updateAvailable: true,
      apkUrl: latestVersion.apkUrl,
      releaseNotes: latestVersion.releaseNotes,
      mandatory: latestVersion.isMandatoryUpdate,
      checksum: latestVersion.sha256Checksum,
      fileSize: latestVersion.fileSize
    }, 'Update info fetched');
  } catch (error) {
    sendError(res, 'Error checking update', 500);
  }
};

export const createApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, packageName, developer, description, iconUrl, apkUrl, apkSize, screenshots, size } = req.body;
    
    // Temporary fallback category if not provided from frontend
    let category = await Category.findOne();
    if (!category) {
      category = await Category.create({ name: 'General', slug: 'general', icon: 'grid' });
    }

    const app = new App({
      name,
      packageName,
      developer,
      description,
      shortDescription: description ? description.substring(0, 150) + '...' : '',
      iconUrl,
      screenshots: screenshots || [],
      category: category._id
    });

    await app.save();

    const version = new Version({
      appId: app._id,
      versionName: '1.0.0',
      versionCode: 1,
      apkUrl,
      fileSize: apkSize || 0,
      releaseNotes: 'Initial release',
      status: 'active'
    });

    await version.save();

    sendSuccess(res, app, 'App created successfully');
  } catch (error) {
    console.error('Error creating app:', error);
    sendError(res, 'Error creating app', 500);
  }
};

export const releaseUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageName } = req.params;
    const { versionName, releaseNotes, apkUrl, apkSize } = req.body;
    
    const app = await App.findOne({ packageName });
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    const latestVersion = await Version.findOne({ appId: app._id }).sort({ versionCode: -1 });
    const nextCode = latestVersion ? latestVersion.versionCode + 1 : 1;

    const version = new Version({
      appId: app._id,
      versionName,
      versionCode: nextCode,
      apkUrl,
      fileSize: apkSize || 0,
      releaseNotes,
      status: 'active'
    });

    await version.save();

    sendSuccess(res, version, 'Update released successfully');
  } catch (error) {
    console.error('Error releasing update:', error);
    sendError(res, 'Error releasing update', 500);
  }
};
