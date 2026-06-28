const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_PATH = process.env.ADMIN_PATH || 'admin123';

app.use(express.json());
app.use(express.static(path.join(__dirname)));

let settings = {
    whatsapp: process.env.WHATSAPP_NUMBER || '213550000000',
    exchangeRate: parseInt(process.env.EXCHANGE_RATE) || 135,
    storeName: 'FibNo'
};

app.get('/api/settings', (req, res) => res.json(settings));

app.put('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
});

app.post('/api/admin/login', (req, res) => {
    if (req.body.password === ADMIN_PASS) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

// المسارات الرئيسية
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', (req, res) => res.redirect('/'));

// صفحة الطلب - هذا المهم
app.get('/order', (req, res) => res.sendFile(path.join(__dirname, 'order.html')));
app.get('/order.html', (req, res) => res.redirect('/order'));

// لوحة التحكم
app.get(`/${ADMIN_PATH}`, (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));
app.get('/admin', (req, res) => res.redirect(`/${ADMIN_PATH}`));
app.get('/admin.html', (req, res) => res.redirect(`/${ADMIN_PATH}`));

// 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🌍 FibNo - وساطة AliExpress و Temu`);
    console.log(`📡 http://localhost:${PORT}`);
    console.log(`📝 طلب: http://localhost:${PORT}/order`);
    console.log(`👑 تحكم: http://localhost:${PORT}/${ADMIN_PATH}`);
    console.log(`💱 الصرف: ${settings.exchangeRate} دج/$`);
    console.log('='.repeat(50));
});
