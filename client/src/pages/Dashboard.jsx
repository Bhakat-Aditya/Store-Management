import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";

export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const [metrics, setMetrics] = useState({
    currentInventoryValue: 0,
    totalSalesVolume: 0,
    totalPurchasesVolume: 0,
    activeBatchesCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetching summary without date filters for now
        const response = await api.get("/dashboard/summary");
        setMetrics(response.data);
      } catch (error) {
        console.error("Failed to fetch metrics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading)
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-pulse text-xl font-bold text-gray-400 tracking-widest">
          LOADING DASHBOARD...
        </div>
      </div>
    );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Overview
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back, here is your store's performance.
          </p>
        </div>
        {/* You can add a date filter dropdown here later */}
      </div>

      {/* Interactive Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <MetricCard
          title="Inventory Value"
          value={`₹${(metrics.currentInventoryValue || 0).toLocaleString("en-IN")}`}
          textColor="text-blue-700"
          gradient="from-blue-50 to-white"
          borderColor="border-blue-100 hover:border-blue-300"
        />
        <MetricCard
          title="Total Sales"
          value={`₹${(metrics.totalSalesVolume || 0).toLocaleString("en-IN")}`}
          textColor="text-green-700"
          gradient="from-green-50 to-white"
          borderColor="border-green-100 hover:border-green-300"
        />
        <MetricCard
          title="Total Purchases"
          value={`₹${(metrics.totalPurchasesVolume || 0).toLocaleString("en-IN")}`}
          textColor="text-orange-700"
          gradient="from-orange-50 to-white"
          borderColor="border-orange-100 hover:border-orange-300"
        />
        <MetricCard
          title="Active Batches"
          value={metrics.activeBatchesCount || 0}
          textColor="text-purple-700"
          gradient="from-purple-50 to-white"
          borderColor="border-purple-100 hover:border-purple-300"
        />
      </div>
    </div>
  );
}

// Reusable animated card component
const MetricCard = ({ title, value, textColor, gradient, borderColor }) => (
  <div
    className={`p-6 rounded-2xl shadow-sm border bg-gradient-to-br ${gradient} ${borderColor} transform transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-default group`}
  >
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider group-hover:text-gray-700 transition-colors">
        {title}
      </h3>
    </div>
    <p className={`text-4xl font-black ${textColor} drop-shadow-sm truncate`}>
      {value}
    </p>
  </div>
);
