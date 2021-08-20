let Discord = null;
try { Discord = require("discord.js"); }
catch (_) { /**/ }
const fetch = require("make-fetch-happen");
const formData = require("form-data");
const fs = require("fs");
const Response = require("./Response");
const Time = require("./Time");
const validator = require("validator");

class Util {
    constructor() {
        throw new Error("This class cannot be instantiated!");
    }

    static #ip = "";

    static get HOST_IP() {
        const os = require("os");

        if (this.#ip) return this.#ip;

        for (const iface of Object.values(os.networkInterfaces())) {
            for (const item of iface) {
                if (item.family == "IPv4" && !item.internal) {
                    this.#ip = item.address;
                    return this.#ip;
                }
            }
        }

        return "127.0.0.1";
    }

    /**
     * @param {string} str 
     */
    static IsSteamID(str) {
        if (!str || typeof str != "string") return false;

        return str.startsWith("765611") && str.length > 13 && !isNaN(str);
    }

    static IsObject(o) {
        if (typeof o !== "object" || Array.isArray(o)) return false;
        return o === Object(o);
    }

    static DumpHeap() {
        try { require("heapdump").writeSnapshot(); }
        catch (_) { /**/ }
    }

    static NormalizeNumber(num) {
        if (num == undefined || num == null || typeof num != "number") return "";
        
        return num.toLocaleString(undefined, {minimumIntegerDigits: 2, useGrouping: false});
    }

    static GetExternalIP() {
        return new Promise((resolve, reject) => {
            this.request("https://checkip.amazonaws.com").then(response => {
                if (!response || !response.body) return reject();
                resolve(response.body.trim());
            }).catch(reject);
        });
    }

    /**
     * @param {string} url 
     * @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} method 
     * @param {any} body 
     * @param {string} consumer_key 
     * @param {string} consumer_secret 
     * @param {string} access_token 
     * @param {string} access_token_secret 
     */
    static GenerateOAuthHeader(url, method, body, consumer_key, consumer_secret, access_token, access_token_secret) {
        if (!method || typeof method != "string") throw new Error("Invalid method");
        method = method.toUpperCase();

        if (!url || typeof url != "string") throw new Error("Invalid URL");
        if (!this.IsObject(body)) throw new Error("Invalid body");

        if (!consumer_key || typeof consumer_key != "string") throw new Error("Invalid consumer_key");
        if (!consumer_secret || typeof consumer_secret != "string") throw new Error("Invalid consumer_secret");
        if (!access_token || typeof access_token != "string") throw new Error("Invalid access_token");
        if (!access_token_secret || typeof access_token_secret != "string") throw new Error("Invalid access_token_secret");
        
        const timestamp = Math.round(Date.now() / 1000).toString();
        const crypto = require("crypto");
        const nonce = crypto.createHash("md5").update(timestamp.toString()).digest("hex");
    
        let oauth_parts = {
            "oauth_consumer_key": consumer_key,
            "oauth_nonce": nonce,
            "oauth_timestamp": timestamp,
            "oauth_token": access_token,
            "oauth_version": "1.0",
            "oauth_signature_method": "HMAC-SHA1"
        };
    
        //merge body with oauth_parts - this has to be undone after
        for (let key in body) oauth_parts[key] = body[key];

        //encode key & value
        let temp = {};
        for (let key in oauth_parts) {
            temp[this.fixedEncodeURIComponent(key)] = this.fixedEncodeURIComponent(oauth_parts[key]);
        }
        oauth_parts = temp;
    
        //sort by key
        temp = {};
        for (let key of Object.keys(oauth_parts).sort((a, b) => a == b ? 0 : b > a ? -1 : 1)) temp[key] = oauth_parts[key];
        oauth_parts = temp;
    
        //encode key & value, join them with = and finally merge all that into 1 string with &
        let parameters = Object.keys(oauth_parts).map(x => x + "=" + oauth_parts[x]).join("&");
        //create signature base by joining all 3 parts with &
        let signature_base = [method, this.fixedEncodeURIComponent(url), this.fixedEncodeURIComponent(parameters)].join("&");
        //create signing key by merging consumer secret & oauth token secret
        let secret_signing_key = this.fixedEncodeURIComponent(consumer_secret) + "&" + this.fixedEncodeURIComponent(access_token_secret);
        //create signature with signing key & signature base
        let signature = crypto.createHmac("sha1", secret_signing_key).update(signature_base).digest("base64");
        //set the signature
        oauth_parts.oauth_signature = this.fixedEncodeURIComponent(signature);

        for (let key in body) delete oauth_parts[this.fixedEncodeURIComponent(key)];

        //sort by key again (not necessary)
        temp = {};
        for (let key of Object.keys(oauth_parts).sort((a, b) => a == b ? 0 : b > a ? -1 : 1)) temp[key] = oauth_parts[key];
        oauth_parts = temp;

        return "OAuth " + Object.keys(oauth_parts).map(x => x + "=\"" + oauth_parts[x] + "\"").join(", ");
    }

    static fixedEncodeURIComponent(str) {
        if (str == undefined || typeof str != "string") throw new Error("Invalid args");
        return encodeURIComponent(str).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16));
    }

    /**
     * @param {string[]} arr 
     * @param {string} str 
     * @param {number} max_length 
     */
    static joinStrArray(arr, str, max_length) {
        if (!max_length || typeof max_length != "number" || !arr || !Array.isArray(arr)) throw new Error("Invalid args");

        let longest_item = [...arr].sort((a, b) => b.length - a.length)[0] ?? "";

        if (longest_item.length > max_length) throw new Error("Longest item is longer than max length");

        let rv = [];
        let temp = [];

        for (let item of arr) {
            if (typeof item != "string") continue;

            if (temp.join(str).length + str.length + item.length > max_length) {
                rv.push(temp.join(str));
                temp = [item];
            }

            else temp.push(item);
        }

        if (temp.length != 0) {
            rv.push(temp.join(str));
        }

        return rv;
    }

    /**
     * @param {Discord.TextChannel} channel 
     */
    static IsPublicChannel(channel) {
        if (!Discord) throw new Error("No Discord.js");
        if (!channel || (!(channel instanceof Discord.TextChannel) && !(channel instanceof Discord.ThreadChannel))) return false;
        
        let permissions = channel.permissionsFor(channel.guild.roles.everyone);

        return permissions.has("VIEW_CHANNEL") && permissions.has("SEND_MESSAGES");
    }

    /**
     * @param {string} str 
     */
    static IsValidEmail(str) {
        if (typeof str != "string") return false;

        // eslint-disable-next-line no-control-regex
        let regex = /^(?!(?:(?:\x22?\x5C[\x00-\x7E]\x22?)|(?:\x22?[^\x5C\x22]\x22?)){255,})(?!(?:(?:\x22?\x5C[\x00-\x7E]\x22?)|(?:\x22?[^\x5C\x22]\x22?)){65,}@)(?:(?:[\x21\x23-\x27\x2A\x2B\x2D\x2F-\x39\x3D\x3F\x5E-\x7E]+)|(?:\x22(?:[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]|(?:\x5C[\x00-\x7F]))*\x22))(?:\.(?:(?:[\x21\x23-\x27\x2A\x2B\x2D\x2F-\x39\x3D\x3F\x5E-\x7E]+)|(?:\x22(?:[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]|(?:\x5C[\x00-\x7F]))*\x22)))*@(?:(?:(?!.*[^.]{64,})(?:(?:(?:xn--)?[a-z0-9]+(?:-[a-z0-9]+)*\.){1,126}){1,}(?:(?:[a-z][a-z0-9]*)|(?:(?:xn--)[a-z0-9]+))(?:-[a-z0-9]+)*)|(?:\[(?:(?:IPv8:(?:(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){7})|(?:(?!(?:.*[a-f0-9][:\]]){7,})(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,5})?::(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,5})?)))|(?:(?:IPv8:(?:(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){5}:)|(?:(?!(?:.*[a-f0-9]:){5,})(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,3})?::(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,3}:)?)))?(?:(?:25[0-5])|(?:2[0-4][0-9])|(?:1[0-9]{2})|(?:[1-9]?[0-9]))(?:\.(?:(?:25[0-5])|(?:2[0-4][0-9])|(?:1[0-9]{2})|(?:[1-9]?[0-9]))){3}))\]))$/;

        str = str.toLowerCase();
        if (!regex.test(str)) return false;

        let domain_parts = str.split("@")[1].split(".");
        let mapped = domain_parts.map((x, i) => domain_parts.slice(i).join("."));

        return mapped.every(x => !blacklist.includes(x));
    }

    static ObjectToForm(object) {
        if (!this.IsObject(object)) return null;

        let form = new formData();
        for (let key in object) form.append(key, object[key]);

        return form;
    }

    static ObjectToUrlencoded(object) {
        if (!this.IsObject(object)) return null;

        return Object.keys(object).map(x => this.fixedEncodeURIComponent(x) + "=" + this.fixedEncodeURIComponent(object[x])).join("&");
    }

    /**
     * @param {string} str 
     * @param {string} search 
     * @param {string} replacement 
     */
    static ReplaceAll(str, search, replacement) {
        if (!str || search == undefined || replacement == undefined) return str;

        return str.replace(new RegExp(this.EscapeRegexExp(search), "g"), replacement);
    }

    /**
     * @param {string} host 
     */
    static GetCertExpirationDays(host) {
        return new Promise((resolve, reject) => {
            if (!host) return reject(new Error("No Host"));
    
            host = host.toLowerCase();

            if (host.startsWith("http://")) return reject(new Error("Host Uses HTTP"));
            if (host.startsWith("https://")) host = host.replace("https://", "");
    
            let port = 443;
            if (host.includes(":")) {
                let split = host.split(":");
                if (split.length > 1) {
                    host = split[0];
                    if (!isNaN(split.last())) port = Number(split.last()); 
                }
            }
    
            let client = require("tls").connect(port, {host: host, timeout: 5e3});
    
            client.on("error", error => {
                client.end();
                reject(error);
            });

            client.on("timeout", () => {
                client.end();
                reject(new Error("Host Timed Out"));
            });
            
    
            client.on("session", () => {
                let valid_to = new Date(client.getPeerCertificate().valid_to);
                let days = (valid_to - Date.now()) / (1000 * 3600 * 24);
                client.end();
                resolve(days);
            });
        });
    }

    /**
     * @param {string} str 
     */
    static EscapeRegexExp(str) {
        if (str == undefined) return str;

        return str.replace(/([.*+?^=!:${}()|[]\/\\])/g, "\\$1");
    }

    /**
     * @param {any[]} arr 
     */
    static RemoveDuplicates(arr) {
        if (!arr || !Array.isArray(arr)) return null;

        return arr.filter((item, index) => arr.indexOf(item) == index);
    }

    /**
     * @param {string} path 
     * @param {object} file 
     * @param {number} attempts 
     */
    static SaveFile(path, file, attempts = 0) {
        if (attempts >= 5) return;
        
        try {
            if (fs.existsSync(path) && fs.readFileSync(path) != "") fs.copyFileSync(path, path + ".backup");
            file.lastSave = new Date();
            fs.writeFileSync(path, JSON.stringify(file, null, 2));
        }

        catch (ex) {
            setTimeout(() => this.SaveFile(path, file, attempts + 1), 1000 * 2.5);
        }
    }

    /**
     * @param {number} ms 
     */
    static Sleep(ms) {
        if (ms == undefined || typeof ms != "number") ms = 0;
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * @param {string} str 
     */
    static IsValidJSON(str) {
        if (!str) return false;

        try { JSON.parse(str); }
        catch (_) { return false; }

        return true;
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

        if (this.IsObject(res) || Array.isArray(res)) {
            try { res = JSON.stringify(res, null, 2); }
            catch (_) { /**/ }
        }
        else res = String(res);

        let code = msg.content && typeof msg.content == "string" ? this.GetArgsFromMessage(msg.content) : [undefined, _code];
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

        else msg.channel.send({files: [{name: "eval_" + Time.LogFormat() + (this.IsValidJSON(res) ? ".json" : ".txt"), attachment: Buffer.from(res)}]});
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

        if (this.IsObject(res) || Array.isArray(res)) {
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
            files.push(new Discord.MessageAttachment(Buffer.from(res), "eval_" + Time.LogFormat() + (this.IsValidJSON(res) ? ".json" : ".txt")));
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
     * @param {{ip: string}} req 
     */
    static IPFromRequest(req) {
        return this.CleanIP(req.ip);
    }

    /**
     * @param {string} IP 
     */
    static CleanIP(IP) {
        if (!IP || typeof IP != "string") throw new Error("Missing IP");

        IP = IP.replace("::ffff:", "");
        if (!IP) throw new Error("Missing IP");
        
        return IP;
    }

    /**
     * @param {string} str 
     */
    static Base64Encode(str) {
        return Buffer.from(str).toString("base64");
    }

    /**
     * @param {string} endpoint 
     * @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} method 
     * @param {any} body 
     * @param {Record<string, string>} headers 
     */
    static APIrequest(endpoint, method, body, headers) {
        if (!endpoint || typeof endpoint != "string") return Promise.reject(new Error("Invalid endpoint"));
        if (!process.env.INTERNAL_API_TOKEN) return Promise.reject(new Error("No API token"));

        if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
            
        let time = Math.round(Date.now() / 1000).toString();
        let name = require("path").parse(process.argv[1]).base.replace(".js", "");
        let parts = [this.Base64Encode(time), this.Base64Encode("prism_" + name), this.Base64Encode(process.env.INTERNAL_API_TOKEN)].map(x => x.replace(/=/g, ""));
        let token = parts.join(".");

        if (!headers) headers = {};
        headers["authorization"] = token;

        return this.request("https://prismrust.com" + endpoint, method, body, headers);
    }

    /**
     * @param {string} url 
     * @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} method 
     * @param {any} body 
     * @param {Record<string, string>} headers 
     * @param {string} proxy 
     * @param {number} timeout
     * @returns {Promise<Response>}
     */
    static request(url, method, body, headers = {}, proxy = "", timeout = 60e3) {
        return new Promise((resolve, reject) => {
            if (!url || typeof url != "string") return reject(new Error("Invalid URL"));

            if (isNaN(timeout) || timeout < 1) return reject(new Error("Invalid timeout"));

            if (!method) method = "GET";
            if (typeof method != "string") return reject(new Error("Invalid Method"));
            
            method = method.toUpperCase();

            if (!["GET", "POST", "PUT", "PATCH", "DELETE"].includes(method)) return reject(new Error("Invalid method"));
            if (!url.startsWith("http://") && !url.startsWith("https://")) return reject(new Error("Invalid URL"));

            let data = { method, headers: {} };
            
            if (body) data.body = body;
            if (proxy && typeof proxy == "string") {
                data.proxy = proxy.startsWith("http://") || proxy.startsWith("https://") ? proxy : "http://" + proxy;
            }

            if (this.IsObject(headers)) {
                for (let key in headers) {
                    data.headers[key.toLowerCase()] = headers[key];
                }
            }
            else data.headers = {};

            if (!("user-agent" in data.headers)) {
                data.headers["user-agent"] = "PRISM Utils/2.1";
            }

            //We set the content type if it's not present already
            if (method != "GET" && body && !("content-type" in data.headers)) {
                if (typeof body == "string" && this.IsValidJSON(body)) {
                    data.headers["content-type"] = "application/json";
                }
                
                else if (body instanceof formData) {
                    data.headers["content-type"] = "multipart/form-data;boundary=" + body.getBoundary();
                }

                else if (typeof body == "string") {
                    data.headers["content-type"] = "text/plain";
                }

                else return reject(new Error("Invalid body type"));
            }

            let timer = setTimeout(() => reject(new Error("Timed Out")), timeout);

            fetch(url, data).then(async response => {
                try {
                    const buff = await response.arrayBuffer();
                    return resolve(new Response(response, Buffer.from(buff)));
                }
                catch (ex) { return reject(ex); }
            }).catch(reject).finally(() => clearTimeout(timer));
        });
    }

    static clone(object) {
        return JSON.parse(JSON.stringify(object));
    }

    static SortByValues(object) {
        let rv = {};
        for (let key of Object.keys(object).sort((a, b) => object[b] - object[a])) rv[key] = object[key];
        return rv;
    }

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
            msg2.edit({embeds: [embed]}).catch(x => console.log(x));
        }, onrj => console.log("Failed to send ping embed! - " + onrj));
    }

    /**
     * @param {string} ip 
     */
    static IsLocalhost(ip) {
        return ip == "127.0.0.1" || ip == "::1" || ip == this.HOST_IP;
    }

    /**
     * @param {Discord.GuildMember} GuildMember 
     */
    static IsAdmin(GuildMember) {
        if (!Discord) throw new Error("No Discord.js");

        if (!GuildMember || !(GuildMember instanceof Discord.GuildMember)) return false;
        return GuildMember.permissions.has("ADMINISTRATOR") || (GuildMember.permissions.has("BAN_MEMBERS") && GuildMember.permissions.has("KICK_MEMBERS")) || (GuildMember.permissions.has("MANAGE_GUILD") && GuildMember.permissions.has("MANAGE_CHANNELS") && GuildMember.permissions.has("MANAGE_ROLES"));
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
        if (!msg || !msg.author) return;

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
        setTimeout(() => msg.delete().catch(x => console.log(x)), ms);
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
                client.send({content: msg, avatarURL: avatar, username: name}).catch(x => console.log(x));
            }
        }

        else client.send({embeds: [message], avatarURL: avatar, username: name}).catch(x => console.log(x));
        return true;
    }

    /**
     * @param {Discord.Client} client 
     * @param {string} id 
     */
    static GetPRISMServer(client, id) {
        if (!id) throw new Error("Missing id");
        return client.guilds.cache.find(x => x.id == id);
    }

    /**
     * @param {string} str 
     */
    static IsIPAddress(str) {
        return !!this.GetIPAddress(str);
    }

    /**
     * @param {string} str 
     */
    static GetIPAddress(str) {  
        for (let item of str.split(":")) {
            if (validator.isIP(item, "4") && item != this.HOST_IP) return item;
        }

        return validator.isIP(str, "4") && str != this.HOST_IP ? str : null;
    }

    /**
     * @param {string} message 
     * @param {boolean} simple 
     */
    static GetArgsFromMessage(message, simple = false) {
        if (simple) {
            let split = message.trim().split(" ");
            return split.map(x => x.trim()).filter(x => x);
        }

        let inlongarg = false;
        let args = [];
        let buffer = "";

        for (let letter of message) {
            if (letter == "\"") {
                if (inlongarg) {
                    buffer = buffer.trim();

                    if (buffer) args.push(buffer);

                    buffer = "";
                    inlongarg = false;
                }
                else inlongarg = true;
            }

            else if (letter == " " && !inlongarg) {
                buffer = buffer.trim();

                if (buffer) args.push(buffer);

                buffer = "";
            }
            else buffer += letter;
        }

        if (buffer.length > 0) {
            buffer = buffer.trim();

            if (buffer) args.push(buffer);
        }

        return args;
    }

    /**
     * @param {number} max 
     */
    static GetRandomNumber(max) {
        if (max && typeof max == "number") {
            return Math.floor(Math.random() * max);
        }

        return Math.floor(Math.random() * 1000);
    }

    static GetRandomCode() {
        let rv = "";
        let possible = "ABCDEFGHJKMNPQRSTUVWXYZ123456789";
    
        for (let i = 0; i < 5; i++) {
            rv += possible.charAt(Math.floor(Math.random() * possible.length));
        }

        return rv;
    }

    /**
     * @param {string} path 
     * @param {any} object 
     */
    static LoadFile(path, object) {
        if (!fs.existsSync(path)) {
            if (!path.endsWith(".backup")) return this.LoadFile(path + ".backup", object);
            else {
                fs.writeFileSync(path, JSON.stringify(object, null, 2));
                return object;
            }
        }

        try { object = JSON.parse(fs.readFileSync(path)); }
        catch (_) {
            if (!path.endsWith(".backup")) return this.LoadFile(path + ".backup", object);
            else {
                fs.writeFileSync(path, JSON.stringify(object, null, 2));
                return object;
            }
        }

        return object;
    }

    /**
     * honestly I have no idea what this is
     * @param {any} original_file 
     * @param {any} new_file 
     */
    static ValidateFile(original_file, new_file) {
        let changed = false;

        for (let key in original_file) {
            if (new_file[key] == undefined) {
                if (JSON.stringify(new_file[key]) != "null") {
                    changed = true;
                    new_file[key] = original_file[key];
                }
            }

            if (this.IsObject(original_file[key])) {
                for (let key2 in original_file[key]) {
                    if (new_file[key][key2] == undefined) {
                        changed = true;
                        new_file[key][key2] = original_file[key][key2];
                    }

                    if (this.IsObject(original_file[key][key2])) {
                        for (let key3 in original_file[key][key2]) {
                            if (new_file[key][key2][key3] == undefined) {
                                changed = true;
                                new_file[key][key2][key3] = original_file[key][key2][key3];
                            }

                            if (this.IsObject(original_file[key][key2][key3])) {
                                for (let key4 in original_file[key][key2][key3]) {
                                    if (new_file[key][key2][key3][key4] == undefined) {
                                        changed = true;
                                        new_file[key][key2][key3][key4] = original_file[key][key2][key3][key4];
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        return changed;
    }

    /**
     * @param {string} arg 
     */
    static GetIDFromString(arg) {
        if (!arg) return null;

        return arg.replace("<@!", "").replace("<@", "").replace(">", "").replace("<#", "");
    }
}

let blacklist = [];
function UpdateBlacklist(first = false) {
    Util.request("https://raw.githubusercontent.com/FGRibreau/mailchecker/master/list.txt").then(response => {
        if (!response.Valid && first) {
            return setTimeout(UpdateBlacklist, 60 * 1000);
        }

        blacklist = response.body.split("\n").map(x => x.trim());
    });
}
UpdateBlacklist(true);

module.exports = Util;
