import { z } from 'zod';

export const purchaseSchema = z.object({
    productName: z.string().min(2, "Product name must be at least 2 characters"),
    hsnCode: z.string().min(4, "HSN code must be at least 4 characters"),
    purchasePrice: z.number().positive("Purchase price must be greater than 0"),
    sellingPrice: z.number().positive("Selling price must be greater than 0").optional(),
    quantity: z.number().int().positive("Quantity must be a positive whole number")
});

export const sellSchema = z.object({
    batchId: z.string().length(24, "Invalid Batch ID format"), // MongoDB ObjectIds are 24 hex characters
    quantityToSell: z.number().int().positive("Sale quantity must be at least 1")
});

export const adjustmentSchema = z.object({
    newQuantity: z.number().int().min(0, "Quantity cannot be negative"),
    newPurchasePrice: z.number().positive("Price must be positive").optional(),
    notes: z.string().max(200, "Notes cannot exceed 200 characters").optional()
});