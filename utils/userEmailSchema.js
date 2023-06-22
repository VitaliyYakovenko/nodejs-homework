const joi = require("joi");

const userEmailSchema = joi.object({
    email: joi.string().required(),
});


module.exports = userEmailSchema;


