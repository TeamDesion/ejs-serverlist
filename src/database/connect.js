const mongoose = require("mongoose");
module.exports = async () => {
  mongoose
    .connect(global.config.bot.mongourl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
      autoIndex: false
    })
    .then(() => {
      console.log("[Desion]: Mongoose successfully connected.");
    })
    .catch(err =>
      console.log("[Desion]: An error occurred while connecting mongoose. ", err)
    );
};
