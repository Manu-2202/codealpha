import React, { useState, useEffect } from 'react';

// API base URL
const API_URL = 'http://localhost:5000/api';

// Offline fallback mock products (with custom SVGs)
const mockProducts = [
    {
        _id: "1",
        name: "AeroPro Wireless Headphones",
        description: "Experience premium active noise cancelling sound with lightweight ergonomic ear cushions and up to 40 hours of battery life.",
        price: 19999.00,
        category: "electronics",
        rating: 4.8,
        reviewsCount: 124,
        stock: 15,
        color: "#a855f7",
        imageUrl: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600&auto=format&fit=crop&q=80",
        discount: 10
    },
    {
        _id: "2",
        name: "Quantum Smart Watch",
        description: "Track your health metrics, sync workouts, and receive real-time notifications on a bright crystal clear OLED display.",
        price: 15999.00,
        category: "wearables",
        rating: 4.6,
        reviewsCount: 89,
        stock: 8,
        color: "#ec4899",
        imageUrl: "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&auto=format&fit=crop&q=80",
        discount: 15
    },
    {
        _id: "3",
        name: "Ergonomic Mechanical Keyboard",
        description: "Hot-swappable switches, dynamic RGB backlighting, and a premium aluminum top frame for maximum typing efficiency and speed.",
        price: 9999.00,
        category: "accessories",
        rating: 4.7,
        reviewsCount: 210,
        stock: 22,
        color: "#3b82f6",
        imageUrl: "https://images.unsplash.com/photo-1618384887929-16ec33faf9c1?w=600&auto=format&fit=crop&q=80",
        discount: 0
    },
    {
        _id: "4",
        name: "Ultra-Wide Curve Monitor 34\"",
        description: "Immersive 1500R curvature, 144Hz refresh rate, and 3440 x 1440 resolution for a cinema-grade gaming and productivity setup.",
        price: 49999.00,
        category: "electronics",
        rating: 4.9,
        reviewsCount: 65,
        stock: 5,
        color: "#10b981",
        imageUrl: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600&auto=format&fit=crop&q=80",
        discount: 20
    },
    {
        _id: "5",
        name: "FitTrack Smart Scale",
        description: "Syncs weight, body fat %, muscle mass, and water content to your smartphone app automatically via Bluetooth.",
        price: 3999.00,
        category: "wearables",
        rating: 4.2,
        reviewsCount: 312,
        stock: 40,
        color: "#f59e0b",
        imageUrl: "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=600&auto=format&fit=crop&q=80",
        discount: 5
    },
    {
        _id: "6",
        name: "USB-C Multi-Port Hub",
        description: "8-in-1 expansion dock featuring HDMI 4K, SD card slots, USB 3.0 ports, and 100W Power Delivery pass-through.",
        price: 4999.00,
        category: "accessories",
        rating: 4.5,
        reviewsCount: 178,
        stock: 18,
        color: "#ef4444",
        imageUrl: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=600&auto=format&fit=crop&q=80",
        discount: 0
    }
];

function generateProductSVG(color, id) {
    const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <defs>
            <linearGradient id="grad${id}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:${color};stop-opacity:0.2" />
                <stop offset="100%" style="stop-color:${color};stop-opacity:0.8" />
            </linearGradient>
            <filter id="shadow">
                <feDropShadow dx="0" dy="8" stdDeviation="6" flood-color="${color}" flood-opacity="0.3"/>
            </filter>
        </defs>
        <rect width="200" height="200" rx="20" fill="url(#grad${id})" />
        <circle cx="100" cy="100" r="50" fill="none" stroke="white" stroke-width="2" stroke-dasharray="6,6" opacity="0.3"/>
        <g filter="url(#shadow)" transform="translate(75, 75)">
            <rect width="50" height="50" rx="10" fill="white" opacity="0.9"/>
            <circle cx="25" cy="25" r="12" fill="${color}"/>
        </g>
    </svg>`;
    return `data:image/svg+xml;base64,${window.btoa(unescape(encodeURIComponent(svgStr)))}`;
}

export default function App() {
    // App Navigation View
    const [activeView, setActiveView] = useState('shop'); // 'shop' | 'admin' | 'profile' | 'contact'

    // App State
    const [products, setProducts] = useState(mockProducts);
    const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('nexshop_cart')) || []);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('nexshop_user')) || null);
    const [orders, setOrders] = useState(() => JSON.parse(localStorage.getItem('nexshop_orders')) || []);
    const [isOffline, setIsOffline] = useState(false);
    
    // Filters & UI Control
    const [category, setCategory] = useState('all');
    const [sort, setSort] = useState('default');
    const [search, setSearch] = useState('');
    const [isCartOpen, setIsCartOpen] = useState(false);
    
    // Modals Control
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isAuthOpen, setIsAuthOpen] = useState(false);
    const [authTab, setAuthTab] = useState('login');
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

    // Auth Form State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');

    // Checkout Form State
    const [shippingName, setShippingName] = useState('');
    const [shippingAddress, setShippingAddress] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cardExpiry, setCardExpiry] = useState('');
    const [cardCvc, setCardCvc] = useState('');

    // Admin Creation Form State
    const [adminName, setAdminName] = useState('');
    const [adminDesc, setAdminDesc] = useState('');
    const [adminPrice, setAdminPrice] = useState('');
    const [adminDiscount, setAdminDiscount] = useState('0');
    const [adminCategory, setAdminCategory] = useState('electronics');
    const [adminStock, setAdminStock] = useState('10');
    const [adminColor, setAdminColor] = useState('#6366f1');
    const [adminImageUrl, setAdminImageUrl] = useState('');

    // Contact Form & FAQ Accordion State
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMsg, setContactMsg] = useState('');
    const [activeFaq, setActiveFaq] = useState(null);

    // Auto Login Guest to keep database online
    useEffect(() => {
        const autoLoginGuest = async () => {
            if (user) return;
            try {
                let res = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: 'guest_user@gmail.com', password: 'guest123' })
                });
                let data = await res.json();
                if (res.ok) {
                    setUser(data);
                    localStorage.setItem('nexshop_user', JSON.stringify(data));
                    return;
                }
                
                res = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: 'Guest Admin', email: 'guest_user@gmail.com', password: 'guest123' })
                });
                data = await res.json();
                if (res.ok) {
                    setUser(data);
                    localStorage.setItem('nexshop_user', JSON.stringify(data));
                }
            } catch (err) {
                console.error("Auto login failed", err);
            }
        };
        autoLoginGuest();
    }, [user]);

    // Load products and user orders from Backend or Fallback
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch(`${API_URL}/products?category=${category}&search=${search}`);
                if (!res.ok) throw new Error('API server down');
                const data = await res.json();
                setProducts(data);
                setIsOffline(false);
            } catch (err) {
                setIsOffline(true);
                // Filter mock locally
                let filtered = mockProducts.filter(prod => {
                    const matchesCategory = category === 'all' || prod.category === category;
                    const matchesSearch = prod.name.toLowerCase().includes(search.toLowerCase()) ||
                                          prod.description.toLowerCase().includes(search.toLowerCase());
                    return matchesCategory && matchesSearch;
                });
                setProducts(filtered);
            }
        };
        fetchProducts();
    }, [category, search, activeView]);

    useEffect(() => {
        const fetchOrders = async () => {
            if (!user) return;
            try {
                const res = await fetch(`${API_URL}/orders/myorders`, {
                    headers: { 'Authorization': `Bearer ${user.token}` }
                });
                if (!res.ok) throw new Error();
                const data = await res.json();
                setOrders(data);
            } catch (err) {
                // fall back to local storage cached orders
            }
        };
        fetchOrders();
    }, [user, activeView]);

    // Handle LocalStorage caching
    useEffect(() => {
        localStorage.setItem('nexshop_cart', JSON.stringify(cart));
    }, [cart]);

    useEffect(() => {
        localStorage.setItem('nexshop_orders', JSON.stringify(orders));
    }, [orders]);

    // Price Discount Math Helper
    const getSalePrice = (price, discount) => {
        return price * (1 - (discount || 0) / 100);
    };

    // Cart Actions
    const addToCart = (product) => {
        setCart(prevCart => {
            const existing = prevCart.find(item => item.product._id === product._id);
            if (existing) {
                return prevCart.map(item => 
                    item.product._id === product._id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { product, quantity: 1 }];
        });
        setIsCartOpen(true);
    };

    const updateQuantity = (id, change) => {
        setCart(prevCart => {
            return prevCart.map(item => {
                if (item.product._id === id) {
                    const newQty = item.quantity + change;
                    return newQty > 0 ? { ...item, quantity: newQty } : null;
                }
                return item;
            }).filter(Boolean);
        });
    };

    const removeFromCart = (id) => {
        setCart(prevCart => prevCart.filter(item => item.product._id !== id));
    };

    // Calculate Cart Totals with Discounts
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const subtotal = cart.reduce((total, item) => total + (getSalePrice(item.product.price, item.product.discount) * item.quantity), 0);

    // Sorting Logic
    const sortedProducts = [...products].sort((a, b) => {
        const finalA = getSalePrice(a.price, a.discount);
        const finalB = getSalePrice(b.price, b.discount);
        if (sort === 'price-low') return finalA - finalB;
        if (sort === 'price-high') return finalB - finalA;
        if (sort === 'rating') return b.rating - a.rating;
        return 0;
    });

    // Auth Actions
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            
            setUser(data);
            localStorage.setItem('nexshop_user', JSON.stringify(data));
            setIsAuthOpen(false);
            setEmail('');
            setPassword('');
        } catch (err) {
            // Simulated login fallback
            const username = email.split('@')[0];
            const dummyUser = { username, email, token: 'offline-jwt-token' };
            setUser(dummyUser);
            localStorage.setItem('nexshop_user', JSON.stringify(dummyUser));
            setIsAuthOpen(false);
            setEmail('');
            setPassword('');
            alert('Offline Mode: Simulated logging in for ' + username);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: regUsername, email: regEmail, password: regPassword })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setUser(data);
            localStorage.setItem('nexshop_user', JSON.stringify(data));
            setIsAuthOpen(false);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
        } catch (err) {
            const dummyUser = { username: regUsername, email: regEmail, token: 'offline-jwt-token' };
            setUser(dummyUser);
            localStorage.setItem('nexshop_user', JSON.stringify(dummyUser));
            setIsAuthOpen(false);
            setRegUsername('');
            setRegEmail('');
            setRegPassword('');
            alert('Offline Mode: Simulated registration completion.');
        }
    };

    const handleLogout = () => {
        setUser(null);
        localStorage.removeItem('nexshop_user');
        setActiveView('shop');
        alert('Logged out.');
    };

    // Checkout Submission
    const handleCheckoutSubmit = async (e) => {
        e.preventDefault();
        
        const orderPayload = {
            orderItems: cart.map(item => ({
                name: item.product.name,
                qty: item.quantity,
                price: getSalePrice(item.product.price, item.product.discount),
                color: item.product.color,
                product: item.product._id
            })),
            shippingAddress,
            totalPrice: subtotal
        };

        try {
            const res = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(orderPayload)
            });
            if (!res.ok) throw new Error('Checkout API failed');
            const data = await res.json();
            setOrders([data, ...orders]);
            alert('Order placed successfully via Server!');
        } catch (err) {
            const simulatedOrder = {
                _id: 'order_' + Date.now(),
                createdAt: new Date().toISOString(),
                orderItems: orderPayload.orderItems,
                shippingAddress: shippingAddress,
                totalPrice: subtotal,
                status: 'Processing'
            };
            setOrders([simulatedOrder, ...orders]);
            alert('Offline Mode: Successfully placed simulated order!');
        }

        setCart([]);
        setIsCheckoutOpen(false);
        setShippingName('');
        setShippingAddress('');
        setCardNumber('');
        setCardExpiry('');
        setCardCvc('');
    };

    // Admin Add Product Submission
    const handleAddProduct = async (e) => {
        e.preventDefault();
        if (!adminName.trim() || !adminPrice.trim()) return;

        const productPayload = {
            name: adminName,
            description: adminDesc,
            price: Number(adminPrice),
            discount: Number(adminDiscount),
            category: adminCategory,
            stock: Number(adminStock),
            color: adminColor,
            imageUrl: adminImageUrl
        };

        try {
            const res = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': user ? `Bearer ${user.token}` : ''
                },
                body: JSON.stringify(productPayload)
            });
            if (!res.ok) throw new Error('API create failed');
            const data = await res.json();
            setProducts([data, ...products]);
            alert('Product created successfully on Server!');
        } catch (err) {
            // Offline create simulated
            const simulatedProduct = {
                _id: 'local_prod_' + Date.now(),
                ...productPayload,
                rating: 5.0,
                reviewsCount: 1
            };
            setProducts([simulatedProduct, ...products]);
            // Update local mock array as well
            mockProducts.unshift(simulatedProduct);
            alert('Offline Mode: Simulated creating product locally!');
        }

        // Reset fields
        setAdminName('');
        setAdminDesc('');
        setAdminPrice('');
        setAdminDiscount('0');
        setAdminStock('10');
        setAdminImageUrl('');
    };

    // Admin Delete Product
    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;

        try {
            const res = await fetch(`${API_URL}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': user ? `Bearer ${user.token}` : '' }
            });
            if (!res.ok) throw new Error();
            setProducts(products.filter(p => p._id !== id));
            alert('Product deleted successfully from Server.');
        } catch (err) {
            setProducts(products.filter(p => p._id !== id));
            // Also filter from local mock list
            const index = mockProducts.findIndex(p => p._id === id);
            if (index !== -1) mockProducts.splice(index, 1);
            alert('Offline Mode: Simulated deleting product locally.');
        }
    };

    // Contact Submission
    const handleContactSubmit = (e) => {
        e.preventDefault();
        alert(`Thank you, ${contactName}! Your message regarding "${contactMsg.substring(0, 15)}..." has been simulated. We will reply to ${contactEmail} soon.`);
        setContactName('');
        setContactEmail('');
        setContactMsg('');
    };

    const renderStars = (rating) => {
        let stars = [];
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        for (let i = 0; i < fullStars; i++) {
            stars.push(<i key={`f-${i}`} className="fa-solid fa-star"></i>);
        }
        if (halfStar) {
            stars.push(<i key="h" className="fa-solid fa-star-half-stroke"></i>);
        }
        const empty = 5 - stars.length;
        for (let i = 0; i < empty; i++) {
            stars.push(<i key={`e-${i}`} className="fa-regular fa-star"></i>);
        }
        return stars;
    };

    return (
        <div>
            {/* Header */}
            <header className="header">
                <div className="header-container">
                    <a href="#" className="logo" onClick={() => { setActiveView('shop'); }}>
                        <span className="gradient-text">Nex</span>Shop
                    </a>
                    
                    <nav className="nav-links">
                        <button className={`nav-link ${activeView === 'shop' ? 'active' : ''}`} onClick={() => setActiveView('shop')}>Shop</button>
                        <button className={`nav-link ${activeView === 'contact' ? 'active' : ''}`} onClick={() => setActiveView('contact')}>Support & FAQs</button>
                        
                        <button className={`nav-link ${activeView === 'profile' ? 'active' : ''}`} onClick={() => setActiveView('profile')}>My Orders</button>
                        <button className={`nav-link ${activeView === 'admin' ? 'active' : ''}`} onClick={() => setActiveView('admin')}>Admin Panel</button>
                        
                        {user ? (
                            <>
                                <span className="user-greeting">Hi, {user.username}</span>
                                <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
                            </>
                        ) : (
                            <button className="btn btn-primary" onClick={() => { setAuthTab('login'); setIsAuthOpen(true); }}>
                                <i className="fa-regular fa-user"></i> Login
                            </button>
                        )}

                        <button className="btn btn-primary cart-trigger" onClick={() => setIsCartOpen(true)}>
                            <i className="fa-solid fa-bag-shopping"></i>
                            <span className="cart-count">{cartCount}</span>
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main content switches */}
            <main className="main-container" style={{ marginTop: '85px' }}>
                
                {/* 1. SHOP FRONT VIEW */}
                {activeView === 'shop' && (
                    <>
                        {/* Hero */}
                        <section className="hero-section">
                            <div className="hero-content">
                                <span className="badge">Summer Collection 2026</span>
                                <h1>Experience Future <br/><span className="gradient-text">Innovation Today</span></h1>
                                <p>Curated premium tech and lifestyle products designed to elevate your everyday experience with style and speed.</p>
                                <div className="hero-actions">
                                    <a href="#products-section" className="btn btn-primary btn-large">Explore Shop</a>
                                    <button className="btn btn-outline btn-large" onClick={() => setActiveView('contact')}>Get Help</button>
                                </div>
                            </div>
                            <div className="hero-visual">
                                <div className="glass-card decorative-card">
                                    <div className="glow-orb"></div>
                                    <i className="fa-solid fa-laptop-code floating-icon"></i>
                                    <h3>Smart Home Hub v2</h3>
                                    <p className="price"><span style={{ textDecoration: 'line-through', opacity: 0.6, fontSize: '0.9rem', marginRight: '6px' }}>₹30,000</span>₹24,900.00</p>
                                    <span className="tag">15% OFF</span>
                                </div>
                            </div>
                        </section>

                        {/* Shop Grid */}
                        <section id="products-section" className="shop-section">
                            <div className="section-header">
                                <h2>Our <span className="gradient-text">Featured Products</span></h2>
                                <div className="search-bar-container" style={{ width: '300px', display: 'block' }}>
                                    <input 
                                        type="text" 
                                        placeholder="Search products..." 
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ width: '100%', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', outline: 'none' }}
                                    />
                                </div>
                                <div className="filters">
                                    <select 
                                        className="select-input"
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                    >
                                        <option value="all">All Categories</option>
                                        <option value="electronics">Electronics</option>
                                        <option value="wearables">Wearables</option>
                                        <option value="accessories">Accessories</option>
                                    </select>
                                    <select 
                                        className="select-input"
                                        value={sort}
                                        onChange={(e) => setSort(e.target.value)}
                                    >
                                        <option value="default">Sort By</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                        <option value="rating">Top Rated</option>
                                    </select>
                                </div>
                            </div>

                            <div className="product-grid">
                                {sortedProducts.map(prod => {
                                    const discounted = prod.discount > 0;
                                    const finalPrice = getSalePrice(prod.price, prod.discount);
                                    
                                    return (
                                        <div className="product-card" key={prod._id}>
                                            {discounted && (
                                                <span className="badge" style={{ position: 'absolute', top: '15px', left: '15px', zIndex: 2, background: 'var(--secondary-color)', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                                    {prod.discount}% OFF
                                                </span>
                                            )}
                                            <div className="product-image-container">
                                                <img src={prod.imageUrl || generateProductSVG(prod.color, prod._id)} alt={prod.name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                                            </div>
                                            <div className="product-category">{prod.category}</div>
                                            <h3 className="product-title" onClick={() => setSelectedProduct(prod)}>{prod.name}</h3>
                                            <div className="product-rating">
                                                {renderStars(prod.rating)}
                                                <span>({prod.reviewsCount})</span>
                                            </div>
                                            <div className="product-footer">
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    {discounted && (
                                                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                            ₹{prod.price.toFixed(2)}
                                                        </span>
                                                    )}
                                                    <span className="product-price">₹{finalPrice.toFixed(2)}</span>
                                                </div>
                                                <button className="btn btn-outline" onClick={() => addToCart(prod)}>
                                                    <i className="fa-solid fa-cart-plus"></i> Add
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}

                {/* 2. ADMIN PANEL VIEW */}
                {activeView === 'admin' && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Admin Product Management</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '2rem' }}>
                            {/* Add Product Form */}
                            <div className="glass-card">
                                <h3 style={{ marginBottom: '1.2rem', fontSize: '1.2rem' }}>Add New Product</h3>
                                <form onSubmit={handleAddProduct}>
                                    <div className="form-group">
                                        <label>Product Name</label>
                                        <input type="text" required placeholder="e.g. RGB mouse pad" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Description</label>
                                        <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', padding: '0.5rem', outline: 'none' }} rows="3" placeholder="Description details..." value={adminDesc} onChange={(e) => setAdminDesc(e.target.value)} />
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Price (₹)</label>
                                            <input type="number" step="0.01" required placeholder="e.g. 29.99" value={adminPrice} onChange={(e) => setAdminPrice(e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label>Discount (%)</label>
                                            <input type="number" required min="0" max="99" value={adminDiscount} onChange={(e) => setAdminDiscount(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Category</label>
                                            <select style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', padding: '0.65rem 0.5rem', outline: 'none' }} value={adminCategory} onChange={(e) => setAdminCategory(e.target.value)}>
                                                <option value="electronics">Electronics</option>
                                                <option value="wearables">Wearables</option>
                                                <option value="accessories">Accessories</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Stock</label>
                                            <input type="number" required value={adminStock} onChange={(e) => setAdminStock(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label>Product Color theme (Hex)</label>
                                        <input type="text" placeholder="#6366f1" value={adminColor} onChange={(e) => setAdminColor(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Product Photo Image URL</label>
                                        <input type="text" placeholder="https://..." value={adminImageUrl} onChange={(e) => setAdminImageUrl(e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '0.5rem' }}>Create Product Listing</button>
                                </form>
                            </div>

                            {/* Active Products List */}
                            <div className="glass-card" style={{ overflowX: 'auto' }}>
                                <h3 style={{ marginBottom: '1.2rem', fontSize: '1.2rem' }}>Active Product Catalog ({products.length})</h3>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                            <th style={{ padding: '10px' }}>Name</th>
                                            <th style={{ padding: '10px' }}>Category</th>
                                            <th style={{ padding: '10px' }}>Price</th>
                                            <th style={{ padding: '10px' }}>Discount</th>
                                            <th style={{ padding: '10px' }}>Stock</th>
                                            <th style={{ padding: '10px', textAlign: 'center' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {products.map(p => (
                                            <tr key={p._id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '12px 10px', fontWeight: 600 }}>{p.name}</td>
                                                <td style={{ padding: '12px 10px', textTransform: 'capitalize' }}>{p.category}</td>
                                                <td style={{ padding: '12px 10px' }}>₹{p.price.toFixed(2)}</td>
                                                <td style={{ padding: '12px 10px', color: p.discount > 0 ? 'var(--secondary-color)' : 'white', fontWeight: p.discount > 0 ? 600 : 400 }}>{p.discount}%</td>
                                                <td style={{ padding: '12px 10px' }}>{p.stock} units</td>
                                                <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                                    <button className="btn btn-outline" style={{ padding: '4px 8px', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.2)' }} onClick={() => handleDeleteProduct(p._id)}>
                                                        <i className="fa-solid fa-trash-can"></i> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. PROFILE & ORDER HISTORY VIEW */}
                {activeView === 'profile' && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>User Dashboard & Order History</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '2rem' }}>
                            {/* Profile Card */}
                            <div className="glass-card" style={{ height: 'fit-content', textAlign: 'center' }}>
                                <div className="avatar" style={{ margin: '0 auto 1.5rem', width: '80px', height: '80px', fontSize: '2.5rem' }}>
                                    {(user ? user.username : 'Guest Admin').substring(0, 2).toUpperCase()}
                                </div>
                                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.4rem' }}>{user ? user.username : 'Guest Admin'}</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{user ? user.email : 'admin@gmail.com'}</p>
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.2rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                                    Member Status: <strong style={{ color: 'var(--primary-color)' }}>Standard Client</strong>
                                </div>
                            </div>

                            {/* Orders Table */}
                            <div className="glass-card">
                                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem' }}>Past Orders ({orders.length})</h3>
                                {orders.length === 0 ? (
                                    <div className="empty-cart-message" style={{ padding: '3rem 0' }}>
                                        <i className="fa-solid fa-box-open" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'block' }}></i>
                                        <p>You haven't placed any orders yet. Visit the Shop to check out!</p>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                        {orders.map(o => (
                                            <div key={o._id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', background: 'rgba(255,255,255,0.01)', overflow: 'hidden' }}>
                                                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px 15px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                                    <span>Order ID: <strong>{o._id}</strong></span>
                                                    <span>Date: <strong>{new Date(o.createdAt).toLocaleDateString()}</strong></span>
                                                    <span style={{ color: '#10b981', fontWeight: 600 }}>{o.status}</span>
                                                </div>
                                                <div style={{ padding: '15px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                                        {o.orderItems.map((item, index) => (
                                                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                                                <span>{item.name} <span style={{ color: 'var(--text-muted)' }}>x{item.qty}</span></span>
                                                                <strong>₹{(item.price * item.qty).toFixed(2)}</strong>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                                                        <span>Total Paid</span>
                                                        <span style={{ color: 'var(--secondary-color)', fontSize: '1.1rem' }}>₹{o.totalPrice.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. SUPPORT & FAQS VIEW */}
                {activeView === 'contact' && (
                    <div style={{ textAlign: 'left' }}>
                        <h2 style={{ fontSize: '2rem', marginBottom: '1.5rem' }}>Client Support Center</h2>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
                            {/* Contact Form */}
                            <div className="glass-card">
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '0.4rem' }}>Submit a Support Ticket</h3>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Need assistance with shipping, payment or order details? Send us a message.</p>
                                
                                <form onSubmit={handleContactSubmit}>
                                    <div className="form-group">
                                        <label>Your Name</label>
                                        <input type="text" required placeholder="John Doe" value={contactName} onChange={(e) => setContactName(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" required placeholder="john@example.com" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                                    </div>
                                    <div className="form-group">
                                        <label>Message Content</label>
                                        <textarea style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-color)', borderRadius: '10px', color: 'white', padding: '0.5rem', outline: 'none' }} rows="5" required placeholder="Describe your request..." value={contactMsg} onChange={(e) => setContactMsg(e.target.value)} />
                                    </div>
                                    <button type="submit" className="btn btn-primary btn-block">Send Support Ticket</button>
                                </form>
                            </div>

                            {/* FAQ Accordion */}
                            <div>
                                <h3 style={{ fontSize: '1.3rem', marginBottom: '1.2rem' }}>Frequently Asked Questions</h3>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {[
                                        { q: "How do product discount percentages apply?", a: "Discounts are applied directly to the product's base price. When a product has a discount badge, the base price is crossed out, and the active sale price is used in cart and checkout calculations." },
                                        { q: "How can I access the Admin Panel dashboard?", a: "Once logged in, an 'Admin Panel' button appears in the navigation header, allowing you to list, add, and delete products dynamically." },
                                        { q: "Is payment processing real or simulated?", a: "This application is currently in development mode. Payment processing and checkouts are simulated securely and logged directly into the MERN database." },
                                        { q: "Can I run the application offline?", a: "Yes! If the Node/Express backend server goes offline, the frontend React application automatically activates 'Simulated Client Mode', allowing full testing via in-memory local storage." }
                                    ].map((faq, idx) => (
                                        <div key={idx} className="glass-card" style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 600 }}>
                                                <span>{faq.q}</span>
                                                <i className={`fa-solid ${activeFaq === idx ? 'fa-angle-up' : 'fa-angle-down'}`} style={{ color: 'var(--primary-color)' }}></i>
                                            </div>
                                            {activeFaq === idx && (
                                                <p style={{ marginTop: '0.8rem', color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5', borderTop: '1px solid var(--border-color)', paddingTop: '0.8rem' }}>
                                                    {faq.a}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="footer">
                <p>&copy; 2026 NexShop. All rights reserved. Designed for CodeAlpha MERN Internship.</p>
            </footer>

            {/* Shopping Cart Drawer */}
            <div className={`drawer ${isCartOpen ? 'open' : ''}`}>
                <div className="drawer-overlay" onClick={() => setIsCartOpen(false)}></div>
                <div className="drawer-content">
                    <div className="drawer-header">
                        <h3>Your Cart ({cartCount})</h3>
                        <button className="close-btn" onClick={() => setIsCartOpen(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="drawer-body">
                        {cart.length === 0 ? (
                            <div className="empty-cart-message">
                                <i className="fa-solid fa-basket-shopping"></i>
                                <p>Your cart is empty. Start shopping!</p>
                            </div>
                        ) : (
                            cart.map(item => {
                                const salePrice = getSalePrice(item.product.price, item.product.discount);
                                return (
                                    <div className="cart-item" key={item.product._id}>
                                        <img src={item.product.imageUrl || generateProductSVG(item.product.color, item.product._id)} alt={item.product.name} style={{ objectFit: 'cover' }} />
                                        <div className="cart-item-details">
                                            <h4 className="cart-item-title">{item.product.name}</h4>
                                            <span className="cart-item-price">₹{(salePrice * item.quantity).toFixed(2)}</span>
                                            <div className="cart-item-qty">
                                                <button className="qty-btn" onClick={() => updateQuantity(item.product._id, -1)}>-</button>
                                                <span>{item.quantity}</span>
                                                <button className="qty-btn" onClick={() => updateQuantity(item.product._id, 1)}>+</button>
                                            </div>
                                        </div>
                                        <button className="cart-item-remove" onClick={() => removeFromCart(item.product._id)}>
                                            <i className="fa-solid fa-trash-can"></i>
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="drawer-footer">
                        <div className="cart-summary">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Shipping</span>
                                <span className="free-text">Free</span>
                            </div>
                            <hr style={{ border: 'none', borderBottom: '1px solid var(--border-color)', margin: '12px 0' }} />
                            <div className="summary-row total-row">
                                <span>Total</span>
                                <span>₹{subtotal.toFixed(2)}</span>
                            </div>
                        </div>
                        <button 
                            className="btn btn-primary btn-block" 
                            disabled={cart.length === 0}
                            onClick={() => {
                                if (!user) {
                                    alert('Please login to place an order.');
                                    setIsCartOpen(false);
                                    setAuthTab('login');
                                    setIsAuthOpen(true);
                                } else {
                                    setIsCartOpen(false);
                                    setIsCheckoutOpen(true);
                                }
                            }}
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                </div>
            </div>

            {/* Product Details Modal */}
            <div className={`modal ${selectedProduct ? 'open' : ''}`}>
                <div className="modal-overlay" onClick={() => setSelectedProduct(null)}></div>
                <div className="modal-content modal-large">
                    <button className="close-btn" onClick={() => setSelectedProduct(null)}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    {selectedProduct && (
                        <div className="details-grid">
                            <div className="details-image">
                                <img src={selectedProduct.imageUrl || generateProductSVG(selectedProduct.color, selectedProduct._id)} alt={selectedProduct.name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                            </div>
                            <div className="details-info">
                                <span className="product-category">{selectedProduct.category}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '0.4rem', marginBottom: '0.8rem' }}>
                                    <h2>{selectedProduct.name}</h2>
                                    {selectedProduct.discount > 0 && (
                                        <span className="badge" style={{ background: 'var(--secondary-color)', color: 'white', border: 'none', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                                            {selectedProduct.discount}% OFF
                                        </span>
                                    )}
                                </div>
                                <div className="product-rating">
                                    {renderStars(selectedProduct.rating)}
                                    <span>({selectedProduct.reviewsCount} customer reviews)</span>
                                </div>
                                <div className="details-price">
                                    {selectedProduct.discount > 0 && (
                                        <span style={{ textDecoration: 'line-through', color: 'var(--text-muted)', fontSize: '1.2rem', marginRight: '10px' }}>
                                            ₹{selectedProduct.price.toFixed(2)}
                                        </span>
                                    )}
                                    <span>₹{getSalePrice(selectedProduct.price, selectedProduct.discount).toFixed(2)}</span>
                                </div>
                                <p className="details-desc">{selectedProduct.description}</p>
                                
                                <div className="details-meta">
                                    <div className="meta-item">Category: <strong>{selectedProduct.category.toUpperCase()}</strong></div>
                                    <div className="meta-item">Status: <strong style={{ color: '#10b981' }}>In Stock ({selectedProduct.stock} left)</strong></div>
                                </div>

                                <button 
                                    className="btn btn-primary btn-large btn-block" 
                                    onClick={() => { addToCart(selectedProduct); setSelectedProduct(null); }}
                                >
                                    <i className="fa-solid fa-cart-shopping"></i> Add to Shopping Cart
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Auth Modal */}
            <div className={`modal ${isAuthOpen ? 'open' : ''}`}>
                <div className="modal-overlay" onClick={() => setIsAuthOpen(false)}></div>
                <div className="modal-content auth-box">
                    <button className="close-btn" onClick={() => setIsAuthOpen(false)}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    
                    <div className="auth-tabs">
                        <button className={`auth-tab ${authTab === 'login' ? 'active' : ''}`} onClick={() => setAuthTab('login')}>Login</button>
                        <button className={`auth-tab ${authTab === 'register' ? 'active' : ''}`} onClick={() => setAuthTab('register')}>Register</button>
                    </div>

                    {authTab === 'login' ? (
                        <form onSubmit={handleLoginSubmit} className="auth-form active">
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" required placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" required placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">Log In</button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegisterSubmit} className="auth-form active">
                            <div className="form-group">
                                <label>Username</label>
                                <input type="text" required placeholder="johndoe" value={regUsername} onChange={(e) => setRegUsername(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" required placeholder="name@example.com" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Password</label>
                                <input type="password" required placeholder="Create password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary btn-block">Create Account</button>
                        </form>
                    )}
                </div>
            </div>

            {/* Checkout Modal */}
            <div className={`modal ${isCheckoutOpen ? 'open' : ''}`}>
                <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}></div>
                <div className="modal-content auth-box">
                    <button className="close-btn" onClick={() => setIsCheckoutOpen(false)}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                    <h2 style={{ marginBottom: '1.5rem', textAlign: 'left' }}>Checkout Details</h2>
                    <form onSubmit={handleCheckoutSubmit}>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" required placeholder="John Doe" value={shippingName} onChange={(e) => setShippingName(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Shipping Address</label>
                            <input type="text" required placeholder="123 Main St, New York, NY" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>Card Number</label>
                            <input type="text" required placeholder="1234 5678 1234 5678" pattern="\d{16}" title="16-digit card number" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Expiry</label>
                                <input type="text" required placeholder="MM/YY" pattern="\d{2}/\d{2}" title="MM/YY format" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>CVC</label>
                                <input type="password" required placeholder="123" pattern="\d{3}" title="3-digit CVC" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-block" style={{ marginTop: '1.5rem' }}>Place Order (₹{subtotal.toFixed(2)})</button>
                    </form>
                </div>
            </div>
        </div>
    );
}
