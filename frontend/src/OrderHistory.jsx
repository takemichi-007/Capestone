import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

function OrderHistory() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [orderItemsMap, setOrderItemsMap] = useState({}); // { [orderId]: [OrderItem] }
    const [productsMap, setProductsMap] = useState({}); // { [productId]: Product }
    const [userReviewsMap, setUserReviewsMap] = useState({}); // { [productId]: Review }
    
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Review Modal State
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedProductForReview, setSelectedProductForReview] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewError, setReviewError] = useState("");

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const customerId = loggedInUser?.id;
    const customerName = loggedInUser?.username || "Customer";

    const fetchApi = async (path, options = {}) => {
        return await fetch(`${API_BASE_URL}${path}`, options);
    };

    // =====================================================
    // AUTH CHECK & INITIAL LOAD
    // =====================================================
    useEffect(() => {
        if (!loggedInUser) {
            navigate("/login");
            return;
        }

        const role = loggedInUser.role ? String(loggedInUser.role).trim().toUpperCase() : "";
        if (role !== "CUSTOMER") {
            navigate("/");
            return;
        }

        loadAllOrderData();
    }, []);

    // =====================================================
    // LOAD ORDERS, ORDER ITEMS, PRODUCTS & REVIEWS
    // =====================================================
    const loadAllOrderData = async () => {
        if (!customerId) {
            setMessage("Customer information not found.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setMessage("");

            // 1. Fetch Products
            const prodRes = await fetchApi("/api/products");
            let pMap = {};
            if (prodRes.ok) {
                const prodData = await prodRes.json();
                prodData.forEach(p => {
                    pMap[p.id] = p;
                });
                setProductsMap(pMap);
            }

            // 2. Fetch Customer's Existing Reviews
            const revRes = await fetchApi("/api/reviews");
            if (revRes.ok) {
                const allReviews = await revRes.json();
                const userRevs = {};
                allReviews.forEach(r => {
                    if (Number(r.customerId) === Number(customerId)) {
                        userRevs[r.productId] = r;
                    }
                });
                setUserReviewsMap(userRevs);
            }

            // 3. Fetch Orders
            const ordersRes = await fetchApi(`/api/orders/customer/${customerId}`);
            if (!ordersRes.ok) {
                throw new Error("Unable to load orders");
            }

            const ordersData = await ordersRes.json();
            setOrders(ordersData);

            // 4. Fetch Order Items for each order
            const itemsMap = {};
            await Promise.all(
                ordersData.map(async (order) => {
                    try {
                        const itemsRes = await fetchApi(`/api/orders/${order.id}/items`);
                        if (itemsRes.ok) {
                            const items = await itemsRes.json();
                            itemsMap[order.id] = items;
                        } else {
                            itemsMap[order.id] = [];
                        }
                    } catch (e) {
                        itemsMap[order.id] = [];
                    }
                })
            );
            setOrderItemsMap(itemsMap);

        } catch (error) {
            console.error("Error loading order history data:", error);
            setMessage("Cannot connect to server to fetch orders.");
        } finally {
            setLoading(false);
        }
    };

    // =====================================================
    // MARK ORDER AS RECEIVED
    // =====================================================
    const markReceived = async (orderId) => {
        try {
            const response = await fetchApi(`/api/orders/${orderId}/received?customerId=${customerId}`, {
                method: "PUT"
            });

            if (!response.ok) {
                const errText = await response.text();
                alert(errText || "Unable to update order status.");
                return;
            }

            setSuccessMessage("🎉 Order marked as RECEIVED! You can now review the products in your order below.");
            setTimeout(() => setSuccessMessage(""), 6000);

            // Reload orders to update status and enable review buttons
            await loadAllOrderData();

        } catch (error) {
            console.error("Error marking order received:", error);
            alert("Cannot connect to backend.");
        }
    };

    // =====================================================
    // OPEN REVIEW MODAL
    // =====================================================
    const openReviewModal = (product) => {
        setReviewError("");
        setSelectedProductForReview(product);

        const existingReview = userReviewsMap[product.id];
        if (existingReview) {
            setEditingReviewId(existingReview.id);
            setReviewRating(existingReview.rating || 5);
            setReviewComment(existingReview.comment || "");
        } else {
            setEditingReviewId(null);
            setReviewRating(5);
            setReviewComment("");
        }

        setReviewModalOpen(true);
    };

    const closeReviewModal = () => {
        setReviewModalOpen(false);
        setSelectedProductForReview(null);
        setEditingReviewId(null);
        setReviewComment("");
        setReviewRating(5);
        setReviewError("");
    };

    // =====================================================
    // SUBMIT OR UPDATE REVIEW
    // =====================================================
    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        setReviewError("");

        if (!reviewComment.trim()) {
            setReviewError("Please enter your review feedback.");
            return;
        }

        if (!selectedProductForReview) return;

        setSubmittingReview(true);

        try {
            let res;
            if (editingReviewId) {
                // Update review
                res = await fetchApi(`/api/reviews/${editingReviewId}?customerId=${customerId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        rating: Number(reviewRating),
                        comment: reviewComment.trim()
                    })
                });
            } else {
                // Add new review
                res = await fetchApi("/api/reviews", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        productId: selectedProductForReview.id,
                        customerId: Number(customerId),
                        customerName: customerName,
                        rating: Number(reviewRating),
                        comment: reviewComment.trim()
                    })
                });
            }

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(errText || "Failed to submit review.");
            }

            const savedReview = await res.json();

            // Update user reviews state map
            setUserReviewsMap(prev => ({
                ...prev,
                [selectedProductForReview.id]: savedReview
            }));

            closeReviewModal();
            setSuccessMessage(`⭐ Thank you! Your review for "${selectedProductForReview.name}" has been recorded.`);
            setTimeout(() => setSuccessMessage(""), 5000);

        } catch (err) {
            console.error("Submit review error:", err);
            setReviewError(err.message || "Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    // =====================================================
    // LOGOUT
    // =====================================================
    const logout = () => {
        localStorage.removeItem("loggedInUser");
        navigate("/login");
    };

    // =====================================================
    // RENDER STAR RATING HELPER
    // =====================================================
    const renderStars = (num) => {
        return "⭐".repeat(num) + "☆".repeat(Math.max(0, 5 - num));
    };

    if (loading) {
        return (
            <div style={styles.loadingPage}>
                <h2>📦 Loading your order history...</h2>
            </div>
        );
    }

    return (
        <div style={styles.page}>

            {/* ================= HEADER ================= */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.logo}>🛒 ShaliniMart</h1>
                    <h2 style={styles.title}>📦 My Orders & Reviews</h2>
                    <p style={styles.welcome}>
                        Welcome, <strong>{loggedInUser?.username}</strong>
                    </p>
                </div>

                <div style={styles.headerButtons}>
                    <button
                        style={styles.backButton}
                        onClick={() => navigate("/customer-dashboard")}
                    >
                        🛍️ Shop More
                    </button>
                    <button
                        style={styles.wishlistHeaderBtn}
                        onClick={() => navigate("/wishlist")}
                    >
                        ❤️ My Wishlist
                    </button>
                    <button
                        style={styles.cartHeaderBtn}
                        onClick={() => navigate("/cart")}
                    >
                        🛒 Cart
                    </button>
                    <button
                        style={styles.logoutButton}
                        onClick={logout}
                    >
                        Logout
                    </button>
                </div>
            </div>

            {/* ================= ALERTS ================= */}
            {successMessage && (
                <div style={styles.successBox}>
                    {successMessage}
                </div>
            )}

            {message && (
                <div style={styles.errorBox}>
                    {message}
                </div>
            )}

            {/* ================= NO ORDERS ================= */}
            {!message && orders.length === 0 && (
                <div style={styles.emptyBox}>
                    <div style={styles.emptyIcon}>📦</div>
                    <h2 style={{ color: "#1e1b4b" }}>No Orders Yet</h2>
                    <p style={{ color: "#64748b" }}>You haven't placed any orders yet.</p>
                    <button
                        style={styles.shopButton}
                        onClick={() => navigate("/customer-dashboard")}
                    >
                        🛍️ Start Shopping
                    </button>
                </div>
            )}

            {/* ================= ORDERS LIST ================= */}
            <div style={styles.ordersContainer}>
                {orders.map((order) => {
                    const totalAmount = order.totalAmount ?? order.total ?? order.amount ?? 0;
                    const status = order.status ? String(order.status).toUpperCase() : "CONFIRMED";
                    const isReceived = status === "RECEIVED";
                    const items = orderItemsMap[order.id] || [];

                    return (
                        <div key={order.id} style={styles.orderCard}>

                            {/* ORDER HEADER */}
                            <div style={styles.orderHeader}>
                                <div>
                                    <h2 style={styles.orderTitle}>Order #{order.id}</h2>
                                    <p style={styles.orderDate}>
                                        📅 Date: {order.orderDate ? new Date(order.orderDate).toLocaleString() : "Recent Order"}
                                    </p>
                                </div>

                                <div style={isReceived ? styles.receivedBadge : styles.confirmedBadge}>
                                    {isReceived ? "✓ RECEIVED" : "🚚 IN TRANSIT / CONFIRMED"}
                                </div>
                            </div>

                            {/* TOTAL & PAYMENT */}
                            <div style={styles.totalBox}>
                                <div>
                                    <span style={styles.totalLabel}>💰 Total Order Amount</span>
                                    <h2 style={styles.totalAmount}>₹{Number(totalAmount).toFixed(2)}</h2>
                                </div>
                                <div style={styles.paymentInfoSection}>
                                    <div style={{
                                        ...styles.paymentModeTag,
                                        backgroundColor: order.paymentMode === "ONLINE" ? "#e0f2fe" : "#fef3c7",
                                        color: order.paymentMode === "ONLINE" ? "#0369a1" : "#b45309"
                                    }}>
                                        {order.paymentMode === "ONLINE" ? "⚡ Online Prepaid" : "💵 Cash on Delivery (Offline)"}
                                    </div>
                                    <div style={{
                                        ...styles.paymentStatus,
                                        backgroundColor: order.paymentStatus && order.paymentStatus.toUpperCase().includes("PAID") ? "#dcfce7" : "#fef9c3",
                                        color: order.paymentStatus && order.paymentStatus.toUpperCase().includes("PAID") ? "#15803d" : "#854d0e"
                                    }}>
                                        {order.paymentStatus ? `✓ ${order.paymentStatus}` : "✓ Payment Confirmed"}
                                    </div>
                                </div>
                            </div>

                            {/* DELIVERY & CONTACT INFO */}
                            {(order.phone || order.address) && (
                                <div style={styles.deliveryInfoBox}>
                                    <h4 style={styles.deliveryInfoTitle}>📍 Delivery & Contact Details</h4>
                                    <div style={styles.deliveryInfoContent}>
                                        {order.phone && (
                                            <p style={styles.deliveryDetailItem}>
                                                <strong>📞 Phone:</strong> {order.phone}
                                            </p>
                                        )}
                                        {order.address && (
                                            <p style={styles.deliveryDetailItem}>
                                                <strong>🏠 Address:</strong> {order.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ORDER STATUS / ACTION BANNER */}
                            {!isReceived ? (
                                <div style={styles.actionBanner}>
                                    <div style={{ flex: 1 }}>
                                        <p style={styles.actionPromptTitle}>📦 Have you received your delivery?</p>
                                        <p style={styles.actionPromptSubtitle}>
                                            Mark this order as received once it is delivered to unlock product reviews!
                                        </p>
                                    </div>
                                    <button
                                        style={styles.receivedButton}
                                        onClick={() => markReceived(order.id)}
                                    >
                                        ✓ Mark as Received
                                    </button>
                                </div>
                            ) : (
                                <div style={styles.receivedBanner}>
                                    <span style={{ fontSize: "20px" }}>🎉</span>
                                    <div>
                                        <strong>Order Received!</strong> You can now rate and review each product below.
                                    </div>
                                </div>
                            )}

                            {/* ORDER PRODUCTS LIST */}
                            <div style={styles.productsSection}>
                                <h3 style={styles.productsSectionTitle}>
                                    🛍️ Items in this Order ({items.length > 0 ? items.length : "Products"}):
                                </h3>

                                {items.length === 0 ? (
                                    <p style={styles.noItemsNote}>
                                        Order items details registered under Order #{order.id}.
                                    </p>
                                ) : (
                                    <div style={styles.itemsList}>
                                        {items.map((item, index) => {
                                            const product = productsMap[item.productId] || {
                                                id: item.productId,
                                                name: `Product #${item.productId}`,
                                                price: item.price,
                                                category: "General",
                                                imageUrl: ""
                                            };

                                            const existingReview = userReviewsMap[product.id];

                                            return (
                                                <div key={item.id || index} style={styles.itemCard}>
                                                    {product.imageUrl ? (
                                                        <img
                                                            src={product.imageUrl}
                                                            alt={product.name}
                                                            style={styles.productThumbnail}
                                                        />
                                                    ) : (
                                                        <div style={styles.noImageThumb}>
                                                            🛍️
                                                        </div>
                                                    )}

                                                    <div style={styles.itemInfo}>
                                                        <h4 style={styles.itemName}>{product.name}</h4>
                                                        
                                                        {/* COLOR & SIZE BADGES */}
                                                        <div style={styles.variantBadgesRow}>
                                                            {item.color && (
                                                                <span style={styles.orderVariantBadge}>
                                                                    🎨 Color: <b>{item.color}</b>
                                                                </span>
                                                            )}
                                                            {item.size && (
                                                                <span style={styles.orderVariantBadge}>
                                                                    📏 Size: <b>{item.size}</b>
                                                                </span>
                                                            )}
                                                        </div>

                                                        <p style={styles.itemMeta}>
                                                            Category: <strong>{product.category || "General"}</strong> • 
                                                            Qty: <strong>{item.quantity}</strong> • 
                                                            Price: <strong>₹{item.price}</strong>
                                                        </p>

                                                        {/* EXISTING REVIEW DISPLAY */}
                                                        {existingReview && (
                                                            <div style={styles.existingReviewBox}>
                                                                <div style={styles.starRatingDisplay}>
                                                                    {renderStars(existingReview.rating)} ({existingReview.rating}/5)
                                                                </div>
                                                                <p style={styles.reviewCommentDisplay}>
                                                                    "{existingReview.comment}"
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* REVIEW ACTION BUTTON */}
                                                    <div style={styles.itemAction}>
                                                        {isReceived ? (
                                                            <button
                                                                style={existingReview ? styles.editReviewBtn : styles.writeReviewBtn}
                                                                onClick={() => openReviewModal(product)}
                                                            >
                                                                {existingReview ? "✏️ Edit Review" : "⭐ Review Product"}
                                                            </button>
                                                        ) : (
                                                            <span style={styles.disabledReviewNote}>
                                                                🔒 Review unlocks after delivery
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                        </div>
                    );
                })}
            </div>

            {/* ================= REVIEW MODAL ================= */}
            {reviewModalOpen && selectedProductForReview && (
                <div style={styles.modalOverlay} onClick={closeReviewModal}>
                    <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                        <div style={styles.modalHeader}>
                            <h2 style={styles.modalTitle}>
                                {editingReviewId ? "✏️ Edit Product Review" : "⭐ Rate & Review Product"}
                            </h2>
                            <button style={styles.closeBtn} onClick={closeReviewModal}>✕</button>
                        </div>

                        {/* PRODUCT SUMMARY IN MODAL */}
                        <div style={styles.modalProductSummary}>
                            {selectedProductForReview.imageUrl ? (
                                <img
                                    src={selectedProductForReview.imageUrl}
                                    alt={selectedProductForReview.name}
                                    style={styles.modalProductThumb}
                                />
                            ) : (
                                <div style={styles.modalProductThumbFallback}>🛍️</div>
                            )}
                            <div>
                                <h3 style={styles.modalProductName}>{selectedProductForReview.name}</h3>
                                <p style={styles.modalProductCategory}>
                                    Category: {selectedProductForReview.category || "General"}
                                </p>
                            </div>
                        </div>

                        {reviewError && (
                            <div style={styles.modalErrorBox}>
                                {reviewError}
                            </div>
                        )}

                        <form onSubmit={handleReviewSubmit} style={styles.modalForm}>
                            {/* RATING STARS SELECTOR */}
                            <label style={styles.modalLabel}>Your Rating *</label>
                            <div style={styles.starPickerRow}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                        type="button"
                                        key={star}
                                        style={{
                                            ...styles.starPickerBtn,
                                            color: star <= reviewRating ? "#f59e0b" : "#cbd5e1",
                                            transform: star <= reviewRating ? "scale(1.15)" : "scale(1)"
                                        }}
                                        onClick={() => setReviewRating(star)}
                                    >
                                        ★
                                    </button>
                                ))}
                                <span style={styles.starRatingWord}>
                                    {reviewRating === 5 && "⭐ Excellent (5/5)"}
                                    {reviewRating === 4 && "⭐ Good (4/5)"}
                                    {reviewRating === 3 && "⭐ Average (3/5)"}
                                    {reviewRating === 2 && "⭐ Poor (2/5)"}
                                    {reviewRating === 1 && "⭐ Terrible (1/5)"}
                                </span>
                            </div>

                            {/* COMMENT TEXTAREA */}
                            <label style={styles.modalLabel}>Your Feedback / Comments *</label>
                            <textarea
                                style={styles.modalTextarea}
                                rows={4}
                                placeholder="Share what you liked or disliked about this product..."
                                value={reviewComment}
                                onChange={(e) => setReviewComment(e.target.value)}
                                required
                            />

                            {/* MODAL ACTIONS */}
                            <div style={styles.modalActionRow}>
                                <button
                                    type="button"
                                    style={styles.modalCancelBtn}
                                    onClick={closeReviewModal}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={styles.modalSubmitBtn}
                                    disabled={submittingReview}
                                >
                                    {submittingReview ? "Saving Review..." : (editingReviewId ? "💾 Update Review" : "⭐ Submit Review")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

// =========================================================
// STYLES
// =========================================================
const styles = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2ff, #f8fafc)",
        padding: "30px 20px",
        fontFamily: "Arial, sans-serif",
        color: "#111827",
        boxSizing: "border-box"
    },
    loadingPage: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f1f5f9",
        color: "#1e1b4b"
    },
    header: {
        maxWidth: "1100px",
        margin: "0 auto 30px",
        padding: "25px 30px",
        borderRadius: "18px",
        background: "linear-gradient(135deg, #0f172a, #312e81, #2563eb)",
        color: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        boxShadow: "0 15px 40px rgba(15, 23, 42, 0.20)",
        flexWrap: "wrap"
    },
    logo: {
        margin: "0 0 6px",
        color: "white",
        fontSize: "28px"
    },
    title: {
        margin: "0 0 6px",
        color: "white",
        fontSize: "26px"
    },
    welcome: {
        color: "#dbeafe",
        margin: "0",
        fontSize: "15px"
    },
    headerButtons: {
        display: "flex",
        gap: "12px",
        flexWrap: "wrap"
    },
    backButton: {
        border: "none",
        padding: "12px 20px",
        borderRadius: "10px",
        background: "white",
        color: "#312e81",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "14px"
    },
    wishlistHeaderBtn: {
        border: "none",
        padding: "12px 20px",
        borderRadius: "10px",
        background: "#e11d48",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "14px",
        boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
    },
    cartHeaderBtn: {
        border: "none",
        padding: "12px 20px",
        borderRadius: "10px",
        background: "#10b981",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "14px"
    },
    logoutButton: {
        border: "none",
        padding: "12px 20px",
        borderRadius: "10px",
        background: "#ef4444",
        color: "white",
        fontWeight: "bold",
        cursor: "pointer",
        fontSize: "14px"
    },
    successBox: {
        maxWidth: "1100px",
        margin: "0 auto 20px",
        padding: "16px 20px",
        borderRadius: "12px",
        background: "#dcfce7",
        color: "#166534",
        fontWeight: "bold",
        textAlign: "center",
        border: "1px solid #86efac",
        boxShadow: "0 4px 15px rgba(22, 101, 52, 0.1)"
    },
    errorBox: {
        maxWidth: "1100px",
        margin: "0 auto 20px",
        padding: "16px 20px",
        borderRadius: "12px",
        background: "#fee2e2",
        color: "#991b1b",
        fontWeight: "bold",
        textAlign: "center",
        border: "1px solid #fca5a5"
    },
    emptyBox: {
        maxWidth: "600px",
        margin: "80px auto",
        padding: "50px 30px",
        textAlign: "center",
        background: "white",
        borderRadius: "20px",
        boxShadow: "0 10px 35px rgba(15, 23, 42, 0.10)"
    },
    emptyIcon: {
        fontSize: "65px",
        marginBottom: "15px"
    },
    shopButton: {
        marginTop: "20px",
        padding: "14px 28px",
        border: "none",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #4f46e5, #2563eb)",
        color: "white",
        fontWeight: "bold",
        fontSize: "16px",
        cursor: "pointer"
    },
    ordersContainer: {
        maxWidth: "1100px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "25px"
    },
    orderCard: {
        background: "white",
        borderRadius: "20px",
        padding: "25px",
        boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
        border: "1px solid #e2e8f0"
    },
    orderHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: "18px",
        borderBottom: "1px solid #e2e8f0",
        flexWrap: "wrap",
        gap: "15px"
    },
    orderTitle: {
        color: "#111827",
        margin: "0 0 6px",
        fontSize: "22px"
    },
    orderDate: {
        color: "#64748b",
        margin: "0",
        fontSize: "14px"
    },
    confirmedBadge: {
        padding: "8px 16px",
        borderRadius: "20px",
        background: "#dbeafe",
        color: "#1d4ed8",
        fontWeight: "bold",
        fontSize: "13px"
    },
    receivedBadge: {
        padding: "8px 16px",
        borderRadius: "20px",
        background: "#dcfce7",
        color: "#166534",
        fontWeight: "bold",
        fontSize: "13px"
    },
    totalBox: {
        marginTop: "18px",
        padding: "18px 22px",
        borderRadius: "14px",
        background: "linear-gradient(135deg, #eef2ff, #eff6ff)",
        border: "1px solid #c7d2fe",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap"
    },
    paymentInfoSection: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "6px"
    },
    paymentModeTag: {
        padding: "5px 12px",
        borderRadius: "16px",
        fontWeight: "700",
        fontSize: "12px",
        display: "inline-block"
    },
    totalLabel: {
        color: "#475569",
        fontSize: "13px",
        fontWeight: "bold"
    },
    totalAmount: {
        color: "#312e81",
        margin: "4px 0 0",
        fontSize: "26px",
        fontWeight: "bold"
    },
    paymentStatus: {
        padding: "8px 14px",
        borderRadius: "20px",
        background: "#dcfce7",
        color: "#166534",
        fontWeight: "bold",
        fontSize: "12px"
    },
    actionBanner: {
        marginTop: "18px",
        padding: "18px 20px",
        borderRadius: "14px",
        background: "#fffbeb",
        border: "1px solid #fde68a",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap"
    },
    actionPromptTitle: {
        margin: "0 0 4px",
        fontWeight: "bold",
        color: "#92400e",
        fontSize: "15px"
    },
    actionPromptSubtitle: {
        margin: 0,
        color: "#b45309",
        fontSize: "13px"
    },
    receivedButton: {
        border: "none",
        padding: "12px 22px",
        borderRadius: "10px",
        background: "linear-gradient(135deg, #16a34a, #15803d)",
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(22, 163, 74, 0.25)"
    },
    receivedBanner: {
        marginTop: "18px",
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#f0fdf4",
        border: "1px solid #bbf7d0",
        color: "#166534",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        fontSize: "14px"
    },
    productsSection: {
        marginTop: "22px",
        paddingTop: "18px",
        borderTop: "1px dashed #cbd5e1"
    },
    productsSectionTitle: {
        margin: "0 0 15px",
        fontSize: "16px",
        color: "#1e293b",
        fontWeight: "bold"
    },
    noItemsNote: {
        color: "#64748b",
        fontStyle: "italic",
        margin: "10px 0"
    },
    itemsList: {
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    itemCard: {
        display: "flex",
        alignItems: "center",
        gap: "16px",
        padding: "14px 18px",
        borderRadius: "12px",
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        flexWrap: "wrap"
    },
    productThumbnail: {
        width: "64px",
        height: "64px",
        borderRadius: "8px",
        objectFit: "cover",
        border: "1px solid #cbd5e1"
    },
    noImageThumb: {
        width: "64px",
        height: "64px",
        borderRadius: "8px",
        background: "#e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "24px"
    },
    itemInfo: {
        flex: 1,
        minWidth: "220px"
    },
    itemName: {
        margin: "0 0 4px",
        fontSize: "16px",
        color: "#0f172a"
    },
    itemMeta: {
        margin: "0 0 6px",
        fontSize: "13px",
        color: "#64748b"
    },
    existingReviewBox: {
        marginTop: "6px",
        padding: "8px 12px",
        borderRadius: "8px",
        background: "#fef3c7",
        border: "1px solid #fde68a"
    },
    starRatingDisplay: {
        fontSize: "13px",
        fontWeight: "bold",
        color: "#b45309"
    },
    reviewCommentDisplay: {
        margin: "2px 0 0",
        fontSize: "12px",
        color: "#78350f",
        fontStyle: "italic"
    },
    itemAction: {
        marginLeft: "auto"
    },
    writeReviewBtn: {
        backgroundColor: "#f59e0b",
        color: "white",
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        fontWeight: "bold",
        fontSize: "13px",
        cursor: "pointer",
        boxShadow: "0 3px 10px rgba(245, 158, 11, 0.25)"
    },
    editReviewBtn: {
        backgroundColor: "#3b82f6",
        color: "white",
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        fontWeight: "bold",
        fontSize: "13px",
        cursor: "pointer"
    },
    disabledReviewNote: {
        fontSize: "12px",
        color: "#94a3b8",
        fontStyle: "italic"
    },

    // MODAL STYLES
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px"
    },
    modalCard: {
        backgroundColor: "white",
        borderRadius: "20px",
        maxWidth: "520px",
        width: "100%",
        padding: "30px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        boxSizing: "border-box",
        animation: "fadeIn 0.2s ease-in-out"
    },
    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "18px"
    },
    modalTitle: {
        margin: 0,
        fontSize: "20px",
        color: "#1e1b4b"
    },
    closeBtn: {
        border: "none",
        background: "#f1f5f9",
        width: "32px",
        height: "32px",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#475569"
    },
    modalProductSummary: {
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "12px",
        borderRadius: "12px",
        background: "#f8fafc",
        marginBottom: "18px",
        border: "1px solid #e2e8f0"
    },
    modalProductThumb: {
        width: "50px",
        height: "50px",
        borderRadius: "8px",
        objectFit: "cover"
    },
    modalProductThumbFallback: {
        width: "50px",
        height: "50px",
        borderRadius: "8px",
        background: "#e2e8f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "20px"
    },
    modalProductName: {
        margin: "0 0 3px",
        fontSize: "15px",
        color: "#0f172a"
    },
    modalProductCategory: {
        margin: 0,
        fontSize: "12px",
        color: "#64748b"
    },
    modalErrorBox: {
        padding: "10px 14px",
        borderRadius: "8px",
        background: "#fee2e2",
        color: "#991b1b",
        fontSize: "13px",
        marginBottom: "15px",
        fontWeight: "bold"
    },
    modalForm: {
        display: "flex",
        flexDirection: "column",
        gap: "14px"
    },
    modalLabel: {
        fontSize: "14px",
        fontWeight: "bold",
        color: "#334155",
        marginBottom: "-6px"
    },
    starPickerRow: {
        display: "flex",
        alignItems: "center",
        gap: "8px"
    },
    starPickerBtn: {
        background: "transparent",
        border: "none",
        fontSize: "32px",
        cursor: "pointer",
        padding: "0 2px",
        transition: "all 0.15s ease"
    },
    starRatingWord: {
        marginLeft: "10px",
        fontSize: "14px",
        fontWeight: "bold",
        color: "#b45309"
    },
    modalTextarea: {
        padding: "12px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        fontSize: "14px",
        outline: "none",
        fontFamily: "inherit",
        resize: "vertical"
    },
    modalActionRow: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "10px"
    },
    modalCancelBtn: {
        padding: "11px 20px",
        borderRadius: "8px",
        border: "1px solid #cbd5e1",
        background: "#f8fafc",
        color: "#475569",
        fontWeight: "bold",
        fontSize: "14px",
        cursor: "pointer"
    },
    modalSubmitBtn: {
        padding: "11px 22px",
        borderRadius: "8px",
        border: "none",
        background: "#2563eb",
        color: "white",
        fontWeight: "bold",
        fontSize: "14px",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)"
    },
    deliveryInfoBox: {
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        padding: "12px 16px",
        marginTop: "12px",
        marginBottom: "12px"
    },
    deliveryInfoTitle: {
        fontSize: "13px",
        fontWeight: "bold",
        color: "#334155",
        margin: "0 0 6px 0"
    },
    deliveryInfoContent: {
        display: "flex",
        flexDirection: "column",
        gap: "4px"
    },
    deliveryDetailItem: {
        margin: 0,
        fontSize: "13px",
        color: "#475569"
    },
    variantBadgesRow: {
        display: "flex",
        gap: "8px",
        marginTop: "4px",
        marginBottom: "6px",
        flexWrap: "wrap"
    },
    orderVariantBadge: {
        backgroundColor: "#e0f2fe",
        color: "#0369a1",
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px"
    }
};

export default OrderHistory;