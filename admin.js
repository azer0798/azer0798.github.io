// ============ المتغيرات ============
let isLoggedIn = sessionStorage.getItem('fibno_admin_logged') === 'true';

// ============ معاينة الصورة ============
function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('image-preview').src = e.target.result;
            document.getElementById('image-preview').style.display = 'block';
            document.getElementById('upload-placeholder').style.display = 'none';
        };
        reader.readAsDataURL(file);
    }
}

// ============ تهيئة لوحة التحكم ============
document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn) {
        showDashboard();
        loadDashboardData();
    }
    
    // نموذج تسجيل الدخول
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('admin-password').value;
            
            try {
                const response = await fetch('/api/admin/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    isLoggedIn = true;
                    sessionStorage.setItem('fibno_admin_logged', 'true');
                    showDashboard();
                    loadDashboardData();
                    showNotification('✅ تم تسجيل الدخول بنجاح');
                } else {
                    showNotification('❌ كلمة المرور غير صحيحة', 'error');
                }
            } catch (error) {
                showNotification('❌ خطأ في الاتصال', 'error');
            }
        });
    }
    
    // نموذج الإعدادات
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        loadSettings();
        settingsForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveSettings();
        });
    }
    
    // نموذج المنتج
    const productForm = document.getElementById('product-form');
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveProduct();
        });
    }
});

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
}

// ============ تحميل البيانات ============
async function loadDashboardData() {
    try {
        // تحميل المنتجات
        const productsResponse = await fetch('/api/products');
        const products = await productsResponse.json();
        document.getElementById('total-products').textContent = products.length;
        renderAdminProducts(products);
        
        // تحميل طلبات المتجر
        const ordersResponse = await fetch('/api/orders');
        const orders = await ordersResponse.json();
        document.getElementById('total-orders').textContent = orders.length;
        
        const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
        document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString('ar-DZ') + ' دج';
        
        renderAdminOrders(orders);
        
        // تحميل طلبات الوساطة
        const serviceOrders = JSON.parse(localStorage.getItem('fibno_service_orders')) || [];
        document.getElementById('total-service-orders').textContent = serviceOrders.length;
        renderServiceOrders(serviceOrders);
        
    } catch (error) {
        console.error('خطأ في تحميل البيانات:', error);
    }
}

// ============ التبويبات ============
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabName + '-tab').classList.add('active');
}

// ============ إدارة المنتجات ============
function renderAdminProducts(products) {
    const container = document.getElementById('admin-products-list');
    if (!container) return;
    
    if (products.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد منتجات</p>';
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div class="admin-product-item">
            <img src="${product.image || ''}" alt="${product.name}" class="admin-product-img"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2770%27 height=%2770%27%3E%3Crect fill=%27%23ddd%27 width=%2770%27 height=%2770%27/%3E%3Ctext fill=%27%23999%27 x=%2750%25%27 y=%2750%25%27 text-anchor=%27middle%27 dy=%27.3em%27 font-size=%2730%27%3E📦%3C/text%3E%3C/svg%3E'">
            <div class="admin-product-info">
                <h4>${product.name}</h4>
                <p>${(product.price || 0).toLocaleString('ar-DZ')} دج | ${getCategoryName(product.category)}</p>
            </div>
            <div class="admin-product-actions">
                <button onclick="editProduct('${product._id}')" class="edit-btn">✏️ تعديل</button>
                <button onclick="deleteProduct('${product._id}')" class="delete-btn">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function showAddProduct() {
    document.getElementById('modal-title').textContent = 'إضافة منتج جديد';
    document.getElementById('product-form').reset();
    document.getElementById('product-id').value = '';
    document.getElementById('image-preview').style.display = 'none';
    document.getElementById('upload-placeholder').style.display = 'block';
    document.getElementById('product-modal').style.display = 'block';
}

async function editProduct(productId) {
    try {
        const response = await fetch(`/api/products/${productId}`);
        const product = await response.json();
        
        document.getElementById('modal-title').textContent = 'تعديل المنتج';
        document.getElementById('product-id').value = product._id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        document.getElementById('product-original-price').value = product.originalPrice || '';
        document.getElementById('product-category').value = product.category;
        document.getElementById('product-description').value = product.description || '';
        
        if (product.image) {
            document.getElementById('image-preview').src = product.image;
            document.getElementById('image-preview').style.display = 'block';
            document.getElementById('upload-placeholder').style.display = 'none';
        }
        
        document.getElementById('product-modal').style.display = 'block';
    } catch (error) {
        showNotification('❌ خطأ في تحميل المنتج', 'error');
    }
}

function closeProductModal() {
    document.getElementById('product-modal').style.display = 'none';
}

async function saveProduct() {
    const productId = document.getElementById('product-id').value;
    const isEdit = productId !== '';
    
    const formData = new FormData();
    formData.append('name', document.getElementById('product-name').value);
    formData.append('price', document.getElementById('product-price').value);
    formData.append('originalPrice', document.getElementById('product-original-price').value);
    formData.append('category', document.getElementById('product-category').value);
    formData.append('description', document.getElementById('product-description').value);
    
    const imageInput = document.getElementById('product-image-input');
    if (imageInput && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }
    
    try {
        const url = isEdit ? `/api/products/${productId}` : '/api/products';
        const method = isEdit ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            body: formData
        });
        
        if (response.ok) {
            closeProductModal();
            loadDashboardData();
            showNotification('✅ تم حفظ المنتج بنجاح');
        }
    } catch (error) {
        showNotification('❌ خطأ في حفظ المنتج', 'error');
    }
}

async function deleteProduct(productId) {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return;
    
    try {
        await fetch(`/api/products/${productId}`, { method: 'DELETE' });
        loadDashboardData();
        showNotification('🗑️ تم حذف المنتج');
    } catch (error) {
        showNotification('❌ خطأ في حذف المنتج', 'error');
    }
}

// ============ طلبات المتجر ============
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
                <span class="order-id">طلب #${order._id ? order._id.slice(-6) : ''}</span>
                <span class="order-status ${order.status}">${getStatusText(order.status)}</span>
            </div>
            <div class="order-details">
                <p><strong>العميل:</strong> ${order.customer?.name || ''}</p>
                <p><strong>الهاتف:</strong> ${order.customer?.phone || ''}</p>
                <p><strong>الولاية:</strong> ${order.customer?.wilaya || ''}</p>
                <p><strong>الإجمالي:</strong> ${(order.total || 0).toLocaleString('ar-DZ')} دج</p>
                <p><strong>التاريخ:</strong> ${order.createdAt ? new Date(order.createdAt).toLocaleString('ar-DZ') : ''}</p>
            </div>
            <div class="order-products">
                ${order.products?.map(p => `${p.name} ×${p.quantity}`).join(' | ') || ''}
            </div>
            <div class="order-actions">
                <select onchange="updateOrderStatus('${order._id}', this.value)" class="status-select">
                    <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>⏳ قيد الانتظار</option>
                    <option value="confirmed" ${order.status === 'confirmed' ? 'selected' : ''}>✅ مؤكد</option>
                    <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>🚚 تم الشحن</option>
                    <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>📦 تم التسليم</option>
                </select>
                <a href="https://wa.me/${order.customer?.phone || ''}" target="_blank" class="whatsapp-btn">💬 واتساب</a>
            </div>
        </div>
    `).join('');
}

async function updateOrderStatus(orderId, status) {
    try {
        await fetch(`/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        loadDashboardData();
        showNotification('✅ تم تحديث حالة الطلب');
    } catch (error) {
        showNotification('❌ خطأ في تحديث الطلب', 'error');
    }
}

// ============ طلبات الوساطة ============
function renderServiceOrders(orders) {
    const container = document.getElementById('admin-service-orders-list');
    if (!container) return;
    
    if (orders.length === 0) {
        container.innerHTML = '<p class="no-data">لا توجد طلبات وساطة</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card service-order">
            <div class="order-header">
                <span class="order-id">وساطة #${order.id ? order.id.toString().slice(-6) : ''}</span>
                <span class="order-status pending">⏳ جديد</span>
            </div>
            <div class="order-details">
                <p><strong>الاسم واللقب:</strong> ${order.firstName} ${order.lastName}</p>
                <p><strong>الهاتف:</strong> ${order.phone}</p>
                <p><strong>البلدية:</strong> ${order.commune}</p>
                <p><strong>الولاية:</strong> ${order.wilaya}</p>
                <p><strong>طريقة الدفع:</strong> ${getPaymentMethod(order.paymentMethod)}</p>
                <p><strong>التاريخ:</strong> ${order.date}</p>
            </div>
            <div class="order-products">
                <strong>الروابط:</strong><br>
                ${order.links.map(link => `<a href="${link}" target="_blank" style="color:#3498db;">${link}</a>`).join('<br>')}
            </div>
            ${order.notes ? `<p><strong>ملاحظات:</strong> ${order.notes}</p>` : ''}
            <div class="order-actions">
                <a href="https://wa.me/${order.phone}" target="_blank" class="whatsapp-btn">💬 واتساب</a>
            </div>
        </div>
    `).join('');
}

// ============ الإعدادات ============
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        const settings = await response.json();
        document.getElementById('whatsapp-number').value = settings.whatsapp || '213550000000';
        document.getElementById('store-name').value = settings.storeName || 'FibNo';
    } catch (error) {
        console.error('خطأ في تحميل الإعدادات:', error);
    }
}

async function saveSettings() {
    try {
        await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                whatsapp: document.getElementById('whatsapp-number').value,
                storeName: document.getElementById('store-name').value,
                currency: 'دج'
            })
        });
        showNotification('✅ تم حفظ الإعدادات بنجاح');
    } catch (error) {
        showNotification('❌ خطأ في حفظ الإعدادات', 'error');
    }
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

function getStatusText(status) {
    const texts = {
        pending: '⏳ قيد الانتظار',
        confirmed: '✅ مؤكد',
        shipped: '🚚 تم الشحن',
        delivered: '📦 تم التسليم'
    };
    return texts[status] || status;
}

function getPaymentMethod(method) {
    const methods = {
        ccp: '🏦 CCP (بريدي)',
        cash: '💵 نقداً',
        baridi: '📱 بريدي موب'
    };
    return methods[method] || method;
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
