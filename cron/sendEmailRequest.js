if (process.env.NODE_ENV !== "production") {
  const result = require("dotenv").config();
  if (result.error) {
    console.log(result.error);
  }
}

let request = require("request"); // "Request" library

async function sendEmail() {
  return await request.post({
    url: "https://muse-flying-monkey.herokuapp.com/sendemail"
  });
}

sendEmail();
