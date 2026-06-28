// ============ بيانات المنتجات (محملة من localStorage أو افتراضية) ============
function getProducts() {
    const saved = localStorage.getItem('fibno_products');
    if (saved) return JSON.parse(saved);
    
    // منتجات افتراضية
    const defaultProducts = [
        {
            id: 1,
            name: "هاتف سامسونج جالاكسي",
            price: 45000,
            originalPrice: 52000,
            category: "electronics",
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23e3f2fd' width='250' height='250'/%3E%3Ctext fill='%231976d2' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='80'%3E📱%3C/text%3E%3C/svg%3E",
            description: "هاتف ذكي متطور مع كاميرا عالية الدقة"
        },
        {
            id: 2,
            name: "سماعات بلوتوث",
            price: 3500,
            originalPrice: 5000,
            category: "electronics",
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23f3e5f5' width='250' height='250'/%3E%3Ctext fill='%237b1fa2' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='80'%3E🎧%3C/text%3E%3C/svg%3E",
            description: "سماعات لاسلكية عالية الجودة"
        },
        {
            id: 3,
            name: "كتاب تعلم البرمجة",
            price: 2500,
            category: "books",
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23fff3e0' width='250' height='250'/%3E%3Ctext fill='%23f57c00' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='80'%3E📚%3C/text%3E%3C/svg%3E",
            description: "دليل شامل لتعلم البرمجة للمبتدئين"
        },
        {
            id: 4,
            name: "قميص جزائري تقليدي",
            price: 4500,
            originalPrice: 6000,
            category: "clothing",
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23e8f5e9' width='250' height='250'/%3E%3Ctext fill='%23388e3c' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='80'%3E👕%3C/text%3E%3C/svg%3E",
            description: "قميص تقليدي جزائري أصلي"
        },
        {
            id: 5,
            name: "ساعة ذكية",
            price: 12000,
            originalPrice: 15000,
            category: "electronics",
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23fce4ec' width='250' height='250'/%3E%3Ctext fill='%23c2185b' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='80'%3E⌚%3C/text%3E%3C/svg%3E",
            description: "ساعة ذكية متعددة الوظائف"
        },
        {
            id: 6,
            name: "حقيبة ظهر عصرية",
            price: 3800,
            category: "clothing",
            image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23e0f2f1' width='250' height='250'/%3E%3Ctext fill='%2300796b' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='80'%3E🎒%3C/text%3E%3C/svg%3E",
            description: "حقيبة متينة وعملية للاستخدام اليومي"
        }
    ];
    
    localStorage.setItem('fibno_products', JSON.stringify(defaultProducts));
    return defaultProducts;
}

// ============ المتغيرات ============
const products = getProducts();
let cart = JSON.parse(localStorage.getItem('fibno_cart')) || [];
const coupons = { 'WELCOME10': 10, 'SAVE20': 20, 'RAMADAN': 15 };

// ============ حفظ السلة ============
function saveCart() {
    localStorage.setItem('fibno_cart', JSON.stringify(cart));
    updateCartCount();
}

function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    document.querySelectorAll('#cart-count').forEach(el => el.textContent = count);
}

// ============ إضافة إلى السلة ============
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    saveCart();
    showNotification('✅ تمت إضافة المنتج إلى السلة!');
    // تأثير إضافة للسلة
    animateAddToCart(productId);
}

function animateAddToCart(productId) {
    const buttons = document.querySelectorAll(`button[onclick="addToCart(${productId})"]`);
    buttons.forEach(btn => {
        btn.textContent = '✓ تمت الإضافة';
        btn.style.background = '#00b894';
        setTimeout(() => {
            btn.textContent = 'أضف إلى السلة';
            btn.style.background = '';
        }, 1500);
    });
}

// ============ إزالة من السلة ============
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
    const discount = product.originalPrice 
        ? Math.round((1 - product.price / product.originalPrice) * 100) 
        : 0;
    
    return `
        <div class="product-card">
            ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
            <img src="${product.image}" alt="${product.name}" class="product-image">
            <div class="product-info">
                <span class="product-category">${getCategoryName(product.category)}</span>
                <h3 class="product-title">${product.name}</h3>
                <p class="product-desc">${product.description || ''}</p>
                <div class="product-price">
                    <span class="current-price">${formatPrice(product.price)}</span>
                    ${product.originalPrice ? `<span class="original-price">${formatPrice(product.originalPrice)}</span>` : ''}
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">
                    🛒 أضف إلى السلة
                </button>
            </div>
        </div>
    `;
}

function getCategoryName(cat) {
    const names = {
        electronics: 'إلكترونيات',
        clothing: 'ملابس',
        books: 'كتب',
        home: 'منزل'
    };
    return names[cat] || cat;
}

function formatPrice(price) {
    return price.toLocaleString('ar-DZ') + ' دج';
}

function renderProducts(containerId, productsList) {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = productsList.map(createProductCard).join('');
    }
}

// ============ عرض السلة ============
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
                <p class="item-price">${formatPrice(item.price)}</p>
                <div class="quantity-control">
                    <button onclick="updateQuantity(${item.id}, -1)">➖</button>
                    <span class="quantity">${item.quantity}</span>
                    <button onclick="updateQuantity(${item.id}, 1)">➕</button>
                </div>
            </div>
            <div class="cart-item-total">
                <p>${formatPrice(item.price * item.quantity)}</p>
                <button class="remove-item" onclick="removeFromCart(${item.id})">🗑️</button>
            </div>
        </div>
    `).join('');
    
    updateTotals();
}

function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 500;
    
    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shipping').textContent = shipping === 0 ? 'مجاني 🎉' : formatPrice(shipping);
    document.getElementById('total').textContent = formatPrice(subtotal + shipping);
}

// ============ الكوبونات ============
function applyCoupon() {
    const couponCode = document.getElementById('coupon-input').value.toUpperCase();
    if (coupons[couponCode]) {
        const discountPercent = coupons[couponCode];
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discountAmount = Math.round((subtotal * discountPercent) / 100);
        
        document.getElementById('discount').textContent = `-${formatPrice(discountAmount)}`;
        
        const shipping = subtotal > 5000 ? 0 : 500;
        document.getElementById('total').textContent = formatPrice(subtotal + shipping - discountAmount);
        
        showNotification(`🎉 تم تطبيق الخصم! وفرت ${discountPercent}%`);
    } else {
        showNotification('❌ كود الخصم غير صالح', 'error');
    }
}

// ============ إتمام الشراء ============
function checkout() {
    if (cart.length === 0) {
        showNotification('❌ السلة فارغة!', 'error');
        return;
    }
    document.getElementById('checkout-modal').style.display = 'block';
}

function closeModal() {
    document.getElementById('checkout-modal').style.display = 'none';
}

// التعامل مع نموذج الطلب
document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // جمع بيانات العميل
            const orderData = {
                name: document.getElementById('customer-name').value,
                phone: document.getElementById('customer-phone').value,
                email: document.getElementById('customer-email').value,
                wilaya: document.getElementById('customer-wilaya').value,
                address: document.getElementById('customer-address').value,
                notes: document.getElementById('customer-notes').value,
                payment: document.querySelector('input[name="payment"]:checked').value,
                products: cart,
                total: calculateTotal(),
                date: new Date().toLocaleString('ar-DZ')
            };
            
            // حفظ الطلب
            saveOrder(orderData);
            
            // إرسال إلى واتساب
            sendToWhatsApp(orderData);
            
            // تنظيف السلة
            cart = [];
            saveCart();
            closeModal();
            renderCart();
            
            showNotification('✅ تم تأكيد الطلب! سيتم التواصل معك قريباً');
        });
    }
});

function calculateTotal() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shipping = subtotal > 5000 ? 0 : 500;
    return subtotal + shipping;
}

function saveOrder(orderData) {
    const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
    orderData.id = Date.now();
    orderData.status = 'pending';
    orders.unshift(orderData);
    localStorage.setItem('fibno_orders', JSON.stringify(orders));
}

function sendToWhatsApp(orderData) {
    const settings = JSON.parse(localStorage.getItem('fibno_settings')) || {};
    const whatsappNumber = settings.whatsapp || '213550000000';
    
    // تحضير رسالة الواتساب
    let productsList = orderData.products.map(item => 
        `• ${item.name} ×${item.quantity} - ${formatPrice(item.price * item.quantity)}`
    ).join('\n');
    
    const message = `🛍️ *طلب جديد من FibNo*\n\n` +
                   `👤 *العميل:* ${orderData.name}\n` +
                   `📱 *الهاتف:* ${orderData.phone}\n` +
                   `📍 *الولاية:* ${orderData.wilaya}\n` +
                   `🏠 *العنوان:* ${orderData.address}\n` +
                   `💳 *الدفع:* ${orderData.payment === 'cash' ? 'عند الاستلام' : 'بطاقة'}\n\n` +
                   `📦 *المنتجات:*\n${productsList}\n\n` +
                   `💰 *الإجمالي:* ${formatPrice(orderData.total)}\n` +
                   `📅 *التاريخ:* ${orderData.date}\n\n` +
                   `📝 *ملاحظات:* ${orderData.notes || 'لا يوجد'}`;
    
    // فتح واتساب
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

// ============ الإشعارات ============
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? '#e74c3c' : '#00b894';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============ التصفية والبحث ============
function setupFilters() {
    const categoryFilter = document.getElementById('category-filter');
    const priceFilter = document.getElementById('price-filter');
    const searchInput = document.getElementById('search-input');
    const sortSelect = document.getElementById('sort-select');
    
    if (!categoryFilter) return;
    
    function applyFilters() {
        let filtered = [...products];
        
        // تصفية الفئة
        const category = categoryFilter.value;
        if (category !== 'all') {
            filtered = filtered.filter(p => p.category === category);
        }
        
        // تصفية السعر
        const maxPrice = parseInt(priceFilter.value);
        filtered = filtered.filter(p => p.price <= maxPrice);
        document.getElementById('price-value').textContent = formatPrice(maxPrice);
        
        // البحث
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) || 
                (p.description && p.description.toLowerCase().includes(searchTerm))
            );
        }
        
        // الترتيب
        const sortBy = sortSelect.value;
        if (sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        }
        
        renderProducts('all-products', filtered);
    }
    
    categoryFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('input', applyFilters);
    searchInput.addEventListener('input', applyFilters);
    sortSelect.addEventListener('change', applyFilters);
}

function resetFilters() {
    document.getElementById('category-filter').value = 'all';
    document.getElementById('price-filter').value = 50000;
    document.getElementById('price-value').textContent = formatPrice(50000);
    document.getElementById('search-input').value = '';
    document.getElementById('sort-select').value = 'default';
    renderProducts('all-products', products);
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
    
    // الصفحة الرئيسية
    if (document.getElementById('featured-products')) {
        renderProducts('featured-products', products.slice(0, 4));
    }
    
    // صفحة المنتجات
    if (document.getElementById('all-products')) {
        renderProducts('all-products', products);
        setupFilters();
    }
    
    // صفحة السلة
    if (document.getElementById('cart-items')) {
        renderCart();
    }
    
    // إغلاق المودال عند النقر خارجه
    window.onclick = (event) => {
        const modal = document.getElementById('checkout-modal');
        if (event.target === modal) {
            closeModal();
        }
    };
});
