// models/Product.js
const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  new_price: {
    type: Number,
    required: true,
  },
  old_price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  available: {
    type: Boolean,
    default: true,
  },
});

let Product;

try {
  Product = mongoose.model('Product');
} catch (error) {
  if (error.name === 'MissingSchemaError') {
    Product = mongoose.model('Product', ProductSchema);
  } else {
    throw error;
  }
}

module.exports = Product;