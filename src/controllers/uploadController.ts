import { Request, Response } from 'express';
import { uploadFileToDrive, isDriveConfigured, getDriveAuthUrl } from '../services/googleDriveService.js';

// @desc    Upload an image/file directly to Google Drive using Google OAuth service
// @route   POST /api/upload
// @access  Public / Admin
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    let fileBuffer: Buffer | undefined;
    let fileName: string | undefined;
    let mimeType: string = 'image/jpeg';

    if (req.file) {
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
    } else if (req.body.image && typeof req.body.image === 'string' && req.body.image.startsWith('data:')) {
      // Support base64 upload conversion to Drive
      const matches = req.body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        mimeType = matches[1];
        fileBuffer = Buffer.from(matches[2], 'base64');
        fileName = req.body.name || `upload-${Date.now()}.${mimeType.split('/')[1] || 'jpg'}`;
      }
    }

    if (!fileBuffer || !fileName) {
      res.status(400).json({
        message: 'No file provided. Please attach a file (multipart/form-data with field "image" or "file") or send a base64 image string.'
      });
      return;
    }

    // Check if Drive is configured
    if (!isDriveConfigured() && !process.env.GOOGLE_DRIVE_REFRESH_TOKEN) {
      const authUrl = getDriveAuthUrl();
      res.status(503).json({
        message: 'Google Drive OAuth service is not authenticated. Please authorize Google Drive to enable cloud storage.',
        authUrl,
        requiresAuth: true
      });
      return;
    }

    const result = await uploadFileToDrive({
      buffer: fileBuffer,
      filename: fileName,
      mimetype: mimeType
    });

    res.status(200).json({
      success: true,
      message: 'File successfully uploaded to Google Drive storage',
      url: result.directUrl,
      thumbnailUrl: result.thumbnailUrl,
      fileId: result.fileId,
      name: result.name,
      webViewLink: result.webViewLink
    });
  } catch (error: any) {
    console.error('[UploadController] Error uploading to Google Drive:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload file to Google Drive storage'
    });
  }
};
