import { Request, Response } from 'express';
import Log from '../models/Log';
import { sendSuccess, sendError } from '../utils';

const geoCache = new Map<string, { country?: string; city?: string }>();

const getGeo = async (ip: string): Promise<{ country?: string; city?: string }> => {
  if (!ip || ip === '::1' || ip === '127.0.0.1') return {};
  if (geoCache.has(ip)) return geoCache.get(ip)!;
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'User-Agent': 'EliteHub/1.0' },
      signal: AbortSignal.timeout(3000)
    });
    if (!res.ok) return {};
    const data = await res.json() as any;
    const geo = { country: data.country_name, city: data.city };
    geoCache.set(ip, geo);
    return geo;
  } catch {
    return {};
  }
};

export const createLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const { action, packageName, metadata } = req.body;
    
    // Resolve client IP (works behind proxies)
    const clientIp: string = (
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket?.remoteAddress ||
      ''
    ).replace('::ffff:', '');

    // Add server-side IP/UserAgent if not provided
    const userAgent = metadata?.userAgent || req.headers['user-agent'] || 'Unknown';

    // Geo lookup on the server — no CORS issues
    const geo = await getGeo(clientIp);
    
    const newLog = new Log({
      action,
      packageName,
      metadata: { ...metadata, ...geo, userAgent }
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
