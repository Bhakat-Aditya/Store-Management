import { useState, useEffect } from "react";
import api from "../api/axios";

export default function EditStore() {
  const [formData, setFormData] = useState({
    phone: "",
    gstin: "",
    address: "",
    description: "",
  });
  const [status, setStatus] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get("/settings");
        setFormData({
          phone: res.data.phone || "",
          gstin: res.data.gstin || "",
          address: res.data.address || "",
          description: res.data.description || "",
        });
      } catch (error) {
        console.error("Failed to fetch settings");
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const res = await api.put("/settings", formData);
      setStatus({ type: "success", text: res.data.message });
    } catch (error) {
      setStatus({ type: "error", text: "Failed to update store details." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Store Settings</h1>

      {status.text && (
        <div
          className={`p-4 mb-6 rounded border ${status.type === "error" ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"}`}
        >
          {status.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6"
      >
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Business Tagline / Description
          </label>
          <input
            type="text"
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="e.g., Your trusted local supermarket"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Contact Phone Number
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="+91 9876543210"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              GSTIN / Tax ID
            </label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none uppercase"
              value={formData.gstin}
              onChange={(e) =>
                setFormData({ ...formData, gstin: e.target.value })
              }
              placeholder="22AAAAA0000A1Z5"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            Full Business Address
          </label>
          <textarea
            rows="3"
            className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            placeholder="123 Market Street, City, State, ZIP"
          ></textarea>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white font-bold py-3 px-8 rounded hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Store Details"}
          </button>
        </div>
      </form>
    </div>
  );
}
