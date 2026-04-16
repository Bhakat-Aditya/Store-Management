import express from 'express';
import PDFDocument from 'pdfkit';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

router.get('/:transactionId', tenantAuth, async (req, res) => {
    const Transaction = req.db.model('Transaction');

    try {
        // 1. Updated: Populate productId inside the new 'items' array
        const transaction = await Transaction.findById(req.params.transactionId).populate('items.productId');

        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-disposition', `inline; filename=receipt-${transaction._id}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        doc.pipe(res);

        // Header
        doc.fontSize(22).font('Helvetica-Bold').text(req.tenant.businessName, { align: 'center' });
        doc.moveDown();

        doc.fontSize(16).font('Helvetica').text('Transaction Receipt', { align: 'center', underline: true });
        doc.moveDown(2);

        // Transaction Details
        doc.fontSize(12);
        doc.font('Helvetica-Bold').text(`Receipt ID: `, { continued: true }).font('Helvetica').text(transaction._id);
        doc.font('Helvetica-Bold').text(`Date: `, { continued: true }).font('Helvetica').text(new Date(transaction.date).toLocaleString());
        doc.font('Helvetica-Bold').text(`Type: `, { continued: true }).font('Helvetica').text(transaction.type);

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // 2. Updated: Draw a Table Header for Multiple Items
        doc.font('Helvetica-Bold');
        doc.text('Item Name', 50, doc.y, { continued: true, width: 200 });
        doc.text('Qty', 250, doc.y, { continued: true, width: 50 });
        doc.text('Price', 350, doc.y, { continued: true, width: 100 });
        doc.text('Total', 450, doc.y, { align: 'right' });
        doc.moveDown(0.5);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

        // 3. Updated: Loop through the items array and print each row
        doc.font('Helvetica');
        transaction.items.forEach(item => {
            const productName = item.productId ? item.productId.name : 'Unknown Product';

            doc.text(productName, 50, doc.y, { continued: true, width: 200 });
            doc.text(Math.abs(item.quantity).toString(), 250, doc.y, { continued: true, width: 50 });
            doc.text(`Rs. ${item.price.toFixed(2)}`, 350, doc.y, { continued: true, width: 100 });
            doc.text(`Rs. ${item.total.toFixed(2)}`, 450, doc.y, { align: 'right' });
            doc.moveDown(0.5);
        });

        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Grand Total
        doc.fontSize(16).font('Helvetica-Bold').text(`Grand Total: Rs. ${transaction.totalAmount.toFixed(2)}`, { align: 'right' });

        doc.end();

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).json({ error: "Failed to generate invoice" });
    }
});

export default router;