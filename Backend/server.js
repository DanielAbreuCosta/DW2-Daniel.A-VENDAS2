// Backend server for vendas site
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory data
let products = [];
let sales = [];

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Add a new product
app.post('/api/products', (req, res) => {
  const { name, price, estoque, descricao } = req.body;
  if (!name || !price || estoque === undefined) {
    return res.status(400).json({ error: 'Name, price e estoque são obrigatórios' });
  }
  const product = { id: Date.now(), name, price, estoque: parseInt(estoque), descricao: descricao || '' };
  products.push(product);
  res.status(201).json(product);
});

// Register a sale
app.post('/api/sales', (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items required' });
  }
  const sale = { id: Date.now(), items, date: new Date() };
  sales.push(sale);
  res.status(201).json(sale);
});

// Get all sales
app.get('/api/sales', (req, res) => {
  res.json(sales);
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
