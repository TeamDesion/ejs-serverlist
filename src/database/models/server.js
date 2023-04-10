const mongoose = require("mongoose");
module.exports = mongoose.model(
  "servers",
  new mongoose.Schema({
    id: String,
    invite: String,
    tag: String,
    sound: Object,
    verified: { type: String, default: null },
    lastHeart: String,
    hearts: Object,
    monthHearts: { type: Number, default: 0 },
    totalHearts: { type: Number, default: 0 },
    partner: { type: String, default: null },
    gizli: { type: String, default: null },
    totalVoiceStats: { type: Number, default: 0 },
    customURL: String,
    nsfw: String,
    webhook: Object,
    commandsLang: String
  })
);