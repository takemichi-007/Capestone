import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "./config";

function Wishlist() {
    const navigate = useNavigate();

    const loggedInUser = JSON.parse(localStorage.getItem("loggedInUser"));
    const customerId = loggedInUser?.id;

    const [wishlistItems, setWishlistItems] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartCount, setCartCount] = useState(0);
    const [actionMessage, setActionMessage] = useState("");

    // Variant selections for quick Add-to-Cart from wishlist
    const [selectedColor, setSelectedColor] = useState({});
    const [selectedSize, setSelectedSize] = useState({});

    // Variant Helper Functions
    const getCategoryType = (product) => {
        const text = `${product.category || ""} ${product.name || ""} ${product.description || ""}`.toLowerCase();
        if (text.includes("shoe") || text.includes("footwear") || text.includes("sneaker") || text.includes("boot") || text.includes("sandal") || text.includes("croc") || text.includes("loafer") || text.includes("slipper") || text.includes("heel")) {
            return "SHOE";
        }
        if (text.includes("cloth") || text.includes("shirt") || text.includes("pant") || text.includes("t-shirt") || text.includes("tshirt") || text.includes("dress") || text.includes("jean") || text.includes("jacket") || text.includes("hoodie") || text.includes("top") || text.includes("kurti") || text.includes("apparel") || text.includes("wear") || text.includes("fashion") || text.includes("suit") || text.includes("trouser") || text.includes("skirt") || text.includes("saree")) {
            return "CLOTHES";
        }
        return "GENERAL";
    };

    const getAvailableSizes = (categoryType) => {
        if (categoryType === "CLOTHES") {
            return ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
        }
        if (categoryType === "SHOE") {
            return ["UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"];
        }
        return ["Standard", "Free Size"];
    };

    const COLOR_PALETTE = [
        { name: "Black", hex: "#111827" },
        { name: "White", hex: "#FFFFFF", border: "#D1D5DB" },
        { name: "Navy Blue", hex: "#1E3A8A" },
        { name: "Crimson Red", hex: "#DC2626" },
        { name: "Forest Green", hex: "#15803D" },
        { name: "Slate Grey", hex: "#4B5563" },
        { name: "Royal Blue", hex: "#2563EB" },
        { name: "Beige", hex: "#D4B996" }
    ];

    useEffect(() => {
        if (!loggedInUser) {
            navigate("/login");
            return;
        }
        if (loggedInUser.role !== "CUSTOMER") {
            navigate("/");
            return;
        }

        loadData();
        loadCartCount();
    }, [customerId]);

    const loadData = async () => {
        setLoading(true);
        try {
            // Load products
            const prodRes = await fetch(`${API_BASE_URL}/api/products`);
            if (prodRes.ok) {
                const prodData = await prodRes.json();
                setProducts(prodData);
            }

            // Load wishlist
            const wishRes = await fetch(`${API_BASE_URL}/api/wishlist/${customerId}`);
            if (wishRes.ok) {
                const wishData = await wishRes.json();
                setWishlistItems(wishData);
            }
        } catch (err) {
            console.error("Wishlist load error:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadCartCount = () => {
        if (!customerId) return;
        fetch(`${API_BASE_URL}/api/cart/${customerId}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const count = data.reduce((t, i) => t + Number(i.quantity), 0);
                setCartCount(count);
            })
            .catch(err => console.error(err));
    };

    const removeFromWishlist = async (productId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/wishlist/customer/${customerId}/product/${productId}`, {
                method: "DELETE"
            });
            if (res.ok) {
                setWishlistItems(prev => prev.filter(item => item.productId !== productId));
                showMessage("❤️ Item removed from your wishlist.");
            }
        } catch (err) {
            console.error("Remove wishlist error:", err);
        }
    };

    const addToCartFromWishlist = (product) => {
        const catType = getCategoryType(product);
        const defaultSize = catType === "CLOTHES" ? "M" : catType === "SHOE" ? "UK 8" : "Standard";
        const chosenColor = selectedColor[product.id] || "Black";
        const chosenSize = selectedSize[product.id] || defaultSize;

        const cartItem = {
            customerId: customerId,
            productId: product.id,
            quantity: 1,
            price: product.price,
            color: chosenColor,
            size: chosenSize
        };

        fetch(`${API_BASE_URL}/api/cart`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(cartItem)
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to add to cart");
                return res.json();
            })
            .then(() => {
                loadCartCount();
                showMessage("🛒 Moved product to Cart successfully!");
            })
            .catch(err => {
                console.error(err);
                alert("Could not add to cart.");
            });
    };

    const showMessage = (msg) => {
        setActionMessage(msg);
        setTimeout(() => setActionMessage(""), 4000);
    };

    const logout = () => {
        localStorage.removeItem("loggedInUser");
        navigate("/");
    };

    // Filter wishlist items against products list
    const wishedProductList = wishlistItems.map(wish => {
        const product = products.find(p => p.id === wish.productId);
        return {
            wishId: wish.id,
            product: product || { id: wish.productId, name: `Product #${wish.productId}`, price: 0 }
        };
    }).filter(item => item.product);

    return (
        <div style={styles.container}>
            {/* HEADER */}
            <div style={styles.header}>
                <div>
                    <h1 style={styles.logo}>🛒 ShaliniMart</h1>
                    <p style={styles.welcomeText}>
                        ❤️ <b>My Favourite Wishlist</b> ({wishedProductList.length} items)
                    </p>
                </div>

                <div style={styles.navGroup}>
                    <button
                        style={styles.navBtnHome}
                        onClick={() => navigate("/customer-dashboard")}
                    >
                        🏠 Browse Products
                    </button>
                    <button
                        style={styles.navBtnCart}
                        onClick={() => navigate("/cart")}
                    >
                        🛒 My Cart {cartCount > 0 && `(${cartCount})`}
                    </button>
                    <button
                        style={styles.navBtnOrders}
                        onClick={() => navigate("/orders")}
                    >
                        📦 My Orders
                    </button>
                    <button style={styles.navBtnLogout} onClick={logout}>
                        Logout
                    </button>
                </div>
            </div>

            {/* ACTION ALERT */}
            {actionMessage && (
                <div style={styles.alertBox}>
                    {actionMessage}
                </div>
            )}

            {/* HERO BANNER */}
            <div style={styles.heroBanner}>
                <div style={{ flex: 1 }}>
                    <h2 style={styles.bannerTitle}>❤️ Your Saved & Favourite Items</h2>
                    <p style={styles.bannerSubtitle}>
                        Keep track of items you love. Select your preferred color & size, and easily move them to your cart whenever you are ready to order!
                    </p>
                </div>
                <div style={styles.heartIconBanner}>💖</div>
            </div>

            {/* LOADING STATE */}
            {loading && (
                <div style={styles.centerBox}>
                    <h3>Loading your wishlist...</h3>
                </div>
            )}

            {/* EMPTY STATE */}
            {!loading && wishedProductList.length === 0 && (
                <div style={styles.emptyCard}>
                    <div style={{ fontSize: "56px", marginBottom: "15px" }}>💔</div>
                    <h2 style={{ color: "#1e293b", marginBottom: "8px" }}>Your Wishlist is Empty</h2>
                    <p style={{ color: "#64748b", maxWidth: "450px", margin: "0 auto 24px auto" }}>
                        Explore our wide range of products and tap the ❤️ heart icon on any product card to save it here!
                    </p>
                    <button
                        style={styles.shopNowBtn}
                        onClick={() => navigate("/customer-dashboard")}
                    >
                        🛍️ Explore Products
                    </button>
                </div>
            )}

            {/* WISHLIST GRID */}
            {!loading && wishedProductList.length > 0 && (
                <div style={styles.grid}>
                    {wishedProductList.map(({ wishId, product }) => {
                        const catType = getCategoryType(product);
                        const availableSizes = getAvailableSizes(catType);
                        const defaultSize = catType === "CLOTHES" ? "M" : catType === "SHOE" ? "UK 8" : "Standard";
                        const activeColor = selectedColor[product.id] || "Black";
                        const activeSize = selectedSize[product.id] || defaultSize;

                        return (
                            <div key={wishId || product.id} style={styles.card}>
                                <div style={styles.cardImageContainer}>
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            style={styles.productImg}
                                            onError={(e) => { e.target.style.display = "none"; }}
                                        />
                                    ) : (
                                        <div style={styles.imagePlaceholder}>🛍️</div>
                                    )}

                                    <button
                                        style={styles.removeWishlistBtn}
                                        title="Remove from wishlist"
                                        onClick={() => removeFromWishlist(product.id)}
                                    >
                                        ❤️
                                    </button>
                                </div>

                                <div style={styles.cardBody}>
                                    <div style={styles.categoryBadge}>
                                        {product.category || "General"}
                                    </div>

                                    <h3 style={styles.productName}>{product.name}</h3>
                                    <p style={styles.productDesc}>
                                        {product.description || "High quality product with premium material & finish."}
                                    </p>

                                    <div style={styles.priceRow}>
                                        <span style={styles.priceText}>₹{Number(product.price).toFixed(2)}</span>
                                        <span style={product.stockQuantity > 0 ? styles.inStockBadge : styles.outStockBadge}>
                                            {product.stockQuantity > 0 ? `In Stock (${product.stockQuantity})` : "Out of Stock"}
                                        </span>
                                    </div>

                                    {/* COLOR SELECTION */}
                                    <div style={styles.variantGroup}>
                                        <label style={styles.variantLabel}>
                                            🎨 <b>Color:</b> <span style={styles.badgeText}>{activeColor}</span>
                                        </label>
                                        <div style={styles.colorPalette}>
                                            {COLOR_PALETTE.map((col) => (
                                                <button
                                                    key={col.name}
                                                    type="button"
                                                    title={col.name}
                                                    onClick={() => setSelectedColor(prev => ({ ...prev, [product.id]: col.name }))}
                                                    style={{
                                                        ...styles.colorCircle,
                                                        backgroundColor: col.hex,
                                                        border: col.border ? `2px solid ${col.border}` : "2px solid transparent",
                                                        outline: activeColor === col.name ? "3px solid #e11d48" : "none",
                                                        outlineOffset: "2px",
                                                        transform: activeColor === col.name ? "scale(1.15)" : "scale(1)"
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* SIZE SELECTION */}
                                    <div style={styles.variantGroup}>
                                        <label style={styles.variantLabel}>
                                            📏 <b>Size:</b> <span style={styles.badgeText}>{activeSize}</span>
                                        </label>
                                        <div style={styles.sizePills}>
                                            {availableSizes.map((sz) => (
                                                <button
                                                    key={sz}
                                                    type="button"
                                                    onClick={() => setSelectedSize(prev => ({ ...prev, [product.id]: sz }))}
                                                    style={{
                                                        ...styles.sizePill,
                                                        ...(activeSize === sz ? styles.sizePillActive : {})
                                                    }}
                                                >
                                                    {sz}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* BUTTONS */}
                                    <div style={styles.cardActions}>
                                        <button
                                            style={styles.addToCartBtn}
                                            disabled={product.stockQuantity <= 0}
                                            onClick={() => addToCartFromWishlist(product)}
                                        >
                                            🛒 Move to Cart
                                        </button>
                                        <button
                                            style={styles.deleteBtn}
                                            onClick={() => removeFromWishlist(product.id)}
                                        >
                                            🗑️ Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

const styles = {
    container: {
        padding: "30px",
        fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        backgroundColor: "#f8fafc",
        minHeight: "100vh"
    },
    header: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "#ffffff",
        padding: "20px 30px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
        marginBottom: "25px",
        flexWrap: "wrap",
        gap: "15px"
    },
    logo: {
        margin: 0,
        fontSize: "26px",
        fontWeight: "800",
        color: "#1e1b4b"
    },
    welcomeText: {
        margin: "6px 0 0 0",
        color: "#64748b",
        fontSize: "15px"
    },
    navGroup: {
        display: "flex",
        gap: "10px",
        flexWrap: "wrap"
    },
    navBtnHome: {
        backgroundColor: "#2563eb",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px"
    },
    navBtnCart: {
        backgroundColor: "#10b981",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px"
    },
    navBtnOrders: {
        backgroundColor: "#8b5cf6",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px"
    },
    navBtnLogout: {
        backgroundColor: "#ef4444",
        color: "#fff",
        border: "none",
        padding: "10px 18px",
        borderRadius: "8px",
        cursor: "pointer",
        fontWeight: "600",
        fontSize: "14px"
    },
    alertBox: {
        backgroundColor: "#ecfdf5",
        color: "#065f46",
        border: "1px solid #a7f3d0",
        padding: "12px 20px",
        borderRadius: "10px",
        marginBottom: "20px",
        fontWeight: "600"
    },
    heroBanner: {
        background: "linear-gradient(135deg, #ffe4e6 0%, #fbcfe8 50%, #fed7aa 100%)",
        borderRadius: "16px",
        padding: "26px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "30px",
        border: "1px solid #fecdd3"
    },
    bannerTitle: {
        margin: "0 0 8px 0",
        color: "#881337",
        fontSize: "24px",
        fontWeight: "800"
    },
    bannerSubtitle: {
        margin: 0,
        color: "#9f1239",
        fontSize: "15px",
        maxWidth: "700px",
        lineHeight: "1.5"
    },
    heartIconBanner: {
        fontSize: "48px"
    },
    centerBox: {
        textAlign: "center",
        padding: "60px 20px",
        color: "#64748b"
    },
    emptyCard: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        padding: "50px 30px",
        textAlign: "center",
        boxShadow: "0 4px 15px rgba(0,0,0,0.04)"
    },
    shopNowBtn: {
        backgroundColor: "#e11d48",
        color: "#fff",
        border: "none",
        padding: "12px 28px",
        borderRadius: "10px",
        fontSize: "16px",
        fontWeight: "700",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(225, 29, 72, 0.3)"
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
        gap: "24px"
    },
    card: {
        backgroundColor: "#ffffff",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        transition: "transform 0.2s ease, box-shadow 0.2s ease"
    },
    cardImageContainer: {
        position: "relative",
        height: "210px",
        backgroundColor: "#f1f5f9",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden"
    },
    productImg: {
        width: "100%",
        height: "100%",
        objectFit: "cover"
    },
    imagePlaceholder: {
        fontSize: "50px"
    },
    removeWishlistBtn: {
        position: "absolute",
        top: "12px",
        right: "12px",
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        border: "none",
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "18px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
    },
    cardBody: {
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        flex: 1
    },
    categoryBadge: {
        display: "inline-block",
        alignSelf: "flex-start",
        backgroundColor: "#f1f5f9",
        color: "#475569",
        fontSize: "12px",
        fontWeight: "700",
        padding: "4px 10px",
        borderRadius: "20px",
        textTransform: "uppercase",
        marginBottom: "8px"
    },
    productName: {
        margin: "0 0 6px 0",
        fontSize: "18px",
        fontWeight: "700",
        color: "#0f172a"
    },
    productDesc: {
        margin: "0 0 12px 0",
        fontSize: "13px",
        color: "#64748b",
        lineHeight: "1.4",
        minHeight: "36px"
    },
    priceRow: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px"
    },
    priceText: {
        fontSize: "20px",
        fontWeight: "800",
        color: "#059669"
    },
    inStockBadge: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#16a34a",
        backgroundColor: "#dcfce7",
        padding: "3px 8px",
        borderRadius: "6px"
    },
    outStockBadge: {
        fontSize: "12px",
        fontWeight: "600",
        color: "#dc2626",
        backgroundColor: "#fee2e2",
        padding: "3px 8px",
        borderRadius: "6px"
    },
    variantGroup: {
        marginBottom: "12px"
    },
    variantLabel: {
        display: "block",
        fontSize: "12px",
        color: "#334155",
        marginBottom: "6px"
    },
    badgeText: {
        color: "#e11d48",
        fontWeight: "700"
    },
    colorPalette: {
        display: "flex",
        gap: "8px",
        flexWrap: "wrap"
    },
    colorCircle: {
        width: "22px",
        height: "22px",
        borderRadius: "50%",
        cursor: "pointer",
        padding: 0,
        transition: "all 0.15s ease"
    },
    sizePills: {
        display: "flex",
        gap: "6px",
        flexWrap: "wrap"
    },
    sizePill: {
        padding: "4px 10px",
        fontSize: "12px",
        fontWeight: "600",
        border: "1px solid #cbd5e1",
        borderRadius: "6px",
        backgroundColor: "#ffffff",
        color: "#334155",
        cursor: "pointer"
    },
    sizePillActive: {
        backgroundColor: "#e11d48",
        color: "#ffffff",
        borderColor: "#e11d48"
    },
    cardActions: {
        display: "flex",
        gap: "10px",
        marginTop: "auto",
        paddingTop: "15px"
    },
    addToCartBtn: {
        flex: 2,
        backgroundColor: "#e11d48",
        color: "#ffffff",
        border: "none",
        padding: "10px 14px",
        borderRadius: "8px",
        fontWeight: "700",
        fontSize: "14px",
        cursor: "pointer",
        transition: "background-color 0.2s"
    },
    deleteBtn: {
        flex: 1,
        backgroundColor: "#f1f5f9",
        color: "#475569",
        border: "1px solid #cbd5e1",
        padding: "10px",
        borderRadius: "8px",
        fontWeight: "600",
        fontSize: "13px",
        cursor: "pointer"
    }
};

export default Wishlist;
