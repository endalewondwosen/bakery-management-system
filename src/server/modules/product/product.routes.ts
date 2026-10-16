/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Product & Pricing Agreement Routes Definition
 */

import { Router } from 'express';
import * as productController from './product.controller.ts';

export const productRouter = Router();

// Products
productRouter.get('/', productController.getProducts);
productRouter.get('/:id', productController.getProduct);
productRouter.post('/', productController.createProduct);
productRouter.put('/:id', productController.updateProduct);
productRouter.delete('/:id', productController.deleteProduct);

// Customer Pricing Agreements sub-route or standalone
productRouter.get('/agreements/all', productController.getPricingAgreements);
productRouter.post('/agreements', productController.setPricingAgreement);
productRouter.delete('/agreements/:id', productController.deletePricingAgreement);
