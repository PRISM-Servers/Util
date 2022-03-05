const formData = require("form-data");
const fs = require("fs");

class Util {
    constructor() {
        throw new Error("This class cannot be instantiated!");
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

    /**
     * Fills a Date record with missing dates
     * 
     * Example:
     * ```
     * Util.FillDateRecord(src, a => Util.Time.MonthAndDayFromDate(a) + "Z", (source, a) => source[Util.Time.MonthAndDayFromDate(a) + "Z"] ?? -1, "day")
     * //Input
     * {
     *   '2021-5-5Z': 1,
     *   '2021-5-10Z': 2,
     *   '2021-5-11Z': 3,
     *   '2021-5-13Z': 4
     * }
     * //Output
     * {
     *   '2021-5-5Z': 1,
     *   '2021-5-6Z': -1,
     *   '2021-5-7Z': -1,
     *   '2021-5-8Z': -1,
     *   '2021-5-9Z': -1,
     *   '2021-5-10Z': 2,
     *   '2021-5-11Z': 3,
     *   '2021-5-12Z': -1,
     *   '2021-5-13Z': 4
     * }
     * ```
     * 
     * Last param determines whether days months or years will be filled
     * 
     * @param {Record<string, any>} source
     * @param {(date: Date) => {}} keyFn
     * @param {(source: Record<string, any>, date: Date) => {}} valueFn
     * @param {"day" | "month" | "year"} mode
     */
    static FillDateRecord(source, keyFn, valueFn, mode = "day") {
        if (!Util.IsObject(source)) return null;
        if (typeof keyFn != "function" || typeof valueFn != "function") {
            throw new Error("Invalid keyFn/valueFn, needs to be a function");
        }

        const keys = Object.keys(source);
        const last = new Date(keys.last());
        last.setDate(last.getDate() + 1);

        if (!Util.Time.isValidDate(keys[0]) || !Util.Time.isValidDate(last)) {
            throw new Error("Invalid start/end date");
        }

        const rv = {};
    
        for (const date = new Date(keys[0]); date <= last; mode == "day" ? date.setDate(date.getDate() + 1) : mode == "month" ? date.setMonth(date.getMonth() + 1) : date.setFullYear(date.getFullYear() + 1)) {
            rv[keyFn(date)] = valueFn(source, date);
        }

        return rv;
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

        catch (_) {
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
     * @param {string} str 
     */
    static Base64Encode(str) {
        return Buffer.from(str).toString("base64");
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
}

let blacklist = [];
setTimeout(() => {
    require("./Net").request("https://raw.githubusercontent.com/FGRibreau/mailchecker/master/list.txt").then(response => {
        if (response.Valid) {
            blacklist = response.body.split("\n").map(x => x.trim());
        }
    });
}, 0);

module.exports = Util;
