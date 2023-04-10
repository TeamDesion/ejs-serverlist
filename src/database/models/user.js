const mongoose = require("mongoose");
module.exports = mongoose.model(
  "profiles",
  new mongoose.Schema({
    id: String,
    bio: String
  })
);
