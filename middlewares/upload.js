const multer = require("multer");
const path = require("path");

const destination = path.resolve("tmp");


console.log(destination);

const storage = multer.diskStorage({
    destination,
    filename: (req, file, cb) => {
        const uniquePreffix = Date.now();
        const { originalname } = file; 
        const filename = `${uniquePreffix}_${originalname}`;
        cb(null, filename);
    },
});


const upload = multer({
    storage,
});

module.exports = upload;
