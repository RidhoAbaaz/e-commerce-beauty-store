const { Firestore, Timestamp } = require('@google-cloud/firestore');
const Boom = require('@hapi/boom');
const getNextMonthRange = require('../helper/getMonthRange');
const InputError = require('../exceptions/InputError');
const { deleteProductImage, deleteImageFromBucket } = require('./cloudStorage');


const db = new Firestore({
    keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

//clear
const getUserByName = async (username) => {
    try {
        const userAccount = await db.collection("users").where("name", "==", username).limit(1).get();
        if (userAccount.empty) throw new Error("user not found");

        const user = userAccount.docs[0].data();
        return user;
    } catch (error) {
        if(error instanceof InputError) throw error;
        throw Boom.internal(error.messsage);
    }
};

//clear
const getUserById = async (userId) => {
    const userAccount = await db.collection("users").doc(userId).get();
    if (!userAccount.exists) throw Boom.internal("user not found");

    return userAccount.data();
};

//clear
const addUser = async (data) => {
    try {
        const collection = db.collection("users");
        const isExist = await collection.where("name", "==", data.name).get();
        if (!isExist.empty) throw new InputError("User Already Exist");
    
        await collection.doc(data.user_id).set(data);
    } catch (error) {
        if(error instanceof InputError) throw error;
        throw Boom.internal(error);
    }
}

//clear
const updateProfile = async (userId, data) => {
    try {
        const user = await db.collection("users").doc(userId).get();
        if (!user.exists) throw new InputError("user not found");

        await user.ref.update(data);
    } catch (error) {
        if(error instanceof InputError) throw error
        throw Boom.internal(error.message);
    }
}

//clear
const getAddress = async (userId) => {
    try {
        const user = db.collection("users").doc(userId);
        const address = await user.collection("addresses").get();
    
        return address.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getAddressById = async (userId, addressId) => {
    try {
        const user = db.collection("users").doc(userId);
        const address = await user.collection("addresses").doc(addressId).get();
    
        return address.data();
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const addAddress = async (userId, data) => {
    try {
        const user = await db.collection("users").doc(userId).get();
        if(!user.exists) return InputError("user not found");

        const addressCollection = user.ref.collection("addresses");
        await addressCollection.doc(data.address_id).set(data);
    } catch (error) {
        if(error instanceof InputError) throw error;
        throw Boom.internal(error.message);
    }
}

const deleteAddress = async (userId, addressId) => {
    try {
        const user = db.collection("users").doc(userId);
        await user.collection("addresses").doc(addressId).delete();
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

const updateAddress = async (userId, addressId, data) => {
    try {
        const user = db.collection("users").doc(userId);
        const address = user.collection("addresses").doc(addressId);
        await address.update(data)
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const updatePassword = async (username, data) => {
    try {
        const user = await getUserByName(username);
        if(!user) throw new InputError("user not found");

        const document = db.collection("users").doc(user.user_id); 
        await document.update(data);
    } catch (error) {
        if(error instanceof InputError) throw error;
        throw Boom.internal(error.message);
    }
}

//clear
const addProduct = async (data) => {
    try {
        const collection = db.collection("products");
        const isExist = await collection.where("name", "==", data.name).get();
        if (!isExist.empty) throw new InputError("Product Already Exist");

        await collection.doc(data.product_id).set(data);
    } catch (error) {
        if(error instanceof InputError) throw error;
        throw Boom.internal(error.message);
    }
}

//clear
const getProductByName = async (name) => {
    const productSnapshoot = await db.collection("products").where("name", "==", name).get();
    if(productSnapshoot.empty) throw Boom.internal("product not found");
    
    const product = productSnapshoot.docs[0].data();
    return product;
}

//clear
const updateProduct = async (productId, data) => {
    try {
        const product = db.collection("products").doc(productId);
        await product.update(data);
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const deleteProduct = async (id) => {
    try {
        const product = await db.collection("products").doc(id).get();
        
        await deleteImageFromBucket(product.data().image_url);
        await db.recursiveDelete(product.ref)
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getAllBatch = async (productId) => {
    try {
        const product = db.collection("products").doc(productId);
        const batchCollection = await product.collection("batches").orderBy("exp_date", "asc").get();

        // return batchCollection.docs.map(item => item.data());
        return batchCollection.docs.map(item => {
            const data = item.data()

            return {
                ...data,
                exp_date: data.exp_date.toDate().toISOString().split('T')[0]
            }
        });
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getBatchById = async (productId, batchId) => {
    try {
        const product = db.collection("products").doc(productId);
        const batch = await product.collection("batches").doc(batchId).get();

        const data = batch.data();
        return {
            ...data,
            exp_date: data.exp_date.toDate().toISOString().split('T')[0]
        }
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const addBatch = async (productId, data) => {
    return db.runTransaction(async (tx) => {
        const product = db.collection("products").doc(productId);
        const batch = product.collection("batches").doc(data.batch_code);

        const productSnap = await tx.get(product);
        const batchSnap = await tx.get(batch);

        const stokeBefore = productSnap.data().total_stock;

        if(batchSnap.exists) throw new InputError("batch already exist");
        
        tx.set(batch, data);
        tx.update(product, {total_stock: stokeBefore + data.stock});

    });
}


//clear
const updateBatch = async (productId, batchId, data) => {
    try {
        const product = db.collection("products").doc(productId);
        const batch = product.collection("batches").doc(batchId);
        
        if(!batch) throw Boom.internal("Batch Not Found");

        const productSnap = await product.get();

        await batch.update(data);

        const allBatch = await getAllBatch(productId);
        const newTotalStock = allBatch.reduce((acc, item) => acc + item.stock, 0);

        if (newTotalStock !== productSnap.data().total_stock) {
            await product.update({
                total_stock: newTotalStock
            })
        }
    } catch (error) {
        throw Boom.internal(error.message)
    }
}

//clear
const deleteBatch = async (productId, batchId) => {
    try {
        const product = db.collection("products").doc(productId);
        const batch = product.collection("batches").doc(batchId);

        const productSnap = await product.get();
        const batchSnap = await batch.get();


        if(!batch) throw Boom.notFound("Batch Not Found");

        await batch.delete();
        await product.update({
            total_stock: productSnap.data().total_stock - batchSnap.data().stock
        })
    } catch (error) {
        throw error;
    }
}

//clear
const updateStatus = async (orderId, data) => {
    try {
        const order = await db.collection("orders").doc(orderId).get();
        if(!order.exists) throw Boom.notFound("order not found")
    
        await order.ref.update(data);
    } catch (error) {
        throw error;
    }
}

//clear
const getAllProduct = async () => {
    try {
        const productCollection = await db.collection("products").get();
        
        if(productCollection.empty) return [];
        
        return productCollection.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getProductById = async (productId) => {
    const product = await db.collection("products").doc(productId).get();
    if(!product.exists) throw Boom.internal("product not found");
    
    return product.data();
}

//clear
const getHomeContent = async () => {
    try {
        const [products, discountProduct, banners] = await Promise.all([
            db.collection("products").where("discount", "==", 0).limit(10).get(),
            db.collection("products").where("discount", ">", 0).get(),
            getAllBanner()
        ])
        
        const response = {
            products: products.docs.map(item => item.data()),
            discountProducts: discountProduct.docs.map(item => item.data()),
            banners,
        }
        
        return response;
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const addBanner = async (data) => {
    try {
        const bannerCollection = db.collection("banners");
        const isExist = await bannerCollection.where("banner_url", "==", data.banner_url).get();

        if(!isExist.empty) throw new InputError("image already exist");

        await bannerCollection.doc(data.banner_id).set(data);
    } catch (error) {
        throw error;
    }
}

const deleteBanner = async (bannerId) => {
    try {
        const banner = await db.collection("banners").doc(bannerId).get();

        await deleteImageFromBucket(banner.data().banner_url);
        await banner.ref.delete();
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getAllBanner = async () => {
    try {
        const banner = await db.collection("banners").get();
        if (banner.empty) return [];

        return banner.docs.map(item => item.data());
    } catch (error) {
        throw error;
    }
}

const getBannerById = async (bannerId) => {
    try {
        const banner = await db.collection("banners").doc(bannerId).get()
        if(!banner.exists) throw new InputError("document not found")
        
        return banner.data();
    } catch (error) {
        if (error instanceof InputError) throw error;
        throw Boom.internal(error.message);
    }
}

//clear
const makeOrder = async (data) => {
    try {
        const orderCollection = db.collection("orders");
        await orderCollection.doc(data.order_id).set(data);
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

const getAllOrderItem = async (orderId) => {
    try {
        const order = db.collection("orders").doc(orderId);
        const items = await order.collection("items").get();

        return items.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.message)
    }
}

//clear
const addOrderItem = async (orderId, data) => {
    try {
        const orderCollection = db.collection("orders").doc(orderId);
        const itemsCollection = orderCollection.collection("items");

        await itemsCollection.doc(data.product_id).set(data);
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getBatchRecap = async (orderId, productId) => {
    try {
        const order = db.collection("orders").doc(orderId);
        const item = order.collection("items").doc(productId);
        const recap = await item.collection("recaps").get();

        return recap.docs.map(item => item.data());
    } catch (error) {
        
    }
}

//clear
const addBatchRecap = async (orderId, productId, data) => {
    try {
        const orderCollection = db.collection("orders").doc(orderId);
        const itemsCollection = orderCollection.collection("items").doc(productId);
    
        const recap = itemsCollection.collection('recaps');
        await recap.doc(data.batch_code).set(data);
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const showBatchRecap = async (productId, qtyNeeded) => {
    return db.runTransaction(async (tx) => {
        const today = Timestamp.now();

        const product = db.collection("products").doc(productId);
        const batchCollection = product.collection("batches");

        const batchSnapshoot = await tx.get(
            batchCollection.orderBy("exp_date", "asc")
        );

        if(batchSnapshoot.empty) throw new Error("Batch Not Found");

        let qtyRemaining = qtyNeeded;
        const batchRecap = [];

        for (const doc of batchSnapshoot.docs) {
            if(qtyRemaining <= 0) break;

            const batch = doc.data();
            const stock = Number(batch.stock ?? 0);
            if(stock <= 0 || batch.exp_date < today) continue;

            const take = Math.min(stock, qtyRemaining);

            batchRecap.push({
                batch_code: batch.batch_code,
                exp_date: batch.exp_date.toDate().toISOString().split('T')[0],
            });

            qtyRemaining -= take;
        }
        
        if (qtyRemaining > 0) throw Boom.internal(`Out of Stock`);

        return batchRecap;
    });
}

//clear
const checkoutBatch = async (productId, qtyNeeded) => {
    return db.runTransaction(async (tx) => {
        const today = Timestamp.now();

        const product = db.collection("products").doc(productId);
        const batchCollection = product.collection("batches");

        const productSnapshoot = await tx.get(product);
        if (!productSnapshoot.exists) throw Boom.notFound("Product not found");

        let productStock = Number(productSnapshoot.data().total_stock ?? 0);

        if (productStock < qtyNeeded) {
            throw Boom.badRequest("Out of Stock");
        }

        const batchSnapshoot = await tx.get(
            batchCollection.orderBy("exp_date", "asc")
        );

        if(batchSnapshoot.empty) throw new Error("Batch Not Found");

        let qtyRemaining = qtyNeeded;
        const batchRecap = [];

        for (const doc of batchSnapshoot.docs) {
            if(qtyRemaining <= 0) break;

            const batch = doc.data();
            const stock = Number(batch.stock ?? 0);
            if(stock <= 0 || batch.exp_date < today) continue;

            const take = Math.min(stock, qtyRemaining);
            const newStock = stock - take;

            tx.update(doc.ref, {
                stock: newStock,
                status: newStock == 0 ? "habis" : batch.status,
            });

            batchRecap.push({
                batch_code: batch.batch_code,
                exp_date: batch.exp_date.toDate().toISOString().split('T')[0],
                take,
                before: stock,
                after: newStock,
            });

            qtyRemaining -= take;
            productStock -= take;
        }

        tx.update(productSnapshoot.ref, {
            status: productStock === 0 ? "out of stock" : productSnapshoot.data().status,
            total_stock: productStock,
            updated_at: new Date().toISOString(),
        });

        if (qtyRemaining > 0) throw Boom.internal(`Something Went Wrong`);

        return batchRecap;
    });
}

//clear
const addHistory = async (userId, historyId, data) => {
    try {
        const user = db.collection("users").doc(userId);
        const historyCollection = user.collection("histories");
        await historyCollection.doc(historyId).set(data);
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getAllCart = async (userId) => {
    try {
        const user = db.collection("users").doc(userId);
        const cartCollection = await user.collection("cartes").get();
        if(cartCollection.empty) return [];
        return cartCollection.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const addCart = async (userId, data) => {
    try {
        const user = db.collection("users").doc(userId);

        const cartCollection = user.collection("cartes");
        const isExist =  await cartCollection.doc(data.product_id).get();

        if(isExist.exists) throw new InputError("Already in Your Cart");

        await cartCollection.doc(data.product_id).set(data);
    } catch (error) {
        if(error instanceof InputError) throw error;

        throw Boom.internal(error.message);
    }
}

//clear
const getCartById = async (userId, productId) => {
    try {
        const user = db.collection("users").doc(userId);
        const cart = await user.collection("cartes").doc(productId).get();
        
        if (cart.exists) {
            return true;
        }
        else {
            return false;
        }
    } catch (error) {
        throw Boom.internal(error.message)
    }
}

//clear
const getAllHistories = async (userId) => {
    try {
        const user = db.collection("users").doc(userId);
        const historiesCollection = await user.collection("histories").get();
    
        return historiesCollection.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.messages);
    }
}

//clear
const getUserOrder = async (userId) => {
    try {
        const orderCollection = db.collection("orders");
        const userOrders = await orderCollection.where("customer_id", "==", userId).get();
        if(userOrders.empty) return [];

        return userOrders.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getAllOrder = async () => {
    try {
        const order = await db.collection("orders").get();

        return order.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getOrderById = async (orderId) => {
    try {
        const order = await db.collection("orders").doc(orderId).get();
        if(!order.exists) throw new InputError("order not found");

        return order.data();
    } catch (error) {
        if (error instanceof InputError) throw error;
        throw Boom.internal(error.message);
    }
}

//clear
const getAllFavorite = async (userId) => {
    try {
        const user = db.collection("users").doc(userId);
        const favorites = await user.collection("favorites").get();
    
        if(favorites.empty) return [];
        return favorites.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getFavoriteById = async (userId, productId) => {
    try {
        const user = db.collection("users").doc(userId);
        const favorite = await user.collection("favorites").doc(productId).get();
        
        if (favorite.exists) {
            return true;
        }
        else {
            return false;
        }
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const addFavorite = async (userId, data) => {
    try {
        const user = db.collection("users").doc(userId);
        const favoriteCollection = user.collection("favorites");

        const isExist = await favoriteCollection.doc(data.product_id).get();
        if(isExist.exists) throw new InputError("product already in favorite");

        await favoriteCollection.doc(data.product_id).set(data);
    } catch (error) {
        if(error instanceof InputError) throw error;
        throw Boom.internal(error.message);
    }
}

//clear
const deleteFavorite = async (userId, productId) => {
    try {
        const user = db.collection("users").doc(userId);
        const favoriteProduct = user.collection("favorites").doc(productId); 
    
        await favoriteProduct.delete();
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const deleteCart = async (userId, productId) => {
    try {
        const user = db.collection("users").doc(userId);
        const cartProduct = user.collection("cartes").doc(productId); 
    
        await cartProduct.delete();
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const checkExpBatch = async () => {
    try {
        const exp_batch = [];
        const today = Timestamp.now();
        const { start, end } = getNextMonthRange();

        const startOfMount = Timestamp.fromDate(start);
        const endOfMount = Timestamp.fromDate(end);

        const [expBatch, expSoon] = await Promise.all([
            db.collectionGroup("batches").where("status", "==" , "available").where("exp_date", "<", today).get(),
            db.collectionGroup("batches").where("status", "==" , "available").where("exp_date", ">=", startOfMount).where("exp_date", "<=", endOfMount).get()
        ]);

        const mapBatch = (docs) =>
            docs.map(doc => {
                const batch = doc.data();
                return {
                    data: batch.batch_code,
                    product_id: doc.ref.parent.parent.id
                };
        });

        for (const doc of expBatch.docs) {
            const batch = doc.data();
            const productId = doc.ref.parent.parent.id

            const update = {
                status: "expired",
            }

            await updateBatch(productId, batch.batch_code, update);

            exp_batch.push({
                data: batch.batch_code,
                product_id: doc.ref.parent.parent.id
            })
        }

        const exp_soon = mapBatch(expSoon.docs);

        return {
            exp_batch,
            exp_soon
        }

    } catch (error) {
        console.error(error)
        throw Boom.internal(error.message);
    }
}

const checkCollectionGroup = async () => {
    const expBatch = await db.collectionGroup("batches").get();

    return expBatch.docs.map(item => item.data())
}

//clear
const checkStockproduct = async () => {
    try {
        const [empty, emptySoon] = await Promise.all([
            db.collection("products").where("total_stock", "<=" , 0).get(),
            db.collection("products").where("total_stock", "<=", 10).get()
        ]);

        const mapProduct = (docs) =>
            docs.map(doc => {
                const product = doc.data();
                return {
                    data: product.name,
                    product_id: product.product_id,
                };
        });
        

        const empty_stock = mapProduct(empty.docs);
        const empty_soon = mapProduct(emptySoon.docs);

        return {
            empty_stock,
            empty_soon
        }
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getAllnotification = async () => {
    try {
        const notifications = await db.collection("notifications").orderBy("create_at", "asc").get();
        if (notifications.empty) return [];

        return notifications.docs.map(item => item.data());
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

const getNotificationByData = async (identifier) => {
    try {
        const notification = await db.collection("notifications").where("data", "==", identifier).get();
        if (!notification.empty) {
            return notification.docs[0].data();
        }
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const addNotification = async (notifId, data) => {
    try {
        const notifCollection = db.collection("notifications");

        await notifCollection.doc(notifId).set(data);
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const deleteNotification = async (notifId) => {
    try {
        const notifCollection = db.collection("notifications").doc(notifId);
        
        await notifCollection.delete()
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

const updateStatusNotification = async (notifId, message) => {
    try {
        const notification = db.collection("notifications").doc(notifId);
        await notification.update(message)
        
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const getDashboardContent = async () => {
    try {
        const [ order, filteredOrder, productCount, orderCount, bannerCount, notificationCount ] = await Promise.all([
            db.collection("orders").get(),
            db.collection("orders").where("status", "==", "menunggu konfirmasi").get(),
            db.collection("products").count().get(),
            db.collection("orders").count().get(),
            db.collection("banners").count().get(),
            db.collection("notifications").count().get(),
        ]);
    
        const response = {
            orders: order.docs.map(item => item.data()),
            filteredOrder: filteredOrder.docs.map(item => item.data()),
            productCount: productCount.data().count,
            orderCount: orderCount.data().count,
            bannerCount: bannerCount.data().count,
            notificationCount: notificationCount.data().count
        }
    
        return response;
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

const getToolbarContent = async (userId) => {
    try {
        const [cartLength, favoriteLength] = await Promise.all([
            db.collection("users").doc(userId).collection("cartes").count().get(),
            db.collection("users").doc(userId).collection("favorites").count().get(),
        ]);

        return {
            cartCount: cartLength.data().count,
            favoriteCount: favoriteLength.data().count
        }
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

module.exports = { 
    getUserByName, addUser, addAddress, updateProfile, updatePassword, 
    addProduct, updateProduct, deleteProduct, addBatch, updateBatch, 
    deleteBatch, updateStatus, getProductByName, getAllBatch, getAllProduct, 
    getProductById, addBanner, getAllBanner, getUserById, makeOrder, 
    addOrderItem, showBatchRecap, addHistory, addBatchRecap, addCart,
    getAllCart, getAllHistories, getUserOrder, getOrderById, getAllFavorite,
    addFavorite, deleteFavorite, deleteCart, getHomeContent, checkoutBatch,
    getCartById, getFavoriteById, checkExpBatch, getAllnotification, addNotification, 
    deleteNotification, getDashboardContent, checkStockproduct, getAllOrder, getBatchById,
    getAllOrderItem, getBatchRecap, getBannerById, deleteBanner, getAddress,
    updateAddress, deleteAddress, getAddressById, getToolbarContent, checkCollectionGroup,
    getNotificationByData, updateStatusNotification
};