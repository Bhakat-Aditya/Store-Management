import express from 'express';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

router.get('/summary', tenantAuth, async (req, res) => {
    const { filter } = req.query; // 'week', 'month', 'year', or undefined
    const Batch = req.db.model('Batch');
    const Transaction = req.db.model('Transaction');

    try {
        // 1. Calculate Date Range Filter
        let dateQuery = {};
        if (filter && filter !== 'all') {
            const startDate = new Date();
            if (filter === 'week') startDate.setDate(startDate.getDate() - 7);
            if (filter === 'month') startDate.setMonth(startDate.getMonth() - 1);
            if (filter === 'year') startDate.setFullYear(startDate.getFullYear() - 1);
            dateQuery = { date: { $gte: startDate } };
        }

        // 2. Current Inventory Value (Unchanged by date filter)
        const activeBatches = await Batch.find({ currentQuantity: { $gt: 0 } });
        const currentInventoryValue = activeBatches.reduce((total, batch) => {
            return total + (batch.currentQuantity * batch.purchasePrice);
        }, 0);

        // 3. Transactions WITH Date Filter
        const transactions = await Transaction.find(dateQuery);

        let totalSalesVolume = 0;
        let totalPurchasesVolume = 0;

        transactions.forEach(t => {
            if (t.type === 'SALE') totalSalesVolume += t.totalAmount;
            if (t.type === 'PURCHASE') totalPurchasesVolume += t.totalAmount;
        });

        res.json({
            currentInventoryValue,
            totalSalesVolume,
            totalPurchasesVolume,
            activeBatchesCount: activeBatches.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a route to Fetch all Receipts for the new "Browse Receipts" page
router.get('/receipts', tenantAuth, async (req, res) => {
    const Transaction = req.db.model('Transaction');
    try {
        // Find all transactions, populate product names, sort by newest
        const receipts = await Transaction.find().populate('items.productId').sort({ date: -1 });
        res.json(receipts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;