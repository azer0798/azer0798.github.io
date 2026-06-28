// ============ بيانات المنتجات ============
const products = [
    {
        id: 1,
        name: "هاتف ذكي",
        price: 599,
        originalPrice: 799,
        category: "electronics",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23ddd' width='250' height='250'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='24'%3E📱%3C/text%3E%3C/svg%3E",
        description: "هاتف ذكي متطور"
    },
    {
        id: 2,
        name: "سماعات لاسلكية",
        price: 199,
        originalPrice: 299,
        category: "electronics",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23ddd' width='250' height='250'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='24'%3E🎧%3C/text%3E%3C/svg%3E",
        description: "سماعات بلوتوث عالية الجودة"
    },
    {
        id: 3,
        name: "كتاب تعلم البرمجة",
        price: 49,
        category: "books",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23ddd' width='250' height='250'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='24'%3E📚%3C/text%3E%3C/svg%3E",
        description: "دليل شامل لتعلم البرمجة"
    },
    {
        id: 4,
        name: "قميص عصري",
        price: 89,
        originalPrice: 129,
        category: "clothing",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23ddd' width='250' height='250'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='24'%3E👕%3C/text%3E%3C/svg%3E",
        description: "قميص قطني مريح"
    },
    {
        id: 5,
        name: "ساعة ذكية",
        price: 349,
        originalPrice: 449,
        category: "electronics",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23ddd' width='250' height='250'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='24'%3E⌚%3C/text%3E%3C/svg%3E",
        description: "ساعة ذكية متعددة الوظائف"
    },
    {
        id: 6,
        name: "حقيبة ظهر",
        price: 129,
        category: "clothing",
        image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23ddd' width='250' height='250'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='24'%3E🎒%3C/text%3E%3C/svg%3E",
        description: "حقيبة متينة وعملية"
    }
];

// ============ إدارة السلة ============
let cart = JSON.parse(localStorage.getItem('cart')) || [];
const coupons = { 'WELCOME10': 10, 'SAVE20': 20, 'SUMMER30': 30 };

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    showNotification('تمت إضافة المنتج إلى السلة!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    renderCart();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
            renderCart();
        }
    }
}

// ============ عرض المنتجات ============
function createProductCard(product) {
    return `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <div class="product-price">
                    ${product.price} ريال
                    ${product.originalPrice ? `<span class="product-original-price">${product.originalPrice} ريال</span>` : ''}
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    أضف إلى السلة
                </button>
            </div>
        </div>
    `;
}

function renderProducts(containerId, productsList) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = productsList.map(createProductCard).join('');
    }
}

// ============ صفحة السلة ============
function renderCart() {
    const cartItems = document.getElementById('cart-items');
    const cartEmpty = document.getElementById('cart-empty');
    const cartSummary = document.getElementById('cart-summary');
    
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '';
        cartEmpty.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }
    
    cartEmpty.style.display = 'none';
    cartSummary.style.display = 'block';
    
    cartItems.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h3>${item.name}</h3>
                <p>${item.price} ريال</p>
                <div class="quantity-control">
                    <button onclick="updateQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="remove-item" onclick="removeFromCart(${item.id})">حذف</button>
        </div>
    `).join('');
    
    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 500 ? 0 : 30;
    const discount = 0; // سيتم تحديثه مع الكوبون
    
    document.getElementById('subtotal').textContent = subtotal;
    document.getElementById('shipping').textContent = shipping;
    document.getElementById('total').textContent = subtotal + shipping - discount;
}

// ============ الكوبونات ============
function applyCoupon() {
    const couponCode = document.getElementById('coupon-input').value.toUpperCase();
    if (coupons[couponCode]) {
        const discount = coupons[couponCode];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = (subtotal * discount) / 100;
        
        document.getElementById('discount').textContent = discountAmount;
        updateTotals();
        showNotification(`تم تطبيق كود الخصم! خصم ${discount}%`);
    } else {
        showNotification('كود الخصم غير صالح!', 'error');
    }
}

// ============ الدفع ============
function checkout() {
    if (cart.length === 0) {
        showNotification('السلة فارغة!', 'error');
        return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>إتمام الشراء</h2>
            <form id="checkout-form">
                <div class="form-group">
                    <label>الاسم الكامل</label>
                    <input type="text" required placeholder="أدخل اسمك">
                </div>
                <div class="form-group">
                    <label>البريد الإلكتروني</label>
                    <input type="email" required placeholder="example@email.com">
                </div>
                <div class="form-group">
                    <label>رقم الهاتف</label>
                    <input type="tel" required placeholder="05xxxxxxxx">
                </div>
                <div class="form-group">
                    <label>العنوان</label>
                    <input type="text" required placeholder="المدينة، الشارع">
                </div>
                <button type="submit" class="checkout-btn">تأكيد الطلب</button>
                <button type="button" class="cta-button" onclick="this.closest('.modal').remove()" 
                        style="background: #999; margin-top: 10px;">إلغاء</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    document.getElementById('checkout-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // محاكاة عملية الدفع
        showNotification('جارٍ معالجة الطلب...');
        
        setTimeout(() => {
            modal.remove();
            cart = [];
            saveCart();
            showNotification('تم تأكيد الطلب بنجاح! شكراً لتسوقك معنا 🎉');
            renderCart();
        }, 2000);
    });
}

// ============ الإشعارات ============
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? '#e74c3c' : '#27ae60';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => notification.remove(), 3000);
}

// ============ البحث والتصفية ============
function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const searchInput = document.getElementById('search-input');
    
    if (!categoryFilter) return;
    
    function applyFilters() {
        let filtered = [...products];
        
        const category = categoryFilter.value;
        if (category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }
        
        const maxPrice = priceFilter.value;
        filtered = filtered.filter(p => p.price <= maxPrice);
        document.getElementById('price-value').textContent = maxPrice + ' ريال';
        
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        renderProducts('all-products', filtered);
    }
    
    categoryFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('input', applyFilters);
    searchInput.addEventListener('input', applyFilters);
}

// ============ القائمة المتجاوبة ============
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }
}

// ============ التهيئة ============
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    setupMobileMenu();
    
    // تهيئة الصفحة الرئيسية
    if (document.getElementById('featured-products')) {
        renderProducts('featured-products', products.slice(0, 4));
    }
    
    // تهيئة صفحة المنتجات
    if (document.getElementById('all-products')) {
        renderProducts('all-products', products);
        setupFilters();
    }
    
    // تهيئة صفحة السلة
    if (document.getElementById('cart-items')) {
        renderCart();
    }
});
