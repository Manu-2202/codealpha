// App State & API Configuration
let backendChoice = localStorage.getItem('nexshop_backend_choice') || 'express';
let API_URL = backendChoice === 'django' ? 'http://localhost:8000/api' : 'http://localhost:5000/api';

let productsData = [];
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

const backendSelect = document.getElementById('backend-api-select');

// SVG Generator for Product Images (Fallback)
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
            <circle cx="25" cy="25" r="12" fill="${color}"/>
        </g>
    </svg>`;
}

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    backendSelect.value = backendChoice;
    checkUserSession();
    fetchProducts();
    updateCartUI();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    // Backend Select
    backendSelect.addEventListener('change', (e) => {
        localStorage.setItem('nexshop_backend_choice', e.target.value);
        window.location.reload();
    });

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
            localStorage.removeItem('nexshop_token');
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

// Fetch Products from Backend
async function fetchProducts() {
    try {
        const queryParams = new URLSearchParams();
        if (activeFilters.category !== 'all') {
            queryParams.append('category', activeFilters.category);
        }
        if (activeFilters.search) {
            queryParams.append('search', activeFilters.search);
        }

        const res = await fetch(`${API_URL}/products?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch products");
        productsData = await res.json();
        renderProducts();
    } catch (err) {
        console.error(err);
        productGrid.innerHTML = `
            <div class="empty-cart-message" style="grid-column: 1/-1; padding: 4rem 0;">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Could not connect to the backend server (${backendChoice === 'django' ? 'Django @ Port 8000' : 'Express @ Port 5000'}). Please make sure the server is running!</p>
            </div>
        `;
    }
}

// Render Product Grid
function renderProducts() {
    let filtered = [...productsData];

    // Frontend local search/filter as fallback and sorting
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

    productGrid.innerHTML = filtered.map(prod => {
        const id = prod.id || prod._id;
        const imgUrl = prod.imageUrl || generateProductSVG(prod.color || '#6366f1', id);
        return `
            <div class="product-card">
                <div class="product-image-container">
                    <img src="${imgUrl}" alt="${prod.name}">
                </div>
                <div class="product-category">${prod.category}</div>
                <h3 class="product-title" onclick="openDetails(${id})">${prod.name}</h3>
                <div class="product-rating">
                    ${generateStars(prod.rating)}
                    <span>(${prod.reviewsCount})</span>
                </div>
                <div class="product-footer">
                    <span class="product-price">$${Number(prod.price).toFixed(2)}</span>
                    <button class="btn btn-outline" onclick="addToCart(${id})">
                        <i class="fa-solid fa-cart-plus"></i> Add
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Helper Star Generator
function generateStars(rating) {
    let stars = '';
    const numRating = Number(rating) || 0;
    const fullStars = Math.floor(numRating);
    const halfStar = numRating % 1 >= 0.5 ? 1 : 0;
    const emptyStars = 5 - fullStars - halfStar;

    for (let i = 0; i < fullStars; i++) stars += '<i class="fa-solid fa-star"></i>';
    if (halfStar) stars += '<i class="fa-solid fa-star-half-stroke"></i>';
    for (let i = 0; i < emptyStars; i++) stars += '<i class="fa-regular fa-star"></i>';
    return stars;
}

// Shopping Cart Actions
function addToCart(productId) {
    const product = productsData.find(p => (p.id || p._id) == productId);
    if (!product) return;

    const cartItem = cart.find(item => (item.product.id || item.product._id) == productId);
    if (cartItem) {
        cartItem.quantity++;
    } else {
        cart.push({ product, quantity: 1 });
    }

    localStorage.setItem('nexshop_cart', JSON.stringify(cart));
    updateCartUI();
    cartDrawer.classList.add('open');
}

// Remove Cart Item
function removeFromCart(productId) {
    cart = cart.filter(item => (item.product.id || item.product._id) != productId);
    localStorage.setItem('nexshop_cart', JSON.stringify(cart));
    updateCartUI();
}

// Update Quantity
function updateQuantity(productId, newQty) {
    if (newQty <= 0) {
        removeFromCart(productId);
        return;
    }
    const cartItem = cart.find(item => (item.product.id || item.product._id) == productId);
    if (cartItem) {
        cartItem.quantity = newQty;
        localStorage.setItem('nexshop_cart', JSON.stringify(cart));
        updateCartUI();
    }
}

// Update Cart Drawer UI
function updateCartUI() {
    const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
    cartCountBadges.forEach(badge => badge.innerText = totalItemsCount);
    cartDrawerCount.innerText = totalItemsCount;

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
        cartItemsContainer.innerHTML = cart.map(item => {
            const id = item.product.id || item.product._id;
            const imgUrl = item.product.imageUrl || generateProductSVG(item.product.color || '#6366f1', id);
            return `
                <div class="cart-item">
                    <img src="${imgUrl}" alt="${item.product.name}">
                    <div class="cart-item-details">
                        <h4 class="cart-item-title">${item.product.name}</h4>
                        <span class="cart-item-price">$${(Number(item.product.price) * item.quantity).toFixed(2)}</span>
                        <div class="cart-item-qty">
                            <button class="qty-btn" onclick="updateQuantity(${id}, ${item.quantity - 1})">-</button>
                            <span>${item.quantity}</span>
                            <button class="qty-btn" onclick="updateQuantity(${id}, ${item.quantity + 1})">+</button>
                        </div>
                    </div>
                    <button class="cart-item-remove" onclick="removeFromCart(${id})">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
        }).join('');

        const subtotalVal = cart.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0);
        cartSubtotal.innerText = `$${subtotalVal.toFixed(2)}`;
        cartTotal.innerText = `$${subtotalVal.toFixed(2)}`;
    }
}

// Product Details Modal Load
function openDetails(productId) {
    const prod = productsData.find(p => (p.id || p._id) == productId);
    if (!prod) return;

    const id = prod.id || prod._id;
    const imgUrl = prod.imageUrl || generateProductSVG(prod.color || '#6366f1', id);

    detailsModalBody.innerHTML = `
        <div class="details-image">
            <img src="${imgUrl}" alt="${prod.name}">
        </div>
        <div class="details-info">
            <span class="product-category">${prod.category}</span>
            <h2>${prod.name}</h2>
            <div class="product-rating">
                ${generateStars(prod.rating)}
                <span>(${prod.reviewsCount} customer reviews)</span>
            </div>
            <div class="details-price">$${Number(prod.price).toFixed(2)}</div>
            <p class="details-desc">${prod.description}</p>
            
            <div class="details-meta">
                <div class="meta-item">Category: <strong>${prod.category.toUpperCase()}</strong></div>
                <div class="meta-item">Status: <strong style="color:#10b981;">In Stock (${prod.stock} left)</strong></div>
            </div>

            <button class="btn btn-primary btn-large btn-block" onclick="addToCartAndCloseDetails(${id})">
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

// Authentication Toggle
function toggleAuthTabs(tab) {
    if (tab === 'login') {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
    } else {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        registerForm.classList.add('active');
        loginForm.classList.remove('active');
    }
}

// Authentication Logic: Login
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Login failed");

        currentUser = data.user;
        localStorage.setItem('nexshop_user', JSON.stringify(currentUser));
        localStorage.setItem('nexshop_token', data.token);
        
        checkUserSession();
        authModal.classList.remove('open');
        loginForm.reset();
        alert(`Welcome back, ${currentUser.username}!`);
    } catch (err) {
        alert("Login failed: " + err.message);
    }
}

// Authentication Logic: Register
async function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value;
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Registration failed");

        currentUser = data.user;
        localStorage.setItem('nexshop_user', JSON.stringify(currentUser));
        localStorage.setItem('nexshop_token', data.token);

        checkUserSession();
        authModal.classList.remove('open');
        registerForm.reset();
        alert(`Account successfully created. Welcome, ${currentUser.username}!`);
    } catch (err) {
        alert("Registration failed: " + err.message);
    }
}

// Check User Session
function checkUserSession() {
    currentUser = JSON.parse(localStorage.getItem('nexshop_user'));
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
async function handleCheckout(e) {
    e.preventDefault();
    const token = localStorage.getItem('nexshop_token');
    if (!token) {
        alert("Please log in to complete checkout!");
        return;
    }

    const orderData = {
        items: cart.map(item => ({
            productId: item.product.id || item.product._id,
            quantity: item.quantity,
            price: item.product.price
        })),
        totalAmount: cart.reduce((total, item) => total + (Number(item.product.price) * item.quantity), 0),
        shippingAddress: document.getElementById('shipping-address').value
    };

    try {
        placeOrderBtn.disabled = true;
        placeOrderBtn.innerText = "Processing...";
        
        const res = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || "Checkout failed");
        }

        alert("Payment authorized! Order processed successfully. Thank you for shopping with NexShop.");
        
        // Reset Cart
        cart = [];
        localStorage.removeItem('nexshop_cart');
        updateCartUI();

        checkoutForm.reset();
        checkoutModal.classList.remove('open');
    } catch (err) {
        alert("Error during checkout: " + err.message);
    } finally {
        placeOrderBtn.disabled = false;
        placeOrderBtn.innerText = `Place Order (${cartTotal.innerText})`;
    }
}
