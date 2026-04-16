import express from 'express';
import PDFDocument from 'pdfkit';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

router.get('/:transactionId', tenantAuth, async (req, res) => {
    const Transaction = req.db.model('Transaction');
    
    try {
        // Find the transaction and populate the product details
        const transaction = await Transaction.findById(req.params.transactionId).populate('productId');
        
        if (!transaction) {
            return res.status(404).json({ error: "Transaction not found" });
        }

        // 1. Initialize the PDF Document
        const doc = new PDFDocument({ margin: 50 });

        // 2. Set Response Headers 
        // 'inline' opens in browser, 'attachment' forces download
        res.setHeader('Content-disposition', `inline; filename=receipt-${transaction._id}.pdf`);
        res.setHeader('Content-type', 'application/pdf');

        // 3. Pipe the PDF generation stream directly to the HTTP response
        doc.pipe(res);

        // 4. Draw the PDF Content
        // We use the business name from the JWT token (req.tenant)
        doc.fontSize(22).font('Helvetica-Bold').text(req.tenant.businessName, { align: 'center' });
        doc.moveDown();
        
        doc.fontSize(16).font('Helvetica').text('Transaction Receipt', { align: 'center', underline: true });
        doc.moveDown(2);

        // Transaction Details
        doc.fontSize(12);
        doc.text(`Receipt ID: ${transaction._id}`);
        doc.text(`Date: ${new Date(transaction.date).toLocaleString()}`);
        doc.text(`Transaction Type: ${transaction.type}`);
        
        doc.moveDown();
        
        // Draw a separator line
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Product Details
        doc.font('Helvetica-Bold').text('Item Details:');
        doc.font('Helvetica').text(`Product: ${transaction.productId.name}`);
        doc.text(`HSN Code: ${transaction.productId.hsnCode}`);
        doc.text(`Quantity: ${Math.abs(transaction.quantity)}`);
        doc.text(`Price per unit: Rs. ${transaction.price}`);
        
        doc.moveDown();
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown();

        // Total Amount
        doc.fontSize(16).font('Helvetica-Bold').text(`Total Amount: Rs. ${transaction.totalAmount}`, { align: 'right' });

        // 5. Finalize the PDF file
        doc.end();

    } catch (error) {
        res.status(500).json({ error: "Failed to generate invoice" });
    }
});

export default router;