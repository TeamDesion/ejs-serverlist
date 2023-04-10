const Discord = require("discord.js");
const reminder = require('../database/models/reminder.js');

exports.run = async (client, message, args) => {
    let serverLanguage = client.locale(client['language_' + message.guild.id])['reminder'];
    let db = await reminder.findOne({ id: message.author.id, guild: message.guild.id });

    let arg = args[0];
    if(!arg) {
      return sendError(serverLanguage['invalidArgs']);
    }
    if(arg === "on") {
      if(db) {
        if(db.status === 1 || db.status === 0) return sendError(serverLanguage['AlreadyActive'])
      }
      message.channel.send(serverLanguage['reminderSuccess']['open']);     
      await reminder.updateOne({
        id: message.author.id
      }, { $set: {
        guild: message.guild.id,
        status: 1,
        channel: message.channel.id
       }}, { upsert: true })  
    }
    if(arg === "off") {
      if(!db) {
        return sendError(serverLanguage['AlreadyOff']);
      }
      message.channel.send(serverLanguage['reminderSuccess']['close']);     
      await reminder.deleteOne({ id: message.author.id, guild: message.guild.id });
    }

function sendError(text) {
  message.channel.send(new Discord.MessageEmbed()
  .setAuthor(client.user.username, client.user.avatarURL())
  .setFooter('desion.me')
  .setDescription(text)
  .setColor("RED")
  )
}
};
exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [ 'hatırlatıcı' ]
};
exports.help = {
	name: 'reminder',
	description: '',
	usage: ''
};


