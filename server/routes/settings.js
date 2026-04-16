import express from 'express';
import { tenantAuth } from '../middleware/tenantAuth.js';

const router = express.Router();

// Get Store Settings
router.get('/', tenantAuth, async (req, res) => {
    const Settings = req.db.model('Settings');
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings({});
            await settings.save();
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update Store Settings
router.put('/', tenantAuth, async (req, res) => {
    const Settings = req.db.model('Settings');
    try {
        let settings = await Settings.findOne();
        if (!settings) {
            settings = new Settings(req.body);
        } else {
            settings.phone = req.body.phone;
            settings.gstin = req.body.gstin;
            settings.address = req.body.address;
            settings.description = req.body.description;
        }
        await settings.save();
        res.json({ message: "Store details updated successfully!", settings });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;