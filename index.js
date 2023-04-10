global.config = require("./config.js");

const server = require("./src/server.js");
const bot = require("./src/client.js");
const { Client } = require("discord.js");
const client = new Client({disableEveryone: true});

server(client);
bot(client);


client.makeid = length => {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }

client.login(global.config.bot.token);
