var nodemailer = require('nodemailer');
var Email = require('email-templates');
var path = require('path');

const transport = nodemailer.createTransport({
    auth: {
      user: 'apollo.muse.concerts@gmail.com',
      pass: process.env.MUSE_EMAIL_PASSWORD
    },
    service: "Gmail"
});

function send(templateName, user) {
  let email = new Email({
     message: { from: 'Apollo @ Muse' },
     transport,
     send: false,
     preview: true,
     views: {
        root: './emails',
        options: {
            extension: 'hbs'
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
  })
  .then((result) => {
    console.log(result);
  })
}

module.exports = { send };
