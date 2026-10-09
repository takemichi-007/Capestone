import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

function AdminOrders() {

    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [orderItemsMap, setOrderItemsMap] = useState({});
    const [productsMap, setProductsMap] = useState({});
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");


    // =====================================================
    // CHECK ADMIN
    // =====================================================

    useEffect(() => {

        const savedUser =
            localStorage.getItem("loggedInUser");

        if (!savedUser) {
            navigate("/login");
            return;
        }

        try {

            const user =
                JSON.parse(savedUser);

            if (
                !user.role ||
                user.role.toUpperCase() !== "ADMIN"
            ) {
                navigate("/");
                return;
            }

            loadOrders();

        } catch (error) {

            localStorage.removeItem(
                "loggedInUser"
            );

            navigate("/login");
        }

    }, [navigate]);


    // =====================================================
    // LOAD ORDERS & ITEMS
    // =====================================================

    const loadOrders = async () => {

        try {

            setLoading(true);

            // Fetch Products
            const prodRes = await fetch(`${API_BASE_URL}/api/admin/products`);
            if (prodRes.ok) {
                const prodData = await prodRes.json();
                const pMap = {};
                prodData.forEach(p => { pMap[p.id] = p; });
                setProductsMap(pMap);
            }

            const response = await fetch(
                `${API_BASE_URL}/api/admin/orders`
            );

            if (!response.ok) {
                throw new Error(
                    "Failed to load orders"
                );
            }

            const data =
                await response.json();

            setOrders(data);
            setMessage("");

            // Fetch items for each order
            const itemsMap = {};
            await Promise.all(
                data.map(async (order) => {
                    try {
                        const itemsRes = await fetch(`${API_BASE_URL}/api/orders/${order.id}/items`);
                        if (itemsRes.ok) {
                            itemsMap[order.id] = await itemsRes.json();
                        }
                    } catch (e) {
                        itemsMap[order.id] = [];
                    }
                })
            );
            setOrderItemsMap(itemsMap);

        } catch (error) {

            console.error(error);

            setMessage(
                "Cannot connect to backend!"
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <div style={styles.container}>

            {/* HEADER */}

            <div style={styles.header}>

                <div>

                    <h1>
                        🛒 ShaliniMart
                    </h1>

                    <h2>
                        📦 Manage Customer Orders
                    </h2>

                </div>


                <button
                    style={styles.backButton}
                    onClick={() =>
                        navigate("/admin-dashboard")
                    }
                >
                    ← Dashboard
                </button>

            </div>


            {/* MESSAGE */}

            {message && (

                <div style={styles.message}>
                    {message}
                </div>

            )}


            {/* ORDERS */}

            {loading ? (

                <h2>
                    Loading orders...
                </h2>

            ) : orders.length === 0 ? (

                <h2>
                    No orders found.
                </h2>

            ) : (

                <>

                    <h2>
                        All Customer Orders ({orders.length})
                    </h2>


                    {orders.map((order) => {
                        const items = orderItemsMap[order.id] || [];

                        return (

                            <div
                                key={order.id}
                                style={styles.orderCard}
                            >

                                <div style={styles.orderCardHeader}>
                                    <h2>
                                        📦 Order #{order.id}
                                    </h2>

                                    <span
                                        style={
                                            styles.status
                                        }
                                    >
                                        {order.status}
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
                                        Total Amount:
                                    </strong>{" "}
                                    <span style={styles.amountText}>₹{Number(order.totalAmount || 0).toFixed(2)}</span>
                                </p>

                                <p>
                                    <strong>
                                        Payment Mode:
                                    </strong>{" "}
                                    <span style={{
                                        backgroundColor: order.paymentMode === "ONLINE" ? "#e0f2fe" : "#fef3c7",
                                        color: order.paymentMode === "ONLINE" ? "#0369a1" : "#b45309",
                                        padding: "3px 8px",
                                        borderRadius: "6px",
                                        fontWeight: "bold",
                                        fontSize: "12px"
                                    }}>
                                        {order.paymentMode === "ONLINE" ? "⚡ Online Prepaid" : "💵 Cash on Delivery (Offline)"}
                                    </span>
                                </p>

                                <p>
                                    <strong>
                                        Payment Status:
                                    </strong>{" "}
                                    <span style={{
                                        backgroundColor: order.paymentStatus && order.paymentStatus.toUpperCase().includes("PAID") ? "#dcfce7" : "#fef9c3",
                                        color: order.paymentStatus && order.paymentStatus.toUpperCase().includes("PAID") ? "#15803d" : "#854d0e",
                                        padding: "3px 8px",
                                        borderRadius: "6px",
                                        fontWeight: "bold",
                                        fontSize: "12px"
                                    }}>
                                        {order.paymentStatus || "PENDING"}
                                    </span>
                                </p>

                                {/* CONTACT & ADDRESS */}
                                {(order.phone || order.address) && (
                                    <div style={styles.customerInfoBox}>
                                        <h4 style={{ margin: "0 0 6px 0", color: "#334155" }}>📍 Customer Delivery Details</h4>
                                        {order.phone && (
                                            <p style={{ margin: "2px 0" }}>
                                                <strong>📞 Phone:</strong> {order.phone}
                                            </p>
                                        )}
                                        {order.address && (
                                            <p style={{ margin: "2px 0" }}>
                                                <strong>🏠 Address:</strong> {order.address}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {order.orderDate && (
                                    <p>
                                        <strong>
                                            Order Date:
                                        </strong>{" "}
                                        {new Date(order.orderDate).toLocaleString()}
                                    </p>
                                )}

                                {/* ORDER ITEMS */}
                                {items.length > 0 && (
                                    <div style={styles.itemsSection}>
                                        <h4 style={{ margin: "10px 0 6px 0", color: "#1e293b" }}>Ordered Items:</h4>
                                        <div style={styles.itemsGrid}>
                                            {items.map((item, idx) => {
                                                const product = productsMap[item.productId];
                                                return (
                                                    <div key={item.id || idx} style={styles.itemBox}>
                                                        <div>
                                                            <b>{product ? product.name : `Product #${item.productId}`}</b>
                                                            <div style={styles.badgeRow}>
                                                                {item.color && (
                                                                    <span style={styles.badge}>
                                                                        🎨 Color: {item.color}
                                                                    </span>
                                                                )}
                                                                {item.size && (
                                                                    <span style={styles.badge}>
                                                                        📏 Size: {item.size}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            Qty: <b>{item.quantity}</b> × ₹{item.price} = <b>₹{(item.quantity * item.price).toFixed(2)}</b>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                            </div>

                        );
                    })}

                </>

            )}

        </div>
    );
}


const styles = {

    container: {
        minHeight: "100vh",
        padding: "30px",
        backgroundColor: "#f5f5f5",
        fontFamily: "Arial, sans-serif"
    },

    header: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "25px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)"
    },

    backButton: {
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        padding: "12px 18px",
        borderRadius: "6px",
        cursor: "pointer"
    },

    message: {
        backgroundColor: "#ffe5e5",
        padding: "15px",
        borderRadius: "8px",
        marginBottom: "20px"
    },

    orderCard: {
        backgroundColor: "white",
        padding: "20px",
        marginBottom: "20px",
        borderRadius: "10px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)"
    },

    orderCardHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid #f1f5f9",
        paddingBottom: "10px",
        marginBottom: "12px"
    },

    amountText: {
        color: "#16a34a",
        fontWeight: "bold",
        fontSize: "16px"
    },

    status: {
        backgroundColor: "#e8f5e9",
        color: "#2e7d32",
        padding: "6px 12px",
        borderRadius: "6px",
        fontWeight: "bold"
    },

    customerInfoBox: {
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px",
        marginTop: "10px",
        marginBottom: "10px"
    },

    itemsSection: {
        marginTop: "12px",
        paddingTop: "10px",
        borderTop: "1px dashed #e2e8f0"
    },

    itemsGrid: {
        display: "flex",
        flexDirection: "column",
        gap: "8px"
    },

    itemBox: {
        backgroundColor: "#f1f5f9",
        padding: "10px 14px",
        borderRadius: "6px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "10px"
    },

    badgeRow: {
        display: "flex",
        gap: "8px",
        marginTop: "4px"
    },

    badge: {
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        fontSize: "12px",
        padding: "2px 8px",
        borderRadius: "4px"
    }

};

export default AdminOrders;