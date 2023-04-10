const Discord = require("discord.js");
exports.run = async (client, message, args) => {
    let serverLanguage = client.locale(
        client["language_" + message.guild.id]
      )["help"];

          var embed = new Discord.MessageEmbed()
          .setAuthor(message.author.username, message.author.avatarURL({dynamic: true}))
          .setColor("BLURPLE")
          .addField("• Desion •", `
          • \`?heart\` » ${serverLanguage['heart']}
          • \`?si (serverinfo)\` » ${serverLanguage['server_info']}
          • \`?reminder on|off\` » ${serverLanguage['reminder']}
          • \`?stats\` » ${serverLanguage['stats']}
          • \`?invite\` » ${serverLanguage['invite']}
          • \`?lang\` » ${serverLanguage['lang']}
          `)
          message.channel.send(embed);

};
exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [ 'h', 'y', 'yardım', 'yardim' ]
};
exports.help = {
	name: 'help',
	description: '',
	usage: ''
};


