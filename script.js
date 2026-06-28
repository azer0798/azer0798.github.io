// ============ خدمة الوساطة ============
document.addEventListener('DOMContentLoaded', () => {
    const serviceForm = document.getElementById('service-form');
    if (serviceForm) {
        serviceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // جمع الروابط
            const linksText = document.getElementById('product-links').value;
            const links = linksText.split('\n')
                .map(link => link.trim())
                .filter(link => link.length > 0);
            
            if (links.length === 0) {
                showNotification('❌ يرجى إدخال رابط واحد على الأقل', 'error');
                return;
            }
            
            // التحقق من الروابط
            const validLinks = links.filter(link => 
                link.includes('aliexpress.com') || 
                link.includes('temu.com')
            );
            
            if (validLinks.length === 0) {
                showNotification('❌ يرجى إدخال روابط صحيحة من AliExpress أو Temu', 'error');
                return;
            }
            
            const orderData = {
                id: Date.now(),
                firstName: document.getElementById('first-name').value.trim(),
                lastName: document.getElementById('last-name').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                commune: document.getElementById('commune').value.trim(),
                wilaya: document.getElementById('wilaya').value,
                links: validLinks,
                paymentMethod: document.querySelector('input[name="payment-method"]:checked').value,
                notes: document.getElementById('notes').value.trim(),
                date: new Date().toLocaleString('ar-DZ')
            };
            
            // حفظ الطلب محلياً
            const serviceOrders = JSON.parse(localStorage.getItem('fibno_service_orders')) || [];
            serviceOrders.unshift(orderData);
            localStorage.setItem('fibno_service_orders', JSON.stringify(serviceOrders));
            
            // إرسال إلى واتساب
            await sendServiceToWhatsApp(orderData);
            
            // إظهار رسالة النجاح
            document.getElementById('service-form').style.display = 'none';
            document.getElementById('success-message').style.display = 'block';
        });
    }
});

async function sendServiceToWhatsApp(orderData) {
    let whatsappNumber = '213550000000';
    
    try {
        const response = await fetch('/api/settings');
        if (response.ok) {
            const settings = await response.json();
            whatsappNumber = settings.whatsapp || whatsappNumber;
        }
    } catch (error) {
        console.log('Using default whatsapp number');
    }
    
    const paymentText = {
        ccp: '🏦 CCP (بريدي)',
        cash: '💵 نقداً عند الاستلام',
        baridi: '📱 بريدي موب'
    };
    
    const linksList = orderData.links.map((link, i) => `${i + 1}. ${link}`).join('\n');
    
    const message = `🌍 *طلب وساطة جديد*\n\n` +
                   `👤 *الاسم:* ${orderData.firstName} ${orderData.lastName}\n` +
                   `📱 *الهاتف:* ${orderData.phone}\n` +
                   `📍 *البلدية:* ${orderData.commune}\n` +
                   `📍 *الولاية:* ${orderData.wilaya}\n` +
                   `💳 *الدفع:* ${paymentText[orderData.paymentMethod] || orderData.paymentMethod}\n\n` +
                   `🔗 *روابط المنتجات:*\n${linksList}\n\n` +
                   `📝 *ملاحظات:* ${orderData.notes || 'لا يوجد'}\n\n` +
                   `📅 *التاريخ:* ${orderData.date}`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
    window.open(whatsappURL, '_blank');
}
