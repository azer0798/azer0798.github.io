// ============ الولايات ============
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
    // ملء الولايات
    const wilayaSelect = document.getElementById('wilaya');
    if (wilayaSelect) {
        wilayaSelect.innerHTML = '<option value="">اختر الولاية</option>' +
            wilayas.map(w => `<option value="${w}">${w}</option>`).join('');
    }
    
    // حاسبة الرئيسية
    setupMainCalculator();
    
    // نموذج الطلب
    setupOrderForm();
    
    // المنشورات
    loadPosts();
    
    // القائمة
    setupMobileMenu();
    
    // تحديث الحاسبة عند تغيير المنتجات أو سعر الصرف
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('product-price-usd') || e.target.id === 'exchange-rate-input') {
            updateOrderCalculator();
        }
    });
});

function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (hamburger) {
        hamburger.addEventListener('click', () => navLinks.classList.toggle('active'));
    }
}

// ============ حاسبة الرئيسية ============
function setupMainCalculator() {
    const priceInput = document.getElementById('product-price');
    const rateInput = document.getElementById('exchange-rate');
    
    if (priceInput && rateInput) {
        priceInput.addEventListener('input', updateMainCalculator);
        rateInput.addEventListener('input', updateMainCalculator);
    }
}

function updateMainCalculator() {
    const price = parseFloat(document.getElementById('product-price')?.value) || 0;
    const rate = parseFloat(document.getElementById('exchange-rate')?.value) || USD_RATE;
    
    const priceDZD = price * rate;
    const commission = priceDZD * (COMMISSION / 100);
    const total = priceDZD + commission;
    
    document.getElementById('price-dzd').textContent = Math.round(priceDZD).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('commission').textContent = Math.round(commission).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('total-price').textContent = Math.round(total).toLocaleString('ar-DZ') + ' دج';
}

// ============ نموذج الطلب ============
function setupOrderForm() {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
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
        
        if (products.length === 0) {
            showNotification('❌ أدخل رابط وسعر منتج واحد على الأقل', 'error');
            return;
        }
        
        const rate = parseFloat(document.getElementById('exchange-rate-input').value) || USD_RATE;
        const totalDZD = totalUSD * rate;
        const commission = totalDZD * (COMMISSION / 100);
        const grandTotal = totalDZD + commission;
        
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
            commission: commission,
            grandTotal: grandTotal,
            payment: document.querySelector('input[name="payment"]:checked').value,
            notes: document.getElementById('notes').value.trim(),
            date: new Date().toLocaleString('ar-DZ'),
            status: 'new'
        };
        
        // حفظ الطلب
        const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
        orders.unshift(orderData);
        localStorage.setItem('fibno_orders', JSON.stringify(orders));
        
        // إرسال للواتساب
        await sendOrderToWhatsApp(orderData);
        
        // إظهار النجاح
        document.getElementById('order-form').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
    });
}

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
            🗑️ حذف
        </button>
    `;
    container.appendChild(entry);
}

function updateOrderCalculator() {
    let totalUSD = 0;
    document.querySelectorAll('.product-price-usd').forEach(input => {
        totalUSD += parseFloat(input.value) || 0;
    });
    
    const rate = parseFloat(document.getElementById('exchange-rate-input')?.value) || USD_RATE;
    const totalDZD = totalUSD * rate;
    const commission = totalDZD * (COMMISSION / 100);
    const grandTotal = totalDZD + commission;
    
    document.getElementById('products-total-usd').textContent = totalUSD.toFixed(2) + ' $';
    document.getElementById('products-total-dzd').textContent = Math.round(totalDZD).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('commission-amount').textContent = Math.round(commission).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('total-to-pay').textContent = Math.round(grandTotal).toLocaleString('ar-DZ') + ' دج';
}

// ============ إرسال الطلب للواتساب ============
async function sendOrderToWhatsApp(orderData) {
    let whatsappNumber = '213550000000';
    
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const settings = await response.json();
            whatsappNumber = settings.whatsapp || whatsappNumber;
        }
    } catch (e) {}
    
    const paymentNames = { baridi: '📱 بريدي موب', ccp: '🏦 CCP' };
    
    const productsList = orderData.products.map((p, i) => 
        `${i + 1}. ${p.link}\n   💰 السعر: ${p.priceUSD} $ | 📝 ${p.notes || 'بدون ملاحظات'}`
    ).join('\n\n');
    
    const message = `🆕 *طلب وساطة جديد*\n\n` +
                   `🆔 رقم: ${orderData.id}\n\n` +
                   `👤 *الزبون:* ${orderData.firstName} ${orderData.lastName}\n` +
                   `📱 *الهاتف:* ${orderData.phone}\n` +
                   `📍 *البلدية:* ${orderData.commune}\n` +
                   `📍 *الولاية:* ${orderData.wilaya}\n` +
                   `📮 *مركز البريد:* ${orderData.postOffice}\n` +
                   `💳 *الدفع:* ${paymentNames[orderData.payment]}\n\n` +
                   `📦 *المنتجات:*\n${productsList}\n\n` +
                   `💵 المجموع: ${orderData.totalUSD.toFixed(2)} $\n` +
                   `💱 سعر الصرف: 1$ = ${orderData.exchangeRate} دج\n` +
                   `💰 المبلغ: ${Math.round(orderData.totalDZD).toLocaleString('ar-DZ')} دج\n` +
                   `🔧 العمولة (25%): ${Math.round(orderData.commission).toLocaleString('ar-DZ')} دج\n` +
                   `💎 *الإجمالي: ${Math.round(orderData.grandTotal).toLocaleString('ar-DZ')} دج*\n\n` +
                   `📝 *ملاحظات:* ${orderData.notes || 'لا يوجد'}\n` +
                   `📅 ${orderData.date}`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

// ============ المنشورات ============
function loadPosts() {
    const container = document.getElementById('posts-container');
    if (!container) return;
    
    const posts = JSON.parse(localStorage.getItem('fibno_posts')) || [];
    
    if (posts.length === 0) {
        document.getElementById('posts-section').style.display = 'none';
        return;
    }
    
    container.innerHTML = posts.slice(0, 6).map(post => `
        <div class="post-card" style="background:${post.color || '#667eea'}">
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            ${post.link ? `<a href="${post.link}" target="_blank" style="color:white;text-decoration:underline;">رابط →</a>` : ''}
            <small style="opacity:0.8;display:block;margin-top:10px;">${post.date}</small>
        </div>
    `).join('');
}

// ============ الإشعارات ============
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? '#e74c3c' : '#00b894';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
                                   }
