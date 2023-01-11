const httpStatus = require("http-status");
const { Cart, Product, User } = require("../models");
const ApiError = require("../utils/ApiError");

/**
 * Fetches cart for a user
 * - Fetch user's cart from Mongo
 * - If cart doesn't exist, throw ApiError
 * --- status code  - 404 NOT FOUND
 * --- message - "User does not have a cart"
 *
 * @param {User} user
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const getCartByUser = async (user) => {
    const cartItem = await Cart.findOne({ email: user.email });
    if (cartItem === null) throw new ApiError(httpStatus.NOT_FOUND, "User does not have a cart");
    return cartItem;
};

/**
 * Adds a new product to cart
 * - Get user's cart object using "Cart" model's findOne() method
 * --- If it doesn't exist, create one
 * --- If cart creation fails, throw ApiError with "500 Internal Server Error" status code
 *
 * - If product to add already in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product already in cart. Use the cart sidebar to update or remove product from cart"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - Otherwise, add product to user's cart
 *
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const addProductToCart = async (user, productId, quantity) => {
    const product = await Product.findById(productId);

    //throw error if product dont exist
    if (!product)
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Product doesn't exist in database"
        );

    const userCart = await Cart.findOne({ email: user.email });

    //craete new cart
    if (userCart === null) {
        try {
            const newCart = await Cart.create({
                email: user.email,
                cartItems: [
                    {
                        product,
                        quantity,
                    },
                ],
            });
            if (newCart === null) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'cart creation failed');
            return newCart;
        } catch (err) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
        }
    }

    //throw error if product is already added to cart
    const temp = userCart.cartItems.filter(
        (item) => item.product._id.toString() === productId
    );

    if (temp.length !== 0)
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Product already in cart. Use the cart sidebar to update or remove product from cart"
        );

    try {
        const newProduct = {
            product,
            quantity,
        };
        const updatedCart = new Cart(userCart)
        updatedCart.cartItems.push(newProduct)
        return await updatedCart.save();
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
};

/**
 * Updates the quantity of an already existing product in cart
 * - Get user's cart object using "Cart" model's findOne() method
 * - If cart doesn't exist, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart. Use POST to create cart and add a product"
 *
 * - If product to add not in "products" collection in MongoDB, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product doesn't exist in database"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * - Otherwise, update the product's quantity in user's cart to the new quantity provided and return the cart object
 *
 *
 * @param {User} user
 * @param {string} productId
 * @param {number} quantity
 * @returns {Promise<Cart>}
 * @throws {ApiError}
 */
const updateProductInCart = async (user, productId, quantity) => {
    const userCart = await Cart.findOne({ email: user.email });
    const product = await Product.findById(productId);

    if (userCart === null)
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "User does not have a cart. Use POST to create cart and add a product"
        );

    if (userCart.cartItems.length === 0)
        throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");

    if (product === null)
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            "Product doesn't exist in database"
        );

    try {
        const updateCart = new Cart(userCart)
        updateCart.cartItems.map((item, index) => {
            if (item.product._id.toString() === productId) {
                updateCart.cartItems[index].quantity = quantity
            }
        })
        return await updateCart.save();
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
};

/**
 * Deletes an already existing product in cart
 * - If cart doesn't exist for user, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "User does not have a cart"
 *
 * - If product to update not in user's cart, throw ApiError with
 * --- status code  - 400 BAD REQUEST
 * --- message - "Product not in cart"
 *
 * Otherwise, remove the product from user's cart
 *
 *
 * @param {User} user
 * @param {string} productId
 * @throws {ApiError}
 */
const deleteProductFromCart = async (user, productId) => {
    const userCart = await Cart.findOne({ email: user.email });

    if (userCart === null)
        throw new ApiError(httpStatus.BAD_REQUEST, "User does not have a cart");

    const temp = userCart.cartItems.filter(
        (item) => item.product._id.toString() === productId
    );
    if (temp.length === 0)
        throw new ApiError(httpStatus.BAD_REQUEST, "Product not in cart");
    try {
        return await Cart.findOneAndUpdate(
            { email: user.email },
            { $pull: { cartItems: { "product._id": productId } } },
            { new: true, multi: true }
        );
        
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, err.message);
    }
};

/**
 * Checkout a users cart.
 * On success, users cart must have no products.
 *
 * @param {User} user
 * @returns {Promise}
 * @throws {ApiError} when cart is invalid
 */
const checkout = async (user) => {

    const cartItem = await Cart.findOne({ email: user.email })
    if (cartItem === null) throw new ApiError(httpStatus.NOT_FOUND, "cart not found")

    const cart = new Cart(cartItem);
    if (cart.cartItems.length == 0) throw new ApiError(httpStatus.BAD_REQUEST, "cart is empty")

    if (await user.hasSetNonDefaultAddress() === false) throw new ApiError(httpStatus.BAD_REQUEST, "address is not set")

    const totalCost = cart.cartItems.reduce(function (total, item) {
        return total + (item.product.cost * item.quantity)
    }, 0)

    if (totalCost > user.walletMoney) throw new ApiError(httpStatus.BAD_REQUEST, "wallet balance is insufficient")

    cart.cartItems = []

    return await cart.save()
};

module.exports = {
    getCartByUser,
    addProductToCart,
    updateProductInCart,
    deleteProductFromCart,
    checkout,
};