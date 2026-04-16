import jwt from 'jsonwebtoken';
import { getTenantDB } from '../utils/dbManager.js';

export const tenantAuth = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.tenant = decoded; // Contains businessName, logoUrl, and mongoUri
        
        // Establish connection to their specific DB
        req.db = await getTenantDB(decoded.mongoUri);
        next();
    } catch (error) {
        res.status(400).json({ error: "Invalid token" });
    }
};