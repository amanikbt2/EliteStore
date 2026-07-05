import { Request, Response } from 'express';
import Setting from '../models/Setting';
import { sendSuccess, sendError } from '../utils';

export const getTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const setting = await Setting.findOne({ key: 'web_theme' });
    sendSuccess(res, { theme: setting?.value || 'light' }, 'Theme fetched');
  } catch (error) {
    sendError(res, 'Error fetching theme', 500);
  }
};

export const updateTheme = async (req: Request, res: Response): Promise<void> => {
  try {
    const { theme } = req.body;
    if (!['light', 'dark'].includes(theme)) {
      sendError(res, 'Invalid theme', 400);
      return;
    }
    await Setting.findOneAndUpdate(
      { key: 'web_theme' }, 
      { value: theme }, 
      { upsert: true, returnDocument: 'after' }
    );
    sendSuccess(res, { theme }, 'Theme updated');
  } catch (error) {
    sendError(res, 'Error updating theme', 500);
  }
};
