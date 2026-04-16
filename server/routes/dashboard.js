import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';

export default function Dashboard() {
    const { user, logout } = useContext(AuthContext);
    const [metrics, setMetrics] = useState({
        currentInventoryValue: 0, totalSalesVolume: 0, totalPurchasesVolume: 0, activeBatchesCount: 0
    });
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/dashboard/summary?filter=${filter}`);
                setMetrics(response.data);
            } catch (error) {
                console.error("Failed to fetch metrics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboardData();
    }, [filter]); // Re-fetch whenever the filter changes

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
                <div className="flex items-center gap-6">
                    {/* Filter Dropdown */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="p-2 border border-gray-300 rounded-md outline-none bg-gray-50 hover:bg-gray-100 cursor-pointer"
                    >
                        <option value="all">Lifetime</option>
                        <option value="year">This Year</option>
                        <option value="month">This Month</option>
                        <option value="week">This Week</option>
                    </select>

                    <div className="flex items-center gap-3">
                        {user?.logoUrl && <img src={user.logoUrl} alt="Logo" className="h-10 w-10 rounded-full border" />}
                        <span className="font-semibold text-gray-700">{user?.businessName}</span>
                        <button onClick={logout} className="text-sm px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100 transition">Logout</button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-10">Loading metrics...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Added hover:-translate-y-1 hover:shadow-xl transition-all to cards */}
                    <MetricCard title="Inventory Value" value={`₹${metrics.currentInventoryValue.toFixed(2)}`} color="text-blue-600" />
                    <MetricCard title="Total Sales" value={`₹${metrics.totalSalesVolume.toFixed(2)}`} color="text-green-600" subtitle={filter !== 'all' ? `(For selected ${filter})` : ''} />
                    <MetricCard title="Total Purchases" value={`₹${metrics.totalPurchasesVolume.toFixed(2)}`} color="text-orange-600" subtitle={filter !== 'all' ? `(For selected ${filter})` : ''} />
                    <MetricCard title="Active Batches" value={metrics.activeBatchesCount} color="text-purple-600" />
                </div>
            )}
        </div>
    );
}

const MetricCard = ({ title, value, color, subtitle }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transform hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-default">
        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">{title}</h3>
        <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
);