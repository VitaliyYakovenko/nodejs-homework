const express = require("express");
const controllers = require("../../controllers/auth-controllers");
const { authenticate, upload } = require("../../middlewares/index");



const router = express.Router();

router.post("/users/register", upload.single("avatar"), controllers.signup);

router.post("/users/login", controllers.signin);

router.get("/users/current", authenticate, controllers.getCurrent);

router.post("/users/logout", authenticate, controllers.logout);


router.patch( "/users/avatars",
    authenticate,
    upload.single("avatar"),
    controllers.updateAvatar
);



module.exports = router;