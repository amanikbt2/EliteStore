import { Request, Response } from 'express';
import Log from '../models/Log';
import { sendSuccess, sendError } from '../utils';

export const createLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, packageName, metadata } = req.body;
    
    // Add server-side IP/UserAgent if not provided
    const userAgent = metadata?.userAgent || req.headers['user-agent'] || 'Unknown';
    
    const newLog = new Log({
      action,
      packageName,
      metadata: { ...metadata, userAgent }
    });

    await newLog.save();
    
    // We can respond without data to keep it lightweight
    res.status(200).json({ success: true });
  } catch (error) {
    // Fail silently for tracking so it doesn't break client experience
    console.error('Error creating log:', error);
    res.status(500).json({ success: false });
  }
};

export const getLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, page = 1 } = req.query;
    
    const logs = await Log.find()
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
      
    const total = await Log.countDocuments();
    
    sendSuccess(res, { logs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) }, 'Logs fetched');
  } catch (error) {
    console.error('Error fetching logs:', error);
    sendError(res, 'Error fetching logs', 500);
  }
};

export const clearLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    await Log.deleteMany({});
    sendSuccess(res, null, 'All logs cleared');
  } catch (error) {
    console.error('Error clearing logs:', error);
    sendError(res, 'Error clearing logs', 500);
  }
};
