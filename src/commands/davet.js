const Discord = require("discord.js");
exports.run = async (client, message, args) => {
          var embed = new Discord.MessageEmbed()
          .setAuthor(message.author.username, message.author.avatarURL({dynamic: true}))
          .addField("ᅠᅠᅠᅠᅠᅠ", '• **[Invite](https://desion.me/invite)**')
          .addField("ᅠᅠᅠᅠᅠᅠ", '• **[Website](https://desion.me)**')
          .addField("ᅠᅠᅠᅠᅠᅠ", '• **[Discord](https://discord.gg/desion)**')
          .setColor("BLURPLE")
          .setImage('https://desion.me/images/desion_font_by_discord.png')
          message.channel.send(embed);

};
exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [ 'davet' ]
};
exports.help = {
	name: 'invite',
	description: '',
	usage: ''
};


