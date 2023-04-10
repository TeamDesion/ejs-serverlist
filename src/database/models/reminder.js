const mongoose = require("mongoose");
module.exports = mongoose.model("reminders", 
	new mongoose.Schema({
		id: String,
        status: Number,
        guild: String,
		channel: String
	})
);