const { adminRegisterHandler, addProductHandler, updateProductHandler, addBatchHandler, deleteProductHandler, addBannerHandler, updateBatchHandler, deleteBatchHandler, updateStatusOrderhandler, checkExpBatchhandler, deleteNotificationHandler, getDashboardContentHandler, checkStockProductHandler, getAllnotificationHandler, getAllOrderHandler, getAllBannerHandler, getBatchByIdHandler, getBannerByIdHandler, deleteBannerHandler, updateBannerHandler, checkCollectionGroupHandler } = require("./handler/AdminHandler/AdminHandler");
const { UserLoginHandler, UserRegisterHandler, updatePasswordHandler, updateProfileHandler, addAddressHandler, getAllProductHandler, getProductByIdHandler, getHomeContentHandler, makeOrderHandler, addCartHandler, getAllCarthandler, getHistoryHandler, getUserOrderHandler, getOrderByIdHandler, getAllFavoriteHandler, getProfileHandler, addFavoritehandler, deleteCartHandler, getProductExpHandler, getCartByIdHandler, getFavoriteByIdHandler, getAddressHandler, deleteFavoriteHandler, deleteAddressHandler, updateAddressHandler, getAddressByIdHandler, getToolbarContentHandler } = require("./handler/CustomerHandler/UserHandler");

const routes = [
    {
        method: "GET",
        path: "/",
        handler: (_, h) => {
            return h.response({
                status: "success",
                message: "server running successfully",
            })
        } 
    },

    //clear -> frontend & Backend *
    {
        method:"POST",
        path: "/login",
        handler: UserLoginHandler,
    },

    //clear -> Frontend & Backend *
    {
        method:"POST",
        path: "/userSignup",
        handler: UserRegisterHandler,
    },

    //clear -> frontend & backend *
    {
        method:"PUT",
        path: "/password",
        handler: updatePasswordHandler,
    },

    //clear
    {
        method:"PUT",
        path: "/profile",
        handler: updateProfileHandler,
    },

    //clear Frontend & Backend
    {
        method:"POST",
        path: "/address",
        handler: addAddressHandler,
    },

    //clear Frontend & Backend
    {
        method:"PUT",
        path: "/address/{addressId}",
        handler: updateAddressHandler,
    },

    //clear Frontend & Backend
    {
        method:"DELETE",
        path: "/address/{addressId}",
        handler: deleteAddressHandler,
    },

    //clear
    {
        method:"POST",
        path: "/adminSignup",
        handler: adminRegisterHandler,
    },

    //clear Frontend & Backend
    {
        method: "POST",
        path: "/product",
        handler: addProductHandler,
    },

    //clear -> Frontend & Backend
    {
        method: "PUT",
        path: "/product/{productId}",
        handler: updateProductHandler,
    },

    //clear -> Frontend & Backend
    {
        method: "DELETE",
        path: "/product/{productId}",
        handler: deleteProductHandler,
    },

    //clear -> Frontend & Backend
    {
        method: "GET",
        path: "/{productId}/batch/{batchId}",
        handler: getBatchByIdHandler,
    },

    //clear -> Frontend & Backend
    {
        method: "POST",
        path: "/{productId}/batch",
        handler: addBatchHandler,
    },

    //clear Frontend & Backend
    {
        method: "PUT",
        path: "/{productId}/batch/{batchId}",
        handler: updateBatchHandler,
    },

    //clear Frontend & Backend
    {
        method: "DELETE",
        path: "/{productId}/batch/{batchId}",
        handler: deleteBatchHandler,
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/banners",
        handler: getAllBannerHandler,
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/banners/{bannerId}",
        handler:getBannerByIdHandler
    },

    //clear Frontend & Backend
    {
        method: "POST",
        path: "/banners",
        handler: addBannerHandler,
    },

    //clear Frontend & Backend
    {
        method: "DELETE",
        path: "/banners/{bannerId}",
        handler: deleteBannerHandler,
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/orders",
        handler: getAllOrderHandler,
    },

    //clear Frontend & Backend
    {
        method: "PUT",
        path: "/orders/{orderId}",
        handler: updateStatusOrderhandler,
    },
    
    //clear frontend & Backend
    {
        method: "GET",
        path: "/products",
        handler: getAllProductHandler,
    },

    //clear -> Frontend & Backend
    {
        method: "GET",
        path: "/products/{productId}",
        handler: getProductByIdHandler,
    },

    //clear frontend & Backend
    {
        method: "GET",
        path: "/home",
        handler: getHomeContentHandler,
    },
    
    //clear Frotend & Backend
    {
        method: "POST",
        path: "/checkout",
        handler: getProductExpHandler,
    },

    //clear Frontend & Backend
    {
        method: "POST",
        path: "/getOrder/{from}",
        handler: makeOrderHandler
    },

    //clear Frontend & Backend
    {
        method: "POST",
        path: "/cart",
        handler: addCartHandler
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/cart",
        handler: getAllCarthandler
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/history",
        handler: getHistoryHandler
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/userOrder",
        handler: getUserOrderHandler
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/order/{orderId}",
        handler: getOrderByIdHandler
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/favorite",
        handler: getAllFavoriteHandler,
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/profile",
        handler: getProfileHandler,
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/address",
        handler: getAddressHandler
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/address/{addressId}",
        handler: getAddressByIdHandler
    },

    //clear Frontend & Backend
    {
        method: "POST",
        path: "/favorite",
        handler: addFavoritehandler,
    },

    //clear Frontend & Backend
    {
        method: "DELETE",
        path: "/favorite/{productId}",
        handler: deleteFavoriteHandler,
    },

    //clear Frontend & Backend
    {
        method: "DELETE",
        path: "/cart",
        handler: deleteCartHandler,
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/cart/{productId}",
        handler: getCartByIdHandler,
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/favorite/{productId}",
        handler: getFavoriteByIdHandler,
    },

    //clear Frontend & Backend
    {
        method: "DELETE",
        path: "/notifications/{notifId}",
        handler: deleteNotificationHandler,
    },

    //clear frontend & backend
    {
        method: "GET",
        path: "/dashboard",
        handler: getDashboardContentHandler,
    },

    //clear Backend
    {
        method: "GET",
        path: "/checkExp",
        handler: checkExpBatchhandler,
    },

    {
        method: "GET",
        path: "/check",
        handler: checkCollectionGroupHandler,
    },

    //clear Backend
    {
        method: "GET",
        path: "/checkStock",
        handler: checkStockProductHandler,
    },

    //clear Frontend & Backend
    {
        method: "GET",
        path: "/notifications",
        handler: getAllnotificationHandler,
    },

    {
        method: "GET",
        path: "/toolbar",
        handler: getToolbarContentHandler
    }
    
];

module.exports = routes;