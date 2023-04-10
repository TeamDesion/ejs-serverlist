const mongoose = require("mongoose");
module.exports = mongoose.model("user-heart-servers", 
	new mongoose.Schema({
		id: String,
        date: Date,
        guild: String
	})
);