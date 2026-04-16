import { useState } from 'react';
import api from '../api/axios';

export default function AddStock() {
    const [formData, setFormData] = useState({
        productName: '',
        hsnCode: '',
        purchasePrice: '',
        sellingPrice: '',
        quantity: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Convert string inputs to numbers for validation
            const payload = {
                ...formData,
                purchasePrice: Number(formData.purchasePrice),
                sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : undefined,
                quantity: Number(formData.quantity)
            };

            await api.post('/inventory/purchase', payload);
            
            setMessage({ type: 'success', text: 'Stock added successfully! Batch created.' });
            // Clear form
            setFormData({ productName: '', hsnCode: '', purchasePrice: '', sellingPrice: '', quantity: '' });
        } catch (error) {
            // Handle validation errors from Zod or server errors
            const errorMsg = error.response?.data?.details?.[0]?.message 
                          || error.response?.data?.error 
                          || 'Failed to add stock.';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Add New Stock</h1>

            {message.text && (
                <div className={`p-4 mb-6 rounded border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                        <input 
                            type="text" 
                            name="productName"
                            required
                            className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.productName}
                            onChange={handleChange}
                            placeholder="e.g., Cello Pen"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                        <input 
                            type="text" 
                            name="hsnCode"
                            required
                            className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.hsnCode}
                            onChange={handleChange}
                            placeholder="e.g., 9608"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Price (₹)</label>
                        <input 
                            type="number" 
                            name="purchasePrice"
                            required
                            min="0.1"
                            step="0.01"
                            className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.purchasePrice}
                            onChange={handleChange}
                            placeholder="Cost per unit"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selling Price (₹) - Optional</label>
                        <input 
                            type="number" 
                            name="sellingPrice"
                            min="0.1"
                            step="0.01"
                            className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.sellingPrice}
                            onChange={handleChange}
                            placeholder="Target sale price"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Received</label>
                        <input 
                            type="number" 
                            name="quantity"
                            required
                            min="1"
                            className="block w-full p-2.5 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.quantity}
                            onChange={handleChange}
                            placeholder="Total units in this batch"
                        />
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-blue-600 text-white font-medium p-3 rounded-md hover:bg-blue-700 transition disabled:bg-blue-300"
                    >
                        {loading ? 'Processing...' : 'Register Purchase & Add to Stock'}
                    </button>
                </div>
            </form>
        </div>
    );
}