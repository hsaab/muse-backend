var nodemailer = require("nodemailer");
var Email = require("email-templates");
var path = require("path");

const transport = nodemailer.createTransport({
  auth: {
    user: "apollo.muse.concerts@gmail.com",
    pass: process.env.MUSE_EMAIL_PASSWORD
  },
  host: "smtp.gmail.com",
  port: 465,
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
