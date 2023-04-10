const Discord = require("discord.js");
const { MessageButton } = require("discord-buttons");
const { registerFont, createCanvas } = require('canvas');
const serverData = require("../database/models/server.js");
const userData = require("../database/models/heartCheck.js");
const fetch = require('node-fetch');
let moment = require('moment');
require("moment-duration-format");
exports.run = async (client, message, args) => {
  if(!message.guild.me.hasPermission('SEND_MESSAGES')) return client.users.cache.get(message.author.id).send(`Missing permission: \`SEND_MESSAGES\``);
  if(!message.guild.me.hasPermission('EMBED_LINKS')) return message.channel.send(`Missing permission: \`EMBED_LINKS\``);
  if(!message.guild.me.hasPermission('ATTACH_FILES')) return message.channel.send(`Missing permission: \`ATTACH_FILES\``);


  let serverLanguage = client.locale(client['language_' + message.guild.id])['heart'];
  let findGuild = await serverData.findOne({ id: message.guild.id })
	let findUser = await userData.findOne({ id: message.author.id, guild: message.guild.id });
  if (findUser) {
    let süre = 3600000 - (Date.now() - findUser.date);
    const duration = moment.duration(süre).format(" D [days], H [hours], m [minutes], s [seconds]");
    return await msgError(serverLanguage['wait']['message'].replace('{time}', duration.includes('-') ? serverLanguage['wait']['less1min'] : duration), { channel: message.channel });
	} else {
  if(message.guild.me.hasPermission('ATTACH_FILES')) {
    let kod1 = client.makeid(6);
    let kod2 = client.makeid(6);
    let kod3 = client.makeid(6);
    const width = 400
    const height = 125
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')
    context.fillRect(0, 0, width, height)
    context.font = 'bold 60pt Arial'
    context.textAlign = 'center'
    context.fillStyle = '#fff'
    context.fillText(kod1, 200, 90)
    const attachment = new Discord.MessageAttachment(canvas.toBuffer(), 'captcha.png'); 
    let sorgu = new MessageButton()
    .setLabel(kod1)
    .setStyle("blurple")
    .setID(kod1)
    let sorgu2 = new MessageButton()
    .setLabel(kod2)
    .setStyle("blurple")
    .setID(kod2)
    let sorgu3 = new MessageButton()
    .setLabel(kod3)
    .setStyle("blurple")
    .setID(kod3)
    let web = new MessageButton()
    .setLabel("Visit server page")
    .setStyle("url")
    .setURL("https://desion.me/server/"+message.guild.id)

    const incorrectButton = new Discord.MessageEmbed()
	.setTitle(serverLanguage['wrong']['title'])
	.setColor("RED")
  .addField('ᅠᅠᅠᅠᅠᅠ', '**[Website](https://desion.me)** | **[Discord](https://discord.gg/desion)**')

	.setAuthor(message.author.username, message.author.avatarURL({ dynamic: true }))
	.setDescription(serverLanguage['wrong']['description'])
	const correctButton = new Discord.MessageEmbed()
	.setTitle(serverLanguage['correct']['title'])
	.setColor("GREEN")
	.setAuthor(message.author.username, message.author.avatarURL({ dynamic: true }))
	.setDescription(serverLanguage['correct']['description'].replace('{guildName}', message.guild.name).replace('{hearts}', findGuild ? (findGuild.monthHearts ? findGuild.monthHearts+1 : 1) : 1))

    const controlEmbed = new Discord.MessageEmbed()
    .setTitle(serverLanguage['control']['title'])
    .setColor("BLURPLE")
    .setAuthor(message.author.username, message.author.avatarURL({ dynamic: true }))
    .attachFiles(attachment)
    .setImage('attachment://captcha.png')
    .addField('ᅠᅠᅠᅠᅠᅠ', '**[Website](https://desion.me)** | **[Discord](https://discord.gg/desion)**')
    .setDescription(serverLanguage['control']['description']);

    message.channel.send({ embed: controlEmbed, buttons: [ sorgu, sorgu2, sorgu3 ].sort(() => Math.random()-0.5) }).then(async msg => {
		const filter = (button) => button.clicker.user.id === message.author.id;
		const collector = await msg.createButtonCollector(filter, { time: 60000 });
		  collector.on('collect', async b => {
		    if(b.id == kod1) {
            let findUserr = await userData.findOne({ id: message.author.id, guild: message.guild.id });
            if(findUserr) {
              let süre = 3600000 - (Date.now() - findUser.date);
              const duration = moment.duration(süre).format(" D [days], H [hours], m [minutes], s [seconds]");
          
              return msg.delete().then(await 
                msgError(serverLanguage['wait']['message'].replace('{time}', duration.includes('-') ? serverLanguage['wait']['less1min'] : duration), { channel: message.channel }) 
              );
            }
		      msg.delete().then( message.channel.send({ embed: correctButton, buttons: [ web ] }) )
		        await userData.updateOne({ 
			    	id: message.author.id 
			      }, { 
			    	$set: { 
			    		guild: message.guild.id,
                        date: Date.now()
			    	}
			   	  }, { upsert: true })
             await serverData.findOneAndUpdate({ id: message.guild.id }, { $inc: { monthHearts: 1, totalHearts: 1 } }, { upsert: true })
             await serverData.findOneAndUpdate({ id: message.guild.id }, { $set: { lastHeart: message.author.tag } }, { upsert: true })
             await serverData.findOneAndUpdate({ id: message.guild.id }, { $inc: { [`hearts.${message.author.id}`]: 1 } }, { upsert: true })

             const reminder = require('../database/models/reminder.js');
             let remindDB = await reminder.findOne({ id: message.author.id, guild: message.guild.id });
             if(remindDB) {
               if(remindDB.status === 0) {
                 await reminder.updateOne({
                   id: message.author.id
                 }, { $set: {
                   guild: message.guild.id,
                   status: 1,
                   channel: message.channel.id
                  }}, { upsert: true })  
   
               }
             }
             let findGuildd = await serverData.findOne({ id: message.guild.id })
            if(findGuildd.webhook) {
              let webhookGet = await fetch(findGuildd.webhook.link, { method: "GET"}).then(res => res.json()).then(json => json);
              if(webhookGet.code) {
                await serverData.findOneAndUpdate({
                  id: message.guild.id
                }, {
                  $unset: {
                    webhook: {} 
                  }
                })
                await msgError(`[${message.guild.name}](https://desion.me/server/${message.guild.id}) adlı sunucunun webhook adresi yanlış, bu yüzden webhook bilgileri veritabanından silindi.`, { channel: client.channels.cache.get('868125777722474556') })
              } else {
              const webhook = new Discord.WebhookClient(webhookGet.id, webhookGet.token);
              if(findGuildd.webhook.message) {
                let messageBased = findGuildd.webhook.message;
                let replacedMessage = messageBased
                .replace(/{user}/g, message.author)
                .replace(/{user.tag}/g, message.author.tag)
                .replace(/{heartCount}/g, findGuildd.monthHearts)
                .replace(/{guild.name}/g, message.guild.name)
                .replace(/@(everyone)/gi, "everyone")
                .replace(/@(here)/gi, "here");
                  webhook.send(replacedMessage, {
                    username: message.author.tag,
                    avatarURL: client.user.avatarURL()
                  });
              } else {
                  webhook.send(serverLanguage['webhook']['message'].replace('{user}', '<@'+message.author.id+'>').replace('{hearts}', findGuild.monthHearts), {
                    username: message.author.tag,
                    avatarURL: client.user.avatarURL()
                  });

              }
            } 
          }
			    return;
		    } else if (b.id == kod2 || b.id == kod3) {
		      msg.delete().then( message.channel.send({ embed: incorrectButton, buttons: [ web ] }) )
		    }
		  })
	})
} else {
  return message.reply(`Missing permission: \`ATTACH_FILES\``);
}
}
function msgError(msg, { channel }) {
  channel.send(new Discord.MessageEmbed()
  .setAuthor(client.user.username, client.user.avatarURL())
  .setFooter('desion.me')
  .setDescription(msg)
  .setColor("RED")
  )
}

};
exports.conf = {
	enabled: true,
	guildOnly: false,
	aliases: [ 'kalp', 'oy', 'vote' ]
};
exports.help = {
	name: 'heart',
	description: '',
	usage: ''
};


