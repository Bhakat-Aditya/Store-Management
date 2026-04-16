import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Tenant } from '../models/MasterTenant.js';

const router = express.Router();

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        // 1. Find the tenant in the Master Database
        const tenant = await Tenant.findOne({ username });
        if (!tenant) {
            return res.status(404).json({ error: "Shop not found. Please check your username." });
        }

        // 2. Verify the password
        const isMatch = await bcrypt.compare(password, tenant.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid credentials." });
        }

        // 3. Create the JWT Payload
        // We embed the mongoUri here so the middleware knows exactly where to route queries
        const payload = {
            tenantId: tenant._id,
            businessName: tenant.businessName,
            logoUrl: tenant.logoUrl,
            mongoUri: tenant.mongoUri 
        };

        // 4. Sign the token
        // Use a strong secret in your .env file
        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' } // Token expires in 12 hours
        );

        // 5. Send response to client
        res.status(200).json({
            message: "Login successful",
            token,
            shopDetails: {
                businessName: tenant.businessName,
                logoUrl: tenant.logoUrl
            }
        });

    } catch (error) {
        res.status(500).json({ error: "Server error during login" });
    }
});

export default router;