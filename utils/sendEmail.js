require("dotenv").config();
const sgEmail = require("@sendgrid/mail");

const { SEND_GRID_API_KEY } = process.env;
console.log(SEND_GRID_API_KEY)

sgEmail.setApiKey(SEND_GRID_API_KEY);


const sendEmail = async (data) => {
    const email = { ...data, from: "yakovenkovitaly1@gmail.com", };
    await sgEmail.send(email);
    return true
};

module.exports = sendEmail;
