// ============ المصادقة ============
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

let isLoggedIn = sessionStorage.getItem('fibno_admin_logged') === 'true';

// ============ تهيئة لوحة التحكم ============
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn) {
        showDashboard();
        loadDashboardData();
    }
    
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            
            if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
                isLoggedIn = true;
                sessionStorage.setItem('fibno_admin_logged', 'true');
                showDashboard();
                loadDashboardData();
                showNotification('✅ تم تسجيل الدخول بنجاح');
            } else {
                showNotification('❌ اسم المستخدم أو كلمة المرور خطأ', 'error');
            }
        });
    }
    
    // نموذج الإعدادات
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        loadSettings();
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveSettings();
        });
    }
    
    // نموذج المنتج
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveProduct();
        });
    }
});

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
}

// ============ تحميل البيانات ============
function loadDashboardData() {
    // تحميل المنتجات
    const products = JSON.parse(localStorage.getItem('fibno_products')) || [];
    document.getElementById('total-products').textContent = products.length;
    renderAdminProducts(products);
    
    // تحميل الطلبات
    const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
    document.getElementById('total-orders').textContent = orders.length;
    document.getElementById('pending-orders').textContent = orders.filter(o => o.status === 'pending').length;
    
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString('ar-DZ') + ' دج';
    
    renderAdminOrders(orders);
}

// ============ التبويبات ============
function switchTab(tabName) {
    // تحديث الأزرار
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // تحديث المحتوى
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
}

// ============ إدارة المنتجات ============
function renderAdminProducts(products) {
    const container = document.getElementById('admin-products-list');
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="admin-product-item">
            <img src="${product.image}" alt="${product.name}" class="admin-product-img">
            <div class="admin-product-info">
                <h4>${product.name}</h4>
                <p>${product.price.toLocaleString('ar-DZ')} دج | ${getCategoryName(product.category)}</p>
            </div>
            <div class="admin-product-actions">
                <button onclick="editProduct(${product.id})" class="edit-btn">✏️ تعديل</button>
                <button onclick="deleteProduct(${product.id})" class="delete-btn">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function showAddProduct() {
    document.getElementById('modal-title').textContent = 'إضافة منتج جديد';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('product-modal').style.display = 'block';
}

function editProduct(productId) {
    const products = JSON.parse(localStorage.getItem('fibno_products')) || [];
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('modal-title').textContent = 'تعديل المنتج';
    document.getElementById('product-id').value = product.id;
    document.getElementById('product-name').value = product.name;
    document.getElementById('product-price').value = product.price;
    document.getElementById('product-original-price').value = product.originalPrice || '';
    document.getElementById('product-category').value = product.category;
    document.getElementById('product-description').value = product.description || '';
    document.getElementById('product-image').value = product.image || '';
    
    document.getElementById('product-modal').style.display = 'block';
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

function saveProduct() {
    const products = JSON.parse(localStorage.getItem('fibno_products')) || [];
    const productId = document.getElementById('product-id').value;
    
    const productData = {
        id: productId ? parseInt(productId) : Date.now(),
        name: document.getElementById('product-name').value,
        price: parseInt(document.getElementById('product-price').value),
        originalPrice: document.getElementById('product-original-price').value 
            ? parseInt(document.getElementById('product-original-price').value) 
            : null,
        category: document.getElementById('product-category').value,
        description: document.getElementById('product-description').value,
        image: document.getElementById('product-image').value || 
            `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='250' height='250'%3E%3Crect fill='%23ddd' width='250' height='250'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='80'%3E📦%3C/text%3E%3C/svg%3E`
    };
    
    if (productId) {
        const index = products.findIndex(p => p.id === parseInt(productId));
        products[index] = productData;
    } else {
        products.push(productData);
    }
    
    localStorage.setItem('fibno_products', JSON.stringify(products));
    closeProductModal();
    loadDashboardData();
    showNotification('✅ تم حفظ المنتج بنجاح');
}

function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    let products = JSON.parse(localStorage.getItem('fibno_products')) || [];
    products = products.filter(p => p.id !== productId);
    localStorage.setItem('fibno_products', JSON.stringify(products));
    loadDashboardData();
    showNotification('🗑️ تم حذف المنتج');
}

// ============ إدارة الطلبات ============
function renderAdminOrders(orders) {
    const container = document.getElementById('admin-orders-list');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد طلبات حالياً</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span class="order-id">طلب #${order.id}</span>
                <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-details">
                <p><strong>العميل:</strong> ${order.name}</p>
                <p><strong>الهاتف:</strong> ${order.phone}</p>
                <p><strong>الولاية:</strong> ${order.wilaya}</p>
                <p><strong>الإجمالي:</strong> ${(order.total || 0).toLocaleString('ar-DZ')} دج</p>
                <p><strong>التاريخ:</strong> ${order.date}</p>
            </div>
            <div class="order-products">
                ${order.products.map(p => `
                    <span>${p.name} ×${p.quantity}</span>
                `).join(' | ')}
            </div>
            <div class="order-actions">
                <select onchange="updateOrderStatus(${order.id}, this.value)" class="status-select">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>قيد الانتظار</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>مؤكد</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>تم الشحن</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>تم التسليم</option>
                </select>
                <a href="https://wa.me/${order.phone}" target="_blank" class="whatsapp-btn">💬 واتساب</a>
            </div>
        </div>
    `).join('');
}

function updateOrderStatus(orderId, status) {
    const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        localStorage.setItem('fibno_orders', JSON.stringify(orders));
        loadDashboardData();
        showNotification('✅ تم تحديث حالة الطلب');
    }
}

function getStatusText(status) {
    const texts = {
        pending: '⏳ قيد الانتظار',
        confirmed: '✅ مؤكد',
        shipped: '🚚 تم الشحن',
        delivered: '📦 تم التسليم'
    };
    return texts[status] || status;
}

// ============ الإعدادات ============
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('fibno_settings')) || {};
    document.getElementById('whatsapp-number').value = settings.whatsapp || '213550000000';
    document.getElementById('store-name').value = settings.storeName || 'FibNo';
}

function saveSettings() {
    const settings = {
        whatsapp: document.getElementById('whatsapp-number').value,
        storeName: document.getElementById('store-name').value,
        currency: 'دج'
    };
    
    localStorage.setItem('fibno_settings', JSON.stringify(settings));
    showNotification('✅ تم حفظ الإعدادات بنجاح');
}

// ============ دوال مساعدة ============
function getCategoryName(cat) {
    const names = {
        electronics: 'إلكترونيات',
        clothing: 'ملابس',
        books: 'كتب',
        home: 'منزل'
    };
    return names[cat] || cat;
}

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
