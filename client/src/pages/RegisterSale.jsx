import { useState, useEffect } from 'react';
import api from '../api/axios';
import { numberToWords } from '../utils/numberToWords';


export default function RegisterSale() {
    const emptyRow = { id: Date.now(), searchQuery: '', batchId: '', maxQty: 0, sellingPrice: '', quantityToSell: '', total: 0, results: [], showDropdown: false };
    
    const [rows, setRows] = useState([{ ...emptyRow }]);
    const [grandTotal, setGrandTotal] = useState(0);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    // Calculate Grand Total whenever rows change
    useEffect(() => {
        const total = rows.reduce((acc, row) => acc + (Number(row.total) || 0), 0);
        setGrandTotal(total);
    }, [rows]);

    const addRow = () => setRows([...rows, { ...emptyRow, id: Date.now() }]);
    
    const removeRow = (id) => {
        if (rows.length > 1) setRows(rows.filter(row => row.id !== id));
    };

    const handleSearch = async (index, query) => {
        const newRows = [...rows];
        newRows[index].searchQuery = query;
        newRows[index].showDropdown = true;
        setRows(newRows);

        if (query.length > 1) {
            try {
                const res = await api.get(`/inventory/batches/autocomplete?query=${query}`);
                const updatedRows = [...rows];
                updatedRows[index].results = res.data;
                setRows(updatedRows);
            } catch (error) {
                console.error("Autocomplete failed", error);
            }
        }
    };

    const selectBatch = (index, batch) => {
        const newRows = [...rows];
        newRows[index].searchQuery = `${batch.productId.name} (Cost: ₹${batch.purchasePrice})`;
        newRows[index].batchId = batch._id;
        newRows[index].maxQty = batch.currentQuantity;
        newRows[index].showDropdown = false;
        newRows[index].results = [];
        setRows(newRows);
    };

    const handleInput = (index, field, value) => {
        const newRows = [...rows];
        newRows[index][field] = value;

        // Auto-calculate row total
        if (field === 'sellingPrice' || field === 'quantityToSell') {
            const price = Number(newRows[index].sellingPrice) || 0;
            const qty = Number(newRows[index].quantityToSell) || 0;
            newRows[index].total = price * qty;
        }
        
        setRows(newRows);
    };

    const submitSale = async (printInvoice) => {
        setLoading(true);
        setMessage({ type: '', text: '' });

        // Validate data
        const validItems = rows.filter(r => r.batchId && r.sellingPrice > 0 && r.quantityToSell > 0);
        
        if (validItems.length === 0) {
            setMessage({ type: 'error', text: 'Please fill out at least one valid item.' });
            setLoading(false);
            return;
        }

        for (let item of validItems) {
            if (item.quantityToSell > item.maxQty) {
                setMessage({ type: 'error', text: `Cannot sell ${item.quantityToSell} of ${item.searchQuery}. Only ${item.maxQty} in stock.` });
                setLoading(false);
                return;
            }
        }

        try {
            const payload = {
                items: validItems.map(r => ({
                    batchId: r.batchId,
                    sellingPrice: Number(r.sellingPrice),
                    quantityToSell: Number(r.quantityToSell)
                }))
            };

            const res = await api.post('/inventory/sell', payload);
            setMessage({ type: 'success', text: 'Sale registered successfully!' });

            if (printInvoice && res.data.transactionId) {
                const pdfRes = await api.get(`/invoice/${res.data.transactionId}`, { responseType: 'blob' });
                const pdfUrl = URL.createObjectURL(new Blob([pdfRes.data], { type: 'application/pdf' }));
                window.open(pdfUrl);
            }

            // Reset form
            setRows([{ ...emptyRow, id: Date.now() }]);
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to process sale.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Register Sale (POS)</h1>

            {message.text && (
                <div className={`p-4 mb-6 rounded border ${message.type === 'error' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {/* Header Row */}
                <div className="grid grid-cols-12 gap-4 mb-4 font-semibold text-gray-600 text-sm uppercase tracking-wide border-b pb-2">
                    <div className="col-span-4">Search Item (Name/HSN)</div>
                    <div className="col-span-2">Avail. Qty</div>
                    <div className="col-span-2">Unit Price (₹)</div>
                    <div className="col-span-2">Sell Qty</div>
                    <div className="col-span-2 text-right">Total (₹)</div>
                </div>

                {/* Dynamic Rows */}
                {rows.map((row, index) => (
                    <div key={row.id} className="grid grid-cols-12 gap-4 items-start mb-4 relative">
                        {/* Autocomplete Search */}
                        <div className="col-span-4 relative">
                            <input 
                                type="text"
                                placeholder="Type to search..."
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={row.searchQuery}
                                onChange={(e) => handleSearch(index, e.target.value)}
                                onFocus={() => {
                                    const newRows = [...rows];
                                    newRows[index].showDropdown = true;
                                    setRows(newRows);
                                }}
                            />
                            {/* Dropdown Results */}
                            {row.showDropdown && row.results.length > 0 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 shadow-xl rounded mt-1 max-h-48 overflow-y-auto">
                                    {row.results.map(batch => (
                                        <div 
                                            key={batch._id} 
                                            onClick={() => selectBatch(index, batch)}
                                            className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0"
                                        >
                                            <div className="font-bold text-gray-800">{batch.productId.name}</div>
                                            <div className="text-xs text-gray-500">
                                                HSN: {batch.productId.hsnCode} | Cost: ₹{batch.purchasePrice} | In Stock: {batch.currentQuantity}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Available Qty (Read Only) */}
                        <div className="col-span-2">
                            <input 
                                type="text" disabled
                                className="w-full p-2.5 bg-gray-100 border border-gray-300 rounded text-center text-gray-500"
                                value={row.batchId ? row.maxQty : '-'}
                            />
                        </div>

                        {/* Selling Price Input */}
                        <div className="col-span-2">
                            <input 
                                type="number" step="0.01" min="0.1"
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={row.sellingPrice}
                                onChange={(e) => handleInput(index, 'sellingPrice', e.target.value)}
                                placeholder="0.00"
                                disabled={!row.batchId}
                            />
                        </div>

                        {/* Quantity to Sell Input */}
                        <div className="col-span-2">
                            <input 
                                type="number" step="0.01" min="0.1"
                                className="w-full p-2.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                                value={row.quantityToSell}
                                onChange={(e) => handleInput(index, 'quantityToSell', e.target.value)}
                                placeholder="0"
                                disabled={!row.batchId}
                            />
                        </div>

                        {/* Total & Remove Button */}
                        <div className="col-span-2 flex items-center justify-end gap-3">
                            <span className="font-bold text-lg text-gray-800 w-full text-right">
                                {row.total.toFixed(2)}
                            </span>
                            <button 
                                onClick={() => removeRow(row.id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded transition-colors"
                                title="Remove Item"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}

                {/* Add Item Button */}
                <button 
                    onClick={addRow}
                    className="mt-2 text-blue-600 font-medium hover:underline flex items-center gap-1"
                >
                    + Add Another Item
                </button>

                {/* Footer Totals & Actions */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-col items-end mb-6">
                        <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-semibold">Grand Total</div>
                        <div className="text-4xl font-black text-gray-900 mb-2">₹{grandTotal.toFixed(2)}</div>
                        <div className="text-sm font-medium text-blue-800 bg-blue-50 px-3 py-1 rounded">
                            {numberToWords(grandTotal)}
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <button 
                            onClick={() => submitSale(false)}
                            disabled={loading || grandTotal <= 0}
                            className="bg-gray-800 text-white px-8 py-3 rounded-md font-bold hover:bg-gray-700 transition disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Register Sale Only'}
                        </button>
                        <button 
                            onClick={() => submitSale(true)}
                            disabled={loading || grandTotal <= 0}
                            className="bg-green-600 text-white px-8 py-3 rounded-md font-bold hover:bg-green-500 transition disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : 'Register Sale & Print'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}