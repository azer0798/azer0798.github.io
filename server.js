const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();

const PORT = process.env.PORT || 3000;
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_PATH = process.env.ADMIN_PATH || 'admin123';

app.use(express.json());
app.use(express.static(path.join(__dirname)));

let settings = {
    whatsapp: process.env.WHATSAPP_NUMBER || '213550000000',
    exchangeRate: parseInt(process.env.EXCHANGE_RATE) || 250,
    storeName: 'FibNo'
};

app.get('/api/settings', (req, res) => res.json(settings));

app.put('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    res.json(settings);
});

app.post('/api/admin/login', (req, res) => {
    if (req.body.password === ADMIN_PASS) {
        res.json({ success: true, message: 'تم تسجيل الدخول' });
    } else {
        res.status(401).json({ success: false, message: 'كلمة مرور خاطئة' });
    }
});

function sendFileSafe(res, filePath, fallbackPath) {
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else if (fallbackPath && fs.existsSync(fallbackPath)) {
        res.sendFile(fallbackPath);
    } else {
        res.status(200).send(`
            <!DOCTYPE html><html lang="ar" dir="rtl">
            <head><meta charset="UTF-8"><title>FibNo</title>
            <style>body{font-family:sans-serif;text-align:center;padding:50px;background:#f8f9fa;}
            h1{color:#667eea;}</style></head>
            <body><h1>🛫 FibNo</h1><p>الملف غير موجود</p>
            <a href="/" style="color:#667eea;">العودة</a></body></html>
        `);
    }
}

app.get('/', (req, res) => sendFileSafe(res, path.join(__dirname, 'index.html')));
app.get('/order', (req, res) => sendFileSafe(res, path.join(__dirname, 'order.html'), path.join(__dirname, 'index.html')));
app.get(`/${ADMIN_PATH}`, (req, res) => sendFileSafe(res, path.join(__dirname, 'admin.html'), path.join(__dirname, 'index.html')));

app.get('/index.html', (req, res) => res.redirect('/'));
app.get('/order.html', (req, res) => res.redirect('/order'));
app.get('/admin', (req, res) => res.redirect(`/${ADMIN_PATH}`));
app.get('/admin.html', (req, res) => res.redirect(`/${ADMIN_PATH}`));

app.use((req, res) => {
    if (fs.existsSync(path.join(__dirname, 'index.html'))) {
        res.status(404).sendFile(path.join(__dirname, 'index.html'));
    } else {
        res.status(404).send('<h1>404</h1><a href="/">العودة</a>');
    }
});

app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🛫 FibNo - وساطة AliExpress و Temu`);
    console.log(`📡 http://localhost:${PORT}`);
    console.log(`📝 طلب: http://localhost:${PORT}/order`);
    console.log(`👑 تحكم: http://localhost:${PORT}/${ADMIN_PATH}`);
    console.log(`💱 الصرف: 1$ = ${settings.exchangeRate} دج`);
    
    const files = ['index.html', 'order.html', 'admin.html', 'style.css', 'script.js', 'admin.js'];
    console.log('\n📁 فحص الملفات:');
    files.forEach(file => {
        const exists = fs.existsSync(path.join(__dirname, file));
        console.log(`   ${exists ? '✅' : '❌'} ${file}`);
    });
    console.log('='.repeat(50));
});
