// ============ الولايات الجزائرية ============
const wilayas = [
    '01 - أدرار','02 - الشلف','03 - الأغواط','04 - أم البواقي','05 - باتنة',
    '06 - بجاية','07 - بسكرة','08 - بشار','09 - البليدة','10 - البويرة',
    '11 - تمنراست','12 - تبسة','13 - تلمسان','14 - تيارت','15 - تيزي وزو',
    '16 - الجزائر العاصمة','17 - الجلفة','18 - جيجل','19 - سطيف','20 - سعيدة',
    '21 - سكيكدة','22 - سيدي بلعباس','23 - عنابة','24 - قالمة','25 - قسنطينة',
    '26 - المدية','27 - مستغانم','28 - المسيلة','29 - معسكر','30 - ورقلة',
    '31 - وهران','32 - البيض','33 - اليزي','34 - برج بوعريريج','35 - بومرداس',
    '36 - الطارف','37 - تندوف','38 - تيسمسيلت','39 - الوادي','40 - خنشلة',
    '41 - سوق أهراس','42 - تيبازة','43 - ميلة','44 - عين الدفلى','45 - النعامة',
    '46 - عين تموشنت','47 - غرداية','48 - غليزان'
];

const USD_RATE = 135;
const COMMISSION = 25; // 25%

// ============ التهيئة ============
document.addEventListener('DOMContentLoaded', () => {
    // ملء قائمة الولايات
    const wilayaSelect = document.getElementById('wilaya');
    if (wilayaSelect) {
        wilayaSelect.innerHTML = '<option value="">اختر الولاية</option>' +
            wilayas.map(w => `<option value="${w}">${w}</option>`).join('');
    }
    
    // حاسبة الرئيسية
    setupMainCalculator();
    
    // نموذج الطلب
    setupOrderForm();
    
    // تحميل المنشورات
    loadPosts();
    
    // القائمة المتجاوبة
    setupMobileMenu();
    
    // تحديث حاسبة الطلب عند تغيير المنتجات
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('product-price-usd') || e.target.id === 'exchange-rate-input') {
            updateOrderCalculator();
        }
    });
});

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

// ============ حاسبة الصفحة الرئيسية ============
function setupMainCalculator() {
    const priceInput = document.getElementById('product-price');
    const rateInput = document.getElementById('exchange-rate');
    
    if (priceInput && rateInput) {
        priceInput.addEventListener('input', updateMainCalculator);
        rateInput.addEventListener('input', updateMainCalculator);
        updateMainCalculator();
    }
}

function updateMainCalculator() {
    const price = parseFloat(document.getElementById('product-price')?.value) || 0;
    const rate = parseFloat(document.getElementById('exchange-rate')?.value) || USD_RATE;
    
    const priceDZD = price * rate;
    const commission = priceDZD * (COMMISSION / 100);
    const total = priceDZD + commission;
    
    const priceEl = document.getElementById('price-dzd');
    const commissionEl = document.getElementById('commission');
    const totalEl = document.getElementById('total-price');
    
    if (priceEl) priceEl.textContent = Math.round(priceDZD).toLocaleString('ar-DZ') + ' دج';
    if (commissionEl) commissionEl.textContent = Math.round(commission).toLocaleString('ar-DZ') + ' دج';
    if (totalEl) totalEl.textContent = Math.round(total).toLocaleString('ar-DZ') + ' دج';
}

// ============ نموذج تقديم الطلب ============
function setupOrderForm() {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // جمع المنتجات
        const productEntries = document.querySelectorAll('.product-entry');
        const products = [];
        let totalUSD = 0;
        
        productEntries.forEach(entry => {
            const link = entry.querySelector('.product-link').value.trim();
            const price = parseFloat(entry.querySelector('.product-price-usd').value) || 0;
            
            if (link && price > 0) {
                products.push({
                    link: link,
                    priceUSD: price,
                    notes: entry.querySelector('.product-notes').value || ''
                });
                totalUSD += price;
            }
        });
        
        // التحقق من وجود منتج واحد على الأقل
        if (products.length === 0) {
            showNotification('❌ يرجى إدخال رابط وسعر منتج واحد على الأقل', 'error');
            return;
        }
        
        // التحقق من الروابط
        const validLinks = products.filter(p => 
            p.link.includes('aliexpress.com')
        );
        
        if (validLinks.length === 0) {
            showNotification('❌ يرجى إدخال روابط صحيحة من AliExpress فقط', 'error');
            return;
        }
        
        // الحسابات
        const rate = parseFloat(document.getElementById('exchange-rate-input')?.value) || USD_RATE;
        const totalDZD = totalUSD * rate;
        const commissionAmount = totalDZD * (COMMISSION / 100);
        const grandTotal = totalDZD + commissionAmount;
        
        // بناء كائن الطلب
        const orderData = {
            id: Date.now(),
            firstName: document.getElementById('first-name').value.trim(),
            lastName: document.getElementById('last-name').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            commune: document.getElementById('commune').value.trim(),
            wilaya: document.getElementById('wilaya').value,
            postOffice: document.getElementById('post-office').value.trim(),
            products: products,
            totalUSD: totalUSD,
            exchangeRate: rate,
            totalDZD: totalDZD,
            commission: commissionAmount,
            grandTotal: grandTotal,
            payment: document.querySelector('input[name="payment"]:checked')?.value || 'baridi',
            notes: document.getElementById('notes').value.trim(),
            date: new Date().toLocaleString('ar-DZ'),
            status: 'new'
        };
        
        // حفظ الطلب في localStorage
        const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
        orders.unshift(orderData);
        localStorage.setItem('fibno_orders', JSON.stringify(orders));
        
        // إرسال إشعار للواتساب
        await sendOrderToWhatsApp(orderData);
        
        // إظهار رسالة النجاح
        document.getElementById('order-form').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        
        // تمرير للأعلى
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ============ إضافة منتج جديد ============
function addProductEntry() {
    const container = document.getElementById('products-container');
    const entry = document.createElement('div');
    entry.className = 'product-entry';
    entry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>رابط المنتج *</label>
                <input type="url" class="product-link" required placeholder="https://www.aliexpress.com/item/..." dir="ltr">
            </div>
            <div class="form-group">
                <label>السعر بالدولار $ *</label>
                <input type="number" class="product-price-usd" required placeholder="0" min="0" step="0.01">
            </div>
        </div>
        <div class="form-group">
            <label>ملاحظات (لون، مقاس...)</label>
            <input type="text" class="product-notes" placeholder="اللون: أسود، المقاس: M">
        </div>
        <button type="button" class="remove-product-btn" onclick="this.parentElement.remove();updateOrderCalculator();" 
                style="background:#ff4757;color:white;border:none;padding:8px 15px;border-radius:8px;cursor:pointer;margin-top:5px;">
            🗑️ حذف المنتج
        </button>
    `;
    container.appendChild(entry);
}

// ============ تحديث حاسبة الطلب ============
function updateOrderCalculator() {
    let totalUSD = 0;
    document.querySelectorAll('.product-price-usd').forEach(input => {
        totalUSD += parseFloat(input.value) || 0;
    });
    
    const rate = parseFloat(document.getElementById('exchange-rate-input')?.value) || USD_RATE;
    const totalDZD = totalUSD * rate;
    const commissionAmount = totalDZD * (COMMISSION / 100);
    const grandTotal = totalDZD + commissionAmount;
    
    const productsTotalEl = document.getElementById('products-total-usd');
    const productsTotalDZDEl = document.getElementById('products-total-dzd');
    const commissionEl = document.getElementById('commission-amount');
    const totalEl = document.getElementById('total-to-pay');
    
    if (productsTotalEl) productsTotalEl.textContent = totalUSD.toFixed(2) + ' $';
    if (productsTotalDZDEl) productsTotalDZDEl.textContent = Math.round(totalDZD).toLocaleString('ar-DZ') + ' دج';
    if (commissionEl) commissionEl.textContent = Math.round(commissionAmount).toLocaleString('ar-DZ') + ' دج';
    if (totalEl) totalEl.textContent = Math.round(grandTotal).toLocaleString('ar-DZ') + ' دج';
}

// ============ إرسال الطلب للواتساب ============
async function sendOrderToWhatsApp(orderData) {
    let whatsappNumber = '213550000000';
    
    // محاولة جلب الرقم من الإعدادات
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const settings = await response.json();
            whatsappNumber = settings.whatsapp || whatsappNumber;
        }
    } catch (error) {
        // استخدام الرقم الافتراضي
        console.log('استخدام رقم الواتساب الافتراضي');
    }
    
    const paymentNames = { 
        baridi: '📱 بريدي موب', 
        ccp: '🏦 CCP' 
    };
    
    const productsList = orderData.products.map((p, i) => 
        `${i + 1}. ${p.link}\n   💰 السعر: ${p.priceUSD.toFixed(2)} $ | 📝 ${p.notes || 'بدون ملاحظات'}`
    ).join('\n\n');
    
    const message = `🆕 *طلب وساطة جديد*\n\n` +
                   `🆔 *رقم الطلب:* ${orderData.id}\n\n` +
                   `👤 *الزبون:* ${orderData.firstName} ${orderData.lastName}\n` +
                   `📱 *الهاتف:* ${orderData.phone}\n` +
                   `📍 *البلدية:* ${orderData.commune}\n` +
                   `📍 *الولاية:* ${orderData.wilaya}\n` +
                   `📮 *أقرب بريد:* ${orderData.postOffice}\n` +
                   `💳 *طريقة الدفع:* ${paymentNames[orderData.payment]}\n\n` +
                   `📦 *المنتجات المطلوبة:*\n${productsList}\n\n` +
                   `💵 *مجموع المنتجات:* ${orderData.totalUSD.toFixed(2)} $\n` +
                   `💱 *سعر الصرف:* 1 $ = ${orderData.exchangeRate} دج\n` +
                   `💰 *المبلغ بالدينار:* ${Math.round(orderData.totalDZD).toLocaleString('ar-DZ')} دج\n` +
                   `🔧 *العمولة (25%):* ${Math.round(orderData.commission).toLocaleString('ar-DZ')} دج\n` +
                   `💎 *الإجمالي للدفع:* ${Math.round(orderData.grandTotal).toLocaleString('ar-DZ')} دج\n\n` +
                   `📝 *ملاحظات الزبون:* ${orderData.notes || 'لا يوجد'}\n` +
                   `📅 *تاريخ الطلب:* ${orderData.date}`;
    
    // فتح الواتساب
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}

// ============ تحميل المنشورات ============
function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    const posts = JSON.parse(localStorage.getItem('fibno_posts')) || [];
    const postsSection = document.getElementById('posts-section');
    
    if (posts.length === 0) {
        if (postsSection) postsSection.style.display = 'none';
        return;
    }
    
    if (postsSection) postsSection.style.display = 'block';
    
    container.innerHTML = posts.slice(0, 6).map(post => `
        <div class="post-card" style="background:${post.color || '#667eea'}">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            ${post.link ? `<a href="${post.link}" target="_blank" style="color:#ffd700;text-decoration:underline;display:inline-block;margin-top:10px;">🔗 رابط المنشور</a>` : ''}
            <small style="opacity:0.8;display:block;margin-top:10px;font-size:12px;">${post.date}</small>
        </div>
    `).join('');
}

// ============ الإشعارات ============
function showNotification(message, type = 'success') {
    // إزالة الإشعارات القديمة
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? '#e74c3c' : '#00b894';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============ تأثيرات إضافية ============
// إغلاق القائمة عند النقر خارجها
document.addEventListener('click', (e) => {
    const navLinks = document.querySelector('.nav-links');
    const hamburger = document.querySelector('.hamburger');
    
    if (navLinks && navLinks.classList.contains('active')) {
        if (!e.target.closest('.nav-links') && !e.target.closest('.hamburger')) {
            navLinks.classList.remove('active');
        }
    }
});

// تحسين تجربة النموذج
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
        const form = e.target.closest('form');
        if (form && e.target.type !== 'submit') {
            const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"])'));
            const index = inputs.indexOf(e.target);
            if (index < inputs.length - 1) {
                e.preventDefault();
                inputs[index + 1].focus();
            }
        }
    }
});
