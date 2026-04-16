import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);
    const [metrics, setMetrics] = useState({
        currentInventoryValue: 0,
        totalSalesVolume: 0,
        totalPurchasesVolume: 0,
        activeBatchesCount: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard/summary');
                setMetrics(response.data);
            } catch (error) {
                console.error("Failed to fetch metrics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;

    return (
        <div className="p-8 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex items-center gap-4">
                    {user?.logoUrl && <img src={user.logoUrl} alt="Logo" className="h-10 w-10 rounded-full border" />}
                    <span className="font-semibold text-gray-700">{user?.businessName}</span>
                    <button onClick={logout} className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition">Logout</button>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard title="Inventory Value" value={`₹${metrics.currentInventoryValue}`} color="text-blue-600" />
                <MetricCard title="Total Sales" value={`₹${metrics.totalSalesVolume}`} color="text-green-600" />
                <MetricCard title="Total Purchases" value={`₹${metrics.totalPurchasesVolume}`} color="text-orange-600" />
                <MetricCard title="Active Batches" value={metrics.activeBatchesCount} color="text-purple-600" />
            </div>
        </div>
    );
}

// Simple reusable card component
const MetricCard = ({ title, value, color }) => (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
    </div>
);