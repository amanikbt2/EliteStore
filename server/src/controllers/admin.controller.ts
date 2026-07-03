import { Request, Response } from 'express';
import App from '../models/App';
import Review from '../models/Review';
import { sendSuccess, sendError } from '../utils';

export const getDashboardStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalApps = await App.countDocuments();
    
    const apps = await App.find({}, 'downloads');
    const totalDownloads = apps.reduce((sum, app) => sum + (app.downloads || 0), 0);
    
    const pendingReviews = await Review.countDocuments({ status: 'pending' });

    sendSuccess(res, { totalApps, totalDownloads, pendingReviews }, 'Stats fetched');
  } catch (error) {
    console.error('Error fetching stats:', error);
    sendError(res, 'Error fetching stats', 500);
  }
};
