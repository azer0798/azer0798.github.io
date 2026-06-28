const express = require('express');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const app = express();

// ============ متغيرات البيئة من Render ============
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI;
const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
const CLOUDINARY_KEY = process.env.CLOUDINARY_KEY;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_SECRET;
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const ADMIN_PATH = process.env.ADMIN_PATH || 'admin123';

// ============ إعداد Cloudinary ============
if (CLOUDINARY_NAME && CLOUDINARY_KEY && CLOUDINARY_SECRET) {
    cloudinary.config({
        cloud_name: CLOUDINARY_NAME,
        api_key: CLOUDINARY_KEY,
        api_secret: CLOUDINARY_SECRET
    });
    console.log('✅ Cloudinary configured');
} else {
    console.log('⚠️ Cloudinary not configured - using local images');
}

// ============ إعداد Multer ============
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// ============ Middleware ============
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ============ MongoDB Connection ============
if (MONGO_URI) {
    mongoose.connect(MONGO_URI)
        .then(() => console.log('✅ MongoDB متصل بنجاح'))
        .catch(err => console.error('❌ خطأ في اتصال MongoDB:', err));
} else {
    console.log('⚠️ MONGO_URI not set - using localStorage only');
}

// ============ MongoDB Models ============
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    originalPrice: Number,
    category: { type: String, default: 'electronics' },
    description: String,
    image: String,
    imagePublicId: String,
    createdAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
    customer: {
        name: { type: String, required: true },
        phone: { type: String, required: true },
        email: String,
        wilaya: String,
        address: String,
        notes: String
    },
    products: [{
        productId: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String
    }],
    total: Number,
    payment: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const settingsSchema = new mongoose.Schema({
    whatsapp: { type: String, default: '213550000000' },
    storeName: { type: String, default: 'FibNo' },
    currency: { type: String, default: 'دج' }
});

const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const Settings = mongoose.model('Settings', settingsSchema);

// ============ Helper: Check MongoDB Connection ============
function isMongoConnected() {
    return mongoose.connection.readyState === 1;
}

// ============ API Routes ============

// المنتجات
app.get('/api/products', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.json([]);
        }
        const products = await Product.find().sort({ createdAt: -1 });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في جلب المنتجات' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(500).json({ error: 'قاعدة البيانات غير متصلة' });
        }
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في جلب المنتج' });
    }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(500).json({ error: 'قاعدة البيانات غير متصلة' });
        }
        
        let imageUrl = '';
        let imagePublicId = '';
        
        if (req.file) {
            // إذا كانت Cloudinary متصلة، ارفع الصورة
            if (CLOUDINARY_NAME) {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'fibno/products' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(req.file.buffer);
                });
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } else {
                // تحويل الصورة إلى base64
                const base64 = req.file.buffer.toString('base64');
                imageUrl = `data:${req.file.mimetype};base64,${base64}`;
            }
        } else if (req.body.image) {
            imageUrl = req.body.image;
        }
        
        const product = new Product({
            name: req.body.name,
            price: req.body.price,
            originalPrice: req.body.originalPrice || undefined,
            category: req.body.category || 'electronics',
            description: req.body.description || '',
            image: imageUrl,
            imagePublicId: imagePublicId
        });
        
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'خطأ في إضافة المنتج' });
    }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(500).json({ error: 'قاعدة البيانات غير متصلة' });
        }
        
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
        
        let imageUrl = product.image;
        let imagePublicId = product.imagePublicId;
        
        if (req.file) {
            // حذف الصورة القديمة من Cloudinary
            if (product.imagePublicId && CLOUDINARY_NAME) {
                await cloudinary.uploader.destroy(product.imagePublicId);
            }
            
            if (CLOUDINARY_NAME) {
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        { folder: 'fibno/products' },
                        (error, result) => {
                            if (error) reject(error);
                            else resolve(result);
                        }
                    );
                    uploadStream.end(req.file.buffer);
                });
                imageUrl = result.secure_url;
                imagePublicId = result.public_id;
            } else {
                const base64 = req.file.buffer.toString('base64');
                imageUrl = `data:${req.file.mimetype};base64,${base64}`;
            }
        } else if (req.body.image) {
            imageUrl = req.body.image;
        }
        
        product.name = req.body.name || product.name;
        product.price = req.body.price || product.price;
        product.originalPrice = req.body.originalPrice || undefined;
        product.category = req.body.category || product.category;
        product.description = req.body.description || product.description;
        product.image = imageUrl;
        product.imagePublicId = imagePublicId;
        
        await product.save();
        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'خطأ في تحديث المنتج' });
    }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(500).json({ error: 'قاعدة البيانات غير متصلة' });
        }
        
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ error: 'المنتج غير موجود' });
        
        // حذف الصورة من Cloudinary
        if (product.imagePublicId && CLOUDINARY_NAME) {
            await cloudinary.uploader.destroy(product.imagePublicId);
        }
        
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'تم حذف المنتج بنجاح' });
    } catch (error) {
        res.status(500).json({ error: 'خطأ في حذف المنتج' });
    }
});

// الطلبات
app.get('/api/orders', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.json([]);
        }
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في جلب الطلبات' });
    }
});

app.post('/api/orders', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(500).json({ error: 'قاعدة البيانات غير متصلة' });
        }
        
        const order = new Order({
            customer: req.body.customer,
            products: req.body.products,
            total: req.body.total,
            payment: req.body.payment || 'cash'
        });
        
        await order.save();
        res.status(201).json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'خطأ في إنشاء الطلب' });
    }
});

app.put('/api/orders/:id/status', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(500).json({ error: 'قاعدة البيانات غير متصلة' });
        }
        
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status: req.body.status },
            { new: true }
        );
        if (!order) return res.status(404).json({ error: 'الطلب غير موجود' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في تحديث حالة الطلب' });
    }
});

// الإعدادات
app.get('/api/settings', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.json({ whatsapp: '213550000000', storeName: 'FibNo', currency: 'دج' });
        }
        let settings = await Settings.findOne();
        if (!settings) {
            settings = await Settings.create({});
        }
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في جلب الإعدادات' });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        if (!isMongoConnected()) {
            return res.status(500).json({ error: 'قاعدة البيانات غير متصلة' });
        }
        const settings = await Settings.findOneAndUpdate(
            {},
            req.body,
            { new: true, upsert: true }
        );
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: 'خطأ في تحديث الإعدادات' });
    }
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
app.get('/products', (req, res) => res.sendFile(path.join(__dirname, 'products.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'cart.html')));

// لوحة التحكم - مسار مخصص من متغيرات البيئة
app.get(`/${ADMIN_PATH}`, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

// إعادة توجيه /admin إلى المسار المخصص
app.get('/admin', (req, res) => {
    res.redirect(`/${ADMIN_PATH}`);
});

// 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// ============ Start Server ============
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 FibNo Store`);
    console.log(`📡 Server: http://localhost:${PORT}`);
    console.log(`👑 Admin: http://localhost:${PORT}/${ADMIN_PATH}`);
    console.log(`💾 MongoDB: ${MONGO_URI ? 'Configured' : 'Not set'}`);
    console.log(`☁️ Cloudinary: ${CLOUDINARY_NAME ? 'Configured' : 'Not set'}`);
    console.log(`🔑 Admin Pass: ${ADMIN_PASS === 'admin123' ? 'Default (admin123)' : 'Custom'}`);
    console.log('='.repeat(50));
});
