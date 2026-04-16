import express from 'express';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Search Products and their distinct Batches
router.get('/search', tenantAuth, async (req, res) => {
    const { query } = req.query; // can be name or HSN
    const Product = req.db.model('Product');
    const Batch = req.db.model('Batch');

    try {
        // Find products matching name or HSN
        const products = await Product.find({
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { hsnCode: { $regex: query, $options: 'i' } }
            ]
        });

        const productIds = products.map(p => p._id);

        // Find all batches for these products that have stock > 0
        const batches = await Batch.find({
            productId: { $in: productIds },
            currentQuantity: { $gt: 0 }
        }).populate('productId');

        // Group batches by product for the frontend
        const groupedInventory = products.map(product => {
            const productBatches = batches.filter(b =>
                b.productId._id.toString() === product._id.toString()
            );

            const totalStock = productBatches.reduce((acc, curr) => acc + curr.currentQuantity, 0);
            const totalValue = productBatches.reduce((acc, curr) => acc + (curr.currentQuantity * curr.purchasePrice), 0);

            return {
                product,
                totalStock,
                totalValue,
                batches: productBatches // Shows the ₹10 batch and ₹12 batch separately
            };
        });

        res.json(groupedInventory);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Process a Sale
router.post('/sell', tenantAuth, async (req, res) => {
    const { batchId, quantityToSell } = req.body;
    const Batch = req.db.model('Batch');

    try {
        const batch = await Batch.findById(batchId);

        if (!batch) return res.status(404).json({ error: "Batch not found" });
        if (batch.currentQuantity < quantityToSell) {
            return res.status(400).json({ error: "Cannot sell excess than stock in this batch." });
        }

        // Deduct from the specific price batch
        batch.currentQuantity -= quantityToSell;
        await batch.save();

        // Here you would also log the sale in a Transactions collection

        res.json({ message: "Sale successful", remainingStock: batch.currentQuantity });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Record a New Purchase (Adds a Batch)
router.post('/purchase', tenantAuth, async (req, res) => {
    const { productName, hsnCode, purchasePrice, sellingPrice, quantity } = req.body;
    const Product = req.db.model('Product');
    const Batch = req.db.model('Batch');
    const Transaction = req.db.model('Transaction');

    try {
        // 1. Find or create the product
        let product = await Product.findOne({
            $or: [{ name: productName }, { hsnCode: hsnCode }]
        });

        if (!product) {
            product = new Product({ name: productName, hsnCode });
            await product.save();
        }

        // 2. Create a new batch for this specific purchase rate
        const newBatch = new Batch({
            productId: product._id,
            purchasePrice,
            sellingPrice, // Optional: if you want to track target selling price per batch
            currentQuantity: quantity,
            initialQuantity: quantity
        });
        await newBatch.save();

        // 3. Log the purchase transaction
        const transaction = new Transaction({
            type: 'PURCHASE',
            productId: product._id,
            batchId: newBatch._id,
            quantity: quantity,
            price: purchasePrice,
            totalAmount: quantity * purchasePrice
        });
        await transaction.save();

        res.status(201).json({ message: "Stock added successfully", batch: newBatch });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manually Adjust Stock or Price of a specific Batch
router.put('/batch/:batchId', tenantAuth, async (req, res) => {
    const { newQuantity, newPurchasePrice, notes } = req.body;
    const Batch = req.db.model('Batch');
    const Transaction = req.db.model('Transaction');

    try {
        const batch = await Batch.findById(req.params.batchId);
        if (!batch) return res.status(404).json({ error: "Batch not found" });

        const quantityDifference = newQuantity - batch.currentQuantity;

        // Update the batch
        batch.currentQuantity = newQuantity;
        if (newPurchasePrice) batch.purchasePrice = newPurchasePrice;
        await batch.save();

        // Log the adjustment if quantity changed
        if (quantityDifference !== 0) {
            const transaction = new Transaction({
                type: 'ADJUSTMENT',
                productId: batch.productId,
                batchId: batch._id,
                quantity: quantityDifference,
                price: batch.purchasePrice,
                totalAmount: quantityDifference * batch.purchasePrice,
                notes: notes || "Manual adjustment"
            });
            await transaction.save();
        }

        res.json({ message: "Batch updated", batch });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;