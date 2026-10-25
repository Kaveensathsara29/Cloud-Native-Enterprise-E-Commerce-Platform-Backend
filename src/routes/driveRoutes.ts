import express from 'express';
import { getDriveStatus, authorizeDrive, oauthCallback } from '../controllers/driveController.js';

const router = express.Router();

router.get('/status', getDriveStatus);
router.get('/authorize', authorizeDrive);
router.get('/oauth-callback', oauthCallback);

export default router;
