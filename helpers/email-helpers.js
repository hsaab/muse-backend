var nodemailer = require("nodemailer");
var Email = require("email-templates");
var path = require("path");
var gmail = require("../api/gmail.js");

const transport = nodemailer.createTransport({
  auth: {
    user: "apollo.muse.concerts@gmail.com",
    pass: process.env.MUSE_EMAIL_PASSWORD,
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    accessToken: gmail.getAccessToken()
  },
  port: 465,
  service: "gmail",
  secure: true
});

async function send(templateName, user) {
  let email = new Email({
    message: { from: "Apollo @ Muse" },
    transport,
    send: true,
    preview: false,
    views: {
      root: "./emails",
      options: {
        extension: "hbs"
      }
    }
  });
  email.send({
    template: templateName,
    message: {
      to: user.email
    },
    locals: {
      name: user.name,
      location: user.location,
      concerts: user.concerts
    }
  });
}

module.exports = { send };
