import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

function Cart() {

    const navigate = useNavigate();

    // =========================
    // LOGGED-IN USER
    // =========================

    const loggedInUser =
        JSON.parse(localStorage.getItem("loggedInUser"));

    const customerId = loggedInUser?.id;


    const [cart, setCart] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Checkout Modal State
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [phone, setPhone] = useState("");
    const [address, setAddress] = useState("");
    const [paymentMode, setPaymentMode] = useState("ONLINE"); // "ONLINE" or "OFFLINE"
    const [onlinePaymentMethod, setOnlinePaymentMethod] = useState("UPI"); // "UPI", "CARD", "NETBANKING"
    const [upiId, setUpiId] = useState("");
    const [cardNumber, setCardNumber] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [formError, setFormError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);


    // =========================
    // LOAD PRODUCTS
    // =========================

    useEffect(() => {

        fetch(`${API_BASE_URL}/api/products`)
            .then(response => {

                if (!response.ok) {
                    throw new Error("Failed to load products");
                }

                return response.json();

            })
            .then(data => {

                setProducts(data);

            })
            .catch(error => {

                console.error(error);

            });

    }, []);


    // =========================
    // LOAD CART
    // =========================

    useEffect(() => {

        if (!customerId) {
            setLoading(false);
            return;
        }

        loadCart();

    }, [customerId]);


    const loadCart = () => {

        fetch(
            `${API_BASE_URL}/api/cart/${customerId}`
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error("Failed to load cart");
                }

                return response.json();

            })
            .then(data => {

                setCart(data);
                setLoading(false);

            })
            .catch(error => {

                console.error(error);
                setLoading(false);

            });

    };


    // =========================
    // UPDATE QUANTITY
    // =========================

    const updateQuantity = (
        cartItem,
        newQuantity
    ) => {

        if (newQuantity < 1) {
            return;
        }

        fetch(
            `${API_BASE_URL}/api/cart/${cartItem.id}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({
                    quantity: newQuantity
                })
            }
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to update cart"
                    );
                }

                return response.json();

            })
            .then(() => {

                loadCart();

            })
            .catch(error => {

                console.error(error);

                alert(
                    "Cannot update cart."
                );

            });

    };


    // =========================
    // REMOVE ITEM
    // =========================

    const removeFromCart = (id) => {

        const confirmRemove =
            window.confirm(
                "Remove this product from cart?"
            );

        if (!confirmRemove) {
            return;
        }

        fetch(
            `${API_BASE_URL}/api/cart/${id}`,
            {
                method: "DELETE"
            }
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to remove item"
                    );
                }

                return response.text();

            })
            .then(() => {

                loadCart();

            })
            .catch(error => {

                console.error(error);

                alert(
                    "Cannot remove product."
                );

            });

    };


    // =========================
    // TOTAL
    // =========================

    const getTotal = () => {

        return cart.reduce(
            (total, item) =>
                total +
                Number(item.price) *
                Number(item.quantity),
            0
        );

    };


    // =========================
    // OPEN CHECKOUT MODAL
    // =========================

    const openCheckoutModal = () => {
        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }
        setFormError("");
        setShowCheckoutModal(true);
    };

    // =========================
    // SUBMIT CHECKOUT
    // =========================

    const handleConfirmCheckout = (e) => {
        if (e) e.preventDefault();

        // Validation
        const cleanPhone = phone.trim();
        const cleanAddress = address.trim();

        if (!cleanPhone) {
            setFormError("⚠️ Please enter your Phone Number.");
            return;
        }

        const phoneRegex = /^[0-9]{10}$/;
        if (!phoneRegex.test(cleanPhone.replace(/[\s-]/g, ""))) {
            setFormError("⚠️ Please enter a valid 10-digit Phone Number.");
            return;
        }

        if (!cleanAddress || cleanAddress.length < 5) {
            setFormError("⚠️ Please enter a complete Delivery Address (at least 5 characters).");
            return;
        }

        if (paymentMode === "ONLINE") {
            if (onlinePaymentMethod === "UPI") {
                if (!upiId.trim() || !upiId.includes("@")) {
                    setFormError("⚠️ Please enter a valid UPI ID (e.g., yourname@okhdfcbank).");
                    return;
                }
            } else if (onlinePaymentMethod === "CARD") {
                const cleanCard = cardNumber.replace(/\s+/g, "");
                if (cleanCard.length < 16) {
                    setFormError("⚠️ Please enter a valid 16-digit Card Number.");
                    return;
                }
                if (!cardExpiry.trim()) {
                    setFormError("⚠️ Please enter the Card Expiry date (MM/YY).");
                    return;
                }
                if (!cardCvv.trim() || cardCvv.trim().length < 3) {
                    setFormError("⚠️ Please enter a valid 3-digit CVV.");
                    return;
                }
            }
        }

        setIsSubmitting(true);
        setFormError("");

        const payload = {
            phone: cleanPhone,
            address: cleanAddress,
            paymentMode: paymentMode,
            onlinePaymentMethod: paymentMode === "ONLINE" ? onlinePaymentMethod : null,
            transactionRef: paymentMode === "ONLINE" ? `TXN_${Date.now().toString(36).toUpperCase()}` : null
        };

        fetch(`${API_BASE_URL}/api/orders/checkout/${customerId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error("Checkout failed");
                }
                return response.json().catch(() => response.text());
            })
            .then(() => {
                setShowCheckoutModal(false);
                setPhone("");
                setAddress("");
                setUpiId("");
                setCardNumber("");
                setCardExpiry("");
                setCardCvv("");
                if (paymentMode === "ONLINE") {
                    alert("🎉 Payment Successful! Your order has been placed and confirmed.");
                } else {
                    alert("🎉 Order placed successfully with Cash on Delivery (Offline)! Pay when your order arrives.");
                }
                navigate("/orders");
            })
            .catch(error => {
                console.error(error);
                setFormError("Unable to complete checkout. Please try again.");
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    };


    // =========================
    // LOGOUT
    // =========================

    const logout = () => {

        localStorage.removeItem(
            "loggedInUser"
        );

        navigate("/");

    };


    // =========================
    // LOGIN CHECK
    // =========================

    if (!loggedInUser) {

        return (

            <div style={styles.center}>

                <h2>
                    Please login first.
                </h2>

                <button
                    style={styles.button}
                    onClick={() =>
                        navigate("/login")
                    }
                >
                    Go to Login
                </button>

            </div>

        );

    }


    if (loggedInUser.role !== "CUSTOMER") {

        return (

            <div style={styles.center}>

                <h2>
                    Access Denied
                </h2>

                <button
                    style={styles.button}
                    onClick={logout}
                >
                    Logout
                </button>

            </div>

        );

    }


    // =========================
    // UI
    // =========================

    return (

        <div style={styles.container}>

            {/* HEADER */}

            <div style={styles.header}>

                <div>

                    <h1>
                        🛒 ShaliniMart
                    </h1>

                    <p>
                        My Cart
                    </p>

                </div>


                <div>

                    <button
                        style={styles.navButton}
                        onClick={() =>
                            navigate(
                                "/customer-dashboard"
                            )
                        }
                    >
                        🏠 Products
                    </button>

                    <button
                        style={styles.wishlistNavButton}
                        onClick={() =>
                            navigate("/wishlist")
                        }
                    >
                        ❤️ Wishlist
                    </button>

                    <button
                        style={styles.orderButton}
                        onClick={() =>
                            navigate("/orders")
                        }
                    >
                        📦 My Orders
                    </button>


                    <button
                        style={styles.logoutButton}
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </div>


            {/* TITLE */}

            <h2>
                🛒 My Shopping Cart
            </h2>


            {/* LOADING */}

            {loading && (

                <p>
                    Loading cart...
                </p>

            )}


            {/* EMPTY CART */}

            {!loading &&
            cart.length === 0 && (

                <div style={styles.emptyCart}>

                    <h2>
                        🛒 Your cart is empty
                    </h2>

                    <p>
                        Add some products to your cart.
                    </p>

                    <button
                        style={styles.button}
                        onClick={() =>
                            navigate(
                                "/customer-dashboard"
                            )
                        }
                    >
                        Continue Shopping
                    </button>

                </div>

            )}


            {/* CART ITEMS */}

            {!loading &&
            cart.length > 0 && (

                <div>

                    {cart.map(item => {

                        const product =
                            products.find(
                                p =>
                                    p.id ===
                                    item.productId
                            );


                        const itemTotal =
                            Number(item.price) *
                            Number(item.quantity);


                        return (

                            <div
                                key={item.id}
                                style={
                                    styles.cartItem
                                }
                            >

                                <div
                                    style={
                                        styles.productInfo
                                    }
                                >

                                    {product?.imageUrl && (

                                        <img
                                            src={
                                                product.imageUrl
                                            }
                                            alt={
                                                product.name
                                            }
                                            style={
                                                styles.productImage
                                            }
                                            onError={(e) => {
                                                e.target.style.display =
                                                    "none";
                                            }}
                                        />

                                    )}


                                    <div>

                                        <h3>

                                            {
                                                product
                                                    ? product.name
                                                    : `Product ID: ${item.productId}`
                                            }

                                        </h3>


                                        {/* COLOR & SIZE BADGES */}
                                        <div style={styles.variantDisplayRow}>
                                            {item.color && (
                                                <span style={styles.itemVariantBadge}>
                                                    🎨 Color: <b>{item.color}</b>
                                                </span>
                                            )}
                                            {item.size && (
                                                <span style={styles.itemVariantBadge}>
                                                    📏 Size: <b>{item.size}</b>
                                                </span>
                                            )}
                                        </div>


                                        <p>
                                            Price:
                                            ₹{item.price}
                                        </p>


                                        <p>
                                            Quantity:
                                            {item.quantity}
                                        </p>


                                        <p>
                                            <b>
                                                Item Total:
                                            </b>{" "}
                                            ₹
                                            {itemTotal.toFixed(
                                                2
                                            )}
                                        </p>

                                    </div>

                                </div>


                                {/* QUANTITY */}

                                <div
                                    style={
                                        styles.actions
                                    }
                                >

                                    <div>

                                        <button
                                            style={
                                                styles.smallButton
                                            }
                                            onClick={() =>
                                                updateQuantity(
                                                    item,
                                                    item.quantity -
                                                        1
                                                )
                                            }
                                        >
                                            −
                                        </button>


                                        <b
                                            style={{
                                                margin:
                                                    "0 15px"
                                            }}
                                        >
                                            {
                                                item.quantity
                                            }
                                        </b>


                                        <button
                                            style={
                                                styles.smallButton
                                            }
                                            onClick={() =>
                                                updateQuantity(
                                                    item,
                                                    item.quantity +
                                                        1
                                                )
                                            }
                                        >
                                            +
                                        </button>

                                    </div>


                                    <button
                                        style={
                                            styles.deleteButton
                                        }
                                        onClick={() =>
                                            removeFromCart(
                                                item.id
                                            )
                                        }
                                    >
                                        Remove
                                    </button>

                                </div>

                            </div>

                        );

                    })}


                    {/* TOTAL */}

                    <div
                        style={
                            styles.totalBox
                        }
                    >

                        <h2>
                            Total: ₹
                            {getTotal().toFixed(2)}
                        </h2>


                        <button
                            style={
                                styles.checkoutButton
                            }
                            onClick={openCheckoutModal}
                        >
                            💳 Proceed to Checkout
                        </button>

                    </div>

                </div>

            )}

            {/* CHECKOUT & DELIVERY MODAL */}
            {showCheckoutModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <div style={styles.modalHeader}>
                            <h2>📦 Complete Your Order</h2>
                            <button
                                style={styles.modalCloseBtn}
                                onClick={() => setShowCheckoutModal(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <p style={styles.modalSubtext}>
                            Please provide your contact number and delivery address to place your order.
                        </p>

                        {formError && (
                            <div style={styles.modalErrorBox}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleConfirmCheckout} style={styles.checkoutForm}>
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>
                                    📞 <b>Phone Number *</b>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="e.g. 9876543210"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    maxLength="15"
                                    required
                                    style={styles.formInput}
                                />
                                <small style={styles.formHint}>10-digit mobile number for delivery updates</small>
                            </div>

                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>
                                    🏠 <b>Delivery Address *</b>
                                </label>
                                <textarea
                                    placeholder="Enter complete delivery address (House/Flat No, Street, Landmark, City, State, PIN code)..."
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    rows="3"
                                    required
                                    style={styles.formTextarea}
                                />
                            </div>

                            {/* PAYMENT MODE SELECTION */}
                            <div style={styles.formGroup}>
                                <label style={styles.formLabel}>
                                    💳 <b>Choose Payment Mode *</b>
                                </label>

                                <div style={styles.paymentModeSelector}>
                                    <div
                                        style={{
                                            ...styles.paymentOptionCard,
                                            ...(paymentMode === "ONLINE" ? styles.paymentOptionActive : {})
                                        }}
                                        onClick={() => setPaymentMode("ONLINE")}
                                    >
                                        <div style={styles.paymentOptionHeader}>
                                            <input
                                                type="radio"
                                                name="paymentMode"
                                                checked={paymentMode === "ONLINE"}
                                                onChange={() => setPaymentMode("ONLINE")}
                                                style={styles.radioInput}
                                            />
                                            <div>
                                                <div style={styles.paymentOptionTitle}>⚡ Online Payment</div>
                                                <div style={styles.paymentOptionSubtitle}>Instant confirmation via UPI, Cards, NetBanking</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div
                                        style={{
                                            ...styles.paymentOptionCard,
                                            ...(paymentMode === "OFFLINE" ? styles.paymentOptionActive : {})
                                        }}
                                        onClick={() => setPaymentMode("OFFLINE")}
                                    >
                                        <div style={styles.paymentOptionHeader}>
                                            <input
                                                type="radio"
                                                name="paymentMode"
                                                checked={paymentMode === "OFFLINE"}
                                                onChange={() => setPaymentMode("OFFLINE")}
                                                style={styles.radioInput}
                                            />
                                            <div>
                                                <div style={styles.paymentOptionTitle}>💵 Offline / Cash on Delivery</div>
                                                <div style={styles.paymentOptionSubtitle}>Pay in cash upon receiving package at doorstep</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ONLINE PAYMENT METHODS DETAILS */}
                            {paymentMode === "ONLINE" && (
                                <div style={styles.onlinePaymentBox}>
                                    <div style={styles.onlineTabs}>
                                        <button
                                            type="button"
                                            style={{
                                                ...styles.onlineTabBtn,
                                                ...(onlinePaymentMethod === "UPI" ? styles.onlineTabActive : {})
                                            }}
                                            onClick={() => setOnlinePaymentMethod("UPI")}
                                        >
                                            📱 UPI (GPay/PhonePe/Paytm)
                                        </button>
                                        <button
                                            type="button"
                                            style={{
                                                ...styles.onlineTabBtn,
                                                ...(onlinePaymentMethod === "CARD" ? styles.onlineTabActive : {})
                                            }}
                                            onClick={() => setOnlinePaymentMethod("CARD")}
                                        >
                                            💳 Debit / Credit Card
                                        </button>
                                        <button
                                            type="button"
                                            style={{
                                                ...styles.onlineTabBtn,
                                                ...(onlinePaymentMethod === "NETBANKING" ? styles.onlineTabActive : {})
                                            }}
                                            onClick={() => setOnlinePaymentMethod("NETBANKING")}
                                        >
                                            🏦 Net Banking
                                        </button>
                                    </div>

                                    {/* UPI OPTION */}
                                    {onlinePaymentMethod === "UPI" && (
                                        <div style={styles.paymentSubForm}>
                                            <label style={styles.formLabel}>
                                                Enter Virtual Payment Address (VPA / UPI ID)
                                            </label>
                                            <input
                                                type="text"
                                                placeholder="e.g. mobile@upi or username@okhdfcbank"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                style={styles.formInput}
                                            />
                                            <div style={styles.upiBadges}>
                                                <span style={styles.upiPill}>Google Pay</span>
                                                <span style={styles.upiPill}>PhonePe</span>
                                                <span style={styles.upiPill}>Paytm</span>
                                                <span style={styles.upiPill}>BHIM UPI</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* CARD OPTION */}
                                    {onlinePaymentMethod === "CARD" && (
                                        <div style={styles.paymentSubForm}>
                                            <label style={styles.formLabel}>Card Number</label>
                                            <input
                                                type="text"
                                                placeholder="4532 8900 1234 5678"
                                                maxLength="19"
                                                value={cardNumber}
                                                onChange={(e) => setCardNumber(e.target.value)}
                                                style={styles.formInput}
                                            />
                                            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
                                                <div style={{ flex: 1 }}>
                                                    <label style={styles.formLabel}>Expiry (MM/YY)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="MM/YY"
                                                        maxLength="5"
                                                        value={cardExpiry}
                                                        onChange={(e) => setCardExpiry(e.target.value)}
                                                        style={styles.formInput}
                                                    />
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <label style={styles.formLabel}>CVV</label>
                                                    <input
                                                        type="password"
                                                        placeholder="•••"
                                                        maxLength="4"
                                                        value={cardCvv}
                                                        onChange={(e) => setCardCvv(e.target.value)}
                                                        style={styles.formInput}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* NET BANKING OPTION */}
                                    {onlinePaymentMethod === "NETBANKING" && (
                                        <div style={styles.paymentSubForm}>
                                            <label style={styles.formLabel}>Select Bank</label>
                                            <select style={styles.formInput}>
                                                <option>State Bank of India (SBI)</option>
                                                <option>HDFC Bank</option>
                                                <option>ICICI Bank</option>
                                                <option>Axis Bank</option>
                                                <option>Kotak Mahindra Bank</option>
                                                <option>Punjab National Bank</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* OFFLINE PAYMENT CALLOUT */}
                            {paymentMode === "OFFLINE" && (
                                <div style={styles.offlineAlertBox}>
                                    <div style={{ fontSize: "24px" }}>🚚</div>
                                    <div>
                                        <b>Cash on Delivery Selected:</b>
                                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#475569" }}>
                                            Keep ₹{getTotal().toFixed(2)} cash ready. You can inspect the package upon arrival and pay the delivery agent.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* ORDER SUMMARY PREVIEW */}
                            <div style={styles.orderSummaryBox}>
                                <div><b>Total Items:</b> {cart.reduce((t, i) => t + Number(i.quantity), 0)}</div>
                                <div><b>Payment Mode:</b> <span style={{ fontWeight: "700", color: paymentMode === "ONLINE" ? "#0284c7" : "#059669" }}>{paymentMode === "ONLINE" ? "Online (Prepaid)" : "Offline (Cash On Delivery)"}</span></div>
                                <div><b>Grand Total:</b> <span style={{ color: "#28a745", fontSize: "18px" }}>₹{getTotal().toFixed(2)}</span></div>
                            </div>

                            <div style={styles.modalFooter}>
                                <button
                                    type="button"
                                    style={styles.cancelBtn}
                                    onClick={() => setShowCheckoutModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    style={paymentMode === "ONLINE" ? styles.confirmOnlineBtn : styles.confirmOrderBtn}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting
                                        ? "Processing Order..."
                                        : paymentMode === "ONLINE"
                                        ? `🔒 Pay ₹${getTotal().toFixed(2)} & Confirm Order`
                                        : `📦 Confirm Cash on Delivery Order`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>

    );
}


// =====================================================
// STYLES
// =====================================================

const styles = {

    container: {
        padding: "30px",
        fontFamily:
            "Arial, sans-serif",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh"
    },


    header: {
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "center",
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px"
    },


    navButton: {
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "5px",
        cursor: "pointer",
        margin: "5px"
    },


    orderButton: {
        backgroundColor: "#6f42c1",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "5px",
        cursor: "pointer",
        margin: "5px"
    },


    logoutButton: {
        backgroundColor: "#dc3545",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "5px",
        cursor: "pointer",
        margin: "5px"
    },


    center: {
        textAlign: "center",
        padding: "50px"
    },


    button: {
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        padding: "10px 18px",
        borderRadius: "5px",
        cursor: "pointer"
    },


    emptyCart: {
        backgroundColor: "white",
        padding: "40px",
        textAlign: "center",
        borderRadius: "10px"
    },


    cartItem: {
        backgroundColor: "white",
        padding: "20px",
        marginBottom: "15px",
        borderRadius: "10px",
        display: "flex",
        justifyContent:
            "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "20px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)"
    },


    productInfo: {
        display: "flex",
        alignItems: "center",
        gap: "20px"
    },


    productImage: {
        width: "120px",
        height: "120px",
        objectFit: "cover",
        borderRadius: "8px"
    },


    actions: {
        display: "flex",
        alignItems: "center",
        gap: "15px",
        flexWrap: "wrap"
    },


    smallButton: {
        padding: "7px 13px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        backgroundColor: "#007bff",
        color: "white",
        fontSize: "16px"
    },


    deleteButton: {
        padding: "8px 14px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        backgroundColor: "#dc3545",
        color: "white"
    },


    totalBox: {
        backgroundColor: "white",
        padding: "25px",
        marginTop: "20px",
        borderRadius: "10px",
        textAlign: "right"
    },


    checkoutButton: {
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        padding: "12px 25px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "16px"
    },

    variantDisplayRow: {
        display: "flex",
        gap: "10px",
        marginTop: "6px",
        marginBottom: "6px",
        flexWrap: "wrap"
    },

    itemVariantBadge: {
        backgroundColor: "#e8f0fe",
        color: "#1967d2",
        padding: "3px 8px",
        borderRadius: "6px",
        fontSize: "13px"
    },

    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px"
    },

    modalContent: {
        backgroundColor: "white",
        borderRadius: "12px",
        padding: "25px",
        maxWidth: "500px",
        width: "100%",
        boxShadow: "0 8px 30px rgba(0,0,0,0.25)"
    },

    modalHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "10px"
    },

    modalCloseBtn: {
        background: "none",
        border: "none",
        fontSize: "20px",
        cursor: "pointer",
        color: "#6c757d"
    },

    modalSubtext: {
        color: "#6c757d",
        fontSize: "14px",
        marginBottom: "18px"
    },

    modalErrorBox: {
        backgroundColor: "#f8d7da",
        color: "#721c24",
        padding: "10px 14px",
        borderRadius: "6px",
        marginBottom: "15px",
        fontSize: "14px"
    },

    checkoutForm: {
        display: "flex",
        flexDirection: "column",
        gap: "16px"
    },

    formGroup: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },

    formLabel: {
        fontSize: "14px",
        color: "#333333"
    },

    formInput: {
        padding: "10px 12px",
        borderRadius: "6px",
        border: "1px solid #ced4da",
        fontSize: "15px",
        outline: "none"
    },

    formTextarea: {
        padding: "10px 12px",
        borderRadius: "6px",
        border: "1px solid #ced4da",
        fontSize: "14px",
        fontFamily: "inherit",
        outline: "none",
        resize: "vertical"
    },

    formHint: {
        color: "#6c757d",
        fontSize: "12px"
    },

    orderSummaryBox: {
        backgroundColor: "#f8f9fa",
        padding: "14px",
        borderRadius: "8px",
        border: "1px solid #e9ecef",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "15px"
    },

    modalFooter: {
        display: "flex",
        justifyContent: "flex-end",
        gap: "12px",
        marginTop: "10px"
    },

    cancelBtn: {
        backgroundColor: "#6c757d",
        color: "white",
        border: "none",
        padding: "10px 18px",
        borderRadius: "6px",
        cursor: "pointer",
        fontSize: "14px"
    },

    confirmOrderBtn: {
        backgroundColor: "#28a745",
        color: "white",
        border: "none",
        padding: "10px 22px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px"
    },

    confirmOnlineBtn: {
        backgroundColor: "#0284c7",
        color: "white",
        border: "none",
        padding: "10px 22px",
        borderRadius: "6px",
        cursor: "pointer",
        fontWeight: "bold",
        fontSize: "14px",
        boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)"
    },

    wishlistNavButton: {
        backgroundColor: "#e11d48",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "5px",
        cursor: "pointer",
        margin: "5px",
        fontWeight: "600"
    },

    paymentModeSelector: {
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        marginTop: "4px"
    },

    paymentOptionCard: {
        border: "2px solid #e2e8f0",
        borderRadius: "10px",
        padding: "12px 14px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        backgroundColor: "#f8fafc"
    },

    paymentOptionActive: {
        borderColor: "#0284c7",
        backgroundColor: "#f0f9ff"
    },

    paymentOptionHeader: {
        display: "flex",
        alignItems: "center",
        gap: "12px"
    },

    radioInput: {
        width: "18px",
        height: "18px",
        cursor: "pointer",
        accentColor: "#0284c7"
    },

    paymentOptionTitle: {
        fontSize: "15px",
        fontWeight: "700",
        color: "#0f172a"
    },

    paymentOptionSubtitle: {
        fontSize: "12px",
        color: "#64748b",
        marginTop: "2px"
    },

    onlinePaymentBox: {
        backgroundColor: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "14px",
        marginTop: "4px"
    },

    onlineTabs: {
        display: "flex",
        gap: "6px",
        marginBottom: "14px",
        flexWrap: "wrap"
    },

    onlineTabBtn: {
        padding: "6px 12px",
        fontSize: "12px",
        fontWeight: "600",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        color: "#475569",
        cursor: "pointer"
    },

    onlineTabActive: {
        backgroundColor: "#0284c7",
        color: "#ffffff",
        borderColor: "#0284c7"
    },

    paymentSubForm: {
        display: "flex",
        flexDirection: "column",
        gap: "6px"
    },

    upiBadges: {
        display: "flex",
        gap: "6px",
        marginTop: "6px",
        flexWrap: "wrap"
    },

    upiPill: {
        fontSize: "11px",
        backgroundColor: "#e2e8f0",
        color: "#334155",
        padding: "2px 8px",
        borderRadius: "4px",
        fontWeight: "600"
    },

    offlineAlertBox: {
        display: "flex",
        alignItems: "center",
        gap: "12px",
        backgroundColor: "#f0fdf4",
        border: "1px solid #bbf7d0",
        borderRadius: "10px",
        padding: "12px 16px",
        color: "#166534"
    }

};

export default Cart;