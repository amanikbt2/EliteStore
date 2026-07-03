import { Request, Response } from 'express';
import Review from '../models/Review';
import App from '../models/App';
import { sendSuccess, sendError } from '../utils';

export const getReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageName } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const app = await App.findOne({ packageName });
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }

    const query = { appId: app._id, status: 'approved' };
    
    const reviews = await Review.find(query)
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
      
    const total = await Review.countDocuments(query);
    
    sendSuccess(res, { reviews, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, 'Reviews fetched');
  } catch (error) {
    sendError(res, 'Error fetching reviews', 500);
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageName } = req.params;
    const { username, stars, comment } = req.body;
    
    if (!stars || !comment) {
      sendError(res, 'Stars and comment are required', 400);
      return;
    }

    const app = await App.findOne({ packageName });
    if (!app) {
      sendError(res, 'App not found', 404);
      return;
    }
    
    const review = new Review({
      appId: app._id,
      username: username || 'Anonymous User',
      stars: Number(stars),
      comment,
      status: 'approved'
    });
    
    await review.save();
    
    // Update app rating
    const allReviews = await Review.find({ appId: app._id, status: 'approved' });
    const totalStars = allReviews.reduce((acc, curr) => acc + curr.stars, 0);
    app.rating = Number((totalStars / allReviews.length).toFixed(1));
    await app.save();
    
    sendSuccess(res, review, 'Review created successfully');
  } catch (error) {
    console.error('Error creating review:', error);
    sendError(res, 'Error creating review', 500);
  }
};
