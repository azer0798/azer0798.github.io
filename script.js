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

const COMMISSION_MAX = 500; // الحد الأقصى للعمولة
let exchangeRate = 250; // سعر الصرف الافتراضي

// ============ حساب العمولة ============
function calculateCommission(priceUSD) {
    const priceDZD = priceUSD * exchangeRate;
    let commission;
    
    if (priceUSD <= 5) {
        commission = priceDZD * 0.40; // 40%
    } else if (priceUSD <= 10) {
        commission = priceDZD * 0.20; // 20%
    } else if (priceUSD <= 20) {
        commission = priceDZD * 0.10; // 10%
    } else {
        commission = COMMISSION_MAX; // 500 دج ثابت
    }
    
    // لا تتجاوز 500 دج
    if (commission > COMMISSION_MAX) {
        commission = COMMISSION_MAX;
    }
    
    return Math.round(commission);
}

// ============ التهيئة ============
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    
    const wilayaSelect = document.getElementById('wilaya');
    if (wilayaSelect) {
        wilayaSelect.innerHTML = '<option value="">اختر الولاية</option>' +
            wilayas.map(w => `<option value="${w}">${w}</option>`).join('');
    }
    
    setupFloatingCalc();
    setupOrderForm();
    loadPostsTop();
    setupMobileMenu();
    
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
            exchangeRate = settings.exchangeRate || 250;
        }
    } catch (e) {
        exchangeRate = 250;
    }
    
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

function toggleCalcBubble() {
    const popup = document.getElementById('calc-popup');
    const bubble = document.getElementById('calc-bubble');
    
    if (popup.style.display === 'none' || popup.style.display === '') {
        popup.style.display = 'block';
        bubble.style.display = 'none';
    } else {
        popup.style.display = 'none';
        bubble.style.display = 'flex';
    }
}

function updateFloatingCalc() {
    const price = parseFloat(document.getElementById('float-product-price')?.value) || 0;
    
    if (price === 0) {
        document.getElementById('float-price-dzd').textContent = '0 دج';
        document.getElementById('float-commission').textContent = '0 دج';
        document.getElementById('float-total').textContent = '0 دج';
        return;
    }
    
    const priceDZD = price * exchangeRate;
    const commission = calculateCommission(price);
    const total = priceDZD + commission;
    
    document.getElementById('float-price-dzd').textContent = Math.round(priceDZD).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('float-commission').textContent = commission.toLocaleString('ar-DZ') + ' دج';
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
                    notes: entry.querySelector('.product-notes')?.value || ''
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
        const commissionAmount = calculateCommission(totalUSD);
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
            notes: document.getElementById('notes')?.value.trim() || '',
            date: new Date().toLocaleString('ar-DZ'),
            status: 'new'
        };
        
        // حفظ الطلب
        const orders = JSON.parse(localStorage.getItem('fibno_orders')) || [];
        orders.unshift(orderData);
        localStorage.setItem('fibno_orders', JSON.stringify(orders));
        
        // ✅ لا نرسل للواتساب - فقط نحفظ الطلب
        
        // إظهار رسالة النجاح
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
    
    if (totalUSD === 0) {
        document.getElementById('products-total-usd').textContent = '0.00 $';
        document.getElementById('products-total-dzd').textContent = '0 دج';
        document.getElementById('commission-amount').textContent = '0 دج';
        document.getElementById('total-to-pay').textContent = '0 دج';
        return;
    }
    
    const totalDZD = totalUSD * exchangeRate;
    const commissionAmount = calculateCommission(totalUSD);
    const grandTotal = totalDZD + commissionAmount;
    
    document.getElementById('products-total-usd').textContent = totalUSD.toFixed(2) + ' $';
    document.getElementById('products-total-dzd').textContent = Math.round(totalDZD).toLocaleString('ar-DZ') + ' دج';
    document.getElementById('commission-amount').textContent = commissionAmount.toLocaleString('ar-DZ') + ' دج';
    document.getElementById('total-to-pay').textContent = Math.round(grandTotal).toLocaleString('ar-DZ') + ' دج';
}

// ============ المنشورات ============
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
    
    const doubledPosts = [...posts, ...posts];
    
    container.innerHTML = doubledPosts.map(post => `
        <div class="post-top-item" style="background:${post.color || '#667eea'}">
            <span>📢</span>
            <strong>${post.title}</strong>
            <span>${post.content}</span>
            ${post.link ? `<a href="${post.link}" target="_blank">🔗</a>` : ''}
        </div>
    `).join('');
}

// ============ الإشعارات ============
function showNotification(message, type = 'success') {
    const old = document.querySelectorAll('.notification');
    old.forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.background = type === 'error' ? '#e74c3c' : '#00b894';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
    }
