const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

const emailConfig = functions.config().email;
const { user, pass } = emailConfig;

const transporter = nodemailer.createTransport({
  host: "mail.mattealeconsulting.com",
  port: 587,
  secure: false,
  auth: {
    user,
    pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

exports.sendEmail = functions.https.onRequest(async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.status(204).send("");
    return undefined;
  }
  if (req.method !== "POST") {
    res.status(405).end();
    return undefined;
  }
  const { fullName, email, message } = req.body;
  const mailOptions = {
    from: email,
    to: "office@mattealeconsulting.com",
    subject: `Message from ${fullName}`,
    text: message,
  };
  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ success: true });
    return undefined;
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send({ success: false });
    return undefined;
  }
});
