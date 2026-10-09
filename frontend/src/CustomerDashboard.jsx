import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css"; // Import the CSS file for styling
import CustomerReviews from "./CustomerReviews";
import { API_BASE_URL } from "./config";

function CustomerDashboard() {

    const navigate = useNavigate();


    // =========================
    // LOGGED-IN USER
    // =========================

    const loggedInUser =
        JSON.parse(
            localStorage.getItem(
                "loggedInUser"
            )
        );

    const customerId =
        loggedInUser?.id;


    // =========================
    // PRODUCT STATES
    // =========================

    const [products, setProducts] =
        useState([]);

    const [search, setSearch] =
        useState("");

    const [category, setCategory] =
        useState("ALL");


    // =========================
    // CART & WISHLIST COUNT
    // =========================

    const [cartCount, setCartCount] =
        useState(0);

    const [wishlistIds, setWishlistIds] =
        useState(new Set());


    // =========================
    // REVIEW STATES
    // =========================

    const [reviews, setReviews] =
        useState({});

    const [reviewRating, setReviewRating] =
        useState({});

    const [reviewComment, setReviewComment] =
        useState({});

    const [reviewMessage, setReviewMessage] =
        useState({});

    const [canReview, setCanReview] =
        useState({});


    // =========================
    // VARIANT STATES (COLOR & SIZE)
    // =========================

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

    // =========================
    // MESSAGE
    // =========================

    const [message, setMessage] =
        useState("");


    // =====================================================
    // LOAD PRODUCTS
    // =====================================================

    useEffect(() => {

        fetch(
            `${API_BASE_URL}/api/products`
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to load products"
                    );
                }

                return response.json();

            })
            .then(data => {

                setProducts(data);

                data.forEach(product => {

                    loadReviews(
                        product.id
                    );

                    if (customerId) {

                        checkCanReview(
                            product.id
                        );

                    }

                });

            })
            .catch(error => {

                console.error(error);

                setMessage(
                    "Cannot connect to backend."
                );

            });

    }, []);


    // =====================================================
    // LOAD CART & WISHLIST COUNT
    // =====================================================

    useEffect(() => {

        if (!customerId) {
            return;
        }

        loadCartCount();
        loadWishlist();

    }, [customerId]);


    const loadCartCount = () => {

        fetch(
            `${API_BASE_URL}/api/cart/${customerId}`
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to load cart"
                    );
                }

                return response.json();

            })
            .then(data => {

                const count =
                    data.reduce(
                        (total, item) =>
                            total +
                            Number(
                                item.quantity
                            ),
                        0
                    );

                setCartCount(count);

            })
            .catch(error => {

                console.error(
                    "Cart count error:",
                    error
                );

            });

    };

    const loadWishlist = () => {
        if (!customerId) return;
        fetch(`${API_BASE_URL}/api/wishlist/${customerId}`)
            .then(res => res.ok ? res.json() : [])
            .then(data => {
                const idSet = new Set(data.map(item => item.productId));
                setWishlistIds(idSet);
            })
            .catch(err => console.error("Wishlist fetch error:", err));
    };

    const toggleWishlist = (productId) => {
        if (!customerId) {
            alert("Please login as customer to save favourites.");
            return;
        }

        fetch(`${API_BASE_URL}/api/wishlist/toggle`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                customerId: customerId,
                productId: productId
            })
        })
            .then(res => {
                if (!res.ok) throw new Error("Failed to toggle wishlist");
                return res.json();
            })
            .then(data => {
                setWishlistIds(prev => {
                    const next = new Set(prev);
                    if (data.status === "ADDED") {
                        next.add(productId);
                    } else {
                        next.delete(productId);
                    }
                    return next;
                });
            })
            .catch(err => {
                console.error("Error toggling wishlist:", err);
            });
    };


    // =====================================================
    // LOAD REVIEWS
    // =====================================================

    const loadReviews = (
        productId
    ) => {

        fetch(
            `${API_BASE_URL}/api/reviews/product/${productId}`
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to load reviews"
                    );
                }

                return response.json();

            })
            .then(data => {

                setReviews(prev => ({
                    ...prev,
                    [productId]: data
                }));

            })
            .catch(error => {

                console.error(
                    "Review loading error:",
                    error
                );

            });

    };


    // =====================================================
    // CHECK REVIEW PERMISSION
    // =====================================================

    const checkCanReview = (
        productId
    ) => {

        if (!customerId) {
            return;
        }

        fetch(
            `${API_BASE_URL}/api/reviews/can-review?customerId=${customerId}&productId=${productId}`
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to check review permission"
                    );
                }

                return response.json();

            })
            .then(data => {

                setCanReview(prev => ({
                    ...prev,
                    [productId]: data
                }));

            })
            .catch(error => {

                console.error(
                    "Review permission error:",
                    error
                );

                setCanReview(prev => ({
                    ...prev,
                    [productId]: false
                }));

            });

    };


    // =====================================================
    // ADD TO CART
    // =====================================================

    const addToCart = (
        product
    ) => {

        if (!customerId) {

            alert(
                "Please login as customer."
            );

            return;
        }


        const catType = getCategoryType(product);
        const defaultSize = catType === "CLOTHES" ? "M" : catType === "SHOE" ? "UK 8" : "Standard";
        const chosenColor = selectedColor[product.id] || "Black";
        const chosenSize = selectedSize[product.id] || defaultSize;

        const cartItem = {

            customerId:
                customerId,

            productId:
                product.id,

            quantity: 1,

            price:
                product.price,

            color: chosenColor,

            size: chosenSize

        };


        fetch(
            `${API_BASE_URL}/api/cart`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        cartItem
                    )
            }
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to add cart"
                    );
                }

                return response.json();

            })
            .then(() => {

                alert(
                    "Product added to cart!"
                );

                loadCartCount();

            })
            .catch(error => {

                console.error(error);

                alert(
                    "Cannot connect to backend."
                );

            });

    };


    // =====================================================
    // SUBMIT REVIEW
    // =====================================================

    const submitReview = (
        productId
    ) => {

        const rating =
            reviewRating[
                productId
            ];

        const comment =
            reviewComment[
                productId
            ] || "";


        if (!customerId) {

            alert(
                "Please login as customer."
            );

            return;
        }


        if (!canReview[productId]) {

            alert(
                "You can review this product only after receiving your order."
            );

            return;
        }


        if (!rating) {

            alert(
                "Please select a star rating."
            );

            return;
        }


        const review = {

            productId:
                productId,

            customerId:
                customerId,

            rating:
                Number(rating),

            comment:
                comment

        };


        fetch(
            `${API_BASE_URL}/api/reviews`,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(
                        review
                    )
            }
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to submit review"
                    );
                }

                return response.json();

            })
            .then(() => {

                setReviewMessage(
                    prev => ({
                        ...prev,
                        [productId]:
                            "Review submitted successfully!"
                    })
                );


                setReviewRating(
                    prev => ({
                        ...prev,
                        [productId]:
                            ""
                    })
                );


                setReviewComment(
                    prev => ({
                        ...prev,
                        [productId]:
                            ""
                    })
                );


                loadReviews(
                    productId
                );


                setTimeout(() => {

                    setReviewMessage(
                        prev => ({
                            ...prev,
                            [productId]:
                                ""
                        })
                    );

                }, 3000);

            })
            .catch(error => {

                console.error(error);

                setReviewMessage(
                    prev => ({
                        ...prev,
                        [productId]:
                            "Unable to submit review."
                    })
                );

            });

    };


    // =====================================================
    // UPDATE REVIEW
    // =====================================================

    const updateReview = (
        review
    ) => {

        const newRating =
            window.prompt(
                "Enter new rating (1-5):",
                review.rating
            );


        if (newRating === null) {
            return;
        }


        const ratingNumber =
            Number(newRating);


        if (
            isNaN(ratingNumber) ||
            ratingNumber < 1 ||
            ratingNumber > 5
        ) {

            alert(
                "Rating must be between 1 and 5."
            );

            return;
        }


        const newComment =
            window.prompt(
                "Enter new comment:",
                review.comment || ""
            );


        if (newComment === null) {
            return;
        }


        fetch(
            `${API_BASE_URL}/api/reviews/${review.id}?customerId=${customerId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify({

                        rating:
                            ratingNumber,

                        comment:
                            newComment

                    })
            }
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to update review"
                    );
                }

                return response.json();

            })
            .then(() => {

                alert(
                    "Review updated successfully!"
                );

                loadReviews(
                    review.productId
                );

            })
            .catch(error => {

                console.error(error);

                alert(
                    "Cannot update review."
                );

            });

    };


    // =====================================================
    // DELETE REVIEW
    // =====================================================

    const deleteReview = (
        review
    ) => {

        const confirmDelete =
            window.confirm(
                "Are you sure you want to delete this review?"
            );


        if (!confirmDelete) {
            return;
        }


        fetch(
            `${API_BASE_URL}/api/reviews/${review.id}?customerId=${customerId}`,
            {
                method: "DELETE"
            }
        )
            .then(response => {

                if (!response.ok) {
                    throw new Error(
                        "Failed to delete review"
                    );
                }

                return response.text();

            })
            .then(() => {

                alert(
                    "Review deleted successfully!"
                );

                loadReviews(
                    review.productId
                );

            })
            .catch(error => {

                console.error(error);

                alert(
                    "Cannot delete review."
                );

            });

    };


    // =====================================================
    // LOGOUT
    // =====================================================

    const logout = () => {

        localStorage.removeItem(
            "loggedInUser"
        );

        navigate("/");

    };


    // =====================================================
    // FILTER PRODUCTS
    // =====================================================

    const filteredProducts =
        products.filter(product => {

            const matchesSearch =
                product.name
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    )
                ||
                product.description
                    ?.toLowerCase()
                    .includes(
                        search.toLowerCase()
                    );


            const matchesCategory =
                category === "ALL"
                ||
                product.category ===
                    category;


            return (
                matchesSearch &&
                matchesCategory
            );

        });


    // =====================================================
    // CATEGORIES
    // =====================================================

    const categories = [

        "ALL",

        ...new Set(

            products
                .map(
                    product =>
                        product.category
                )
                .filter(Boolean)

        )

    ];


    // =====================================================
    // SECURITY
    // =====================================================

    if (!loggedInUser) {

        return (

            <div style={styles.center}>

                <h2>
                    Please login first.
                </h2>

                <button
                    style={styles.button}
                    onClick={() =>
                        navigate(
                            "/login"
                        )
                    }
                >
                    Go to Login
                </button>

            </div>

        );

    }


    if (
        loggedInUser.role !==
        "CUSTOMER"
    ) {

        return (

            <div style={styles.center}>

                <h2>
                    Access denied!
                </h2>

                <p>
                    This page is only for customers.
                </p>

                <button
                    style={styles.button}
                    onClick={logout}
                >
                    Logout
                </button>

            </div>

        );

    }


    // =====================================================
    // MAIN UI
    // =====================================================

    return (

        <div style={styles.container}>


            {/* HEADER */}

            <div style={styles.header}>

                <div>

                    <h1>
                        🛒 ShaliniMart
                    </h1>

                    <p>

                        Welcome,{" "}

                        <b>
                            {
                                loggedInUser.username
                            }
                        </b>

                    </p>

                </div>


                <div>

                    <button
                        style={
                            styles.wishlistButton
                        }
                        onClick={() =>
                            navigate(
                                "/wishlist"
                            )
                        }
                    >
                        ❤️ Wishlist
                        {wishlistIds.size > 0 &&
                            ` (${wishlistIds.size})`}
                    </button>

                    <button
                        style={
                            styles.navButton
                        }
                        onClick={() =>
                            navigate(
                                "/cart"
                            )
                        }
                    >
                        🛒 My Cart
                        {cartCount > 0 &&
                            ` (${cartCount})`}
                    </button>


                    <button
                        style={
                            styles.orderButton
                        }
                        onClick={() =>
                            navigate(
                                "/orders"
                            )
                        }
                    >
                        📦 My Orders
                    </button>


                    <button
                        style={
                            styles.logoutButton
                        }
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>

            </div>


            {/* MESSAGE */}

            {message && (

                <div style={styles.message}>
                    {message}
                </div>

            )}


            {/* PRODUCTS */}

            <h2>
                🛍️ Available Products
            </h2>


            {/* SEARCH */}

            <div
                style={
                    styles.searchBox
                }
            >

                <input
                    type="text"
                    placeholder="Search products..."
                    value={search}
                    onChange={(e) =>
                        setSearch(
                            e.target.value
                        )
                    }
                    style={styles.input}
                />


                <select
                    value={category}
                    onChange={(e) =>
                        setCategory(
                            e.target.value
                        )
                    }
                    style={styles.input}
                >

                    {categories.map(
                        cat => (

                            <option
                                key={cat}
                                value={cat}
                            >
                                {cat}
                            </option>

                        )
                    )}

                </select>

            </div>


            {/* PRODUCT GRID */}

            <div
                style={
                    styles.productGrid
                }
            >

                {filteredProducts.length ===
                0 ? (

                    <p>
                        No products found.
                    </p>

                ) : (

                    filteredProducts.map(
                        product => (

                            <div
                                key={
                                    product.id
                                }
                                style={
                                    styles.productCard
                                }
                            >

                                {/* IMAGE & WISHLIST BUTTON */}
                                <div style={styles.imageContainer}>
                                    {product.imageUrl ? (
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
                                    ) : (
                                        <div style={styles.imagePlaceholder}>🛍️</div>
                                    )}

                                    <button
                                        type="button"
                                        title={wishlistIds.has(product.id) ? "Remove from wishlist" : "Add to wishlist"}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleWishlist(product.id);
                                        }}
                                        style={{
                                            ...styles.wishlistIconBtn,
                                            color: wishlistIds.has(product.id) ? "#e11d48" : "#94a3b8",
                                            backgroundColor: wishlistIds.has(product.id) ? "#ffe4e6" : "rgba(255, 255, 255, 0.9)"
                                        }}
                                    >
                                        {wishlistIds.has(product.id) ? "❤️" : "🤍"}
                                    </button>
                                </div>

                                <h3>
                                    {
                                        product.name
                                    }
                                </h3>


                                <p>
                                    {
                                        product.description
                                    }
                                </p>


                                <p>
                                    <b>
                                        Category:
                                    </b>{" "}
                                    {
                                        product.category
                                    }
                                </p>


                                <p>
                                    <b>
                                        Price:
                                    </b>{" "}
                                    ₹
                                    {
                                        product.price
                                    }
                                </p>


                                <p>
                                    <b>
                                        Stock:
                                    </b>{" "}
                                    {
                                        product.stockQuantity
                                    }
                                </p>


                                {/* VARIANT SELECTORS (COLOR & SIZE) */}
                                {(() => {
                                    const catType = getCategoryType(product);
                                    const availableSizes = getAvailableSizes(catType);
                                    const defaultSize = catType === "CLOTHES" ? "M" : catType === "SHOE" ? "UK 8" : "Standard";
                                    const activeColor = selectedColor[product.id] || "Black";
                                    const activeSize = selectedSize[product.id] || defaultSize;

                                    return (
                                        <div style={styles.variantSection}>
                                            {/* COLOR SELECTION */}
                                            <div style={styles.variantGroup}>
                                                <label style={styles.variantLabel}>
                                                    🎨 <b>Color:</b> <span style={styles.selectedVariantBadge}>{activeColor}</span>
                                                </label>
                                                <div style={styles.colorPalette}>
                                                    {COLOR_PALETTE.map((col) => (
                                                        <button
                                                            key={col.name}
                                                            type="button"
                                                            title={col.name}
                                                            onClick={() =>
                                                                setSelectedColor((prev) => ({
                                                                    ...prev,
                                                                    [product.id]: col.name
                                                                }))
                                                            }
                                                            style={{
                                                                ...styles.colorCircle,
                                                                backgroundColor: col.hex,
                                                                border: col.border ? `2px solid ${col.border}` : "2px solid transparent",
                                                                outline: activeColor === col.name ? "3px solid #007bff" : "none",
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
                                                    📏 <b>Size ({catType === "CLOTHES" ? "Clothes" : catType === "SHOE" ? "Shoe UK" : "Standard"}):</b>{" "}
                                                    <span style={styles.selectedVariantBadge}>{activeSize}</span>
                                                </label>
                                                <div style={styles.sizePills}>
                                                    {availableSizes.map((sz) => (
                                                        <button
                                                            key={sz}
                                                            type="button"
                                                            onClick={() =>
                                                                setSelectedSize((prev) => ({
                                                                    ...prev,
                                                                    [product.id]: sz
                                                                }))
                                                            }
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
                                        </div>
                                    );
                                })()}

                                {/* ADD TO CART */}

                                <button
                                    style={
                                        styles.button
                                    }
                                    onClick={() =>
                                        addToCart(
                                            product
                                        )
                                    }
                                    disabled={
                                        product.stockQuantity <=
                                        0
                                    }
                                >

                                    {
                                        product.stockQuantity <=
                                        0
                                            ? "Out of Stock"
                                            : "🛒 Add to Cart"
                                    }

                                </button>


                                {/* REVIEWS */}

                                <hr />

                                <h3>
                                    ⭐ Customer Reviews
                                </h3>


                                {reviews[
                                    product.id
                                ] &&
                                reviews[
                                    product.id
                                ].length >
                                    0 ? (

                                    reviews[
                                        product.id
                                    ].map(
                                        review => (

                                            <div
                                                key={
                                                    review.id
                                                }
                                                style={
                                                    styles.reviewBox
                                                }
                                            >

                                                <p>

                                                    <b>
                                                        Rating:
                                                    </b>{" "}

                                                    {"⭐".repeat(
                                                        review.rating
                                                    )}

                                                </p>


                                                <p>
                                                    {
                                                        review.comment
                                                    }
                                                </p>


                                                {review.customerId ===
                                                    customerId && (

                                                    <div>

                                                        <button
                                                            style={
                                                                styles.smallButton
                                                            }
                                                            onClick={() =>
                                                                updateReview(
                                                                    review
                                                                )
                                                            }
                                                        >
                                                            Edit
                                                        </button>


                                                        <button
                                                            style={
                                                                styles.deleteButton
                                                            }
                                                            onClick={() =>
                                                                deleteReview(
                                                                    review
                                                                )
                                                            }
                                                        >
                                                            Delete
                                                        </button>

                                                    </div>

                                                )}

                                            </div>

                                        )
                                    )

                                ) : (

                                    <p>
                                        No reviews yet.
                                    </p>

                                )}


                                {/* REVIEW FORM */}

                                {canReview[
                                    product.id
                                ] ? (

                                    <div
                                        style={
                                            styles.reviewForm
                                        }
                                    >

                                        <h4>
                                            ⭐ Give your review
                                        </h4>


                                        <div>

                                            {[1,2,3,4,5].map(
                                                star => (

                                                    <button
                                                        key={
                                                            star
                                                        }
                                                        onClick={() =>
                                                            setReviewRating(
                                                                prev => ({
                                                                    ...prev,
                                                                    [product.id]:
                                                                        star
                                                                })
                                                            )
                                                        }
                                                        style={{
                                                            ...styles.starButton,
                                                            color:
                                                                star <=
                                                                (
                                                                    reviewRating[
                                                                        product.id
                                                                    ] ||
                                                                    0
                                                                )
                                                                    ? "gold"
                                                                    : "gray"
                                                        }}
                                                    >
                                                        ★
                                                    </button>

                                                )
                                            )}

                                        </div>


                                        <textarea
                                            placeholder="Write your review..."
                                            value={
                                                reviewComment[
                                                    product.id
                                                ] || ""
                                            }
                                            onChange={(e) =>
                                                setReviewComment(
                                                    prev => ({
                                                        ...prev,
                                                        [product.id]:
                                                            e.target.value
                                                    })
                                                )
                                            }
                                            style={
                                                styles.textarea
                                            }
                                        />


                                        <button
                                            style={
                                                styles.button
                                            }
                                            onClick={() =>
                                                submitReview(
                                                    product.id
                                                )
                                            }
                                        >
                                            Submit Review
                                        </button>


                                        {reviewMessage[
                                            product.id
                                        ] && (

                                            <p
                                                style={
                                                    styles.reviewMessage
                                                }
                                            >
                                                {
                                                    reviewMessage[
                                                        product.id
                                                    ]
                                                }
                                            </p>

                                        )}

                                    </div>

                                ) : (

                                    <div
                                        style={
                                            styles.reviewLocked
                                        }
                                    >

                                        🔒{" "}

                                        <b>
                                            Review locked
                                        </b>

                                        <p>
                                            Purchase and
                                            receive this
                                            product first
                                            to give a
                                            rating and
                                            review.
                                        </p>

                                    </div>

                                )}

                            </div>

                        )
                    )

                )}

            </div>

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


    wishlistButton: {
        backgroundColor: "#e11d48",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "5px",
        cursor: "pointer",
        margin: "5px",
        fontWeight: "bold"
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


    message: {
        padding: "10px",
        backgroundColor: "#fff3cd",
        borderRadius: "5px",
        marginBottom: "15px"
    },


    searchBox: {
        display: "flex",
        gap: "10px",
        marginBottom: "25px",
        flexWrap: "wrap"
    },


    input: {
        padding: "10px",
        borderRadius: "5px",
        border: "1px solid #ccc",
        minWidth: "200px"
    },


    productGrid: {
        display: "grid",
        gridTemplateColumns:
            "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "20px"
    },


    productCard: {
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        boxShadow:
            "0 2px 8px rgba(0,0,0,0.1)"
    },


    imageContainer: {
        position: "relative",
        width: "100%",
        height: "180px",
        backgroundColor: "#f1f5f9",
        borderRadius: "8px",
        overflow: "hidden",
        marginBottom: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
    },


    imagePlaceholder: {
        fontSize: "40px"
    },


    wishlistIconBtn: {
        position: "absolute",
        top: "8px",
        right: "8px",
        border: "none",
        width: "36px",
        height: "36px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "18px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
        transition: "all 0.2s ease"
    },


    productImage: {
        width: "100%",
        height: "100%",
        objectFit: "cover",
        borderRadius: "8px"
    },


    button: {
        backgroundColor: "#007bff",
        color: "white",
        border: "none",
        padding: "10px 15px",
        borderRadius: "5px",
        cursor: "pointer",
        marginTop: "8px"
    },


    reviewBox: {
        backgroundColor: "#f8f9fa",
        padding: "10px",
        marginTop: "10px",
        borderRadius: "5px",
        border: "1px solid #ddd"
    },


    reviewForm: {
        marginTop: "15px",
        padding: "10px",
        backgroundColor: "#fff",
        borderRadius: "5px"
    },


    reviewLocked: {
        marginTop: "15px",
        padding: "12px",
        backgroundColor: "#fff3cd",
        border:
            "1px solid #ffe69c",
        borderRadius: "5px",
        color: "#856404"
    },


    reviewMessage: {
        marginTop: "10px",
        fontWeight: "bold"
    },


    starButton: {
        background: "none",
        border: "none",
        fontSize: "28px",
        cursor: "pointer",
        padding: "2px"
    },


    textarea: {
        width: "100%",
        minHeight: "70px",
        marginTop: "10px",
        padding: "8px",
        borderRadius: "5px",
        border:
            "1px solid #ccc",
        boxSizing: "border-box"
    },


    smallButton: {
        padding: "6px 12px",
        margin: "5px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        backgroundColor: "#007bff",
        color: "white"
    },


    deleteButton: {
        padding: "6px 12px",
        margin: "5px",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        backgroundColor: "#dc3545",
        color: "white"
    },

    variantSection: {
        backgroundColor: "#f8f9fa",
        padding: "12px",
        borderRadius: "8px",
        marginTop: "12px",
        marginBottom: "12px",
        border: "1px solid #e9ecef"
    },

    variantGroup: {
        marginBottom: "10px"
    },

    variantLabel: {
        fontSize: "13px",
        color: "#495057",
        display: "block",
        marginBottom: "6px"
    },

    selectedVariantBadge: {
        backgroundColor: "#e3f2fd",
        color: "#0d47a1",
        padding: "2px 8px",
        borderRadius: "12px",
        fontWeight: "bold",
        fontSize: "12px",
        marginLeft: "4px"
    },

    colorPalette: {
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        alignItems: "center"
    },

    colorCircle: {
        width: "24px",
        height: "24px",
        borderRadius: "50%",
        cursor: "pointer",
        transition: "transform 0.15s ease, outline 0.15s ease",
        padding: 0
    },

    sizePills: {
        display: "flex",
        flexWrap: "wrap",
        gap: "6px"
    },

    sizePill: {
        padding: "5px 10px",
        borderRadius: "6px",
        border: "1px solid #ced4da",
        backgroundColor: "#ffffff",
        color: "#333333",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.15s ease"
    },

    sizePillActive: {
        backgroundColor: "#007bff",
        color: "#ffffff",
        borderColor: "#007bff",
        boxShadow: "0 2px 4px rgba(0,123,255,0.25)"
    }

};


export default CustomerDashboard;