const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");

let server;

mongoose
  .connect(config.mongoose.url, config.mongoose.options)
  .then(() => {
    server = app.listen(config.port, () => {
      console.log(`[ info ] servre running in port ${server.address().port}`);
    });
  })
  .catch((err) => {
    console.log(`[ info ] failed to connect to database`);
    console.log(`[ error ] ${err}`);
  });
