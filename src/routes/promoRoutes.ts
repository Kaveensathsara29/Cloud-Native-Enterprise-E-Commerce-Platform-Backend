import express, { Request, Response } from 'express';
import Promo from '../models/Promo.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @desc    Get all promo codes
// @route   GET /api/promos
// @access  Public
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const promos = await Promo.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(promos);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Validate a promo code
// @route   POST /api/promos/validate
// @access  Public
router.post('/validate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code } = req.body;
    if (!code) {
      res.status(400).json({ message: 'Promo code is required' });
      return;
    }

    const formattedCode = code.toUpperCase().trim();
    const promo = await Promo.findOne({ code: formattedCode, isActive: true });

    if (promo) {
      res.json({
        valid: true,
        code: promo.code,
        discount: promo.discount
      });
    } else {
      res.status(404).json({ valid: false, message: 'Invalid or expired promo code' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Create promo code
// @route   POST /api/promos
// @access  Private/Admin
router.post('/', protect, adminProtect, async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, discount } = req.body;
    if (!code || discount === undefined) {
      res.status(400).json({ message: 'Please provide code and discount percentage' });
      return;
    }

    const formattedCode = code.toUpperCase().trim();
    const existing = await Promo.findOne({ code: formattedCode });
    if (existing) {
      existing.discount = Number(discount);
      existing.isActive = true;
      await existing.save();
      res.json(existing);
      return;
    }

    const newPromo = await Promo.create({
      code: formattedCode,
      discount: Number(discount)
    });
    res.status(201).json(newPromo);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Delete promo code
// @route   DELETE /api/promos/:code
// @access  Private/Admin
router.delete('/:code', protect, adminProtect, async (req: Request, res: Response): Promise<void> => {
  try {
    const formattedCode = (req.params.code as string).toUpperCase().trim();
    const promo = await Promo.findOne({ code: formattedCode });
    if (promo) {
      await promo.deleteOne();
      res.json({ message: 'Promo code deleted successfully' });
    } else {
      res.status(404).json({ message: 'Promo code not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
