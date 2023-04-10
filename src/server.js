  const passport = require("passport");
  const Strategy = require("passport-discord").Strategy;
  const fastify = require("fastify");
  const path = require("path");
  const app = fastify();
  const AutoLoad = require("fastify-autoload");
  const fastifySession = require("fastify-session");
  const fastifyCookie = require("fastify-cookie");
  const oauth2 = require("fastify-oauth2");
  const fastifyFormbody = require("fastify-formbody");
  const fetch = require("node-fetch");
  const Discord = require("discord.js");
  
  module.exports = client => {
    require("./database/connect.js")(app);
    app.register(require("fastify-minify"), {
      cache: 2500,
      global: true,
      minInfix: (req, filePath) => req.query.mini === "true",
      validate: (req, rep, payload) => typeof payload === "string",
      htmlOptions: {
        caseSensitive: true
      },
      jsOptions: {
        "keep-classnames": true
      },
      cssOptions: {},
      transformers: [
        {
          suffix: "txt",
          contentType: "text/plain",
          func: value => value.toUpperCase(),
          decorate: "upperCaseText",
          useCache: true
        }
      ]
    });
    const schema = {
      type: "object",
      required: ["PORT"],
      properties: {
        BASE_URL: {
          type: "string"
        },
        PORT: {
          type: "integer",
          default: 3000
        },
        DISCORD_CLIENT_ID: {
          type: "string"
        },
        DISCORD_SECRET: {
          type: "string"
        },
        DISCORD_PERMISSION: {
          type: "string"
        }
      }
    };
    app.register(require("fastify-env"), {
      schema,
      dotenv: true
    });
  
    app.register(require("fastify-static"), {
      root: path.join(__dirname, "views/assets"),
      prefix: "/"
    });
  
    app.register(require("point-of-view"), {
      engine: {
        ejs: require("ejs")
      },
      root: path.join(__dirname, "views")
    });
    
    /* Auth - Start */
  
    app.register(fastifyFormbody);
    app.register(fastifyCookie);
    app.register(fastifySession, {
      cookieName: "dession/auth",
      secret:
        "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
      cookie: {
        secure: false
      },
      expires: 1800000
    });
    app.register(oauth2, {
      name: "discordOAuth2",
      credentials: {
        client: {
          id: global.config.website.clientid,
          secret: global.config.website.secret
        },
        auth: oauth2.DISCORD_CONFIGURATION
      },
      scope: ["identify", "guilds", "guilds.join"],
      startRedirectPath: "/auth/login",
      callbackUri: global.config.website.callback
    });
  
    app.get("/callback", async function(request, reply) {
      const token = await this.discordOAuth2.getAccessTokenFromAuthorizationCodeFlow(
        request
      );
      request.session.isLoggedIn = true;
      const userData = await fetch(`https://discord.com/api/users/@me`, {
        method: "GET",
        headers: {
          authorization: `${token.token_type} ${token.access_token}`
        }
      })
        .then(res => res.json())
        .then(json => json);
      request.session.user = userData;
      reply.redirect("/");
      return token;
    });
  
    app.get("/auth/logout", async function(request, reply, next) {
      if (request.session.isLoggedIn) {
        request.destroySession(err => {
          if (err) {
            reply.status(500);
            request.query.code = 500;
            request.query.message = "An unknown error has occurred.";
            reply.redirect("/error");
          } else {
            reply.redirect("/");
          }
        });
      } else {
        reply.redirect("/");
      }
    });
    /* Auth - End */
  
    app.get("/", async (req, res) => {
      let database = require("./database/models/server.js");
      let exdb = await database.find();
      
      let sort = req.query.s;
      if(sort != "heart" && sort != "voice") {
        req.query.s = "voice";
      }
      return res.view("index.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch,
        exdb: exdb,
        client: client,
        sort: req.query.s
      });
    });
    app.get("/error", async (req, res) => {
      return res.view("error.ejs", {
        config: global.config,
        user: req.session.user,
        client: client
      });
    });
  
    app.get("/_dev/stats", async (req, reply) => {
      reply.send({
        users: client.guilds.cache.reduce((a, b) => a + b.memberCount, 0),
        servers: client.guilds.cache.size
      });
    });
  
    app.get("/p/:ID", async (req, res) => {
      client.users.fetch(req.params.ID).then(async member => {
        if (!member) return res.redirect("/");
        let db = require("./database/models/user.js");
        let userdb = await db.findOne({
          id: member.id
        });
        let database = require("./database/models/server.js");
        let exdb = await database.find();
        return res.view("/profile/profile.ejs", {
          config: global.config,
          user: req.session.user,
          member: member,
          client: client,
          userdb: userdb,
          exdb: exdb
        });
      });
    });
    app.post("/p/:ID", async (req, res) => {
      if (!req.session.user)
        return res.send({
          error: true,
          message: "Bu işlem için giriş yapmalısın."
        });
      let user = req.session.user;
      if (user.id !== req.params.ID)
        return res.send({
          error: true,
          message: "Sadece kendi hesabınızı düzenleyebilirsiniz."
        });
      let db = require("./database/models/user.js");
      let { bio } = req.body;
      await db.updateOne(
        {
          id: req.params.ID
        },
        {
          $set: {
            bio: bio
          }
        },
        {
          upsert: true
        }
      );
      return res.send({
        success: true,
        message: "Hesap başarıyla düzenlendi."
      });
    });
    app.get("/invite", async (req, res) => {
      return res.redirect(
        "https://discord.com/oauth2/authorize?client_id=594085341938450444&permissions=8&scope=bot"
      );
    });
    app.get("/github", async (req, res) => {
      return res.redirect("https://github.com/TeamDesion");
    });
    app.get("/discord", async (req, res) => {
      return res.redirect("https://discord.gg/mghHcd58Th");
    });
    app.get("/s/:custom", async (req, res) => {
      let serverData = require("./database/models/server.js");
      let db = await serverData.findOne({
         customURL: req.params.custom
      });
      if(!db) return res.redirect('/');
      let sw = client.guilds.cache.get(db.id);
      if (!sw) return res.redirect("/");
      client.guilds.fetch(db.id).then(async guild => {
        let moment = require("moment");
        require('moment-duration-format')
        return res.view("/server/view.ejs", {
          config: global.config,
          guild: guild,
          moment: moment,
          db: db,
          res: res,
          client: client,
          user: req.session.user
        });
      });
    });
    app.get("/server/:id", async (req, res) => {
      let sw = client.guilds.cache.get(req.params.id);
      if (!sw) return res.redirect("/");
      client.guilds.fetch(req.params.id).then(async guild => {
        let serverData = require("./database/models/server.js");
        let db = await serverData.findOne({
          id: guild.id
        });
		if(db) {
        if(db.customURL) return res.redirect('/s/'+db.customURL);
		}
        let moment = require("moment");
        require('moment-duration-format')
        return res.view("/server/view.ejs", {
          config: global.config,
          guild: guild,
          moment: moment,
          db: db,
          res: res,
          client: client,
          user: req.session.user
        });
      });
    });
    app.post("/server/:id", async (req, res) => {
      if (!req.session.user)
        return res.send({
          error: true,
          message: "Bu işlem için giriş yapmalısın."
        });
      let sw = client.guilds.cache.get(req.params.id);
      if (!sw) return res.redirect("/");
      client.guilds.fetch(req.params.id).then(async guild => {
        let serverData = require("./database/models/server.js");
        let db = await serverData.findOne({ id: guild.id });
        if (
          !guild.members.cache.get(req.session.user.id) &&
          guild.members.cache
            .get(req.session.user.id)
            .permissions.has("MANAGE_GUILD")
        )
          return res.send({
            error: true,
            message: "Sadece yetkili olduğun sunucular için işlem yapabilirsin."
          });
        let { invite, tag, gizli, customURL, webhook } = req.body;
        if (!invite)
          return res.send({
            error: true,
            message: "Bir davet bağlantısı girmelisiniz. "
          });
        if (!tag)
          return res.send({
            error: true,
            message: "Bir sunucu etiketi seçmelisiniz. "
          });
        if (!invite.startsWith("https://discord.gg/"))
          return res.send({
            error: true,
            message: "Geçerli bir davet bağlantısı girmelisiniz."
          });
        if(db) {
          if(db.verified === "Verified") {
            if(db.tag != tag) {
              return res.send({
                error: true,
                message: 'Onaylanmış sunucularda etiket değişimi yapılamaz.'
              });
            }
            if(customURL) {
              if(customURL.length > 32) return res.send({
                error: true,
                message: 'Özel bağlantılar maksimum 32 karakter olabilir.'
              })
              if(customURL.length < 2) return res.send({
                error: true,
                message: 'Özel bağlantılar minimum 2 karakter olabilir.'
              })
              if(!/^[a-zA-Z]+$/.test(customURL)) return res.send({
                error: true,
                message: 'Sadece ingiliz karakterler kullanılabilir.'
              });
              let checkDomain = await serverData.findOne({ customURL: customURL })
              if(checkDomain) {
              if(checkDomain.id !== db.id) return res.send({
                error: true,
                message: 'Bu özel bağlantı başka bir sunucu tarafından kullanılıyor.'
              });
              }
              if(guild.id !== "849011617962393638") {
              if(customURL.includes('desion') || customURL.includes('discord')) return res.send({
                error: true,
                message: 'Bu özel davet bağlantısı alınamaz.'
              });
              }
            }
          } else {
            if(customURL) return res.send({
              error: true,
              message: 'Onaylanmamış sunucular özel bağlantı belirleyemez.'
            })
          }
        }
        await serverData.updateOne(
          {
            id: req.params.id
          },
          {
            $set: {
              invite: invite,
              tag: tag,
              gizli: gizli === 'true' ? gizli : null,
              customURL: customURL ? customURL : null,
              webhook: webhook ? webhook : null
            }
          },
          {
            upsert: true
          }
        );
        return res.send({
          success: true,
          message: "Sunucu başarıyla düzenlendi."
        });
      });
    });

    /*
      Webhook Düzenle
    */
    app.post("/server/:id/webhook", async (req, res) => {
      if (!req.session.user)
        return res.send({
          error: true,
          message: "Bu işlem için giriş yapmalısın."
        });
      let sw = client.guilds.cache.get(req.params.id);
      if (!sw) return res.redirect("/");
      client.guilds.fetch(req.params.id).then(async guild => {
        let serverData = require("./database/models/server.js");
        let db = await serverData.findOne({ id: guild.id });
        if (
          !guild.members.cache.get(req.session.user.id) &&
          guild.members.cache
            .get(req.session.user.id)
            .permissions.has("MANAGE_GUILD")
        )
          return res.send({
            error: true,
            message: "Sadece yetkili olduğun sunucular için işlem yapabilirsin."
          });
        let { webhook, message} = req.body;
        if(!webhook) return res.send({
          error: true,
          message: 'Bir webhook adresi girmelisin.'
        })
        if (!webhook.startsWith("https://discord.com/api/webhooks"))
          return res.send({
            error: true,
            message: "Geçerli bir webhook bağlantısı girmelisiniz."
          });

        let webhookGet = await fetch(webhook, { method: "GET"}).then(res => res.json()).then(json => json);
        if(webhookGet.code) return res.send({
          error: true,
          message: 'Geçerli bir webhook bağlantısı girmelisiniz.'
        });
        if(webhookGet.guild_id !== req.params.id) return res.send({
          error: true,
          message: 'Bu webhook adresi bu sunucuya ait değil.'
        });
        await serverData.updateOne(
          {
            id: req.params.id
          },
          {
            $set: {
              [`webhook.link`]: webhook ? webhook : null,
              [`webhook.message`]: message ? message : null
            }
          },
          {
            upsert: true
          }
        );

        return res.send({
          success: true,
          message: "Webhook başarıyla düzenlendi."
        });

      });
    });
    /* 
      Verify Server 
    */
    app.post("/server/:id/verify", async (req, res) => {
      if (!req.session.user)
        return res.send({
          error: true,
          message: "Bu işlem için giriş yapmalısın."
        });
      let sw = client.guilds.cache.get(req.params.id);
      if (!sw) return res.redirect("/");
      client.guilds.fetch(req.params.id).then(async guild => {
        let serverData = require("./database/models/server.js");
        if (
          !guild.members.cache.get(req.session.user.id) &&
          guild.members.cache
            .get(req.session.user.id)
            .permissions.has("MANAGE_GUILD")
        )
          return res.send({
            error: true,
            message: "Sadece yetkili olduğun sunucular için işlem yapabilirsin."
          });
        let { invite, tag, desc } = req.body;
        if (!invite)
          return res.send({
            error: true,
            message: "Kalıcı bir davet bağlantısı girmelisiniz."
          });
        if (!invite.startsWith("https://discord.gg/"))
          return res.send({
            error: true,
            message: "Geçerli bir davet bağlantısı girmelisiniz."
          });
  
        if (!tag)
          return res.send({
            error: true,
            message: "Kalıcı bir sunucu kategorisi seçmelisiniz."
          });
        if (!desc)
          return res.send({
            error: true,
            message: "Bir açıklama girmelisin."
          });
        let basvuruData = require("./database/models/verifyForm.js");
        let findDB = await basvuruData.findOne({
          id: req.params.id
        });
        if (findDB)
          return res.send({
            error: true,
            message: "Bu sunucu için daha önceden başvuru yapılmış."
          });
  
        let findDDB = await serverData.findOne({
          id: req.params.id
        });
        if (!findDDB)
          return res.send({
            error: true,
            message: "Sunucu düzenlenmediği için başvuru yapılamaz."
          });
        if (findDDB.verified === "Verified")
          return res.send({
            error: true,
            message: "Bu sunucu zaten onaylanmış."
          });
        await new basvuruData({
          id: req.params.id,
          desc: desc,
          tag: tag,
          invite: invite
        }).save();
        let serverTag = global.config.website.tags.find(
          element => element.value === tag
        );
        const newVerifyForm = new Discord.MessageEmbed()
          .setThumbnail(
            guild.iconURL({
              dynamic: true
            })
          )
          .setDescription(
            `A user named \`${req.session.user.username}#${req.session.user.discriminator}\` requested confirmation for a server named \`${guild.name}\``
          )
          .setColor("#6CA2FC")
          .setAuthor(client.user.username, client.user.avatarURL())
          .addField(`Server Name`, guild.name)
          .addField(`Member Count`, guild.memberCount)
          .addField(`Confirmation Description`, desc)
          .addField(`Permanent Category`, serverTag.value)
          .addField(`Invite Link`, invite, true)
          .addField(`Desion Page`, 'https://desion.me/server/'+guild.id, true);
        client.channels.cache
          .get("868125777722474556")
          .send(
            `<@${req.session.user.id}> & <@&867530131240779786>`,
            newVerifyForm
          );
  
        return res.send({
          success: true,
          message: "Başvuru işlemi başarıyla gerçekleştirildi."
        });
      });
    });
    
    
    
    /* Api - Start */
      app.get("/api/activeSound", async (req, reply) => {
      let key = req.query.id;
      if (key.length <= 0)
        return reply.send({
          status: true,
          count: 0
        });
      let desionGuild = client.guilds.cache.get(req.query.id);
      if (!desionGuild)
        return reply.send({
          status: true,
          count: 0
        });
      reply.send({
        status: true,
        count: desionGuild.channels.cache
          .filter(a => a.type === "voice")
          .reduce((a, b) => a + b.members.size, 0)
      });
    });
    app.post("/api/search", async (req, reply) => {
      let key = req.body.key;
      if (key.length <= 0)
        return reply.send({
          status: true,
          data: []
        });
      let serverDatas = require('./database/models/server.js');
      let db = await serverDatas.find();
      let data = await client.guilds.cache
        .filter(d => d.name.toLowerCase().includes(key.toLowerCase()))
        .sort(
          (a, b) =>
            b.channels.cache
              .filter(a => a.type === "voice")
              .reduce((a, b) => a + b.members.size, 0) -
            a.channels.cache
              .filter(a => a.type === "voice")
              .reduce((a, b) => a + b.members.size, 0)
        );
      reply.send({
        status: true,
        data: data
      });
    });
    /* Api - End */
  
    /* Ortaklar */
  
    app.get("/partners", async (req, res) => {
      let database = require("./database/models/server.js");
      let exdb = await database.find();
      return res.view("partners/partners.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch,
        exdb: exdb,
        client: client
      });
    });
  
    
    app.post("/admin/partner/make/:id", async (req, res) => {
      if (!req.session.user)
        return res.send({
          error: true,
          message: "Bu işlem için giriş yapmalısın."
        });
  
      let getSupport = client.guilds.cache.get("849011617962393638");
      let getUserFromSupport = getSupport.members.cache.get(req.session.user.id);
      if (!getUserFromSupport.roles.cache.get("867530131240779786"))
        return res.send({
          error: true,
          message: "Bu işlem için yeterli izne sahip değilsiniz. "
        });
      let serverData = require("./database/models/server.js");
      let findDB = await serverData.findOne({
        id: req.params.id
      });
      if (!findDB)
        return res.send({
          error: true,
          message: "Bu sunucunun ortak olmak için ayarları düzenlemesi gerekir."
        });
      let guildCache = client.guilds.cache.get(req.params.id);
      if (!guildCache)
        return res.send({
          error: true,
          message: "Bot bu sunucuda bulunmuyor."
        });
  
      if(findDB.partner) 
        return res.send({
          error: true,
          message: 'Bu sunucu zaten bizimle ortak.'
        })
      let serverTag = global.config.website.tags.find(
        element => element.value === findDB.tag
      );
      
      const partneredServer = new Discord.MessageEmbed()
        .setAuthor(client.user.username, client.user.avatarURL())
        .setDescription(
          `The server named \`${guildCache.name}\` was given a partner by an official named \`${req.session.user.username}\`.`
        )
        .setColor("#6ca2fc")
        .addField(`Server Name`, guildCache.name)
        .addField(`Member Count`, guildCache.memberCount)
        .addField(`Server Category`, serverTag.value);
  
      let adminFromServer = [];
      guildCache.members.cache
        .filter(x => x.permissions.has("MANAGE_GUILD") && !x.user.bot)
        .map(x => {
          adminFromServer.push(x.id);
        });
      client.channels.cache
        .get("868125777722474556")
        .send(
          `${adminFromServer.map(x => `<@${x}>`).join(`, `)}`,
          partneredServer
        );
      
      await serverData.updateOne(
        {
          id: req.params.id
        },
        {
          $set: {
            partner: "Partnered"
          }
        },
        {
          upsert: true
        }
      );
      return res.send({
        success: true,
        message: "Sunucu başarıyla ortaklar listesine eklendi."
      });
    });
  app.post("/admin/partner/unmake/:id", async (req, res) => {
      if (!req.session.user)
        return res.send({
          error: true,
          message: "Bu işlem için giriş yapmalısın."
        });
  
      let getSupport = client.guilds.cache.get("849011617962393638");
      let getUserFromSupport = getSupport.members.cache.get(req.session.user.id);
      if (!getUserFromSupport.roles.cache.get("867530131240779786"))
        return res.send({
          error: true,
          message: "Bu işlem için yeterli izne sahip değilsiniz. "
        });
      let serverData = require("./database/models/server.js");
      let findDB = await serverData.findOne({
        id: req.params.id
      });
      if (!findDB.partner)
        return res.send({
          error: true,
          message: "Bu sunucu zaten ortak değil."
        });
      let guildCache = client.guilds.cache.get(req.params.id);
      let serverTag = global.config.website.tags.find(
        element => element.value === findDB.tag
      );
      if(!req.body.reason) return res.send({ error: true, message: 'Bir sebep girmelisin.'});
      const partneredServer = new Discord.MessageEmbed()
        .setAuthor(client.user.username, client.user.avatarURL())
        .setDescription(
          `The partnership of the server named \`${guildCache.name}\` was terminated by the moderator named \`${req.session.user.username}\`.`
        )
        .setColor("RED")
        .addField(`Server Name`, guildCache.name)
        .addField(`Member Count`, guildCache.memberCount)
        .addField(`Server Category`, serverTag.value)
        .addField(`Reason`, req.body.reason);
  
      let adminFromServer = [];
      guildCache.members.cache
        .filter(x => x.permissions.has("MANAGE_GUILD") && !x.user.bot)
        .map(x => {
          adminFromServer.push(x.id);
        });
      client.channels.cache
        .get("868125777722474556")
        .send(
          `${adminFromServer.map(x => `<@${x}>`).join(`, `)}`,
          partneredServer
        );
      
      await serverData.updateOne(
        {
          id: req.params.id
        },
        {
          $set: {
            partner: null
          }
        },
        {
          upsert: true
        }
      );
      return res.send({
        success: true,
        message: "Sunucunun ortaklığı başarıyla sonlandırıldı."
      });
    
    });
    
    /* Admin Options */
  
    app.post("/admin/verify/:id", async (req, res) => {
      if (!req.session.user)
        return res.send({
          error: true,
          message: "Bu işlem için giriş yapmalısın."
        });
  
      let getSupport = client.guilds.cache.get("849011617962393638");
      let getUserFromSupport = getSupport.members.cache.get(req.session.user.id);
      if (!getUserFromSupport.roles.cache.get("867530131240779786"))
        return res.send({
          error: true,
          message: "Bu işlem için yeterli izne sahip değilsiniz. "
        });
  
      let serverData = require("./database/models/server.js");
      let findDB = await serverData.findOne({
        id: req.params.id
      });
      if (!findDB)
        return res.send({
          error: true,
          message: "Bu sunucu onay almak için yeterli değil."
        });
  
      let guildCache = client.guilds.cache.get(req.params.id);
      if (!guildCache)
        return res.send({
          error: true,
          message: "Bot bu sunucuda bulunmuyor."
        });
  
      if (guildCache.memberCount <= 999)
        return res.send({
          error: true,
          message: "Sunucu yeterli kullanıcıya sahip değil."
        });
  
      let formCheck = require("./database/models/verifyForm.js");
      let findForm = await formCheck.findOne({ id: req.params.id });
      if (!findForm)
        return res.send({
          error: true,
          message: "Sunucu onay için bir başvuru yapmamış."
        });
      let serverTag = global.config.website.tags.find(
        element => element.value === findForm.tag
      );
      const verifiedServer = new Discord.MessageEmbed()
        .setAuthor(client.user.username, client.user.avatarURL())
        .setDescription(
          `Server \`${guildCache.name}\` was confirmed by an official named \`${req.session.user.username}\`.
          `
        )
        .setColor("GREEN")
        .addField(`Server Name`, guildCache.name)
        .addField(`Member Count`, guildCache.memberCount)
        .addField(`Server Category`, serverTag.value);
  
      let adminFromServer = [];
      guildCache.members.cache
        .filter(x => x.permissions.has("MANAGE_GUILD") && !x.user.bot)
        .map(x => {
          adminFromServer.push(x.id);
        });
      client.channels.cache
        .get("868125777722474556")
        .send(
          `${adminFromServer.map(x => `<@${x}>`).join(`, `)}`,
          verifiedServer
        );
  
      await serverData.updateOne(
        {
          id: req.params.id
        },
        {
          $set: {
            invite: findForm.invite,
            tag: findForm.tag,
            verified: "Verified"
          }
        },
        {
          upsert: true
        }
      );
      await formCheck.deleteOne({
        id: req.params.id
      });
      return res.send({
        success: true,
        message: "Sunucuya başarıyla onay verildi."
      });
    });
    app.post("/admin/unverify/:id", async (req, res) => {
      if (!req.session.user)
        return res.send({
          error: true,
          message: "Bu işlem için giriş yapmalısın."
        });
  
      let getSupport = client.guilds.cache.get("849011617962393638");
      let getUserFromSupport = getSupport.members.cache.get(req.session.user.id);
      if (!getUserFromSupport.roles.cache.get("867530131240779786"))
        return res.send({
          error: true,
          message: "Bu işlem için yeterli izne sahip değilsiniz. "
        });
  
      let serverData = require("./database/models/server.js");
      let findDB = await serverData.findOne({
        id: req.params.id
      });
  
      let guildCache = client.guilds.cache.get(req.params.id);
      if(!req.body.reason) return res.send({ error: true, message: 'Bir sebep girmelisin.'})
      let formCheck = require("./database/models/verifyForm.js");
      if (!findDB.verified)
        return res.send({
          error: true,
          message: "Sunucuda onay bulunmuyor."
        });
      const verifiedServer = new Discord.MessageEmbed()
        .setAuthor(client.user.username, client.user.avatarURL())
        .setDescription(
          `Confirmation of Server \`${guildCache.name}\` was rejected/received by moderator \`${req.session.user.username}\`.`
        )
        .setColor("RED")
        .addField(`Server Name`, guildCache.name)
        .addField(`Member Count`, guildCache.memberCount)
        .addField(`Server Category`, findDB.tag)
        .addField(`Reason`, req.body.reason);
  
      let adminFromServer = [];
      guildCache.members.cache
        .filter(x => x.permissions.has("MANAGE_GUILD") && !x.user.bot)
        .map(x => {
          adminFromServer.push(x.id);
        });
      client.channels.cache
        .get("868125777722474556")
        .send(
          `${adminFromServer.map(x => `<@${x}>`).join(`, `)}`,
          verifiedServer
        );
  
      await serverData.updateOne(
        {
          id: req.params.id
        },
        {
          $set: {
            verified: null
          }
        },
        {
          upsert: true
        }
      );
      await formCheck.deleteOne({
        id: req.params.id
      });
      return res.send({
        success: true,
        message: "Sunucunun onay işlemi başarıyla iptal edildi/alındı."
      });
    });
    
  /* Legal */
      app.get("/privacy", async (req, res) => {
      return res.view("legal/privacy.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch
      });
    });
        app.get("/tos", async (req, res) => {
      return res.view("legal/tos.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch
      });
    });
    
    /* Team */
          app.get("/team", async (req, res) => {
      return res.view("team/team.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch,
        client: client
      });
    });
    
    /* Search */
    app.get("/search", async (req, res) => {
      let database = require("./database/models/server.js");
      let page = req.query.page || 1;
      let x = await database.find()
      if(req.query.q.length = 0) { 
        req.query.q = "All";
      }
      let data = x.filter(a => client.guilds.cache.get(a.id) && !a.gizli && client.guilds.cache.get(a.id).name.toLowerCase().includes(req.query.q.toLowerCase()))
      if (page < 1) return res.redirect(`/`);
      if (data.length <= 0) return res.redirect("/");
      if ((page > Math.ceil(data.length / 12))) return res.redirect(`/`);
      if (Math.ceil(data.length / 12) < 1) {
          page = 1;
      };
      let sort = req.query.s;
      if(sort != "heart" && sort != "voice") {
        req.query.s = "voice";
      }
      return res.view("search/search.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch,
        exdb: data,
        client: client,
        arama: req.query.q,
        page: page,
        sort: req.query.s
      });
    });
    /* More Verified*/
    app.get("/more/verified", async (req, res) => {
      let database = require("./database/models/server.js");
      let page = req.query.page || 1;
      let x = await database.find()
      let data = x.filter(a => !a.gizli && a.verified === "Verified")
      if (page < 1) return res.redirect(`/`);
      if (data.length <= 0) return res.redirect("/");
      if ((page > Math.ceil(data.length / 12))) return res.redirect(`/`);
      if (Math.ceil(data.length / 12) < 1) {
          page = 1;
      };
      let sort = req.query.s;
      if(sort != "heart" && sort != "voice") {
        req.query.s = "voice";
      }
      return res.view("more/more-verified.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch,
        exdb: data,
        client: client,
        page: page,
        sort: req.query.s
      });
    });
    /* More */
    app.get("/more/:tag", async (req, res) => {
      let database = require("./database/models/server.js");
      let page = req.query.page || 1;
      let x = await database.find()
      let data = x.filter(a => !a.gizli && a.tag === req.params.tag)
      if (page < 1) return res.redirect(`/`);
      if (data.length <= 0) return res.redirect("/");
      if ((page > Math.ceil(data.length / 12))) return res.redirect(`/`);
      if (Math.ceil(data.length / 12) < 1) {
          page = 1;
      };
      let sort = req.query.s;
      if(sort != "heart" && sort != "voice") {
        req.query.s = "voice";
      }
      let foundedTag = global.config.website.tags.find(item => item.value === req.params.tag)
      return res.view("more/more.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch,
        exdb: data,
        client: client,
        etiket: foundedTag,
        page: page,
        sort: req.query.s
      });
    });

    /* Top 30 */
    app.get("/top/:value", async (req, res) => {
      let database = require("./database/models/server.js");
      let x = await database.find()
      let data = x.filter(a => !a.gizli)
      let sort = req.params.value;
      if(sort != "heart" && sort != "voice") {
        req.params.value = "voice";
      }
      return res.view("top/top.ejs", {
        config: global.config,
        user: req.session.user,
        fetch: fetch,
        exdb: data,
        client: client,
        sort: req.params.value
      });
    });

  // Status Redirect
  app.decorate('notFound', (request, reply) => {
    if(reply.code) return reply.redirect('/error');
  })
  app.setNotFoundHandler(app.notFound)



;(async function () {
  app.listen(config.PORT || 3000, '0.0.0.0', (err) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    } else {
      console.log('Server: 3000')
    }
  })
})()

};
  