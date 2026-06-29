let isLoggedIn = sessionStorage.getItem('fibno_admin_logged') === 'true';

document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn) {
        showDashboard();
        loadDashboard();
    }
    
    document.getElementById('login-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('admin-password').value;
        
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            
            if (data.success) {
                isLoggedIn = true;
                sessionStorage.setItem('fibno_admin_logged', 'true');
                showDashboard();
                loadDashboard();
                notify('✅ تم الدخول');
            } else {
                notify('❌ كلمة مرور خاطئة', 'error');
            }
        } catch (e) {
            notify('❌ خطأ', 'error');
        }
    });
    
    document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await fetch('/api/settings', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                whatsapp: document.getElementById('whatsapp-number').value,
                exchangeRate: parseInt(document.getElementById('exchange-rate-setting').value) || 250
            })
        });
        notify('✅ تم حفظ الإعدادات');
    });
    
    document.getElementById('post-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        savePost();
    });
    
    loadSettings();
});

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('dashboard-section').style.display = 'block';
}

function loadDashboard() {
    loadOrders();
    loadPostsList();
    loadSettings();
}

// ============ الطلبات ============
function loadOrders() {
    const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
    document.getElementById('total-orders').textContent = orders.length;
    
    const total = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    document.getElementById('total-revenue').textContent = Math.round(total).toLocaleString('ar-DZ') + ' دج';
    
    const container = document.getElementById('admin-orders-list');
    if (!orders.length) {
        container.innerHTML = '<p class="no-data">لا توجد طلبات</p>';
        return;
    }
    
    container.innerHTML = orders.map(order => `
        <div class="order-card">
            <div class="order-header">
                <span>🆔 ${order.id}</span>
                <span class="order-status">${getStatusText(order.status)}</span>
            </div>
            <div class="order-details">
                <p><strong>👤 ${order.firstName} ${order.lastName}</strong></p>
                <p>📱 ${order.phone} | 📮 ${order.postOffice}</p>
                <p>📍 ${order.commune} - ${order.wilaya}</p>
                <p>💳 ${order.payment === 'baridi' ? 'بريدي موب' : 'CCP'}</p>
                <p>💱 1$ = ${order.exchangeRate || 250} دج</p>
            </div>
            <div style="background:#f8f9fa;padding:10px;border-radius:8px;margin:10px 0;">
                ${order.products.map((p, i) => `
                    <p style="margin:5px 0;font-size:14px;">${i + 1}. <a href="${p.link}" target="_blank">رابط</a> | ${p.priceUSD.toFixed(2)} $ | ${p.notes || ''}</p>
                `).join('')}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
                <div>
                    <p>💰 المجموع: ${order.totalUSD.toFixed(2)} $</p>
                    <p>🔧 العمولة: ${order.commission.toLocaleString('ar-DZ')} دج</p>
                    <p style="font-weight:bold;color:#667eea;">💎 الإجمالي: ${Math.round(order.grandTotal).toLocaleString('ar-DZ')} دج</p>
                    <p style="font-size:12px;color:#666;">${order.date}</p>
                </div>
                <div style="display:flex;gap:8px;align-items:center;">
                    <select onchange="updateStatus(${order.id}, this.value)" style="padding:8px;border-radius:8px;border:1px solid #ddd;">
                        <option value="new" ${order.status=='new'?'selected':''}>🆕 جديد</option>
                        <option value="contacted" ${order.status=='contacted'?'selected':''}>📞 تم التواصل</option>
                        <option value="paid" ${order.status=='paid'?'selected':''}>✅ مدفوع</option>
                        <option value="purchased" ${order.status=='purchased'?'selected':''}>🛒 تم الشراء</option>
                        <option value="shipped" ${order.status=='shipped'?'selected':''}>📦 شحن</option>
                        <option value="delivered" ${order.status=='delivered'?'selected':''}>✅ استلم</option>
                    </select>
                    <button onclick="deleteOrder(${order.id})" style="background:#ff4757;color:white;border:none;padding:8px 12px;border-radius:8px;cursor:pointer;font-size:14px;">
                        🗑️ حذف
                    </button>
                </div>
            </div>
            ${order.notes ? `<p style="margin-top:10px;color:#666;">📝 ${order.notes}</p>` : ''}
        </div>
    `).join('');
}

function updateStatus(orderId, status) {
    const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
    const order = orders.find(o => o.id === orderId);
    if (order) {
        order.status = status;
        localStorage.setItem('fibno_orders', JSON.stringify(orders));
        loadOrders();
        notify('✅ تم تحديث الحالة');
    }
}

// ============ حذف طلب ============
function deleteOrder(orderId) {
    if (!confirm('⚠️ هل أنت متأكد من حذف هذا الطلب؟ لا يمكن التراجع!')) return;
    
    let orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
    orders = orders.filter(o => o.id !== orderId);
    localStorage.setItem('fibno_orders', JSON.stringify(orders));
    loadOrders();
    notify('🗑️ تم حذف الطلب');
}

// ============ المنشورات ============
function loadPostsList() {
    const posts = JSON.parse(localStorage.getItem('fibno_posts')) || [];
    document.getElementById('total-posts').textContent = posts.length;
    
    const container = document.getElementById('admin-posts-list');
    if (!posts.length) {
        container.innerHTML = '<p class="no-data">لا توجد منشورات</p>';
        return;
    }
    
    container.innerHTML = posts.map(post => `
        <div style="background:${post.color || '#667eea'};color:white;padding:15px;border-radius:10px;margin-bottom:10px;">
            <h4>${post.title}</h4>
            <p>${post.content}</p>
            ${post.link ? `<a href="${post.link}" target="_blank" style="color:#ffd700;">🔗 رابط</a>` : ''}
            <small style="opacity:0.8;display:block;margin-top:5px;">${post.date}</small>
            <button onclick="deletePost('${post.id}')" style="background:#ff4757;color:white;border:none;padding:5px 15px;border-radius:5px;cursor:pointer;margin-top:10px;">🗑️ حذف</button>
        </div>
    `).join('');
}

function showAddPost() {
    document.getElementById('post-modal-title').textContent = 'منشور جديد';
    document.getElementById('post-form').reset();
    document.getElementById('post-id').value = '';
    document.getElementById('post-modal').style.display = 'block';
}

function closePostModal() {
    document.getElementById('post-modal').style.display = 'none';
}

function savePost() {
    const posts = JSON.parse(localStorage.getItem('fibno_posts')) || [];
    const postId = document.getElementById('post-id').value;
    
    const postData = {
        id: postId || Date.now().toString(),
        title: document.getElementById('post-title').value,
        content: document.getElementById('post-content').value,
        link: document.getElementById('post-link').value,
        color: document.getElementById('post-color').value,
        date: new Date().toLocaleString('ar-DZ')
    };
    
    if (postId) {
        const index = posts.findIndex(p => p.id === postId);
        posts[index] = postData;
    } else {
        posts.unshift(postData);
    }
    
    localStorage.setItem('fibno_posts', JSON.stringify(posts));
    closePostModal();
    loadDashboard();
    notify('✅ تم حفظ المنشور');
}

function deletePost(postId) {
    if (!confirm('حذف المنشور؟')) return;
    const posts = JSON.parse(localStorage.getItem('fibno_posts')) || [];
    localStorage.setItem('fibno_posts', JSON.stringify(posts.filter(p => p.id !== postId)));
    loadDashboard();
    notify('🗑️ تم الحذف');
}

// ============ الإعدادات ============
async function loadSettings() {
    try {
        const res = await fetch('/api/settings');
        const settings = await res.json();
        document.getElementById('whatsapp-number').value = settings.whatsapp || '213550000000';
        document.getElementById('exchange-rate-setting').value = settings.exchangeRate || 250;
    } catch (e) {}
}

// ============ تبويبات ============
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById(tab + '-tab').classList.add('active');
}

function getStatusText(status) {
    const map = {
        'new': '🆕 جديد', 'contacted': '📞 تم التواصل', 'paid': '✅ مدفوع',
        'purchased': '🛒 تم الشراء', 'shipped': '📦 في الطريق', 'delivered': '✅ استلم'
    };
    return map[status] || status;
}

function notify(msg, type = 'success') {
    const n = document.createElement('div');
    n.className = 'notification';
    n.style.background = type === 'error' ? '#e74c3c' : '#00b894';
    n.textContent = msg;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3000);
        }
