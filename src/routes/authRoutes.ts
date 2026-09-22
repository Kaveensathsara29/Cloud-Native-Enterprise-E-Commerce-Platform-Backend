import express from 'express';
import { registerUser, loginUser, googleAuth, adminLogin, logoutUser } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleAuth);
router.post('/admin-login', adminLogin);
router.post('/logout', logoutUser);

export default router;
