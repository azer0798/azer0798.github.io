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

// ============ API Routes ============

// الإعدادات (مخزنة في متغير محلي - يمكن تطويرها لاحقاً)
let settings = {
    whatsapp: process.env.WHATSAPP_NUMBER || '213550000000',
    storeName: 'FibNo'
};

app.get('/api/settings', (req, res) => {
    res.json(settings);
});

app.put('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
});

// التحقق من كلمة مرور الأدمن
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASS) {
        res.json({ success: true, message: 'تم تسجيل الدخول بنجاح' });
    } else {
        res.status(401).json({ success: false, message: 'كلمة المرور غير صحيحة' });
    }
});

// ============ Serve HTML ============
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/order', (req, res) => res.sendFile(path.join(__dirname, 'order.html')));

// لوحة التحكم بمسار مخصص
app.get(`/${ADMIN_PATH}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// إعادة توجيه المسارات
app.get('/order.html', (req, res) => res.redirect('/order'));
app.get('/admin', (req, res) => res.redirect(`/${ADMIN_PATH}`));
app.get('/admin.html', (req, res) => res.redirect(`/${ADMIN_PATH}`));

// 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// ============ Start Server ============
app.listen(PORT, () => {
    console.log('=' .repeat(50));
    console.log(`🌍 FibNo Store`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`👑 Admin: http://localhost:${PORT}/${ADMIN_PATH}`);
    console.log(`🔑 Admin Pass: ${ADMIN_PASS === 'admin123' ? 'Default' : 'Custom'}`);
    console.log('=' .repeat(50));
});
