import express from 'express';
import { Tenant } from '../models/MasterTenant.js';

const router = express.Router();

// Admin creates a new shop
router.post('/onboard', async (req, res) => {
    try {
        const { businessName, username, password, logoUrl, mongoUri } = req.body;
        
        const newTenant = new Tenant({ businessName, username, password, logoUrl, mongoUri });
        await newTenant.save();
        
        res.status(201).json({ message: "Shop onboarded successfully", tenant: newTenant });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;