/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * Product & Pricing Agreement Controller
 */

import type { Request, Response } from 'express';
import * as productService from './product.service.ts';
import { sendSuccess, sendCreated, sendNotFound, sendError, sendServerError } from '../../common/responseHelper.ts';
import type { CreateProductDto, UpdateProductDto, SetPricingAgreementDto } from '../../../types/apiContracts.ts';

export async function getProducts(req: Request, res: Response) {
  try {
    const products = await productService.getAllProducts();
    return sendSuccess(res, products);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const product = await productService.getProductById(id);
    if (!product) {
      return sendNotFound(res, `Product with id "${id}"`);
    }
    return sendSuccess(res, product);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function createProduct(req: Request, res: Response) {
  try {
    const body = req.body as CreateProductDto;
    if (!body.nameEn || !body.nameAm || body.basePrice === undefined || !body.category) {
      return sendError(res, 'Missing required fields: nameEn, nameAm, basePrice, category');
    }
    const product = await productService.createProduct(body);
    return sendCreated(res, product, 'Product created successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const patch = req.body as UpdateProductDto;
    const updated = await productService.updateProduct(id, patch);
    if (!updated) {
      return sendNotFound(res, `Product with id "${id}"`);
    }
    return sendSuccess(res, updated, 'Product updated successfully');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function getPricingAgreements(req: Request, res: Response) {
  try {
    const agreements = await productService.getAllPricingAgreements();
    return sendSuccess(res, agreements);
  } catch (err: any) {
    return sendServerError(res, err);
  }
}

export async function setPricingAgreement(req: Request, res: Response) {
  try {
    const body = req.body as SetPricingAgreementDto;
    if (!body.customerId || !body.productId || body.agreedPrice === undefined) {
      return sendError(res, 'Missing required fields: customerId, productId, agreedPrice');
    }
    const agreement = await productService.setCustomerPricingAgreement(body);
    return sendSuccess(res, agreement, 'Pricing agreement saved');
  } catch (err: any) {
    return sendServerError(res, err);
  }
}
