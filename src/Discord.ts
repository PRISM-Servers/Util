import * as Discord from "discord.js";
const Util = require("./Util");
const Time = require("./Time");

export function Ping(msg: Discord.Message, color: Discord.ColorResolvable) {
    let start = process.hrtime.bigint();
    let embed = new Discord.MessageEmbed();

    embed.setAuthor(msg.client.user?.username || "", msg.client.user?.avatarURL() || "");
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

export function IsAdmin(guildMember: Discord.GuildMember) {
if (!guildMember || !(guildMember instanceof Discord.GuildMember)) return false;
    return guildMember.permissions.has("ADMINISTRATOR") || (guildMember.permissions.has("BAN_MEMBERS") && guildMember.permissions.has("KICK_MEMBERS") && guildMember.permissions.has("MANAGE_GUILD") && guildMember.permissions.has("MANAGE_CHANNELS") && guildMember.permissions.has("MANAGE_ROLES"));
}

export function FindMember(guild: Discord.Guild, name: string) {
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

export function GetMessageResponse(msg: Discord.Message, time: number = 15 * 1000, accept_args: string[] = [], text: string = "", cleanup: boolean = true) {
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

export function Privet(msg: Discord.Message, owner: string) {
    if (!msg?.author) return;

    let content = msg.content.toLowerCase().replace(/ /g, "");

    if (msg.author.id == owner && (content.includes("приветсолдат") || content.includes("privetsoldat"))) {
        msg.react("519238475510186014");
    }
}

export function HandleShardDisconnect(client: Discord.Client, event: Discord.CloseEvent, id: number) {
    console.log("[" + (client?.user?.username ?? "Unknown") + "] Shard #" + id + " disconnected: " + event.code + " (" + (event.reason ? event.reason : "Unknown Reason") + ")");
}

export function HandleShardError(client: Discord.Client, error: Error, id: number) {
    console.log("[" + (client?.user?.username ?? "Unknown") + "] Shard #" + id + " errored: ", error);
}

export function DeleteMessage(msg: Discord.Message, ms: number = 1000) {
    if (!msg?.deletable || msg?.deleted) return;
    setTimeout(() => msg.delete().catch(console.log), ms);
}

export function GetUserTag(input: Discord.GuildMember | Discord.User | string) {
if (!input) return null;

    let id = "";
    if (typeof input == "string") id = input;
    else if (input instanceof Discord.GuildMember) id = input.user.id;
    else if (input instanceof Discord.User) id = input.id;
    if (!id) return input;

    return isNaN(Number(id)) ? input : "<@" + id + ">";
}

export function SendWebhookMessage(message: string, url: string, avatar: string, name: string) {
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

export function GetServer(client: Discord.Client, id: string) {
    if (!id) throw new Error("Missing id");
    return client.guilds.cache.find(x => x.id == id);
}

export function HandleEval(msg: Discord.Message, res: string, color: Discord.ColorResolvable = "ORANGE", alreadySent?: Discord.Message, _code?: string) {
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
        embed.setAuthor(msg.guild?.members.me?.user.username || "", msg.guild?.members.me?.user.avatarURL() || "");
        embed.setTimestamp();
        embed.setFooter("Custom bot for PRISM");
        embed.addFields({name: "Response", value: "```\n" + res + "```"});

        if (!alreadySent) msg.channel.send({embeds: [embed]});
        else alreadySent.edit({embeds: [embed]});
    }

    else msg.channel.send({files: [{name: "eval_" + Time.LogFormat() + (Util.IsValidJSON(res) ? ".json" : ".txt"), attachment: Buffer.from(res)}]});
}

export function HandleEvalInteract(res: any, code: string, interaction: any, color: Discord.ColorResolvable = "ORANGE") {
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

export function GetClientConnectionInfo(client: Discord.Client, _owner?: string, skipWarning: boolean = false) {
    if (!client) throw new Error("No client");
    
    client.application?.fetch().then(app => {
        let owner = app.owner instanceof Discord.Team ? app.owner.ownerId : app.owner?.id;
        if (_owner != owner && !skipWarning) {
            throw new Error("OWNER ID MISMATCH, OWNER BANNED?? <:terrified:502568483146563585>\nClient: " + client.user?.id + "/" + this.GetUserTag(client.user) + "\nConst owner ID: " + _owner + "/" + this.GetUserTag(_owner) + "\nFetched owner ID: " + owner + "/" + this.GetUserTag(owner));
        }
    });

    return client.user?.tag + " connected to Discord";
}

export function HandleRateLimit(client: Discord.Client, data: Discord.RateLimitData, webhook: string) {
    if (data.path.includes("/reactions/")) return;
    
    this.SendWebhookMessage("[" + ((client?.user?.tag + " (" + this.GetUserTag(client.user) + ")") ?? "Unknown") + "]: " + data.timeout + "ms\n" + data.method.toUpperCase() + " " + data.path, webhook, "https://prismrust.com/public/rate_limit.png", "Rate Limits");
}

export function LogRejection(error: Error | string, client: Discord.Client, webhook: string) {
    let temp = JSON.stringify(error, null, 2);
    let msg = "Unhandled Rejection: " + error + (temp == "{}" ? "" : "\n" + temp);
    
    msg += "\n" + (error instanceof Error ? error.stack : new Error().stack);

    console.log(error);

    if (!temp.includes("AbortError")) {
        this.SendWebhookMessage(msg, webhook, client?.user?.avatarURL() ?? "https://i.stack.imgur.com/bJ120.png", client?.user?.username || "Utils");
    }
}

export function LogException(error: Error | string, client: Discord.Client, webhook: string) {
    console.log(error);

    let user = client?.user?.username ? client?.user?.username : client && typeof client == "string" ? client : "Utils"; 
    let image = client?.user?.avatarURL() ?? "https://i.stack.imgur.com/bJ120.png";
    let msg = "Uncaught Exception: " + (error instanceof Error ? error.message + "\n" + error.stack : error);
    
    this.SendWebhookMessage(msg, webhook, image, user);
}

export function IsPublicChannel(channel: Discord.TextChannel) {
    if (!Discord) throw new Error("No Discord.js");
    if (!channel || (!(channel instanceof Discord.TextChannel))) return false;
    
    let permissions = channel.permissionsFor(channel.guild.roles.everyone);

    if (!permissions && channel.parent == undefined && channel.parentId != undefined) {
        // TODO fix? threads
        return true;
    }

    return permissions.has("VIEW_CHANNEL") && permissions.has("SEND_MESSAGES");
}

export function getIDFromString(arg: string) {
    if (!arg) return null;

    return arg.replace("<@!", "").replace("<@", "").replace(">", "").replace("<#", "");
}
