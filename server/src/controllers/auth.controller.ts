import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Admin from '../models/Admin';
import { generateToken, sendError, sendSuccess } from '../utils';

export const loginAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      sendError(res, 'Username and password are required', 400);
      return;
    }

    const adminUser = process.env.ADMIN_USER || 'admin';
    const adminPass = process.env.ADMIN_PASS || 'admin123';

    if (username !== adminUser || password !== adminPass) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const token = generateToken({ id: 'admin_id', username, role: 'admin' });

    sendSuccess(res, { username, token }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Server error during login', 500);
  }
};

export const logoutAdmin = (req: Request, res: Response): void => {
  res.clearCookie('token');
  sendSuccess(res, null, 'Logged out successfully');
};
