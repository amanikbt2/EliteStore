import { Request, Response, NextFunction } from 'express';
import { verifyToken, sendError } from '../utils';

export interface AuthRequest extends Request {
  admin?: any;
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      sendError(res, 'Invalid or expired token', 401);
      return;
    }

    req.admin = decoded;
    next();
  } catch (error) {
    sendError(res, 'Authentication failed', 500);
  }
};
