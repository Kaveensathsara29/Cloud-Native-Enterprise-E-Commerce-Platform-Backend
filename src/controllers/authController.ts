import { Request, Response } from 'express';
import User from '../models/User.js';
import {
  authCookieOptions,
  clearAuthCookieOptions,
  generateToken
} from '../middleware/authMiddleware.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const sendAuthResponse = (res: Response, status: number, user: any): void => {
  res.cookie('auth_token', generateToken(user._id), authCookieOptions);
  res.status(status).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    isAdmin: user.isAdmin,
    addresses: user.addresses
  });
};

export const logoutUser = (_req: Request, res: Response): void => {
  res.clearCookie('auth_token', clearAuthCookieOptions);
  res.status(204).send();
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ message: 'Please provide all required fields (name, email, password)' });
      return;
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      res.status(400).json({ message: 'User already exists with this email address' });
      return;
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    });

    if (user) {
      sendAuthResponse(res, 201, user);
    } else {
      res.status(400).json({ message: 'Invalid user data received' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Please provide both email and password' });
      return;
    }

    const formattedEmail = email.toLowerCase().trim();
    let user = await User.findOne({ email: formattedEmail });

    // If user does not exist in database, automatically create a new unique user profile!
    if (!user) {
      const defaultName = formattedEmail.split('@')[0].replace(/[._-]/g, ' ');
      const formattedName = defaultName.charAt(0).toUpperCase() + defaultName.slice(1);

      user = await User.create({
        name: formattedName || 'New User',
        email: formattedEmail,
        password: password
      });

      console.log(`[Auth] Auto-registered unique user profile in MongoDB: ${user.email} (${user._id})`);

      sendAuthResponse(res, 201, user);
      return;
    }

    // Existing user: check password
    if (await user.matchPassword(password)) {
      sendAuthResponse(res, 200, user);
    } else {
      res.status(401).json({ message: 'Incorrect password for this email account' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Google OAuth Login & Verification
// @route   POST /api/auth/google
// @access  Public
export const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, picture, googleId, idToken } = req.body;

    let googleEmail = email;
    let googleName = name;
    let googlePic = picture;
    let gId = googleId;

    // Optional: Verify Google ID token if provided
    if (idToken && process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID')) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken,
          audience: process.env.GOOGLE_CLIENT_ID
        });
        const payload = ticket.getPayload();
        if (payload) {
          googleEmail = payload.email || googleEmail;
          googleName = payload.name || googleName;
          googlePic = payload.picture || googlePic;
          gId = payload.sub || gId;
        }
      } catch (err: any) {
        console.warn('Google ID Token Verification warning, falling back to payload:', err.message);
      }
    }

    if (!googleEmail) {
      res.status(400).json({ message: 'Google authentication email is required' });
      return;
    }

    // Find existing user or create a new one
    let user = await User.findOne({ email: googleEmail.toLowerCase() });

    if (user) {
      // Update Google profile picture or Google ID if changed
      user.profilePicture = googlePic || user.profilePicture;
      if (gId) user.googleId = gId;
      await user.save();
    } else {
      user = await User.create({
        name: googleName || 'Google User',
        email: googleEmail.toLowerCase(),
        googleId: gId,
        profilePicture: googlePic
      });
    }

    sendAuthResponse(res, 200, user);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Admin Login
// @route   POST /api/auth/admin-login
// @access  Public
export const adminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const formattedEmail = email.toLowerCase().trim();

    if (formattedEmail === 'admin@master.net' && password === 'admin123') {
      let adminUser = await User.findOne({ email: formattedEmail });
      if (!adminUser) {
        adminUser = await User.create({
          name: 'Administrator',
          email: formattedEmail,
          password: 'admin123',
          isAdmin: true
        });
      }

      sendAuthResponse(res, 200, { ...adminUser.toObject(), isAdmin: true });
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
