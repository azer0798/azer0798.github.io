// ============ الولايات الجزائرية (58 ولاية) ============
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
    '46 - عين تموشنت','47 - غرداية','48 - غليزان','49 - المغير','50 - المنيعة',
    '51 - أولاد جلال','52 - برج باجي مختار','53 - بني عباس','54 - تيميمون',
    '55 - تقرت','56 - جانت','57 - عين صالح','58 - عين قزام'
];

const COMMISSION = 25;
let exchangeRate = 135;

// ============ التهيئة ============
document.addEventListener('DOMContentLoaded', async () => {
    // تحميل الإعدادات
    await loadSettings();
    
    // ملء الولايات
    const wilayaSelect = document.getElementById('wilaya');
    if (wilayaSelect) {
        wilayaSelect.innerHTML = '<option value="">اختر الولاية</option>' +
            wilayas.map(w => `<option value="${w}">${w}</option>`).join('');
    }
    
    // حاسبة عائمة
    setupFloatingCalc();
    
    // نموذج الطلب
    setupOrderForm();
    
    // المنشورات في الأعلى
    loadPostsTop();
    
    // القائمة
    setupMobileMenu();
    
    // تحديث حاسبة الطلب
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('product-price-usd')) {
            updateOrderCalculator();
        }
    });
});

// ============ تحميل الإعدادات ============
async function loadSettings() {
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const settings = await response.json();
            exchangeRate = settings.exchangeRate || 135;
        }
    } catch (e) {
        exchangeRate = 135;
    }
    
    // تحديث عرض السعر
    updateRateDisplay();
}

function updateRateDisplay() {
    document.querySelectorAll('#float-rate-display, #order-rate-display').forEach(el => {
        if (el) el.textContent = exchangeRate;
    });
}

// ============ القائمة ============
function setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger');
    if (hamburger) {
        hamburger.addEventListener('click', () => {
            document.querySelector('.nav-links').classList.toggle('active');
        });
    }
}

// ============ الحاسبة العائمة ============
function setupFloatingCalc() {
    const priceInput = document.getElementById('float-product-price');
    if (priceInput) {
        priceInput.addEventListener('input', updateFloatingCalc);
    }
}

function toggleFloatingCalc() {
    const body = document.getElementById('floating-calc-body');
    const icon = document.querySelector('.toggle-icon');
    if (body.style.display === 'none') {
        body.style.display = 'block';
        icon.textContent = '▼';
    } else {
        body.style.display = 'none';
        icon.textContent = '▲';
    }
}

function updateFloatingCalc() {
    const price = parseFloat(document.getElementById('float-product-price')?.value) || 0;
    const priceDZD = price * exchangeRate;
    const commission = priceDZD * (COMMISSION / 100);
    const total = priceDZD + commission;
    
    document.getElementById('float-price-dzd').textContent = Math.round(priceDZD).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('float-commission').textContent = Math.round(commission).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('float-total').textContent = Math.round(total).toLocaleString('ar-DZ') + ' دج';
}

// ============ نموذج الطلب ============
function setupOrderForm() {
    const form = document.getElementById('order-form');
    if (!form) return;
    
    updateOrderCalculator();
    
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
        
        const validLinks = products.filter(p => 
            p.link.includes('aliexpress.com') || p.link.includes('temu.com')
        );
        
        if (validLinks.length === 0) {
            showNotification('❌ روابط AliExpress أو Temu فقط', 'error');
            return;
        }
        
        const totalDZD = totalUSD * exchangeRate;
        const commissionAmount = totalDZD * (COMMISSION / 100);
        const grandTotal = totalDZD + commissionAmount;
        
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
            exchangeRate: exchangeRate,
            totalDZD: totalDZD,
            commission: commissionAmount,
            grandTotal: grandTotal,
            payment: document.querySelector('input[name="payment"]:checked')?.value || 'baridi',
            notes: document.getElementById('notes').value.trim(),
            date: new Date().toLocaleString('ar-DZ'),
            status: 'new'
        };
        
        const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
        orders.unshift(orderData);
        localStorage.setItem('fibno_orders', JSON.stringify(orders));
        
        await sendOrderToWhatsApp(orderData);
        
        document.getElementById('order-form').style.display = 'none';
        document.getElementById('success-message').style.display = 'block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
            <label>ملاحظات</label>
            <input type="text" class="product-notes" placeholder="اللون، المقاس...">
        </div>
        <button type="button" onclick="this.parentElement.remove();updateOrderCalculator();" 
                style="background:#ff4757;color:white;border:none;padding:8px 15px;border-radius:8px;cursor:pointer;">
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
    
    const totalDZD = totalUSD * exchangeRate;
    const commissionAmount = totalDZD * (COMMISSION / 100);
    const grandTotal = totalDZD + commissionAmount;
    
    document.getElementById('products-total-usd').textContent = totalUSD.toFixed(2) + ' $';
    document.getElementById('products-total-dzd').textContent = Math.round(totalDZD).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('commission-amount').textContent = Math.round(commissionAmount).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('total-to-pay').textContent = Math.round(grandTotal).toLocaleString('ar-DZ') + ' دج';
}

// ============ واتساب ============
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
        `${i + 1}. ${p.link}\n   💰 ${p.priceUSD.toFixed(2)} $ | 📝 ${p.notes || 'لا يوجد'}`
    ).join('\n\n');
    
    const message = `🆕 *طلب وساطة جديد*\n\n` +
                   `🆔 ${orderData.id}\n\n` +
                   `👤 ${orderData.firstName} ${orderData.lastName}\n` +
                   `📱 ${orderData.phone}\n` +
                   `📍 ${orderData.commune} - ${orderData.wilaya}\n` +
                   `📮 ${orderData.postOffice}\n` +
                   `💳 ${paymentNames[orderData.payment]}\n\n` +
                   `📦 *المنتجات:*\n${productsList}\n\n` +
                   `💵 ${orderData.totalUSD.toFixed(2)} $ × ${orderData.exchangeRate} = ${Math.round(orderData.totalDZD).toLocaleString('ar-DZ')} دج\n` +
                   `🔧 عمولة 25%: ${Math.round(orderData.commission).toLocaleString('ar-DZ')} دج\n` +
                   `💎 *الإجمالي: ${Math.round(orderData.grandTotal).toLocaleString('ar-DZ')} دج*\n\n` +
                   `📝 ${orderData.notes || 'لا يوجد'}\n` +
                   `📅 ${orderData.date}`;
    
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

// ============ المنشورات في الأعلى ============
function loadPostsTop() {
    const container = document.getElementById('posts-top-container');
    const section = document.getElementById('posts-top-section');
    if (!container || !section) return;
    
    const posts = JSON.parse(localStorage.getItem('fibno_posts')) || [];
    
    if (posts.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    
    container.innerHTML = posts.slice(0, 3).map(post => `
        <div class="post-top-item" style="background:${post.color || '#667eea'}">
            <span>📢</span>
            <div>
                <strong>${post.title}</strong>
                <span>${post.content}</span>
            </div>
            ${post.link ? `<a href="${post.link}" target="_blank">🔗</a>` : ''}
        </div>
    `).join('');
}

// ============ إشعارات ============
function showNotification(message, type = 'success') {
    const old = document.querySelectorAll('.notification');
    old.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? '#e74c3c' : '#00b894';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
        }
