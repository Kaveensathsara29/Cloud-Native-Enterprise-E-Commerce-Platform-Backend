import { Request, Response } from 'express';
import { getDriveAuthUrl, handleOAuthCallback, isDriveConfigured } from '../services/googleDriveService.js';

// @desc    Check Google Drive OAuth configuration status
// @route   GET /api/drive/status
// @access  Public
export const getDriveStatus = (_req: Request, res: Response): void => {
  const configured = isDriveConfigured();
  const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID'));
  const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_SECRET.includes('YOUR_GOOGLE_CLIENT_SECRET'));

  let authUrl = '';
  try {
    if (hasClientId && hasClientSecret) {
      authUrl = getDriveAuthUrl();
    }
  } catch (err: any) {
    console.warn('[DriveStatus] Could not generate auth URL:', err.message);
  }

  res.json({
    configured,
    hasClientId,
    hasClientSecret,
    authUrl,
    redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5001/api/drive/oauth-callback'
  });
};

// @desc    Redirect to Google OAuth consent page
// @route   GET /api/drive/authorize
// @access  Public
export const authorizeDrive = (_req: Request, res: Response): void => {
  try {
    const authUrl = getDriveAuthUrl();
    res.redirect(authUrl);
  } catch (error: any) {
    res.status(500).send(`
      <h2>Google Drive OAuth Authorization Error</h2>
      <p style="color: red;">${error.message}</p>
      <p>Please make sure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> are set in your <code>BackEnd/.env</code> file.</p>
    `);
  }
};

// @desc    OAuth Callback from Google
// @route   GET /api/drive/oauth-callback
// @access  Public
export const oauthCallback = async (req: Request, res: Response): Promise<void> => {
  const code = req.query.code as string;
  const error = req.query.error as string;

  if (error) {
    res.status(400).send(`
      <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #ffccd5; border-radius: 8px; background: #fff0f3;">
        <h2 style="color: #d90429;">Google Drive Authorization Denied</h2>
        <p>Google returned error: <strong>${error}</strong></p>
        <p><a href="http://localhost:5173/admin">Return to Admin Dashboard</a></p>
      </div>
    `);
    return;
  }

  if (!code) {
    res.status(400).send('Missing authorization code');
    return;
  }

  try {
    const tokens = await handleOAuthCallback(code);
    const refreshToken = tokens.refresh_token;

    console.log('\n======================================================');
    console.log('[Google Drive OAuth] Authorization Successful!');
    if (refreshToken) {
      console.log('[Google Drive OAuth] REFRESH TOKEN:', refreshToken);
      console.log('Add this to BackEnd/.env as:');
      console.log(`GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}`);
    }
    console.log('======================================================\n');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Google Drive Connected Successfully</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #f8fafc;
            color: #1e293b;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .card {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);
            max-width: 560px;
            width: 100%;
            padding: 32px;
            text-align: center;
          }
          .icon {
            font-size: 48px;
            margin-bottom: 16px;
          }
          h1 {
            font-size: 24px;
            color: #0f172a;
            margin-bottom: 12px;
          }
          p {
            color: #64748b;
            line-height: 1.6;
            margin-bottom: 20px;
          }
          .token-box {
            background: #f1f5f9;
            padding: 12px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 13px;
            word-break: break-all;
            text-align: left;
            margin: 16px 0;
            border: 1px solid #e2e8f0;
          }
          .btn {
            display: inline-block;
            background: #ff6b00;
            color: white;
            padding: 10px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            transition: background 0.2s;
          }
          .btn:hover {
            background: #e05e00;
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">🚀</div>
          <h1>Google Drive Storage Connected!</h1>
          <p>The Google Drive OAuth service is now active in your application. Product uploads and images will now be stored in your Google Drive cloud storage.</p>
          ${refreshToken ? `
            <p style="font-size: 13px; text-align: left; margin-bottom: 4px; font-weight: 600;">Your Refresh Token (already active in memory, also paste in <code>BackEnd/.env</code> for persistence):</p>
            <div class="token-box">GOOGLE_DRIVE_REFRESH_TOKEN=${refreshToken}</div>
          ` : '<p style="color: #10b981; font-weight: 500;">Existing refresh token verified and reused.</p>'}
          <div style="margin-top: 24px;">
            <a href="http://localhost:5173/admin" class="btn">Return to Admin Panel</a>
          </div>
        </div>
      </body>
      </html>
    `);
  } catch (error: any) {
    console.error('[Google Drive OAuth] Callback error:', error);
    res.status(500).send(`
      <div style="font-family: sans-serif; max-width: 600px; margin: 40px auto; padding: 20px; border: 1px solid #ffccd5; border-radius: 8px; background: #fff0f3;">
        <h2 style="color: #d90429;">OAuth Token Exchange Failed</h2>
        <p>${error.message}</p>
        <p><a href="/api/drive/authorize">Try Authorizing Again</a></p>
      </div>
    `);
  }
};
