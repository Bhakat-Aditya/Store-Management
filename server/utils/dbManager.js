import mongoose from 'mongoose';

// Cache for tenant connections
const tenantConnections = {};

// 1. Connect to YOUR Master DB (Admin)
export const connectMasterDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MASTER_MONGO_URI);
};

// 2. Connect to Tenant DB dynamically
export const getTenantDB = async (tenantUri) => {
    if (tenantConnections[tenantUri]) {
        return tenantConnections[tenantUri];
    }

    // Create a new connection for this specific shop
    const conn = await mongoose.createConnection(tenantUri).asPromise();
    tenantConnections[tenantUri] = conn;

    // Bind Tenant Models to this specific connection
    const productSchema = new mongoose.Schema({
        name: { type: String, required: true },
        hsnCode: { type: String, required: true }
    });

    const batchSchema = new mongoose.Schema({
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        purchasePrice: { type: Number, required: true },
        currentQuantity: { type: Number, required: true },
        initialQuantity: { type: Number, required: true },
        dateAdded: { type: Date, default: Date.now }
    });
    const transactionSchema = new mongoose.Schema({
        type: { type: String, enum: ['SALE', 'PURCHASE', 'ADJUSTMENT'], required: true },
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
        quantity: { type: Number, required: true }, // Positive for purchase, negative for sale
        price: { type: Number, required: true }, // Price per unit at the time of transaction
        totalAmount: { type: Number, required: true },
        date: { type: Date, default: Date.now },
        notes: { type: String } // For manual adjustment reasons
    });


    // Ensure models are only compiled once per connection
    conn.model('Transaction', transactionSchema);
    conn.model('Product', productSchema);
    conn.model('Batch', batchSchema);

    return conn;
};