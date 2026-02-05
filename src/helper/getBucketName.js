export const getBucketName = (image_url) => {
    const parserUrl = new URL(image_url);

    const part = parserUrl.pathname.split('/');
    part.shift();

    const bucketName = part.shift();
    const fileName = part.join('/');

    return {
        bucketName,
        fileName
    }
}