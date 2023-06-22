const sgEmail = require("@sendgrid/mail");
const SEND_GRID_API_KEY = "SG.U5-Q7yZmSvCNCwuPP7Mv5w.0j1rM7UwEGsPTrPsN5z8asXPs6TXZtSZ0Kye5Cw75vM"


sgEmail.setApiKey(SEND_GRID_API_KEY);


const sendEmail = async (data) => {
    const email = { ...data, from: "yakovenkovitaly1@gmail.com", };
    await sgEmail.send(email);
    return true
};

module.exports = sendEmail;
