const nodemailer = require("nodemailer");
const axios = require("axios");

const sendEmail = async (mailOptions) => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (resendApiKey) {
    console.log("Using Resend API to send email...");
    const payload = {
      from: mailOptions.from || "onboarding@resend.dev",
      to: [mailOptions.to],
      subject: mailOptions.subject,
      html: mailOptions.html,
      text: mailOptions.text,
    };

    await axios.post("https://api.resend.com/emails", payload, {
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
    });
    console.log(`Email sent via Resend API to ${mailOptions.to}`);
  } else {
    console.log("RESEND_API_KEY not found. Falling back to Gmail SMTP...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER_CRM,
        pass: process.env.EMAIL_PASS_CRM,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const defaultOptions = {
      from: `"Sensitive Technologies Authentication Code" <${process.env.EMAIL_USER_CRM}>`,
    };

    const finalOptions = { ...defaultOptions, ...mailOptions };

    await transporter.sendMail(finalOptions);
    console.log(`Email sent via Gmail SMTP to ${finalOptions.to}`);
  }
};

module.exports = sendEmail;
