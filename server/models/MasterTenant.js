import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema({
    businessName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // Remember to bcrypt this in production
    logoUrl: { type: String },
    mongoUri: { type: String, required: true }
});

export const Tenant = mongoose.model('Tenant', tenantSchema);