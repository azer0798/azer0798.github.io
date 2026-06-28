const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// API routes
app.get('/api/products', (req, res) => {
    const products = [
        { id: 1, name: "هاتف ذكي", price: 599, category: "electronics" },
        { id: 2, name: "سماعات لاسلكية", price: 199, category: "electronics" },
        { id: 3, name: "كتاب تعلم البرمجة", price: 49, category: "books" },
        { id: 4, name: "قميص عصري", price: 89, category: "clothing" }
    ];
    res.json(products);
});

// Serve HTML files
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/products', (req, res) => res.sendFile(path.join(__dirname, 'products.html')));
app.get('/cart', (req, res) => res.sendFile(path.join(__dirname, 'cart.html')));

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
