const { addOrderItem, deleteCart, addHistory, addBatchRecap } = require("../services/firestore");
const Boom = require('@hapi/boom');
const { nanoid } = require('nanoid');

//clear
const orderFromProductHelper = async (userId, orderId, product, create_at) => {
    const historyId = nanoid(5);
    try {
        const newItems = {
            product_id: product.product_id,
            name: product.name,
            price: product.price,
            variant: product.variant,
            brand: product.brand,
            category: product.category,
            qty: product.qty,
            sub_total: product.sub_total,
            create_at,
        }
    
        const newHistory = {
            history_id: historyId,
            product_id: product.product_id,
            name: product.name,
            price: product.price,
            variant: product.variant,
            brand: product.brand,
            category: product.category,
            qty: product.qty,
            sub_total: product.sub_total,
            create_at,
        }
    
        await addOrderItem(orderId, newItems);
        await addHistory(userId, historyId, newHistory);

        const batchRecap = await checkoutBatch(product.product_id, item.qty);
        
        for (const recap of batchRecap) {
            await addBatchRecap(orderId, product.product_id, recap);
        }
        
    } catch (error) {
        throw Boom.internal(error.message);
    }
}
module.exports = orderFromProductHelper;