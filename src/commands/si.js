const Discord = require("discord.js");
const moment = require("moment");
const datas = require("../database/models/server.js");
exports.run = async (client, message, args) => {
  let serverLanguage = client.locale(
    client["language_" + message.guild.id]
  )["servers_info"];
  let db = await datas.findOne({ id: message.guild.id });
  var embed = new Discord.MessageEmbed()
    .setAuthor(message.guild.name, message.guild.iconURL({ dynamic: true }))
    .setDescription(
      `${serverLanguage['information'].replace('{guildName}', message.guild.name)}`
    )
    .setColor("BLURPLE")
    .addField(
      `• __${serverLanguage['server_datas']['title']}__ •`,
      `
          • ${serverLanguage['server_datas']['name']} » ${message.guild.name}
          • ${serverLanguage['server_datas']['memberCount']} » ${message.guild.memberCount.toLocaleString()}
          • ${serverLanguage['server_datas']['owner']} » ${client.users.cache.get(message.guild.ownerID).tag}
          • ${serverLanguage['server_datas']['established']} » ${moment(message.guild.createdAt).format(
            "DD MMMM YYYY"
          )}
          `
    );
  if (db) {
    embed.addField(
      `• __${serverLanguage['desion_datas']['title']}__ •`,
      `
          • ${serverLanguage['desion_datas']['heartCount']} » ${db.monthHearts || 0}
          `
    );
  } else {
    embed.addField(`• __${serverLanguage['desion_datas']['title']}__ •`, `${serverLanguage['desion_datas']['nodata']}`);
  }

  embed.addField(
    `• __${serverLanguage['desion_message']['title']}__ •`,
    `${serverLanguage['desion_message']['content'].replace('{guildID}', message.guild.id)}`
  );
  message.channel.send(embed);
};
exports.conf = {
  enabled: true,
  guildOnly: false,
  aliases: ["serverinfo", "server-info", "sb", "sunucubilgi", "sunucu-bilgi"],
};
exports.help = {
  name: "si",
  description: "",
  usage: "",
};
