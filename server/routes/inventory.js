import express from 'express';
import { tenantAuth } from '../middleware/tenantAuth.js';
import { validate } from '../middleware/validate.js';
import { purchaseSchema, sellSchema, adjustmentSchema } from '../schemas/inventorySchema.js';

const router = express.Router();


router.get('/products/autocomplete', tenantAuth, async (req, res) => {
    const { query } = req.query;
    const Product = req.db.model('Product');
    try {
        const products = await Product.find({ name: { $regex: query, $options: 'i' } }).limit(10);
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. Autocomplete for Sale (Products + Active Batches)
router.get('/batches/autocomplete', tenantAuth, async (req, res) => {
    const { query } = req.query;
    const Product = req.db.model('Product');
    const Batch = req.db.model('Batch');
    try {
        const products = await Product.find({ name: { $regex: query, $options: 'i' } }).limit(10);
        const productIds = products.map(p => p._id);
        const activeBatches = await Batch.find({ productId: { $in: productIds }, currentQuantity: { $gt: 0 } }).populate('productId');
        res.json(activeBatches);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
router.post('/sell', tenantAuth, validate(sellSchema), async (req, res) => {
    const { items } = req.body;
    const Batch = req.db.model('Batch');
    const Transaction = req.db.model('Transaction');

    try {
        let transactionItems = [];
        let grandTotal = 0;

        // Loop through all items in the cart
        for (let item of items) {
            const batch = await Batch.findById(item.batchId);
            if (!batch) return res.status(404).json({ error: "Batch not found" });
            if (batch.currentQuantity < item.quantityToSell) {
                return res.status(400).json({ error: `Not enough stock for one of the items.` });
            }

            // Deduct stock
            batch.currentQuantity -= item.quantityToSell;
            await batch.save();

            const rowTotal = item.quantityToSell * item.sellingPrice;
            grandTotal += rowTotal;

            transactionItems.push({
                productId: batch.productId,
                batchId: batch._id,
                quantity: -Math.abs(item.quantityToSell),
                price: item.sellingPrice,
                total: rowTotal
            });
        }

        // Save as ONE Single Receipt
        const transaction = new Transaction({
            type: 'SALE',
            items: transactionItems,
            totalAmount: grandTotal
        });
        await transaction.save();

        res.json({ message: "Sale successful", transactionId: transaction._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Record a New Purchase (Adds a Batch)
router.post('/purchase', tenantAuth, validate(purchaseSchema), async (req, res) => {
    const { items } = req.body;
    const Product = req.db.model('Product');
    const Batch = req.db.model('Batch');
    const Transaction = req.db.model('Transaction');

    try {
        let transactionItems = [];
        let grandTotal = 0;

        for (let item of items) {
            // Find or create product
            let product = await Product.findOne({ name: { $regex: new RegExp(`^${item.productName}$`, 'i') } });
            if (!product) {
                product = new Product({ name: item.productName, hsnCode: item.hsnCode || '' });
                await product.save();
            }

            // Create batch
            const newBatch = new Batch({
                productId: product._id,
                purchasePrice: item.purchasePrice,
                currentQuantity: item.quantity,
                initialQuantity: item.quantity
            });
            await newBatch.save();

            const rowTotal = item.quantity * item.purchasePrice;
            grandTotal += rowTotal;

            transactionItems.push({
                productId: product._id,
                batchId: newBatch._id,
                quantity: item.quantity,
                price: item.purchasePrice,
                total: rowTotal
            });
        }

        // Save as ONE Single Receipt
        const transaction = new Transaction({
            type: 'PURCHASE',
            items: transactionItems,
            totalAmount: grandTotal
        });
        await transaction.save();

        res.status(201).json({ message: "Stock added successfully", transactionId: transaction._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Manually Adjust Stock or Price of a specific Batch
router.put('/batch/:batchId', tenantAuth, validate(adjustmentSchema), async (req, res, next) => {
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