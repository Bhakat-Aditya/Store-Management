import { useState } from 'react';
import api from '../api/axios';

export default function AdminOnboard() {
    const [formData, setFormData] = useState({
        businessName: '',
        username: '',
        password: '',
        mongoUri: '',
        logoUrl: ''
    });
    const [status, setStatus] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', text: '' });

        try {
            await api.post('/admin/onboard', formData);
            setStatus({ type: 'success', text: `Successfully onboarded ${formData.businessName}!` });
            setFormData({ businessName: '', username: '', password: '', mongoUri: '', logoUrl: '' });
        } catch (error) {
            setStatus({ type: 'error', text: error.response?.data?.error || 'Failed to onboard shop' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
            <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-700">
                <h1 className="text-3xl font-bold text-white mb-2">Master Admin Panel</h1>
                <p className="text-gray-400 mb-8">Provision a new multi-tenant shop environment.</p>

                {status.text && (
                    <div className={`p-4 mb-6 rounded ${status.type === 'error' ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-green-900/50 text-green-200 border border-green-800'}`}>
                        {status.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Business Name</label>
                            <input 
                                type="text" required
                                className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.businessName}
                                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Username</label>
                            <input 
                                type="text" required
                                className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.username}
                                onChange={(e) => setFormData({...formData, username: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Admin Password</label>
                            <input 
                                type="password" required
                                className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1">Logo URL (Optional)</label>
                            <input 
                                type="url"
                                className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={formData.logoUrl}
                                onChange={(e) => setFormData({...formData, logoUrl: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">Tenant MongoDB URI</label>
                        <input 
                            type="text" required
                            className="w-full p-2.5 bg-gray-700 border border-gray-600 text-white rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                            value={formData.mongoUri}
                            onChange={(e) => setFormData({...formData, mongoUri: e.target.value})}
                            placeholder="mongodb+srv://..."
                        />
                    </div>
                    <button 
                        type="submit" disabled={loading}
                        className="w-full bg-blue-600 text-white font-bold p-3 rounded hover:bg-blue-500 transition disabled:opacity-50"
                    >
                        {loading ? 'Provisioning Environment...' : 'Deploy New Tenant'}
                    </button>
                </form>
            </div>
        </div>
    );
}