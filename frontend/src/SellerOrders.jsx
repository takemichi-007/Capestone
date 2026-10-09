import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

function SellerOrders() {

    const navigate = useNavigate();

    const loggedInUser =
        JSON.parse(localStorage.getItem("loggedInUser"));

    const sellerId = loggedInUser?.id;


    const [orders, setOrders] = useState([]);

    const [message, setMessage] = useState("");


    // ==============================
    // LOAD ORDERS
    // ==============================

    const loadOrders = async () => {

        if (!sellerId) {
            return;
        }


        try {

            const response = await fetch(
                `${API_BASE_URL}/api/orders/seller/${sellerId}`
            );


            if (!response.ok) {

                throw new Error(
                    "Failed to load orders"
                );
            }


            const data =
                await response.json();


            setOrders(data);

        } catch (error) {

            console.error(error);

            setMessage(
                "Unable to load incoming orders."
            );
        }
    };


    useEffect(() => {

        loadOrders();

    }, [sellerId]);


    // ==============================
    // SECURITY
    // ==============================

    if (!loggedInUser) {

        return (
            <div style={styles.center}>

                <h2>
                    Please login first.
                </h2>

                <button
                    onClick={() =>
                        navigate("/login")
                    }
                >
                    Login
                </button>

            </div>
        );
    }


    if (loggedInUser.role !== "SELLER") {

        return (
            <div style={styles.center}>

                <h2>
                    Access Denied!
                </h2>

                <button
                    onClick={() =>
                        navigate("/")
                    }
                >
                    Go Home
                </button>

            </div>
        );
    }


    return (

        <div style={styles.container}>

            <button
                style={styles.backButton}
                onClick={() =>
                    navigate("/seller-dashboard")
                }
            >
                ← Seller Dashboard
            </button>


            <h1>
                🚚 Incoming Orders
            </h1>


            <p>
                Orders received for your products.
            </p>


            {message && (

                <p style={styles.message}>
                    {message}
                </p>

            )}


            {orders.length === 0 ? (

                <div style={styles.empty}>

                    <h2>
                        No incoming orders yet.
                    </h2>

                    <p>
                        Customer orders for your
                        products will appear here.
                    </p>

                </div>

            ) : (

                orders.map((order, index) => (

                    <div
                        key={
                            order.orderId ? `${order.orderId}-${order.productId}-${index}` : index
                        }
                        style={styles.orderCard}
                    >

                        <div style={styles.orderCardHeader}>
                            <h2>
                                📦 Order #{order.orderId}
                            </h2>

                            <span style={styles.statusBadge}>
                                {order.status || "CONFIRMED"}
                            </span>
                        </div>


                        <p>
                            <strong>
                                Customer ID:
                            </strong>{" "}
                            {order.customerId}
                        </p>


                        <p>
                            <strong>
                                Product:
                            </strong>{" "}
                            <span style={{ fontSize: "16px", fontWeight: "bold", color: "#1e3a8a" }}>
                                {order.productName}
                            </span>
                        </p>

                        {/* PRODUCT VARIANTS (COLOR & SIZE) */}
                        <div style={styles.variantRow}>
                            {order.color && (
                                <span style={styles.variantBadge}>
                                    🎨 Color: <b>{order.color}</b>
                                </span>
                            )}
                            {order.size && (
                                <span style={styles.variantBadge}>
                                    📏 Size: <b>{order.size}</b>
                                </span>
                            )}
                        </div>


                        <p>
                            <strong>
                                Quantity:
                            </strong>{" "}
                            {order.quantity}
                        </p>


                        <p>
                            <strong>
                                Price:
                            </strong>{" "}
                            ₹{order.price} (Item Total: <b>₹{(order.quantity * order.price).toFixed(2)}</b>)
                        </p>

                        {/* SHIPPING & CONTACT & PAYMENT DETAILS */}
                        <div style={styles.shippingBox}>
                            <h4 style={{ margin: "0 0 8px 0", color: "#334155" }}>🚚 Delivery & Payment Info</h4>
                            <div style={{ display: "flex", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
                                <span style={{
                                    backgroundColor: order.paymentMode === "ONLINE" ? "#e0f2fe" : "#fef3c7",
                                    color: order.paymentMode === "ONLINE" ? "#0369a1" : "#b45309",
                                    padding: "3px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}>
                                    💳 Mode: {order.paymentMode === "ONLINE" ? "Online Prepaid" : "Offline (Cash on Delivery)"}
                                </span>
                                <span style={{
                                    backgroundColor: order.paymentStatus && order.paymentStatus.toUpperCase().includes("PAID") ? "#dcfce7" : "#fef9c3",
                                    color: order.paymentStatus && order.paymentStatus.toUpperCase().includes("PAID") ? "#15803d" : "#854d0e",
                                    padding: "3px 10px",
                                    borderRadius: "6px",
                                    fontSize: "12px",
                                    fontWeight: "bold"
                                }}>
                                    ✓ Status: {order.paymentStatus || "PENDING"}
                                </span>
                            </div>
                            {order.phone && (
                                <p style={{ margin: "2px 0", fontSize: "14px" }}>
                                    <strong>📞 Customer Phone:</strong> {order.phone}
                                </p>
                            )}
                            {order.address && (
                                <p style={{ margin: "2px 0", fontSize: "14px" }}>
                                    <strong>🏠 Shipping Address:</strong> {order.address}
                                </p>
                            )}
                        </div>

                    </div>

                ))

            )}

        </div>
    );
}


const styles = {

    container: {
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        padding: "30px",
        fontFamily: "Arial, sans-serif"
    },

    orderCard: {
        backgroundColor: "white",
        padding: "20px",
        marginTop: "15px",
        borderRadius: "10px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)"
    },

    orderCardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #f1f5f9",
        paddingBottom: "8px",
        marginBottom: "12px"
    },

    statusBadge: {
        backgroundColor: "#e8f5e9",
        color: "#2e7d32",
        padding: "5px 12px",
        borderRadius: "6px",
        fontWeight: "bold",
        fontSize: "13px"
    },

    variantRow: {
        display: "flex",
        gap: "10px",
        marginTop: "6px",
        marginBottom: "10px",
        flexWrap: "wrap"
    },

    variantBadge: {
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        padding: "3px 10px",
        borderRadius: "6px",
        fontSize: "13px"
    },

    shippingBox: {
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px",
        marginTop: "12px"
    },

    empty: {
        backgroundColor: "white",
        padding: "30px",
        marginTop: "25px",
        borderRadius: "10px",
        textAlign: "center"
    },

    backButton: {
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "5px",
        cursor: "pointer"
    },

    message: {
        fontWeight: "bold"
    },

    center: {
        textAlign: "center",
        padding: "50px"
    }

};

export default SellerOrders;