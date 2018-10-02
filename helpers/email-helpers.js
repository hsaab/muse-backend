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

let user = { name: "hassan",
    email: "hsaab310@gmail.com" }

function sendEmail(templateName, user, context) {
  let email = new Email({
     message: { from: 'apollo.muse.concerts@gmail.com' },
     transport,
     send: true,
     preview: false,
     views: {
        root: '../emails',
        options: {
            extension: 'hbs'
        }
      }
   });
  console.log('1')
  return new Promise(function(resolve, reject) {
    console.log('2')
    email.send({
      template: 'concerts',
      message: {
        to: user.email
      },
      locals: {
        name: context.name,
        email: context.email
      }
    })
    .then((result) => {
      console.log('3');
      console.log(result);
    })
    .catch((err) => {
      console.log(err);
    })
  })
}

sendEmail('concerts', user, user);
