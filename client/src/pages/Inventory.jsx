import { useState } from "react";
import api from "../api/axios";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inventoryList, setInventoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sellData, setSellData] = useState({ batchId: "", quantity: 1 });
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });
    try {
      const res = await api.get(`/inventory/search?query=${searchQuery}`);
      setInventoryList(res.data);
    } catch (error) {
      setMessage({ type: "error", text: "Failed to search inventory." });
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async (batchId, maxQty) => {
    if (sellData.quantity > maxQty) {
      setMessage({
        type: "error",
        text: `Cannot sell more than available stock (${maxQty}).`,
      });
      return;
    }

    try {
      const res = await api.post("/inventory/sell", {
        batchId,
        quantityToSell: parseInt(sellData.quantity),
      });

      setMessage({
        type: "success",
        text: `Sale successful! Remaining stock: ${res.data.remainingStock}`,
      });

      // Generate Invoice (opens in new tab)
      if (res.data.transactionId) {
        const pdfRes = await api.get(`/invoice/${res.data.transactionId}`, {
          responseType: "blob",
        });
        const pdfUrl = URL.createObjectURL(
          new Blob([pdfRes.data], { type: "application/pdf" }),
        );
        window.open(pdfUrl);
      }

      // Refresh search results to show updated stock
      handleSearch(new Event("submit"));
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "Sale failed.",
      });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Point of Sale & Inventory
      </h1>

      {message.text && (
        <div
          className={`p-4 mb-6 rounded ${message.type === "error" ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"}`}
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
                  HSN: {item.product.hsnCode}
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
                Available Pricing Batches:
              </h3>
              {item.batches.map((batch) => (
                <div
                  key={batch._id}
                  className="flex items-center justify-between bg-gray-50 p-4 rounded border border-gray-100"
                >
                  <div>
                    <p className="font-medium">
                      Purchased at: ₹{batch.purchasePrice}
                    </p>
                    <p className="text-sm text-gray-600">
                      In Stock: {batch.currentQuantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min="1"
                      max={batch.currentQuantity}
                      className="w-20 p-2 border border-gray-300 rounded text-center"
                      placeholder="Qty"
                      onChange={(e) =>
                        setSellData({
                          batchId: batch._id,
                          quantity: e.target.value,
                        })
                      }
                    />
                    <button
                      onClick={() =>
                        handleSell(batch._id, batch.currentQuantity)
                      }
                      className="bg-green-600 text-white px-4 py-2 rounded font-medium hover:bg-green-700"
                    >
                      Sell & Print
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
