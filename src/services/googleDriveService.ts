import { google } from 'googleapis';
import { Readable } from 'stream';

let inMemoryRefreshToken: string | null = null;

export const getOAuth2Client = () => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_DRIVE_REDIRECT_URI || 'http://localhost:5001/api/drive/oauth-callback';

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    redirectUri
  );

  const refreshToken = inMemoryRefreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  if (refreshToken) {
    oauth2Client.setCredentials({ refresh_token: refreshToken });
  }

  return oauth2Client;
};

export const isDriveConfigured = (): boolean => {
  const hasClientId = Boolean(process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID'));
  const hasClientSecret = Boolean(process.env.GOOGLE_CLIENT_SECRET && !process.env.GOOGLE_CLIENT_SECRET.includes('YOUR_GOOGLE_CLIENT_SECRET'));
  const hasRefreshToken = Boolean(inMemoryRefreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN);
  return hasClientId && hasClientSecret && hasRefreshToken;
};

export const getDriveAuthUrl = (): string => {
  const oauth2Client = getOAuth2Client();
  const scopes = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive'
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes
  });
};

export const handleOAuthCallback = async (code: string) => {
  const oauth2Client = getOAuth2Client();
  const { tokens } = await oauth2Client.getToken(code);
  
  if (tokens.refresh_token) {
    inMemoryRefreshToken = tokens.refresh_token;
  }
  oauth2Client.setCredentials(tokens);
  return tokens;
};

export interface UploadResult {
  fileId: string;
  name: string;
  directUrl: string;
  thumbnailUrl: string;
  webViewLink?: string;
}

export const uploadFileToDrive = async ({
  buffer,
  filename,
  mimetype
}: {
  buffer: Buffer;
  filename: string;
  mimetype: string;
}): Promise<UploadResult> => {
  const oauth2Client = getOAuth2Client();
  const refreshToken = inMemoryRefreshToken || process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!refreshToken) {
    throw new Error(
      'Google Drive OAuth is not authenticated. Please visit /api/drive/authorize to connect your Google account or set GOOGLE_DRIVE_REFRESH_TOKEN in BackEnd/.env'
    );
  }

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);

  const fileMetadata: { name: string; parents?: string[] } = {
    name: filename
  };

  if (process.env.GOOGLE_DRIVE_FOLDER_ID) {
    fileMetadata.parents = [process.env.GOOGLE_DRIVE_FOLDER_ID];
  }

  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: {
      mimeType: mimetype,
      body: stream
    },
    fields: 'id, name, webViewLink, webContentLink'
  });

  const fileId = response.data.id;
  if (!fileId) {
    throw new Error('Google Drive upload failed: No file ID returned.');
  }

  // Make uploaded file publicly readable so it displays properly in the web app
  try {
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
  } catch (permErr: any) {
    console.warn(`[Google Drive] Warning setting file permissions: ${permErr.message}`);
  }

  // Direct CDN URL for embedding images: https://lh3.googleusercontent.com/d/{fileId}
  const directUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
  const thumbnailUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;

  return {
    fileId,
    name: response.data.name || filename,
    directUrl,
    thumbnailUrl,
    webViewLink: response.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`
  };
};
