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

    const admin = await Admin.findOne({ username });
    if (!admin) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = generateToken({ id: admin._id, username: admin.username, role: 'admin' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    });

    sendSuccess(res, { username: admin.username, lastLogin: admin.lastLogin }, 'Login successful');
  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 'Server error during login', 500);
  }
};

export const logoutAdmin = (req: Request, res: Response): void => {
  res.clearCookie('token');
  sendSuccess(res, null, 'Logged out successfully');
};
