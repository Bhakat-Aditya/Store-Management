import express from 'express';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

router.get('/summary', tenantAuth, async (req, res) => {
    const Batch = req.db.model('Batch');
    const Transaction = req.db.model('Transaction');

    try {
        // 1. Calculate Total Inventory Value (Current Stock * Purchase Price)
        const activeBatches = await Batch.find({ currentQuantity: { $gt: 0 } });
        const currentInventoryValue = activeBatches.reduce((total, batch) => {
            return total + (batch.currentQuantity * batch.purchasePrice);
        }, 0);

        // 2. Calculate Total Sales & Purchases
        const transactions = await Transaction.find();
        
        let totalSalesVolume = 0;
        let totalPurchasesVolume = 0;

        transactions.forEach(t => {
            if (t.type === 'SALE') {
                totalSalesVolume += t.totalAmount; 
            } else if (t.type === 'PURCHASE') {
                totalPurchasesVolume += t.totalAmount;
            }
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

export default router;