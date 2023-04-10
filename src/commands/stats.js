const Discord = require("discord.js");
let data = require("../database/models/server.js");
let moment = require("moment");
require("moment-duration-format");
exports.run = async (client, message, args) => {
    let serverLanguage = client.locale(
      client["language_" + message.guild.id]
    )["stats"];

    let old = Date.now();
    data.findOne({}, (err, docs) => {
      const duration = moment
        .duration(client.uptime)
        .format(" D [days], H [hours], m [minutes], s [seconds]");

      var embed = new Discord.MessageEmbed()
        .setAuthor(
          message.author.username,
          message.author.avatarURL({ dynamic: true })
        )
        .addField(
          `• __${serverLanguage["general"]["title"]}__ •`,
          `
          • ${
            serverLanguage["general"]["guilds"]
          } » \`${client.guilds.cache.size.toLocaleString()}\`
          • ${serverLanguage["general"]["members"]} » \`${client.guilds.cache
            .reduce((a, b) => a + b.memberCount, 0)
            .toLocaleString()}\`
          • ${
            serverLanguage["general"]["channels"]
          } » \`${client.channels.cache.size.toLocaleString()}\`
          • ${
            serverLanguage["general"]["emojis"]
          } » \`${client.emojis.cache.size.toLocaleString()}\`
          `,
          true
        )
        .addField(
          `\n• __${serverLanguage["pings"]["title"]}__ •`,
          `
          • ${serverLanguage["pings"]["database"]} » \`${Date.now() - old}ms\`
          • ${serverLanguage["pings"]["bot"]} » \`${client.ws.ping}ms\`
          `,
          true
        )
        .addField("ᅠᅠᅠᅠᅠᅠ", "ᅠᅠᅠᅠᅠᅠ")
        .addField(
          `\n• __${serverLanguage["other"]["title"]}__ •`,
          `
          • ${serverLanguage["other"]["library"]} » \`Discord.js\`
          • ${serverLanguage["other"]["web_server"]} » \`Fastify\`
          • ${serverLanguage["other"]["database"]} » \`Mongo DB\`
          • ${serverLanguage["other"]["uptime"]} » \`${duration}\`
          `,
          true
        )
        .addField(
          `\n• __${serverLanguage["versions"]["title"]}__ •`,
          `
          • Node.js » \`${process.version}\`
          • Discord.js » \`v${Discord.version}\`
          `,
          true
        )
        .addField(
          "ᅠᅠᅠᅠᅠᅠ",
          "**[Website](https://desion.me)** | **[Discord](https://discord.gg/desion)**"
        )
        .setColor("BLURPLE")
        .setImage("https://desion.me/images/wallpaper_desion.png");
      message.channel.send(embed);
    });
    };
    exports.conf = {
      enabled: true,
      guildOnly: false,
      aliases: [  'i', 'statistics']
    };
    exports.help = {
      name: 'stats',
      description: '',
      usage: ''
    };
    