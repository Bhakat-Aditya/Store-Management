import express from 'express';
import PDFDocument from 'pdfkit';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

router.get('/:transactionId', tenantAuth, async (req, res) => {
    const Transaction = req.db.model('Transaction');
    const Settings = req.db.model('Settings');

    try {
        const transaction = await Transaction.findById(req.params.transactionId).populate('items.productId');
        const settings = await Settings.findOne() || {}; // Fetch store details

        if (!transaction) return res.status(404).json({ error: "Transaction not found" });

        // Set up A4 Portrait Document
        const doc = new PDFDocument({ size: 'A4', margin: 50 });

        res.setHeader('Content-disposition', `inline; filename=Invoice-${transaction._id}.pdf`);
        res.setHeader('Content-type', 'application/pdf');
        doc.pipe(res);

        // --- HEADER SECTION (Left Side) ---
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1f2937').text(req.tenant.businessName, 50, 50);

        doc.fontSize(10).font('Helvetica').fillColor('#4b5563');

        // Let PDFKit flow the text automatically to handle long, multi-line addresses
        if (settings.description) doc.text(settings.description, 50, doc.y + 5, { width: 250 });
        if (settings.address) doc.text(`Address: ${settings.address}`, 50, doc.y + 5, { width: 250 });
        if (settings.phone) doc.text(`Phone: ${settings.phone}`, 50, doc.y + 5, { width: 250 });
        if (settings.gstin) doc.font('Helvetica-Bold').text(`GSTIN: ${settings.gstin}`, 50, doc.y + 5, { width: 250 });

        // Capture where the left side finished flowing
        const leftEndY = doc.y;

        // --- INVOICE DETAILS (Right Side - Absolute Positioning) ---
        doc.fontSize(20).font('Helvetica-Bold').fillColor('#3b82f6').text('INVOICE', 400, 50, { align: 'right' });

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1f2937').text(`Receipt No:`, 380, 80);
        doc.font('Helvetica').text(transaction._id.toString().slice(-8).toUpperCase(), 450, 80, { align: 'right' });

        doc.font('Helvetica-Bold').text(`Date:`, 380, 95);
        doc.font('Helvetica').text(new Date(transaction.date).toLocaleDateString(), 450, 95, { align: 'right' });

        doc.font('Helvetica-Bold').text(`Type:`, 380, 110);
        doc.font('Helvetica').text(transaction.type, 450, 110, { align: 'right' });

        const rightEndY = 110 + doc.currentLineHeight();

        // --- DYNAMIC POSITIONING FOR TABLE ---
        // Push the Y cursor below whichever side (left or right) is longer to prevent overlap
        doc.y = Math.max(leftEndY, rightEndY) + 30;

        doc.moveTo(50, doc.y).lineTo(550, doc.y).lineWidth(1).strokeColor('#e5e7eb').stroke();
        doc.moveDown(2);

        // --- TABLE HEADER ---
        const tableTop = doc.y;
        doc.font('Helvetica-Bold').fillColor('#1f2937');
        doc.text('S.No.', 50, tableTop);
        doc.text('Item Description', 100, tableTop);
        doc.text('Qty', 350, tableTop, { align: 'center', width: 40 });
        doc.text('Unit Price', 400, tableTop, { align: 'right', width: 60 });
        doc.text('Amount', 480, tableTop, { align: 'right', width: 70 });

        doc.moveTo(50, doc.y + 10).lineTo(550, doc.y + 10).strokeColor('#d1d5db').stroke();
        doc.font('Helvetica').fillColor('#4b5563');

        let positionY = doc.y + 20;

        // --- TABLE ROWS ---
        transaction.items.forEach((item, i) => {
            const productName = item.productId ? item.productId.name : 'Unknown Item';
            const hsn = item.productId?.hsnCode ? `(HSN: ${item.productId.hsnCode})` : '';

            doc.text(`${i + 1}`, 50, positionY);
            doc.text(`${productName} ${hsn}`, 100, positionY, { width: 240 });
            doc.text(Math.abs(item.quantity).toString(), 350, positionY, { align: 'center', width: 40 });
            doc.text(`Rs. ${item.price.toFixed(2)}`, 400, positionY, { align: 'right', width: 60 });
            doc.text(`Rs. ${item.total.toFixed(2)}`, 480, positionY, { align: 'right', width: 70 });

            positionY += 20;
            doc.moveTo(50, positionY).lineTo(550, positionY).lineWidth(0.5).strokeColor('#f3f4f6').stroke();
            positionY += 10;
        });

        // --- GRAND TOTAL SECTION ---
        doc.moveDown(2);
        doc.y = positionY + 10; // Ensure the grand total starts below the last drawn row
        const totalY = doc.y;

        doc.rect(380, totalY, 170, 30).fillColor('#f8fafc').fill();
        doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(14);
        doc.text(`Grand Total:`, 390, totalY + 8);
        doc.text(`Rs. ${transaction.totalAmount.toFixed(2)}`, 460, totalY + 8, { align: 'right', width: 80 });

        // --- FOOTER ---
        doc.fontSize(10).font('Helvetica-Oblique').fillColor('#9ca3af').text('Thank you for your business!', 50, 750, { align: 'center' });
        doc.end();

    } catch (error) {
        console.error("PDF Gen Error:", error);
        res.status(500).json({ error: "Failed to generate invoice" });
    }
});

export default router;