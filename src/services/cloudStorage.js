const { Storage } = require('@google-cloud/storage');
const Boom = require('@hapi/boom');
const { getBucketName } = require('../helper/getBucketName');


const storage = new Storage();

//clear
const uploadProductImage = async (buffer, imgName) => {
    try {
        const bucketName = "ecommerce-beauty-store";
        const bucket = storage.bucket(bucketName);
        const img = bucket.file(`products/${imgName}`);
        const blobStream = img.createWriteStream({
            resumable: false,
        });

        await new Promise((resolve, reject) => {
            blobStream.end(buffer).on('finish', resolve).on('error', reject);
        });
        return `https://storage.googleapis.com/${bucket.name}/${img.name}`;
    } catch (error) {
        throw Boom.internal(error.message)
    }
}

const deleteImageFromBucket = async (filename) => {
    const { bucketName, fileName } = getBucketName(filename);
    try {
        await storage.bucket(bucketName).file(fileName).delete();
    } catch (error) {
        throw Boom.internal(error.message);
    }
}

//clear
const uploadImageBanner = async (buffer, imgName) => {
    try {
        const bucketName = "ecommerce-beauty-store";
        const bucket = storage.bucket(bucketName);
        const img = bucket.file(`banners/${imgName}`);
        const blobStream = img.createWriteStream({
            resumable: false,
        });

        await new Promise((resolve, reject) => {
            blobStream.end(buffer).on('finish', resolve).on('error', reject);
        });
        return `https://storage.googleapis.com/${bucket.name}/${img.name}`;
    } catch (error) {
        throw error
    }
}

module.exports = { uploadProductImage, uploadImageBanner, deleteImageFromBucket };