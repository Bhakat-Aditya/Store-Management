import { useState } from "react";
import api from "../api/axios";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // State to hold the drafted quantity for each batch before the user clicks Update
  const [editQuantities, setEditQuantities] = useState({});

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.get(`/inventory/search?query=${searchQuery}`);
      setInventoryList(res.data);

      // Pre-fill the local edit state with the current quantities from the database
      const initialQuantities = {};
      res.data.forEach((item) => {
        item.batches.forEach((batch) => {
          initialQuantities[batch._id] = batch.currentQuantity;
        });
      });
      setEditQuantities(initialQuantities);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to search inventory." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (batchId) => {
    const newQty = parseInt(editQuantities[batchId]);

    if (isNaN(newQty) || newQty < 0) {
      setMessage({ type: "error", text: "Quantity cannot be negative." });
      return;
    }

    try {
      // Calls the manual adjustment route we built in the backend
      await api.put(`/inventory/batch/${batchId}`, {
        newQuantity: newQty,
        notes: "Manual adjustment via Inventory Page",
      });

      setMessage({
        type: "success",
        text: `Stock adjusted to ${newQty} successfully!`,
      });

      // Refresh search results to show updated total stock
      handleSearch();
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Failed to update stock.",
      });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Stock Inventory Management
      </h1>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded ${message.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}
        >
          {message.text}
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Search by Product Name or HSN Code..."
          className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {/* Results Grid */}
      <div className="space-y-6">
        {inventoryList.map((item) => (
          <div
            key={item.product._id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-center border-b pb-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {item.product.name}
                </h2>
                <p className="text-sm text-gray-500">
                  HSN: {item.product.hsnCode || "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Available Stock</p>
                <p className="text-2xl font-bold text-gray-800">
                  {item.totalStock}
                </p>
              </div>
            </div>

            {/* Batches for this product */}
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-700">
                Manage Stock Batches:
              </h3>
              {item.batches.map((batch) => (
                <div
                  key={batch._id}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded border border-gray-100"
                >
                  <div>
                    <p className="font-medium">
                      Purchased at: ₹{batch.purchasePrice.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Original Batch Qty: {batch.initialQuantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 font-medium">
                      New Qty:
                    </span>
                    <input
                      type="number"
                      min="0"
                      className="w-24 p-2 border border-gray-300 rounded text-center focus:ring-2 focus:ring-blue-500 outline-none"
                      value={editQuantities[batch._id] ?? batch.currentQuantity}
                      onChange={(e) =>
                        setEditQuantities({
                          ...editQuantities,
                          [batch._id]: e.target.value,
                        })
                      }
                    />
                    <button
                      onClick={() => handleUpdateStock(batch._id)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded font-medium hover:bg-yellow-600 transition"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {inventoryList.length === 0 && !loading && searchQuery && (
          <p className="text-gray-500 text-center py-8">
            No products found matching your search.
          </p>
        )}
      </div>
    </div>
  );
}
