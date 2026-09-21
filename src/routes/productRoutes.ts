import express from 'express';
import {
  getProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct
} from '../controllers/productController.js';
import { protect, adminProtect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
  .get(getProducts)
  .post(protect, adminProtect, createProduct);

router.get('/:slug', getProductBySlug);

router.route('/id/:id')
  .put(protect, adminProtect, updateProduct)
  .delete(protect, adminProtect, deleteProduct);

router.route('/:id')
  .put(protect, adminProtect, updateProduct)
  .delete(protect, adminProtect, deleteProduct);

export default router;
