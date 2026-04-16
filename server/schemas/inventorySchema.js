import { z } from 'zod';

export const purchaseSchema = z.object({
    items: z.array(z.object({
        productName: z.string().min(1, "Product name is required"),
        hsnCode: z.string().optional(),
        purchasePrice: z.number().positive("Purchase price must be greater than 0"), // Allows decimals
        quantity: z.number().positive("Quantity must be greater than 0") // Allows decimals
    })).min(1, "At least one item is required")
});

export const sellSchema = z.object({
    items: z.array(z.object({
        batchId: z.string().length(24, "Invalid Batch ID"),
        sellingPrice: z.number().positive("Selling price must be greater than 0"), // Allows decimals
        quantityToSell: z.number().positive("Sale quantity must be greater than 0")
    })).min(1, "At least one item is required")
});

export const adjustmentSchema = z.object({
    newQuantity: z.number().min(0, "Quantity cannot be negative"),
    newPurchasePrice: z.number().positive("Price must be positive").optional(),
    notes: z.string().max(200).optional()
});