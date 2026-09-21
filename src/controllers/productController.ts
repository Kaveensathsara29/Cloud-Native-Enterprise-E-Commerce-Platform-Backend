import { Request, Response } from 'express';
import Product from '../models/Product.js';

// @desc    Fetch all products with optional search query & category filtering
// @route   GET /api/products
// @access  Public
export const getProducts = async (req: Request, res: Response): Promise<void> => {
  try {
    const keywordStr = req.query.keyword as string | undefined;
    const categoryStr = req.query.category as string | undefined;

    const keyword = keywordStr
      ? {
          name: {
            $regex: keywordStr,
            $options: 'i'
          }
        }
      : {};

    const category = categoryStr ? { category: categoryStr } : {};

    const products = await Product.find({ ...keyword, ...category });
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Fetch single product by slug
// @route   GET /api/products/:slug
// @access  Public
export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await Product.findOne({ slug: req.params.slug });
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name,
      slug,
      description,
      longDescription,
      price,
      originalPrice,
      category,
      images,
      rating,
      reviewCount,
      colors,
      sizes,
      specs,
      reviews,
      featured,
      isFeatured,
      onSale,
      inStock,
      freeShipping,
      shippingFee
    } = req.body;

    const generatedSlug = slug || (name ? name.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-') : 'prod-' + Date.now());

    const product = new Product({
      name: name,
      slug: generatedSlug,
      price: price !== undefined ? Number(price) : 0,
      originalPrice: originalPrice ? Number(originalPrice) : undefined,
      description: description || '',
      longDescription: longDescription || '',
      category: category || '',
      images: images && images.length > 0 ? images : [],
      rating: rating !== undefined ? Number(rating) : 0.0,
      reviewCount: reviewCount !== undefined ? Number(reviewCount) : 0,
      colors: colors || [],
      sizes: sizes || [],
      specs: specs || {},
      reviews: reviews || [],
      featured: featured !== undefined ? Boolean(featured) : Boolean(isFeatured),
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : Boolean(featured),
      onSale: onSale !== undefined ? Boolean(onSale) : false,
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      freeShipping: freeShipping !== undefined ? Boolean(freeShipping) : false,
      shippingFee: freeShipping ? 0 : (shippingFee !== undefined ? Number(shippingFee) : 0)
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to find product by id or slug
const findProductByIdOrSlug = async (param: string) => {
  if (param.match(/^[0-9a-fA-F]{24}$/)) {
    const byId = await Product.findById(param);
    if (byId) return byId;
  }
  return await Product.findOne({ slug: param });
};

// @desc    Update a product
// @route   PUT /api/products/:id or PUT /api/products/id/:id
// @access  Private/Admin
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await findProductByIdOrSlug(req.params.id as string);

    if (product) {
      if (req.body.name !== undefined) product.name = req.body.name;
      if (req.body.slug !== undefined) product.slug = req.body.slug;
      if (req.body.price !== undefined) product.price = Number(req.body.price);
      if (req.body.originalPrice !== undefined) product.originalPrice = req.body.originalPrice ? Number(req.body.originalPrice) : undefined;
      if (req.body.description !== undefined) product.description = req.body.description;
      if (req.body.longDescription !== undefined) product.longDescription = req.body.longDescription;
      if (req.body.category !== undefined) product.category = req.body.category;
      if (req.body.images !== undefined) product.images = req.body.images;
      if (req.body.colors !== undefined) product.colors = req.body.colors;
      if (req.body.sizes !== undefined) product.sizes = req.body.sizes;
      if (req.body.specs !== undefined) product.specs = req.body.specs;
      if (req.body.reviews !== undefined) product.reviews = req.body.reviews;
      if (req.body.isFeatured !== undefined || req.body.featured !== undefined) {
        const val = req.body.featured !== undefined ? req.body.featured : req.body.isFeatured;
        product.isFeatured = Boolean(val);
        product.featured = Boolean(val);
      }
      if (req.body.onSale !== undefined) product.onSale = Boolean(req.body.onSale);
      if (req.body.inStock !== undefined) product.inStock = Boolean(req.body.inStock);
      if (req.body.freeShipping !== undefined) product.freeShipping = Boolean(req.body.freeShipping);
      if (req.body.shippingFee !== undefined) product.shippingFee = product.freeShipping ? 0 : Number(req.body.shippingFee);

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id or DELETE /api/products/id/:id
// @access  Private/Admin
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await findProductByIdOrSlug(req.params.id as string);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
