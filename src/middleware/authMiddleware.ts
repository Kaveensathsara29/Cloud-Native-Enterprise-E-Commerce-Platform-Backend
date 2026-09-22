import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import mongoose from 'mongoose';

interface JwtPayload {
  id: string;
}

// Generate JWT Token helper
export const generateToken = (id: string | mongoose.Types.ObjectId): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET || '', {
    expiresIn: '30d'
  });
};

export const authCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/'
};

export const clearAuthCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/'
};

const getCookie = (cookieHeader: string | undefined, name: string): string | undefined => {
  const cookie = cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.slice(name.length + 1)) : undefined;
};

// Protect routes - User authorization
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  const token = getCookie(req.headers.cookie, 'auth_token') ||
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : undefined);

  if (token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || ''
      ) as JwtPayload;

      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return;
      }

      req.user = user;
      next();
      return;
    } catch (error) {
      res.status(401).json({ message: 'Not authorized, token failed' });
      return;
    }
  }

  res.status(401).json({ message: 'Not authorized, no token provided' });
};

// Admin middleware - Require isAdmin flag
export const adminProtect = (req: Request, res: Response, next: NextFunction) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
