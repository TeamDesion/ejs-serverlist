const mongoose = require("mongoose");
module.exports = mongoose.model(
  "verify-forms",
  new mongoose.Schema({
    id: String,
    desc: String,
    tag: String,
    invite: String
  })
);
