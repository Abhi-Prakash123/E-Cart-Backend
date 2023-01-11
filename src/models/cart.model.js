const mongoose = require('mongoose');
const { productSchema } = require('./product.model');

const cartSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    cartItems: [
      {
        product: productSchema,
        quantity: Number
      }
    ],
  },
  {
    timestamps: false,
  }
);


/**
 * @typedef Cart
 */
const Cart = mongoose.model('Cart', cartSchema);

module.exports.Cart = Cart;