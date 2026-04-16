import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import { useContext } from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory"; // Keep this for searching/viewing stock
import AddStock from "./pages/AddStock"; // We will upgrade this to 'RegisterPurchase' next
import AdminOnboard from "./pages/AdminOnboard";
import Layout from "./components/Layout";

// 1. Import the new RegisterSale component
import RegisterSale from "./pages/RegisterSale";
import RegisterPurchase from "./pages/RegisterPurchase";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/admin-setup" element={<AdminOnboard />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedRoute>
                <Inventory />
              </ProtectedRoute>
            }
          />

          <Route
            path="/register-sale"
            element={
              <ProtectedRoute>
                <RegisterSale />
              </ProtectedRoute>
            }
          />

          <Route
            path="/register-purchase"
            element={
              <ProtectedRoute>
                <RegisterPurchase />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
