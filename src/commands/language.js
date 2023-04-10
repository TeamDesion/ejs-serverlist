const Discord = require("discord.js");
const database = require('../database/models/server.js');
exports.run = async (client, message, args) => {

    if(!message.guild.members.cache.get(message.author.id).permissions.has('MANAGE_GUILD')) return message.reply('could not be granted access permission.')
    let lang = args[0];
    let serverLanguage = client.locale(client['language_' + message.guild.id])['language'];
    let fullLanguageFile = client.locale(client['language_' + message.guild.id]);

    require('fs').readdir('./src/lang', async (err, files) => {
        let response = '';
        await files.forEach(file => {
          let langFile = require(`../lang/${file}`);
          let thisLang = langFile['$package'];
          response += '> **'+serverLanguage['name']+'**: '+ thisLang['flag'] + ' ' + thisLang['name'] + '\n> **'+serverLanguage['command']+'**: d?lang '+ file.split('.')[0] + '\n> **'+serverLanguage['author']+'**: ' + thisLang['author'] + '\n\n'; 
        });
        if (!lang) return message.channel.send(
          new Discord.MessageEmbed()
            .setColor('#F4F4F4')
            .setAuthor(serverLanguage['invalidArgs'], client.user.avatarURL())
            .setDescription('> '+serverLanguage['activeLangs']+' **(' + files.length + ')**\n\n' + response)
            .setFooter(serverLanguage['currentLang'].replace('{currentLang}', fullLanguageFile['$package']['name']))
            .setTimestamp()
        );

        try {
            let langChange = require('../lang/' + args[0] + '.json');
            let embed = new Discord.MessageEmbed();
            embed.setDescription(serverLanguage['languageChanged'].replace('{lang}', lang))
            embed.setColor("GREEN")
            embed.setAuthor(message.author.tag, message.author.avatarURL({dynamic: true}))

            await database.updateOne({
                id: message.guild.id
            }, {
                $set: {
                    commandsLang: args[0]
                }
            }, { upsert: true })
            return message.channel.send(embed)

        } catch {
            return message.channel.send(
                new Discord.MessageEmbed()
                  .setColor('RED')
                  .setAuthor(serverLanguage['invalidLang'], client.user.avatarURL())
                  .setDescription('> '+serverLanguage['activeLangs']+' **(' + files.length + ')**\n\n' + response)
                  .setFooter(serverLanguage['currentLang'].replace('{currentLang}', fullLanguageFile['$package']['name']))
                  .setTimestamp()
              );
        }
    })

};
exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [ 'dil', 'language' ]
};
exports.help = {
	name: 'lang',
	description: '',
	usage: ''
};


