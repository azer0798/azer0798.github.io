const express = require('express');
const path = require('path');
const app = express();

// ============ متغيرات البيئة ============
const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_PATH = process.env.ADMIN_PATH || 'admin123';

// ============ Middleware ============
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============ إعدادات المتجر ============
let settings = {
    whatsapp: process.env.WHATSAPP_NUMBER || '213550000000',
    exchangeRate: parseInt(process.env.EXCHANGE_RATE) || 135,
    storeName: 'FibNo'
};

// ============ API Routes ============

// جلب الإعدادات
app.get('/api/settings', (req, res) => {
    res.json(settings);
});

// تحديث الإعدادات
app.put('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
});

// تسجيل دخول الأدمن
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASS) {
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    } else {
        res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }
});

// ============ Serve HTML Files ============

// الصفحة الرئيسية
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// صفحة تقديم الطلب
app.get('/order', (req, res) => {
    res.sendFile(path.join(__dirname, 'order.html'));
});

// لوحة التحكم (مسار مخصص من متغيرات البيئة)
app.get(`/${ADMIN_PATH}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// ============ Redirects ============

// إعادة توجيه index.html إلى /
app.get('/index.html', (req, res) => {
    res.redirect('/');
});

// إعادة توجيه order.html إلى /order
app.get('/order.html', (req, res) => {
    res.redirect('/order');
});

// إعادة توجيه المسارات القديمة للوحة التحكم
app.get('/admin', (req, res) => {
    res.redirect(`/${ADMIN_PATH}`);
});

app.get('/admin.html', (req, res) => {
    res.redirect(`/${ADMIN_PATH}`);
});

// ============ 404 Handler ============
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// ============ Start Server ============
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🌍 FibNo - وساطة شراء من AliExpress و Temu`);
    console.log(`📡 المتجر: http://localhost:${PORT}`);
    console.log(`📝 تقديم طلب: http://localhost:${PORT}/order`);
    console.log(`👑 لوحة التحكم: http://localhost:${PORT}/${ADMIN_PATH}`);
    console.log(`💱 سعر الصرف: 1$ = ${settings.exchangeRate} دج`);
    console.log(`📱 واتساب: ${settings.whatsapp}`);
    console.log('='.repeat(50));
});
