const { addOrderItem, deleteCart, addHistory, addBatchRecap, checkoutBatch } = require("../services/firestore");
const Boom = require('@hapi/boom');
const { nanoid } = require('nanoid');

//clear
const orderFromCartHelper = async (userId, orderId, products, create_at, from) => {
    try {
        for (const item of products) {
            const historyId = nanoid(5);
            const newItems = {
                product_id: item.product_id,
                name: item.name,
                price: item.price,
                variant: item.variant,
                brand: item.brand,
                category: item.category,
                image_url: item.image_url,
                qty: item.qty,
                sub_total: item.sub_total,
                create_at,
            }
    
            const newHistory = {
                history_id: historyId,
                name: item.name,
                price: item.price,
                variant: item.variant,
                brand: item.brand,
                category: item.category,
                image_url: item.image_url,
                qty: item.qty,
                sub_total: item.sub_total,
                create_at,
            }
            
            await addOrderItem(orderId, newItems);
            if (from === "Cart") {
                await deleteCart(userId, item.product_id);
            }
            
            await addHistory(userId, historyId, newHistory);

            const batchRecap = await checkoutBatch(item.product_id, item.qty);

            for (const recap of batchRecap) {
                await addBatchRecap(orderId, item.product_id, recap);
            }
        }
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

module.exports = orderFromCartHelper;