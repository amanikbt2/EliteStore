import { Request, Response } from 'express';
import App from '../models/App';
import Version from '../models/Version';
import Category from '../models/Category';
import Review from '../models/Review';
import { imagekit } from '../config/imagekit';
import { sendSuccess, sendError, verifyToken } from '../utils';

export const getApps = async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;

    // Check if the caller is an authenticated admin
    const token = req.headers.authorization?.split(' ')[1];
    const isAdmin = token ? !!verifyToken(token) : false;

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
    // Admins can always see the app regardless of download status
    const token = req.headers.authorization?.split(' ')[1];
    const isAdmin = token ? !!verifyToken(token) : false;

    const app = await App.findOne({ packageName: req.params.packageName, status: 'published' })
      .populate('category', 'name slug icon');
    
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    // Public users: if download is disabled, still return full app data so the page renders normally.
    // The frontend will grey out the install button based on app.downloadEnabled === false.
    const versions = await Version.find({ appId: app._id, status: 'active' }).sort({ versionCode: -1 });
    const latestVersion = versions.length > 0 ? versions[0] : null;
    
    // Attach versions to the app object for the frontend
    const appData = { ...app.toObject(), versions };
    
    sendSuccess(res, { app: appData, latestVersion }, 'App fetched');
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
    const { name, packageName, developer, description, iconUrl, apkUrl, apkSize, checksum, screenshots, size } = req.body;
    
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
      sha256Checksum: checksum || 'unknown',
      releaseNotes: 'Initial release',
      status: 'active'
    });

    await version.save();

    sendSuccess(res, app, 'App created successfully');
  } catch (error: any) {
    console.error('Error creating app:', error);
    
    if (error.code === 11000 && error.keyValue) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      sendError(res, `An app with this ${field} ('${value}') already exists. Please use a unique ${field}.`, 400);
      return;
    }
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message);
      sendError(res, `Validation error: ${messages.join(', ')}`, 400);
      return;
    }

    sendError(res, `Failed to publish app: ${error.message || 'Unknown server error'}`, 500);
  }
};

export const releaseUpdate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageName } = req.params;
    const { versionName, releaseNotes, apkUrl, apkSize, checksum } = req.body;
    
    const app = await App.findOne({ packageName });
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    const latestVersion = await Version.findOne({ appId: app._id }).sort({ versionCode: -1 });
    const nextCode = latestVersion ? latestVersion.versionCode + 1 : 1;

    // Fetch all old versions before creating the new one
    const oldVersions = await Version.find({ appId: app._id });

    const version = new Version({
      appId: app._id,
      versionName,
      versionCode: nextCode,
      apkUrl,
      fileSize: apkSize || 0,
      sha256Checksum: checksum || 'unknown',
      releaseNotes,
      status: 'active'
    });

    await version.save();

    // Delete the previous versions to save space
    for (const old of oldVersions) {
      if (old.apkUrl) {
        await deleteFromImageKit(old.apkUrl);
      }
      await Version.deleteOne({ _id: old._id });
    }

    sendSuccess(res, version, 'Update released successfully');
  } catch (error) {
    console.error('Error releasing update:', error);
    sendError(res, 'Error releasing update', 500);
  }
};

const deleteFromImageKit = async (url: string) => {
  try {
    if (!url || !url.includes('ik.imagekit.io')) return;
    const fileName = url.split('/').pop();
    if (!fileName) return;
    const cleanFileName = fileName.split('?')[0];
    
    const files = await imagekit.listFiles({ searchQuery: `name="${cleanFileName}"` });
    if (files && files.length > 0) {
      for (const file of files) {
        if ('fileId' in file) {
          await imagekit.deleteFile((file as any).fileId);
        }
      }
    }
  } catch (error) {
    console.error(`Failed to delete ImageKit file for URL ${url}:`, error);
  }
};

export const toggleDownload = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageName } = req.params;

    // Read the current value first (treat missing field as true = enabled)
    const current = await App.findOne({ packageName }, { downloadEnabled: 1 });
    if (!current) {
      sendError(res, 'App not found', 404);
      return;
    }

    // downloadEnabled missing from old docs means it was always enabled (true)
    const currentValue = current.downloadEnabled !== false;
    const newValue = !currentValue;

    await App.updateOne({ packageName }, { downloadEnabled: newValue });

    const app = await App.findOne({ packageName });
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    sendSuccess(res, { downloadEnabled: app.downloadEnabled }, `Downloads ${app.downloadEnabled ? 'enabled' : 'disabled'} successfully`);
  } catch (error) {
    console.error('Toggle Download Error:', error);
    sendError(res, 'Error toggling download status', 500);
  }
};


export const deleteApp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageName } = req.params;
    const app = await App.findOne({ packageName });
    
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    // Find all associated versions
    const versions = await Version.find({ appId: app._id });
    
    // Delete APK files from ImageKit
    for (const version of versions) {
      if (version.apkUrl) {
        await deleteFromImageKit(version.apkUrl);
      }
    }

    // Delete App images from ImageKit
    if (app.iconUrl) await deleteFromImageKit(app.iconUrl);
    if (app.featureGraphicUrl) await deleteFromImageKit(app.featureGraphicUrl);
    if (app.screenshots && app.screenshots.length > 0) {
      for (const screenshot of app.screenshots) {
        await deleteFromImageKit(screenshot);
      }
    }

    // Delete from MongoDB
    await Version.deleteMany({ appId: app._id });
    await Review.deleteMany({ appId: app._id });
    await App.deleteOne({ _id: app._id });

    sendSuccess(res, null, 'App and all associated data deleted successfully');
  } catch (error) {
    console.error('Delete App Error:', error);
    sendError(res, 'Error deleting app', 500);
  }
};

export const incrementDownloads = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageName } = req.params;
    const app = await App.findOneAndUpdate(
      { packageName },
      { $inc: { downloads: 1 } },
      { returnDocument: 'after' }
    );

    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    sendSuccess(res, { downloads: app.downloads }, 'Downloads incremented');
  } catch (error) {
    console.error('Increment Downloads Error:', error);
    sendError(res, 'Error incrementing downloads', 500);
  }
};
