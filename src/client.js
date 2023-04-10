const config = require("../config.js");
const Discord = require("discord.js");
const APIMessage = Discord.APIMessage;
const fs = require("fs");
const statsModel = require("./database/models/server.js");
const { readdirSync } = require("fs");

module.exports = (client) => {
  require("discord-buttons")(client);

  client.on("ready", async () => {
    client.user
      .setActivity("?heart & ?kalp | desion.me", { type: "WATCHING" })
      .catch(console.error);
      console.log('Logged is a '+client.user.tag)
  });

  client.on("message", async (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    let prefix = config.bot.prefix;
    if (message.content.startsWith(prefix)) {
      let databases = require('./database/models/server.js');
      let db = await databases.findOne({ id: message.guild.id });
      client[`language_${message.guild.id}`] = db ? (db.commandsLang ? db.commandsLang : 'en-GB') : 'en-GB';

      let command = message.content.split(" ")[0].slice(prefix.length);
      let params = message.content.split(" ").slice(1);
      let cmd;
      if (global.commands.has(command)) {
        cmd = global.commands.get(command);
      } else if (global.aliases.has(command)) {
        cmd = global.commands.get(global.aliases.get(command));
      }

      if (cmd) cmd.run(client, message, params);
    }
  });

  global.commands = new Discord.Collection();
  global.aliases = new Discord.Collection();
  fs.readdir("./src/commands/", (err, files) => {
    if (err) throw err;
    files.forEach(async (f) => {
      let props = require(`./commands/${f}`);
      global.commands.set(props.help.name, props);
      props.conf.aliases.forEach((alias) => {
        global.aliases.set(alias, props.help.name);
      });
    });
  });

  client.locale = lang => {
    try {
      return require('./lang/' + lang + '.json');
    } catch {
      return require('./lang/en-GB.json');
    }
  };


 
  const sesli = (global.voice = new Discord.Collection());

  client.on("ready", async () => {
    client.guilds.cache.forEach((guild) => {
      guild.channels.cache
        .filter((e) => e.type == "voice" && e.members.size > 0)
        .forEach((channel) => {
          channel.members
            .filter((member) => !member.user.bot && !member.voice.selfDeaf)
            .forEach((member) => {
              sesli.set(member.id, {
                duration: Date.now(),
                guildID: guild.id,
              });
            });
        });
    });

    setInterval(() => {
      sesli.forEach((value, key) => {
        voiceInit(key, getDuraction(value.duration), value.guildID);
        sesli.set(key, {
          duration: Date.now(),
          guildID: value.guildID,
        });
      });
    }, 120000);
  });

  let votesServer = require('./database/models/heartCheck.js');
  client.on("ready", async () => {
    setInterval(async () => {
      let voteServer = await votesServer.find();
      if (voteServer.length > 0) {
        voteServer.forEach(async (a) => {
          let süre = 3600000 - (Date.now() - a.date);
          if (süre > 0) return;
          const reminder = require('./database/models/reminder.js');
          let remindDB = await reminder.findOne({ id: a.id, guild: a.guild });
          if(remindDB) {
            if(remindDB.status === 1) {
              
              let kanal = client.channels.cache.get(remindDB.channel);

              if(kanal) {
                client.channels.cache.get(remindDB.channel).send(`<@${a.id}>, you can beat a heart again.`)
                await reminder.updateOne({
                  id: a.id
                }, { $set: {
                  guild: a.guild,
                  status: 0,
                  channel: remindDB.channe
                 }}, { upsert: true })
              } else {
                let sss = client.guilds.cache.get(a.guild)
                  client.channels.cache.get('868125777722474556').send(`<@${a.id}> was deleted because its reminder channel on server **${sss.name}** was invalid.`)
                await reminder.deleteOne({ id: a.id, guild: a.guild });
              }

            }
          }
          await votesServer.findOneAndDelete({
            guild: a.guild,
            id: a.id,
            date: a.date,
          });
        });
      }
    }, 20000);
  });

  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (oldState.member && (oldState.member.user.bot || newState.selfDeaf))
      return;
    if (!oldState.channelID && newState.channelID) {
      sesli.set(oldState.id, {
        duration: Date.now(),
        guildID: newState.guild.id,
      });
    }
    if (!sesli.has(oldState.id))
      sesli.set(oldState.id, {
        duration: Date.now(),
        guildID: newState.guild.id,
      });

    let data = sesli.get(oldState.id);
    let duration = getDuraction(data.duration);
    if (oldState.channelID && !newState.channelID) {
      voiceInit(oldState.id, duration, data.guildID);
      sesli.delete(oldState.id);
    } else if (oldState.channelID && newState.channelID) {
      voiceInit(oldState.id, duration, data.guildID);
      sesli.set(oldState.id, {
        duration: Date.now(),
        guildID: newState.guild.id,
      });
    }
  });

  const voiceInit = async (memberID, duraction, guildID) => {
    await statsModel.findOneAndUpdate(
      { id: guildID },
      { $inc: { totalVoiceStats: duraction } },
      { upsert: true }
    );
  };
  function getDuraction(ms) {
    return Date.now() - ms;
  }


client.on('guildDelete', async guild => {
  const embed = new Discord.MessageEmbed();
  embed.setTitle("Bir sunucdan atıldım.")
  embed.setAuthor(guild.name, guild.iconURL({dynamic: true}))
  embed.setThumbnail(client.user.avatarURL())
  embed.addField("Sunucu Adı", guild.name)
  embed.addField("Sunucunun Kullanıcı Sayısı", guild.memberCount)
  embed.setColor("RED")
  client.channels.cache.get('871521609041719316').send(embed)
})

client.on('guildCreate', async guild => {
  const embed = new Discord.MessageEmbed();
  embed.setTitle("Bir sunucuya eklendim.")
  embed.setAuthor(guild.name, guild.iconURL({dynamic: true}))
  embed.setThumbnail(client.user.avatarURL())
  embed.addField("Sunucu Adı", guild.name)
  embed.addField("Sunucu Sahibi", client.users.cache.get(guild.ownerID).tag)
  embed.addField("Sunucu Sahibinin ID'si", guild.ownerID)
  embed.addField("Sunucunun Kullanıcı Sayısı", guild.memberCount)
  embed.addField('Desion Sayfası', 'https://desion.me/server/'+ guild.id)
  embed.setColor("GREEN")
  client.channels.cache.get('871521609041719316').send(embed)
})

};
