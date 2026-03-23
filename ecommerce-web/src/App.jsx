

import { Routes, Route } from "react-router-dom";
import "./App.css";

import HomePage from "./pages/HomePage.jsx";
import HomeCatalogPage from "./pages/HomeCatalogPage.jsx";
import CategoryPage from "./pages/CategoryPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import AdminRoute from "./components/AdminRoute";
import Login from "./pages/Login";
import AdminDashboard from "./pages/Admin";
import Navbar from "./Navbar.jsx";
import AdminProductsPage from "./pages/AdminProductsPage.jsx";
import AdminInventoryPage from "./pages/AdminInventoryPage.jsx";
import CartPage from "./pages/CartPage";
import MyOrdersPage from "./pages/MyOrdersPage";
import MyOrderDetailsPage from "./pages/MyOrderDetailsPage";
import AdminOrdersPage from "./pages/AdminOrdersPage";
import AdminOrderDetailsPage from "./pages/AdminOrderDetailsPage";
import Register from "./pages/Register.jsx";
import AdminCategories from "./pages/AdminCategories";
import RequireAuth from "./components/RequireAuth";
import AdminCouponsPage from "./pages/AdminCouponsPage";
import CheckoutPage from "./pages/CheckoutPage";
import "./styles/admin.css";
import "./styles/orders.css";
import "./styles/header.css";

export default function App() {
  return (
    <>
  <Navbar />

      <main className="app-main">
        <div className="container py-4">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<HomeCatalogPage />} />
            <Route path="/category/:categoryId" element={<CategoryPage />} />
            <Route path="/product/:productId" element={<ProductDetailPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Protected User Routes  */}
            <Route path="/my-orders"element={<RequireAuth><MyOrdersPage /></RequireAuth>}/>
            <Route path="/my-orders/:id" element={<RequireAuth><MyOrderDetailsPage /></RequireAuth>}/>
            <Route path="/checkout" element={<CheckoutPage />} />

            {/* Admin Routes */}

            <Route path="/admin" element={ <AdminRoute><AdminDashboard /></AdminRoute> }/>
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProductsPage />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/inventory"
              element={
                <AdminRoute>
                  <AdminInventoryPage />
                </AdminRoute>
              }
            />

            
            

            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetailsPage />} />
            
            
              <Route
  path="/admin/coupons"
  element={
    <AdminRoute>
      <AdminCouponsPage />
    </AdminRoute>
  }
/>
            
            <Route
              path="/admin/categories"
              element={
                <AdminRoute>
                  <AdminCategories />
                </AdminRoute>
              }
            />
          </Routes>
        </div>
      </main>
    </>
  );
}