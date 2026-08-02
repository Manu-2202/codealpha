// Mock Products Data with Custom SVGs
const productsData = [
    {
        id: 1,
        name: "AeroPro Wireless Headphones",
        description: "Experience premium active noise cancelling sound with lightweight ergonomic ear cushions and up to 40 hours of battery life.",
        price: 249.99,
        category: "electronics",
        rating: 4.8,
        reviewsCount: 124,
        stock: 15,
        color: "#a855f7"
    },
    {
        id: 2,
        name: "Quantum Smart Watch",
        description: "Track your health metrics, sync workouts, and receive real-time notifications on a bright crystal clear OLED display.",
        price: 189.50,
        category: "wearables",
        rating: 4.6,
        reviewsCount: 89,
        stock: 8,
        color: "#ec4899"
    },
    {
        id: 3,
        name: "Ergonomic Mechanical Keyboard",
        description: "Hot-swappable switches, dynamic RGB backlighting, and a premium aluminum top frame for maximum typing efficiency and speed.",
        price: 129.99,
        category: "accessories",
        rating: 4.7,
        reviewsCount: 210,
        stock: 22,
        color: "#3b82f6"
    },
    {
        id: 4,
        name: "Ultra-Wide Curve Monitor 34\"",
        description: "Immersive 1500R curvature, 144Hz refresh rate, and 3440 x 1440 resolution for a cinema-grade gaming and productivity setup.",
        price: 599.99,
        category: "electronics",
        rating: 4.9,
        reviewsCount: 65,
        stock: 5,
        color: "#10b981"
    },
    {
        id: 5,
        name: "FitTrack Smart Scale",
        description: "Syncs weight, body fat %, muscle mass, and water content to your smartphone app automatically via Bluetooth.",
        price: 49.99,
        category: "wearables",
        rating: 4.2,
        reviewsCount: 312,
        stock: 40,
        color: "#f59e0b"
    },
    {
        id: 6,
        name: "USB-C Multi-Port Hub",
        description: "8-in-1 expansion dock featuring HDMI 4K, SD card slots, USB 3.0 ports, and 100W Power Delivery pass-through.",
        price: 59.99,
        category: "accessories",
        rating: 4.5,
        reviewsCount: 178,
        stock: 18,
        color: "#ef4444"
    }
];

// SVG Generator for Product Images
function generateProductSVG(color, id) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
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
            <path d="M15 15h20v20H15z" fill="none"/>
            <circle cx="25" cy="25" r="12" fill="${color}"/>
        </g>
    </svg>`;
}

// App State
let cart = JSON.parse(localStorage.getItem('nexshop_cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('nexshop_user')) || null;
let activeFilters = {
    category: 'all',
    search: '',
    sort: 'default'
};

// DOM Elements
const productGrid = document.getElementById('product-grid');
const categoryFilter = document.getElementById('category-filter');
const sortFilter = document.getElementById('sort-filter');
const searchInput = document.getElementById('search-input');

const cartBtn = document.getElementById('cart-btn');
const cartDrawer = document.getElementById('cart-drawer');
const closeCart = document.getElementById('close-cart');
const cartItemsContainer = document.getElementById('cart-items-container');
const cartCountBadges = document.querySelectorAll('.cart-count');
const cartDrawerCount = document.getElementById('cart-drawer-count');
const cartSubtotal = document.getElementById('cart-subtotal');
const cartTotal = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');

const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const userGreeting = document.getElementById('user-greeting');
const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');

const detailsModal = document.getElementById('details-modal');
const detailsModalBody = document.getElementById('details-modal-body');

const checkoutModal = document.getElementById('checkout-modal');
const checkoutForm = document.getElementById('checkout-form');
const placeOrderBtn = document.getElementById('place-order-btn');

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();
    checkUserSession();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Filters
    categoryFilter.addEventListener('change', (e) => {
        activeFilters.category = e.target.value;
        renderProducts();
    });
    sortFilter.addEventListener('change', (e) => {
        activeFilters.sort = e.target.value;
        renderProducts();
    });
    searchInput.addEventListener('input', (e) => {
        activeFilters.search = e.target.value.toLowerCase();
        renderProducts();
    });

    // Cart Drawer Toggle
    cartBtn.addEventListener('click', () => cartDrawer.classList.add('open'));
    closeCart.addEventListener('click', () => cartDrawer.classList.remove('open'));
    cartDrawer.querySelector('.drawer-overlay').addEventListener('click', () => cartDrawer.classList.remove('open'));

    // Modals Close Event
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(element => {
        element.addEventListener('click', (e) => {
            e.target.closest('.modal').classList.remove('open');
        });
    });

    // Auth Button Action
    authBtn.addEventListener('click', () => {
        if (currentUser) {
            // Logout
            currentUser = null;
            localStorage.removeItem('nexshop_user');
            checkUserSession();
            alert("Logged out successfully.");
        } else {
            authModal.classList.add('open');
        }
    });

    // Auth Tabs Toggle
    tabLogin.addEventListener('click', () => toggleAuthTabs('login'));
    tabRegister.addEventListener('click', () => toggleAuthTabs('register'));

    // Auth Forms Submission
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Checkout Modal Action
    checkoutBtn.addEventListener('click', () => {
        if (!currentUser) {
            alert("Please log in to complete your purchase!");
            authModal.classList.add('open');
            cartDrawer.classList.remove('open');
            return;
        }
        checkoutModal.classList.add('open');
        placeOrderBtn.innerText = `Place Order (${cartTotal.innerText})`;
    });

    checkoutForm.addEventListener('submit', handleCheckout);
}

// Render Product Grid
function renderProducts() {
    let filtered = productsData.filter(prod => {
        const matchesCategory = activeFilters.category === 'all' || prod.category === activeFilters.category;
        const matchesSearch = prod.name.toLowerCase().includes(activeFilters.search) || 
                              prod.description.toLowerCase().includes(activeFilters.search);
        return matchesCategory && matchesSearch;
    });

    // Sorting
    if (activeFilters.sort === 'price-low') {
        filtered.sort((a, b) => a.price - b.price);
    } else if (activeFilters.sort === 'price-high') {
        filtered.sort((a, b) => b.price - a.price);
    } else if (activeFilters.sort === 'rating') {
        filtered.sort((a, b) => b.rating - a.rating);
    }

    if (filtered.length === 0) {
        productGrid.innerHTML = `
            <div class="empty-cart-message" style="grid-column: 1/-1; padding: 4rem 0;">
                <i class="fa-solid fa-face-frown"></i>
                <p>No products found matching your criteria.</p>
            </div>
        `;
        return;
    }

    productGrid.innerHTML = filtered.map(prod => `
        <div class="product-card">
            <div class="product-image-container">
                <img src="${generateProductSVG(prod.color, prod.id)}" alt="${prod.name}">
            </div>
            <div class="product-category">${prod.category}</div>
            <h3 class="product-title" onclick="openDetails(${prod.id})">${prod.name}</h3>
            <div class="product-rating">
                ${generateStars(prod.rating)}
                <span>(${prod.reviewsCount})</span>
            </div>
            <div class="product-footer">
                <span class="product-price">$${prod.price.toFixed(2)}</span>
                <button class="btn btn-outline" onclick="addToCart(${prod.id})">
                    <i class="fa-solid fa-cart-plus"></i> Add
                </button>
            </div>
        </div>
    `).join('');
}

// Helper Star Generator
function generateStars(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    for (let i = 0; i < fullStars; i++) stars += '<i class="fa-solid fa-star"></i>';
    if (halfStar) stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    for (let i = 0; i < emptyStars; i++) stars += '<i class="fa-regular fa-star"></i>';
    return stars;
}

// Shopping Cart Actions
function addToCart(productId) {
    const product = productsData.find(p => p.id === productId);
    if (!product) return;

    const cartItem = cart.find(item => item.product.id === productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ product, quantity: 1 });
    }

    localStorage.setItem('nexshop_cart', JSON.stringify(cart));
    updateCartUI();
    
    // Toast notification or open drawer directly
    cartDrawer.classList.add('open');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.product.id !== productId);
    localStorage.setItem('nexshop_cart', JSON.stringify(cart));
    updateCartUI();
}

function updateQuantity(productId, newQty) {
    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }
    const cartItem = cart.find(item => item.product.id === productId);
    if (cartItem) {
        cartItem.quantity = newQty;
        localStorage.setItem('nexshop_cart', JSON.stringify(cart));
        updateCartUI();
    }
}

function updateCartUI() {
    // Update Badge & Counter counts
    const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountBadges.forEach(badge => badge.innerText = totalItemsCount);
    cartDrawerCount.innerText = totalItemsCount;

    // Render cart items
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-message">
                <i class="fa-solid fa-basket-shopping"></i>
                <p>Your cart is empty. Start shopping!</p>
            </div>
        `;
        checkoutBtn.disabled = true;
        cartSubtotal.innerText = "$0.00";
        cartTotal.innerText = "$0.00";
    } else {
        checkoutBtn.disabled = false;
        cartItemsContainer.innerHTML = cart.map(item => `
            <div class="cart-item">
                <img src="${generateProductSVG(item.product.color, item.product.id)}" alt="${item.product.name}">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.product.name}</h4>
                    <span class="cart-item-price">$${(item.product.price * item.quantity).toFixed(2)}</span>
                    <div class="cart-item-qty">
                        <button class="qty-btn" onclick="updateQuantity(${item.product.id}, ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="updateQuantity(${item.product.id}, ${item.quantity + 1})">+</button>
                    </div>
                </div>
                <button class="cart-item-remove" onclick="removeFromCart(${item.product.id})">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `).join('');

        // Calculate Subtotals
        const subtotalVal = cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
        cartSubtotal.innerText = `$${subtotalVal.toFixed(2)}`;
        cartTotal.innerText = `$${subtotalVal.toFixed(2)}`;
    }
}

// Product Details Modal Load
function openDetails(productId) {
    const prod = productsData.find(p => p.id === productId);
    if (!prod) return;

    detailsModalBody.innerHTML = `
        <div class="details-image">
            <img src="${generateProductSVG(prod.color, prod.id)}" alt="${prod.name}">
        </div>
        <div class="details-info">
            <span class="product-category">${prod.category}</span>
            <h2>${prod.name}</h2>
            <div class="product-rating">
                ${generateStars(prod.rating)}
                <span>(${prod.reviewsCount} customer reviews)</span>
            </div>
            <div class="details-price">$${prod.price.toFixed(2)}</div>
            <p class="details-desc">${prod.description}</p>
            
            <div class="details-meta">
                <div class="meta-item">Category: <strong>${prod.category.toUpperCase()}</strong></div>
                <div class="meta-item">Status: <strong style="color:#10b981;">In Stock (${prod.stock} left)</strong></div>
            </div>

            <button class="btn btn-primary btn-large btn-block" onclick="addToCartAndCloseDetails(${prod.id})">
                <i class="fa-solid fa-cart-shopping"></i> Add to Shopping Cart
            </button>
        </div>
    `;

    detailsModal.classList.add('open');
}

function addToCartAndCloseDetails(productId) {
    addToCart(productId);
    detailsModal.classList.remove('open');
}

// Authentication Logic
function toggleAuthTabs(tab) {
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.add('active');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const name = email.split('@')[0];

    currentUser = { username: name, email: email };
    localStorage.setItem('nexshop_user', JSON.stringify(currentUser));
    checkUserSession();
    authModal.classList.remove('open');
    loginForm.reset();
    alert(`Welcome back, ${name}!`);
}

function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;

    currentUser = { username, email };
    localStorage.setItem('nexshop_user', JSON.stringify(currentUser));
    checkUserSession();
    authModal.classList.remove('open');
    registerForm.reset();
    alert(`Account successfully created. Welcome, ${username}!`);
}

function checkUserSession() {
    if (currentUser) {
        userGreeting.innerText = `Hi, ${currentUser.username}`;
        authBtn.querySelector('span').innerText = 'Logout';
        authBtn.classList.remove('btn-primary');
        authBtn.classList.add('btn-outline');
    } else {
        userGreeting.innerText = '';
        authBtn.querySelector('span').innerText = 'Login';
        authBtn.classList.add('btn-primary');
        authBtn.classList.remove('btn-outline');
    }
}

// Checkout Submit
function handleCheckout(e) {
    e.preventDefault();
    alert("Payment authorized! Order processed successfully. Thank you for shopping with NexShop.");
    
    // Reset Cart
    cart = [];
    localStorage.removeItem('nexshop_cart');
    updateCartUI();

    checkoutForm.reset();
    checkoutModal.classList.remove('open');
}
