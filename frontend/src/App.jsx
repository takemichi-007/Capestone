import React from "react";

import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Home from "./Home";
import Login from "./Login";
import Register from "./Register";

import CustomerDashboard from "./CustomerDashboard";
import Cart from "./Cart";
import Wishlist from "./Wishlist";
import OrderHistory from "./OrderHistory";

import SellerDashboard from "./SellerDashboard";
import SellerProduct from "./SellerProducts";
import SellerOrders from "./SellerOrders";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";

import AdminDashboard from "./AdminDashboard";
import AdminUsers from "./AdminUsers";
import AdminProducts from "./AdminProducts";
import AdminOrders from "./AdminOrders";
import AdminReviews from "./AdminReviews";


function App() {

    return (

        <BrowserRouter>

            <div
                style={{
                    width: "100%",
                    minHeight: "100vh",
                    margin: 0,
                    padding: 0,
                    overflowX: "hidden"
                }}
            >

                <Routes>

                    {/* HOME */}

                    <Route
                        path="/"
                        element={<Home />}
                    />


                    {/* LOGIN */}

                    <Route
                        path="/login"
                        element={<Login />}
                    />


                    {/* REGISTER */}

                    <Route
                        path="/register"
                        element={<Register />}
                    />


                    {/* =========================
                        CUSTOMER
                    ========================= */}

                    <Route
                        path="/customer-dashboard"
                        element={
                            <CustomerDashboard />
                        }
                    />

                    <Route
                        path="/cart"
                        element={
                            <Cart />
                        }
                    />

                    <Route
                        path="/wishlist"
                        element={
                            <Wishlist />
                        }
                    />

                    <Route
                        path="/orders"
                        element={
                            <OrderHistory />
                        }
                    />


                    {/* =========================
                        SELLER
                    ========================= */}

                    <Route
                        path="/seller"
                        element={
                            <SellerDashboard />
                        }
                    />

                    <Route
                        path="/seller-dashboard"
                        element={
                            <SellerDashboard />
                        }
                    />

                    <Route
                        path="/seller/products"
                        element={
                            <SellerProduct />
                        }
                    />

                    <Route
                        path="/seller-products"
                        element={
                            <SellerProduct />
                        }
                    />

                    <Route
                        path="/seller/products/add"
                        element={
                            <AddProduct />
                        }
                    />

                    <Route
                        path="/seller/add-product"
                        element={
                            <AddProduct />
                        }
                    />

                    <Route
                        path="/seller/products/edit/:id"
                        element={
                            <EditProduct />
                        }
                    />

                    <Route
                        path="/seller/edit-product/:id"
                        element={
                            <EditProduct />
                        }
                    />

                    <Route
                        path="/seller/orders"
                        element={
                            <SellerOrders />
                        }
                    />


                    {/* =========================
                        ADMIN
                    ========================= */}

                    <Route
                        path="/admin-dashboard"
                        element={
                            <AdminDashboard />
                        }
                    />

                    <Route
                        path="/admin/users"
                        element={
                            <AdminUsers />
                        }
                    />

                    <Route
                        path="/admin/products"
                        element={
                            <AdminProducts />
                        }
                    />

                    <Route
                        path="/admin/orders"
                        element={
                            <AdminOrders />
                        }
                    />

                    <Route
                        path="/admin/reviews"
                        element={
                            <AdminReviews />
                        }
                    />


                    {/* UNKNOWN URL */}

                    <Route
                        path="*"
                        element={
                            <Home />
                        }
                    />

                </Routes>

            </div>

        </BrowserRouter>
    );
}

export default App;