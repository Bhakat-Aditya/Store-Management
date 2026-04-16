import { useState, useEffect } from "react";
import api from "../api/axios";
import { numberToWords } from "../utils/numberToWords";

export default function RegisterPurchase() {
  const [items, setItems] = useState([
    {
      id: Date.now(),
      productName: "",
      hsnCode: "",
      purchasePrice: "",
      quantity: "",
      total: 0,
    },
  ]);
  const [grandTotal, setGrandTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Update grand total whenever items change
  useEffect(() => {
    const total = items.reduce(
      (sum, item) => sum + (Number(item.total) || 0),
      0,
    );
    setGrandTotal(total);
  }, [items]);

  const handleItemChange = (id, field, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: value };
          // Real-time calculation
          if (field === "purchasePrice" || field === "quantity") {
            const price = Number(updatedItem.purchasePrice) || 0;
            const qty = Number(updatedItem.quantity) || 0;
            updatedItem.total = (price * qty).toFixed(2); // Handles decimals
          }
          return updatedItem;
        }
        return item;
      }),
    );
  };

  const addRow = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        productName: "",
        hsnCode: "",
        purchasePrice: "",
        quantity: "",
        total: 0,
      },
    ]);
  };

  const removeRow = (id) => {
    if (items.length > 1) {
      setItems(items.filter((item) => item.id !== id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Clean payload
      const payload = {
        items: items.map((item) => ({
          productName: item.productName,
          hsnCode: item.hsnCode.trim() === "" ? undefined : item.hsnCode,
          purchasePrice: Number(item.purchasePrice),
          quantity: Number(item.quantity),
        })),
      };

      await api.post("/inventory/purchase", payload);
      setMessage("Purchase registered successfully!");
      // Reset form
      setItems([
        {
          id: Date.now(),
          productName: "",
          hsnCode: "",
          purchasePrice: "",
          quantity: "",
          total: 0,
        },
      ]);
    } catch (error) {
      setMessage(error.response?.data?.error || "Failed to register purchase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">
        Register Purchase
      </h1>

      {message && (
        <div className="p-4 mb-6 bg-green-50 text-green-700 rounded-md border border-green-200">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-xl shadow-md border border-gray-100"
      >
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 mb-2 font-semibold text-gray-600 border-b pb-2">
          <div className="col-span-4">Product Name</div>
          <div className="col-span-2">HSN Code</div>
          <div className="col-span-2">Price (₹)</div>
          <div className="col-span-2">Qty</div>
          <div className="col-span-2">Total (₹)</div>
        </div>

        {/* Dynamic Rows */}
        {items.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-12 gap-4 mb-4 items-center"
          >
            <div className="col-span-4 relative">
              {/* Simple Input - You can add a datalist here later for suggestions */}
              <input
                type="text"
                required
                placeholder="Start typing..."
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={item.productName}
                onChange={(e) =>
                  handleItemChange(item.id, "productName", e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={item.hsnCode}
                onChange={(e) =>
                  handleItemChange(item.id, "hsnCode", e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={item.purchasePrice}
                onChange={(e) =>
                  handleItemChange(item.id, "purchasePrice", e.target.value)
                }
              />
            </div>
            <div className="col-span-2">
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={item.quantity}
                onChange={(e) =>
                  handleItemChange(item.id, "quantity", e.target.value)
                }
              />
            </div>
            <div className="col-span-1 text-right font-medium text-gray-800 pt-2">
              {item.total}
            </div>
            <div className="col-span-1 text-right">
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeRow(item.id)}
                  className="text-red-500 hover:text-red-700 font-bold p-2"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="mt-2 text-blue-600 font-medium hover:text-blue-800 flex items-center gap-1"
        >
          + Add Another Item
        </button>

        {/* Footer Totals */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex justify-between items-end mb-4">
            <div className="text-gray-500 italic">
              Amount in words: <br />
              <span className="text-gray-800 font-medium not-italic">
                {numberToWords(grandTotal)}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500 font-medium">
                Grand Total
              </div>
              <div className="text-4xl font-bold text-gray-800">
                ₹{grandTotal.toFixed(2)}
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || grandTotal <= 0}
            className="w-full bg-blue-600 text-white font-bold p-4 rounded-md hover:bg-blue-700 transition disabled:opacity-50"
          >
            {loading ? "Processing..." : "Save Purchase Receipt"}
          </button>
        </div>
      </form>
    </div>
  );
}
