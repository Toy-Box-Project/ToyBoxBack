// src/utils/email.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            html,
        });
    } catch (error) {
        console.error("EMAIL ERROR:", error);
        throw new Error("EMAIL_SEND_FAILED");
    }
};

module.exports = { sendEmail };
