const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const { addProduct, updateProduct, deleteProduct, addBatch, getProductByName, getAllBatch, addBanner, getProductById, deleteBatch, updateBatch, updateStatus, getDashboardContent, deleteNotification, checkExpBatch, addNotification, checkStockproduct, getAllnotification, getAllOrder, getAllBanner, getBatchById, getBannerById, deleteBanner, updateBanner, addUser, checkCollectionGroup } = require("../../../services/firestore");
const { uploadImageBanner, uploadProductImage } = require("../../../services/cloudStorage");
const InputError = require('../../../exceptions/InputError');
const Boom = require('@hapi/boom');
const { Timestamp } = require('@google-cloud/firestore');

//clear
const adminRegisterHandler = async (req, h) => {
    const { name, email, password, phone_number } = req.payload;
    if (!name) throw new InputError("Required Name Value");
    if (!email) throw new InputError("Required Email Value");
    if (!password) throw new InputError("Required Password Value");
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
        role: "admin",
        create_at,
        update_at,
    }

    await addUser(newUser);

    return h
        .response({
            status: "success",
            message: "user adding succesfully",
            userId: user_id
        })
        .code(201);
}

//clear
const addProductHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");
    const data = req.payload;
    if (!data) throw new InputError("Missing Required Value");
    const productId = nanoid(5);
    const create_at = new Date().toISOString();
    const update_at = create_at;

    const base64Data = data.image_url.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");
    const imgUrl = await uploadProductImage(buffer, productId); 

    const newProduct = {
        product_id: productId,
        ...data,
        image_url: imgUrl,
        status: "available",
        total_stock: 0,
        create_at,
        update_at,
    }

    await addProduct(newProduct);

    return h.response({
        status: "success",
        message: "product added successfully",
        productId: productId
    }).code(201);
}

//clear
const updateProductHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const data = req.payload;
    const { productId } = req.params;
    const newData = {
        ...data,
        update_at: new Date().toISOString(),
    };

    await updateProduct(productId, newData);

    return h.response({
        status: "success",
        message: "Product Update Successfully",
    }).code(202)
}

//clear
const deleteProductHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { productId } = req.params;

    await deleteProduct(productId);

    return h.response({
        status: "success",
        message: "product deleted successfully"
    }).code(203);
}

//clear
const getBatchByIdHandler = async (req, h) => {
    const { productId, batchId } = req.params;
    const batch = await getBatchById(productId, batchId);

    return h.response({
        status: "success",
        batch
    });
}

//clear
const addBatchHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { batch_code, exp_date, stock } = req.payload;
    const { productId } = req.params;
    
    // if (!data) throw new InputError("Missing Required Value");

    const product = await getProductById(productId);

    const batchId = nanoid(5);
    const create_at = new Date().toISOString();
    const update_at = create_at;

    const newBatch = {
        batch_id: batchId,
        batch_code,
        exp_date: Timestamp.fromDate(new Date(exp_date)),
        stock,
        status: "available",
        create_at,
        update_at,
    }

    await addBatch(product.product_id, newBatch);

    return h.response({
        status: "success",
        message: "added batch"
    })
}

//clear
const deleteBatchHandler =  async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { productId, batchId } = req.params;

    await deleteBatch(productId, batchId);

    return h.response({
        status: "success",
        message: "product delete successfully"
    });
}

//clear
const updateBatchHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const data = req.payload;
    const { batchId, productId } = req.params;
    const update_at = new Date().toISOString();
    const newBatch = {
        ...data,
        update_at,
    }

    await updateBatch(productId, batchId, newBatch);

    return h.response({
        status: "success",
        message: "success update batch"
    })
}

//clear
const getAllBannerHandler = async (_, h) => {
    const banners = await getAllBanner()

    return h.response({
        status: "success",
        message: "fetch data success",
        banners,
    })
}

const getBannerByIdHandler = async (req, h) => {
    const { bannerId } = req.params;
    const banner = await getBannerById(bannerId);

    return h.response({
        status: "success",
        message: "fetch data success",
        banner,
    })
}

//clear
const addBannerHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { image_url } = req.payload;
    if(!image_url) throw InputError("Missing Required Value");
    const banner_id = nanoid(5);

    const base64Data = image_url.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const banner_url = await uploadImageBanner(buffer, banner_id);

    const newBanner = {
        banner_id,
        banner_url,
    }

    await addBanner(newBanner);

    return h.response({
        status: "success",
        message: "banned has been added successfully"
    }).code(201);
}

const deleteBannerHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");
    const { bannerId } = req.params;

    await deleteBanner(bannerId);

    return h.response({
        status: "success",
        message: "banner deleted succesfully",
    })

}

const getAllOrderHandler = async (_, h) => {
    const orders = await getAllOrder();

    return h.response({
        status: "success",
        message: "fetch success",
        orders,
    })
}

//clear
const updateStatusOrderhandler = async (req, h) => {
    const token  = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");

    const { orderId } = req.params;
    const { status } = req.payload;

    const update_at = new Date().toISOString();
    const newStatus = {
        status,
        update_at
    }

    await updateStatus(orderId, newStatus);

    return h.response({
        status: "success",
        message: "success update status"
    });
}

//clear
const getDashboardContentHandler = async (_, h) => {
    const content = await getDashboardContent();
    return h.response({
        status: "success",
        message: "fetch data success",
        ...content,
    })
}

//clear
const getAllnotificationHandler = async (_, h) => {
    const notifications = await getAllnotification();
    return h.response({
        status: "success",
        message: "fetch data success",
        notifications
    })
}

//clear
const deleteNotificationHandler = async (req, h) => {
    const token = req.auth.user_id;
    if(!token) throw Boom.unauthorized("token not found");
    
    const { notifId } = req.params;
    
    await deleteNotification(notifId);

    return h.response({
        status: "success",
        message: "success delete notification"
    })
}

//clear
const checkExpBatchhandler = async (_, h) => {
    const notifId = nanoid(5);
    const create_at = new Date().toISOString();
    const { exp_batch, exp_soon } = await checkExpBatch();

    if (exp_batch.length !== 0) {
        for (const item of exp_batch) {
            const newNotif = {
                notification_id: notifId,
                ...item,
                category: "expired batch",
                message: "the batch is expired",
                create_at
            }
            await addNotification(notifId, newNotif);
        }
    }

    if (exp_soon.length !== 0) {
        for (const item of exp_soon) {
            const newNotif = {
                notification_id: notifId,
                ...item,
                category: "expired soon",
                message: "this batch will expired soon",
                create_at
            }
            await addNotification(notifId, newNotif);
        }
    }
    
    return h.response({
        status: "success",
        message: "fecth success",
        exp_soon: exp_soon.length,
        exp_batch: exp_batch.length,
    })
}

//clear
const checkStockProductHandler = async (_, h) => {
    const notifId = nanoid(5);
    const create_at = new Date().toISOString();
    const { empty_stock, empty_soon } = await checkStockproduct();

    if (empty_stock.length !== 0) {
        for (const item of empty_stock) {
            const newNotif = {
                notification_id: notifId,
                ...item,
                category: "out of stock",
                message: "the product is out of stock",
                create_at
            }
            await addNotification(notifId, newNotif);
        }
    }

    if (empty_soon.length !== 0) {
        for (const item of empty_soon) {
            const newNotif = {
                notification_id: notifId,
                ...item,
                category: "out of stock soon",
                message: "the product will out of stock soon",
                create_at
            }
            await addNotification(notifId, newNotif);
        }
    }
    
    return h.response({
        status: "success",
        message: "fecth success",
        empty_stock: empty_stock.length,
        empty_soon: empty_soon.length,
    })
}

const checkCollectionGroupHandler = async (_, h) => {
    const data = await checkCollectionGroup();

    return h.response({
        status: "success",
        data
    })
}

module.exports = { 
    adminRegisterHandler, addProductHandler, updateProductHandler, deleteProductHandler, addBatchHandler, 
    addBannerHandler, deleteBatchHandler, updateBatchHandler, updateStatusOrderhandler, getDashboardContentHandler,
    checkExpBatchhandler, deleteNotificationHandler, checkStockProductHandler, getAllnotificationHandler, getAllOrderHandler,
    getAllBannerHandler, getBatchByIdHandler, getBannerByIdHandler, deleteBannerHandler, checkCollectionGroupHandler
}