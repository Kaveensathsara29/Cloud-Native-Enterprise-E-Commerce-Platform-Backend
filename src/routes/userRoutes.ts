import express from 'express';
import { getUserProfile, updateUserProfile, addAddress, removeAddress } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

router.post('/addresses', protect, addAddress);
router.delete('/addresses/:id', protect, removeAddress);

export default router;
