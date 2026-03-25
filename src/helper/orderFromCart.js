const { addOrderItem, deleteCart, addHistory, addBatchRecap, checkoutBatch } = require("../services/firestore");
const Boom = require('@hapi/boom');
const { nanoid } = require('nanoid');

//clear
const orderFromCartHelper = async (userId, orderId, products, create_at, from) => {
    try {
        const allPromises = products.map(async (item) => {

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
                ...newItems
            }
            
            const batchRecap = await checkoutBatch(item.product_id, item.qty);
            
            const allOps = [
                addOrderItem(orderId, newItems),
                addHistory(userId, historyId, newHistory)
            ]

            if (from === "Cart") {
                allOps.push(deleteCart(userId, item.product_id));
            }

            await Promise.all(allOps);

            return {
                item,
                batchRecap
            }
        });

        const results = await Promise.all(allPromises);

        const recapPromises = [];
        
        for (const result of results) {
            for (const recap of result.batchRecap) {
                recapPromises.push(
                    addBatchRecap(orderId, result.item.product_id, recap)
                );
            }
        }

        await Promise.all(recapPromises);
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

module.exports = orderFromCartHelper;