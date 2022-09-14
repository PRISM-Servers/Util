let Discord = null;
try { Discord = require("discord.js"); }
catch (_) { /**/ }
const Util = require("./Util");
const Time = require("./Time");

class Discord_ {
    /**
     * @param {Discord.Message} msg 
     * @param {string} color 
     */
    static Ping(msg, color) {
        if (!Discord) throw new Error("No Discord.js");
    
        let start = process.hrtime.bigint();
        let embed = new Discord.MessageEmbed();
    
        embed.setAuthor(msg.client.user.username, msg.client.user.avatarURL());
        embed.setColor(color);
        embed.setTitle(":ping_pong: Pong!");
        embed.setTimestamp(new Date());
        embed.addFields({name: "__Time :clock1030:__", value: "**Heartbeat (WS)**: " + msg.client.ws.ping.toFixed(2) + "ms\n**REST**: Measuring..."});
    
        msg.channel.send({embeds: [embed]}).then(msg2 => {
            this.DeleteMessage(msg);
    
            let end = process.hrtime.bigint();
            let final = end - start;
            let took = final / BigInt("1000000");
                
            let embed = new Discord.MessageEmbed(msg2.embeds[0]);
            embed.fields[0].value = "**Heartbeat (WS)**: " + msg.client.ws.ping.toFixed(2) + "ms\n**REST**: " + took + "ms";
            msg2.edit({embeds: [embed]}).catch(console.log);
        }, onrj => console.log("Failed to send ping embed! - " + onrj));
    }
    
    /**
         * @param {Discord.GuildMember} GuildMember 
         */
    static IsAdmin(guildMember) {
        if (!Discord) throw new Error("No Discord.js");
    
        if (!guildMember || !(guildMember instanceof Discord.GuildMember)) return false;
        return guildMember.permissions.has("ADMINISTRATOR") || (guildMember.permissions.has("BAN_MEMBERS") && guildMember.permissions.has("KICK_MEMBERS") && guildMember.permissions.has("MANAGE_GUILD") && guildMember.permissions.has("MANAGE_CHANNELS") && guildMember.permissions.has("MANAGE_ROLES"));
    }
    
    /**
         * @param {Discord.Guild} guild 
         * @param {string} name 
         */
    static FindMember(guild, name) {
        return new Promise((resolve, reject) => {
            if (!guild || !name) return reject(new Error("No guild/name provided"));
    
            name = name.toLowerCase();
    
            guild.members.fetch().then(members => {
                let found = members.filter(x => x.id == name || x.user.tag.toLowerCase() == name || x.user.username.toLowerCase() == name);
    
                if (found.size < 1) return reject(new Error("No members found with that name/id"));
    
                resolve(found);
            }).catch(reject);
        });
    }
    
    /**
         * @param {Discord.Message} msg 
         * @param {number} time 
         * @param {string[]} accept_args 
         * @param {string} text 
         * @param {boolean} cleanup 
         */
    static GetMessageResponse(msg, time = 15 * 1000, accept_args = [], text = "", cleanup = true) {
        // eslint-disable-next-line no-async-promise-executor
        return new Promise(async (resolve, reject) => {
            if (!msg || !time) return reject(new Error("args"));
                
            let sent = text ? await msg.channel.send(text) : null;
            let collector = msg.channel.createMessageCollector({filter: m => m.author.id == msg.author.id, time: time});
    
            collector.on("collect", collected => {
                let lower = collected.content.toLowerCase();
                if (!lower) return;
    
                if (accept_args && accept_args.length > 0 && accept_args.map(x => x.toLowerCase()).includes(lower)) {
                    collector.stop("success");
                    return resolve(collected);
                }
    
                if (lower == "stop" || lower == "no") {
                    collector.stop("cancelled");
                    return reject(collected);
                }
    
                if (!accept_args || accept_args.length < 1) {
                    collector.stop("success");
                    return resolve(collected);
                }
            });
    
            collector.on("end", (collected, reason) => {
                if (cleanup) {
                    collected.each(msg => this.DeleteMessage(msg));
                    this.DeleteMessage(sent);
                }
    
                if (reason != "success") reject(reason);
            });
        });
    }
    
    /**
         * @param {Discord.Message} msg 
         * @param {string} owner 
         */
    static Privet(msg, owner) {
        if (!msg?.author) return;
    
        let content = msg.content.toLowerCase().replace(/ /g, "");
    
        if (msg.author.id == owner && (content.includes("приветсолдат") || content.includes("privetsoldat"))) {
            msg.react("519238475510186014");
        }
    }
    
    static HandleShardDisconnect(client, event, id) {
        console.log("[" + (client?.user?.username ?? "Unknown") + "] Shard #" + id + " disconnected: " + event.code + " (" + (event.reason ? event.reason : "Unknown Reason") + ")");
    }
    
    static HandleShardError(client, error, id) {
        console.log("[" + (client?.user?.username ?? "Unknown") + "] Shard #" + id + " errored: ", error);
    }
    
    /**
         * @param {Discord.Message} msg 
         * @param {number} ms 
         */
    static DeleteMessage(msg, ms = 1000) {
        if (!msg?.deletable || msg?.deleted) return;
        setTimeout(() => msg.delete().catch(console.log), ms);
    }
    
    /**
         * @param {Discord.GuildMember | Discord.User | string} input 
         */
    static GetUserTag(input) {
        if (!Discord) throw new Error("No Discord.js");
    
        if (!input) return null;
    
        let id = "";
        if (typeof input == "string") id = input;
        else if (input instanceof Discord.GuildMember) id = input.user.id;
        else if (input instanceof Discord.User) id = input.id;
        if (!id) return input;
    
        return isNaN(id) ? input : "<@" + id + ">";
    }
    
    /**
         * @param {string} message 
         * @param {string} url 
         * @param {string} avatar 
         * @param {string} name 
         */
    static SendWebhookMessage(message, url, avatar, name) {
        if (!Discord) throw new Error("No Discord.js");
    
        if (!url || url == "None") return false;
    
        avatar = avatar.replace(".webp", ".png");
        let _url = url.replace("https://discord.com/api/webhooks/", "");
        let split = _url.split("/");
    
        if (split.length < 2) return false;
    
        let client = new Discord.WebhookClient({url});
        if (typeof message == "string") {
            for (let msg of Discord.Util.splitMessage(message, {maxLength: 1980})) {
                client.send({content: msg, avatarURL: avatar, username: name}).catch(console.log);
            }
        }
    
        else client.send({embeds: [message], avatarURL: avatar, username: name}).catch(console.log);
        return true;
    }
    
    /**
         * @param {Discord.Client} client 
         * @param {string} id 
         */
    static GetServer(client, id) {
        if (!id) throw new Error("Missing id");
        return client.guilds.cache.find(x => x.id == id);
    }

    /**
     * @param {Discord.Message} msg 
     * @param {string} res 
     * @param {string} color 
     * @param {Discord.Message} alreadySent 
     * @param {string} _code 
     */
    static HandleEval(msg, res, color = "ORANGE", alreadySent = undefined, _code = undefined) {
        if (!Discord) throw new Error("No Discord.js");

        if (Util.IsObject(res) || Array.isArray(res)) {
            try { res = JSON.stringify(res, null, 2); }
            catch (_) { /**/ }
        }
        else res = String(res);

        let code = msg.content && typeof msg.content == "string" ? Util.GetArgsFromMessage(msg.content) : [undefined, _code];
        code.shift();
        code = code.join(" ");

        if (code.toLowerCase().startsWith("eval")) code = code.substring(4);
        code.trim();

        // eslint-disable-next-line no-useless-escape
        res = !res ? "None" : res.replace(/[a-zA-Z0-9]{24}\.[a-zA-Z0-9]{6}\.[a-zA-Z0-9_\-]{27}|mfa\.[a-zA-Z0-9_\-]{84}/gi, "[REDACTED]");

        if (res.length < 1000) {
            let embed = new Discord.MessageEmbed();
            embed.setColor(color);
            embed.setDescription("Code:\n>>> " + code);
            embed.setAuthor(msg.guild.me.user.username, msg.guild.me.user.avatarURL());
            embed.setTimestamp();
            embed.setFooter("Custom bot for PRISM");
            embed.addFields({name: "Response", value: "```\n" + res + "```"});

            if (!alreadySent) msg.channel.send({embeds: [embed]});
            else alreadySent.edit({embeds: [embed]});
        }

        else msg.channel.send({files: [{name: "eval_" + Time.LogFormat() + (Util.IsValidJSON(res) ? ".json" : ".txt"), attachment: Buffer.from(res)}]});
    }

    /**
     * @param {any} res 
     * @param {string} code 
     * @param {string} color 
     * @param {any} interaction 
     * @returns 
     */
    static HandleEvalInteract(res, code, interaction, color = "ORANGE") {
        if (!Discord) throw new Error("No Discord.js");

        if (Util.IsObject(res) || Array.isArray(res)) {
            try { res = JSON.stringify(res, null, 2); }
            catch (_) { /**/ }
        }
        else res = String(res);

        // eslint-disable-next-line no-useless-escape
        res = !res ? "None" : res.replace(/[a-zA-Z0-9]{24}\.[a-zA-Z0-9]{6}\.[a-zA-Z0-9_\-]{27}|mfa\.[a-zA-Z0-9_\-]{84}/gi, "[REDACTED]");

        let embed = new Discord.MessageEmbed();
        embed.setColor(color);
        embed.setDescription("Code:\n>>> " + code);
        embed.setTimestamp();
        
        let files = [];

        if (res.length < 1000) {
            embed.addFields({name: "Response", value: "```\n" + res + "```"});
        }
        else {
            embed.addFields({name: "Response", value: "```\nCheck file```"});
            files.push(new Discord.MessageAttachment(Buffer.from(res), "eval_" + Time.LogFormat() + (Util.IsValidJSON(res) ? ".json" : ".txt")));
        }

        interaction.editResponse({embeds: [embed], files});
    }

    /**
     * @param {Discord.Client} client 
     * @param {boolean} skipWarning 
     */
    static GetClientConnectionInfo(client, _owner, skipWarning = false) {
        if (!client) throw new Error("No client");
        
        client.application.fetch().then(app => {
            let owner = app.owner.ownerId ?? app.owner.id;
            if (_owner != owner && !skipWarning) {
                throw new Error("OWNER ID MISMATCH, OWNER BANNED?? <:terrified:502568483146563585>\nClient: " + client.user.id + "/" + this.GetUserTag(client.user) + "\nConst owner ID: " + _owner + "/" + this.GetUserTag(_owner) + "\nFetched owner ID: " + owner + "/" + this.GetUserTag(owner));
            }
        });

        return client.user.tag + " connected to Discord";
    }

    /**
     * @param {Discord.Client} client 
     * @param {Discord.RateLimitData} data 
     * @param {string} webhook 
     */
    static HandleRateLimit(client, data, webhook) {
        if (data.path.includes("/reactions/")) return;
        
        this.SendWebhookMessage("[" + ((client?.user?.tag + " (" + this.GetUserTag(client.user) + ")") ?? "Unknown") + "]: " + data.timeout + "ms\n" + data.method.toUpperCase() + " " + data.path, webhook, "https://prismrust.com/public/rate_limit.png", "Rate Limits");
    }

    /**
     * @param {Error | string} error 
     * @param {Discord.Client} client 
     * @param {string} webhook 
     */
    static LogRejection(error, client, webhook) {
        let temp = JSON.stringify(error, null, 2);
        let msg = "Unhandled Rejection: " + error + (temp == "{}" ? "" : "\n" + temp);
        
        msg += "\n" + (error instanceof Error ? error.stack : new Error().stack);

        console.log(error);

        if (!temp.includes("AbortError")) {
            this.SendWebhookMessage(msg, webhook, client?.user?.avatarURL() ?? "https://i.stack.imgur.com/bJ120.png", client?.user?.username || "Utils");
        }
    }

    /**
     * @param {Error | string} error 
     * @param {Discord.Client} client 
     * @param {string} webhook 
     */
    static LogException(error, client, webhook) {
        console.log(error);

        let user = client?.user?.username ? client?.user?.username : client && typeof client == "string" ? client : "Utils"; 
        let image = client?.user?.avatarURL() ?? "https://i.stack.imgur.com/bJ120.png";
        let msg = "Uncaught Exception: " + error.message + "\n" + error.stack;
        
        this.SendWebhookMessage(msg, webhook, image, user);
    }

    /**
     * @param {Discord.TextChannel} channel 
     */
    static IsPublicChannel(channel) {
        if (!Discord) throw new Error("No Discord.js");
        if (!channel || (!(channel instanceof Discord.TextChannel) && !(channel instanceof Discord.ThreadChannel))) return false;
        
        let permissions = channel.permissionsFor(channel.guild.roles.everyone);

        if (!permissions && channel.parent == undefined && channel.parentId != undefined) {
            // TODO fix? threads
            return true;
        }

        return permissions.has("VIEW_CHANNEL") && permissions.has("SEND_MESSAGES");
    }

    /**
     * @param {string} arg 
     */
    static GetIDFromString(arg) {
        if (!arg) return null;

        return arg.replace("<@!", "").replace("<@", "").replace(">", "").replace("<#", "");
    }
}

module.exports = Discord_;
