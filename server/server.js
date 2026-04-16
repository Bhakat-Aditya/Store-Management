import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectMasterDB } from './utils/dbManager.js';

// Import Routes
import adminRoutes from './routes/admin.js';
import inventoryRoutes from './routes/inventory.js';
import dashboardRoutes from './routes/dashboard.js';
import authRoutes from './routes/auth.js';
import invoiceRoutes from './routes/invoice.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors({
    origin: ['http://localhost:5173', 'https://your-react-client-domain.vercel.app'], // Add your Vercel frontend URL here later
    credentials: true
}));
app.use(express.json());

// Initialize Master Database Connection
// In a serverless environment, this runs when the function spins up
connectMasterDB().catch(err => console.error("Master DB Connection Failed:", err));

// Mount Routes
app.use('/api/admin', adminRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Basic health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: "Backend is running flawlessly" });
});


// Add to mounted routes
app.use('/api/invoice', invoiceRoutes);

// Add to mounted routes
app.use('/api/auth', authRoutes);

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

// Export for Vercel serverless functions
export default app;