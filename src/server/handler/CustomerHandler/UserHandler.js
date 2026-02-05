const InputError = require('../../../exceptions/InputError');
const bcrypt = require("bcrypt");
const { nanoid } = require('nanoid');
const { updateProfile, updatePassword, getAllProduct, getProductById, getAllBanner, makeOrder, addOrderItem, checkoutMultiBatch, addHistory, addBatchRecap, addCart, getAllCart, getAllHistories, getUserOrder, getOrderById, getAllFavorite, getUserById, addFavorite, deleteFavorite, deleteCart, getUserByEmail, getUserByName, addUser, addAddress, getHomeContent, showBatchRecap, getCartById, getFavoriteById, getAllBatch, getAllOrderItem, getBatchRecap, getAddress, deleteAddress, updateAddress, getAddressById, getToolbarContent } = require("../../../services/firestore");
const orderFromCartHelper = require("../../../helper/orderFromCart");
const { signToken } = require("../../../helper/auth");
const Boom = require('@hapi/boom');

//login handler

//clear
const UserLoginHandler = async (req, h) => {
    const { name, password } = req.payload;
    if (!name || !password) {
        throw new InputError("Required Email or Password Data");
    }

    const user = await getUserByName(name);

    const hashPassword = user.password;
    const isMatch = await bcrypt.compare(password, hashPassword);
    if (!isMatch) return new InputError("Password Incorrect");

    const token = signToken(user.user_id);

    return h
        .response({
            status: "success",
            message: "Login Success",
            token,
        })
        .code(200);
}

//clear
const UserRegisterHandler = async (req, h) => {
    const { name, email, password, phone_number } = req.payload;
    if (!name) throw new InputError("Required Name Value to Register");
    if (!email) throw new InputError("Required Email Value to Register");
    if (!password) throw new InputError("Required Password Value to Register");
    if (!phone_number) throw new InputError("Required phone number Value to Register");

    const user_id = nanoid(10);
    const create_at = new Date().toISOString();
    const update_at = create_at;
    
    const hashPassword = await bcrypt.hash(password, 10);

    const newUser = {
        user_id,
        name,
        email,
        phone_number,
        password: hashPassword,
        role: "customer",
        create_at,
        update_at,
    }

    await addUser(newUser);

    return h
        .response({
            status: "success",
            message: "user adding succesfully",
            user_id: user_id
        })
        .code(201);

}

//clear
const addAddressHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { receiver, address, phone_number } = req.payload;

    if (!receiver) throw new InputError("Required receiver Value");
    if (!address) throw new InputError("Required Address Value");
    if (!phone_number) throw new InputError("Required phone number Value");

    const address_id = nanoid(5);
    const create_at = new Date().toISOString();
    const update_at = create_at;

    const data = {
        address_id,
        receiver,
        address,
        phone_number,
        create_at,
        update_at
    }

    await addAddress(token, data);

    return h
        .response({
            status: "success",
            message: "succesfully add address",
        })
        .code(201);
}

const updateAddressHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { addressId } = req.params;
    const data = req.payload;

    const newAddress = {
        ...data,
        update_at: new Date().toISOString()
    }

    await updateAddress(token, addressId, newAddress);

    return h.response({
        status: "success",
        message: "address updated succesfully"
    })
}

const deleteAddressHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { addressId } = req.params;

    await deleteAddress(token, addressId);

    return h.response({
        status: "success",
        message: "address deleted succesfully"
    })
}

//clear
const updateProfileHandler = async (req, h) => {
    const data = req.payload;
    const { userId } = req.params;
    if (!data) throw new InputError("Empty Field!!, please fill all required field");

    const newProfile = {
        ...data,
        update_at: new Date().toISOString(),
    }

    await updateProfile(userId, newProfile);
    return h.response({
        status: "success",
        message: "Profile Update Success",
    }).code(201);
}

//clear
const updatePasswordHandler = async (req, h) => {
    const { name, password, confirm_password } = req.payload;
    if (!name) throw new InputError("Required Username Value");
    if (!password) throw new InputError("Required password Value");
    if (!confirm_password) throw new InputError("Required confirm password Value");

    if (password !== confirm_password) throw new InputError("password and confirm password value not match, check again!!");

    const update_at = new Date().toISOString();
    const hashPassword = await bcrypt.hash(password, 10);

    const newPassword = {
        password: hashPassword,
        update_at,
    }

    await updatePassword(name, newPassword);

    return h.response({
        status: "success",
        message: "update password success"
    }).code(201)
}

//clear
const getAllProductHandler = async (_, h) => {
    const products = await getAllProduct();

    return h.response({
        status: "success",
        message: "request successfully",
        products,
    }).code(200);
}

//clear
const getProductByIdHandler = async (req, h) => {
    const { productId } = req.params;
    const product = await getProductById(productId);
    const batches = await getAllBatch(productId);

    return h.response({
        status: "success",
        message: "request successfully",
        product: {
            ...product,
            batches: batches !== 0 ? batches : [],
        }
    }).code(200);
}

//clear
const getHomeContentHandler = async (_, h) => {
    const homeContent = await getHomeContent();
    return h.response({
        status: "success",
        message: "request success",
        ...homeContent,
    }).code(200);
}

//clear
const getProductExpHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const data = req.payload;
    const productRecap = [];
    if (Array.isArray(data)) {
        for (const product of data) {
            const batchRecap = await showBatchRecap(product.product_id, product.qty);
            productRecap.push({
                ...product,
                batchRecap,
            })
        }
    } else {
        const batchRecap = await showBatchRecap(data.product_id, data.qty);
        productRecap.push({
            ...data,
            batchRecap,
        })
    }


    return h.response({
        status: "success",
        message: "fetch success",
        productRecap,
    }).code(200);
}

//clear
const makeOrderHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const data = req.payload;
    const { from } = req.params;

    const orderId = nanoid(5);
    const create_at = new Date().toISOString();
    const update_at = create_at;

    const newOrder = {
        order_id : orderId,
        customer_id: token,
        status: "menunggu konfirmasi",
        payment: data.payment,
        ongkir: data.ongkir,
        phone_number: data.phone_number,
        total_product: data.total_product,
        total_item: data.total_item,
        total_price: data.total_price,
        receiver: data.receiver,
        address: data.address,
        create_at,
        update_at
    };

    await makeOrder(newOrder);

    await orderFromCartHelper(token, orderId, data.products, create_at, from);

    return h.response({
        status: "success",
        message: "Success Create Order",
    })
}

//clear
const addCartHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const data = req.payload;

    if(!data) throw new InputError("missing required value");

    const create_at = new Date().toISOString();
    const update_at = create_at;

    const newCart = {
        ...data,
        create_at,
        update_at,
    }

    await addCart(token, newCart);

    return h.response({
        status: "success",
        message: "succesfully add to cart"
    }).code(201);
}

//clear
const getAllCarthandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const carts = await getAllCart(token);

    return h.response({
        status: "success",
        message: "request success",
        carts,
    })
}

//clear
const getHistoryHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const histories = await getAllHistories(token);

    return h.response({
        status: "success",
        message: "request success",
        histories,
    });
}

//clear
const getUserOrderHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const orders = await getUserOrder(token)

    return h.response({
        status: "success",
        message: "request success",
        orders,
    });
}

//clear
const getOrderByIdHandler = async (req, h) => {
    const { orderId } = req.params;
    const order = await getOrderById(orderId);
    const items = await getAllOrderItem(orderId);
    
    const orderItem = [];

    for (const product of items) {
        const recaps= await getBatchRecap(orderId, product.product_id);
        orderItem.push({
            ...product,
            recaps,
        })
    }

    return h.response({
        status: "success",
        message: "request fetch success",
        order : {
            ...order,
            orderItem
        }
    });
}

//clear
const getAllFavoriteHandler = async (req, h) => {
    const userId = req.auth.user_id;
    if(!userId) throw Boom.unauthorized("token not found");

    const favorites = await getAllFavorite(userId);

    return h.response({
        status: "success",
        message: "request fetch success",
        favorites,
    })
}

//clear
const getProfileHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const user = await getUserById(token);
    const address = await getAddress(token);

    return h.response({
        status: "success",
        message: "success fetch data",
        user: {
            ...user,
            address
        }
    })
}

//clear
const getAddressHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const address = await getAddress(token);
    return h.response(address)
}


//clear
const getAddressByIdHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { addressId } = req.params;

    const address = await getAddressById(token, addressId);

    return h.response({
        status: "success",
        address
    })
}

//clear
const addFavoritehandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const data = req.payload;
    const create_at = new Date().toISOString();

    const newFavorite = {
        ...data,
        create_at,
    }

    await addFavorite(token, newFavorite);

    return h.response({
        status: "Success",
        message: "success add to favorite"
    })
}

//clear
const deleteFavoriteHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { productId } = req.params;

    await deleteFavorite(token, productId);

    return h.response({
        status: "success",
        message: "product delete successfully"
    })
}

//clear
const deleteCartHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const products = req.payload;

    for (const item of products) {
        await deleteCart(token, item);
    }

    return h.response({
        status: "success",
        message: "product deleted successfully"
    }).code(201);
}

//clear
const getCartByIdHandler =  async (req, h) => {
    const userId = req.auth.user_id;
    if(!userId) throw Boom.unauthorized("token not found");

    const { productId } = req.params;
    const inCart = await getCartById(userId, productId);

    return h.response({
        status: "success",
        inCart,
    })
}

//clear
const getFavoriteByIdHandler =  async (req, h) => {
    const userId = req.auth.user_id;
    if(!userId) throw Boom.unauthorized("token not found");
    
    const { productId } = req.params;
    const inFavorite = await getFavoriteById(userId, productId);

    return h.response({
        status: "success",
        inFavorite,
    })
}

const getToolbarContentHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { cartCount, favoriteCount } = await getToolbarContent(token);

    return h.response({
        status: "success",
        cartCount,
        favoriteCount,
    })
}

module.exports = { 
    UserLoginHandler, UserRegisterHandler, addAddressHandler, updateProfileHandler, updatePasswordHandler, 
    getAllProductHandler, getProductByIdHandler, getHomeContentHandler, makeOrderHandler, addCartHandler,
    getAllCarthandler, getHistoryHandler, getUserOrderHandler, getOrderByIdHandler, getAllFavoriteHandler,
    getProfileHandler, addFavoritehandler, deleteFavoriteHandler, deleteCartHandler, getProductExpHandler,
    getCartByIdHandler, getFavoriteByIdHandler, getAddressHandler, deleteAddressHandler, updateAddressHandler,
    getAddressByIdHandler, getToolbarContentHandler
}