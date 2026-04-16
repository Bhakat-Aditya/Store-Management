import express from 'express';
import bcrypt from 'bcryptjs';
import { Tenant } from '../models/MasterTenant.js';

const router = express.Router();

router.post('/onboard', async (req, res) => {
    try {
        const { businessName, username, password, logoUrl, mongoUri } = req.body;
        
        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const newTenant = new Tenant({ 
            businessName, 
            username, 
            password: hashedPassword, 
            logoUrl, 
            mongoUri 
        });
        
        await newTenant.save();
        res.status(201).json({ message: "Shop onboarded successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;