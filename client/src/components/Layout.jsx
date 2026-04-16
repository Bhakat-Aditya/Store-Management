import { Link, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Layout({ children }) {
    const { logout, user } = useContext(AuthContext);
    const location = useLocation();

    const navItems = [
        { name: 'Dashboard', path: '/' },
        { name: 'Inventory & POS', path: '/inventory' },
        { name: 'Add Stock', path: '/add-stock' }
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-200 flex items-center gap-3">
                    {user?.logoUrl ? (
                        <img src={user.logoUrl} alt="Logo" className="h-8 w-8 rounded-full border" />
                    ) : (
                        <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                            {user?.businessName?.charAt(0)}
                        </div>
                    )}
                    <span className="font-bold text-lg text-gray-800 truncate">{user?.businessName}</span>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`block px-4 py-3 rounded-md transition-colors ${
                                location.pathname === item.path 
                                ? 'bg-blue-50 text-blue-700 font-semibold' 
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>
                
                <div className="p-4 border-t border-gray-200">
                    <button 
                        onClick={logout}
                        className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    >
                        Log Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}