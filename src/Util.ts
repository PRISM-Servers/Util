import FormData from "form-data";
import * as fs from "fs";
import { isValidDate } from "./Time.js";
import { request } from "./Net.js";

export function isSteamID(str: string) {
    if (!str || typeof str != "string") return false;

    return str.startsWith("765611") && str.length > 13 && !isNaN(Number(str));
}

export function isObject(o: unknown) {
    if (typeof o !== "object" || Array.isArray(o)) return false;
    return o === Object(o);
}

export function normalizeNumber(num: number) {
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
 */
export function fillDateRecord<T>(source: Record<string, T>, keyFn: (date: Date) => string, valueFn: (source: Record<string, T>, date: Date) => T, mode: "day" | "month" | "year" = "day") {
    if (!isObject(source)) return null;
    if (typeof keyFn != "function" || typeof valueFn != "function") {
        throw new Error("Invalid keyFn/valueFn, needs to be a function");
    }

    const keys = Object.keys(source);
    const last = new Date(keys.last());
    last.setDate(last.getDate() + 1);

    if (!isValidDate(keys[0]) || !isValidDate(last)) {
        throw new Error("Invalid start/end date");
    }

    const rv: Record<string, T> = {};

    for (const date = new Date(keys[0]); date <= last; mode == "day" ? date.setDate(date.getDate() + 1) : mode == "month" ? date.setMonth(date.getMonth() + 1) : date.setFullYear(date.getFullYear() + 1)) {
        rv[keyFn(date)] = valueFn(source, date);
    }

    return rv;
}

export function fixedEncodeURIComponent(str: string) {
    if (str == undefined || typeof str != "string") throw new Error("Invalid args");
    return encodeURIComponent(str).replace(/[!'()*]/g, c => "%" + c.charCodeAt(0).toString(16).toUpperCase());
}

export function joinStrArray(arr: string[], str: string, max_length: number) {
    if (!max_length || typeof max_length != "number" || !arr || !Array.isArray(arr)) throw new Error("Invalid args");

    const longest_item = [...arr].sort((a, b) => b.length - a.length)[0] ?? "";

    if (longest_item.length > max_length) throw new Error("Longest item is longer than max length");

    const rv: string[] = [];
    let temp: string[] = [];

    for (const item of arr) {
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

export function isValidEmail(str: string) {
    if (typeof str != "string") return false;

    // eslint-disable-next-line no-control-regex
    const regex = /^(?!(?:(?:\x22?\x5C[\x00-\x7E]\x22?)|(?:\x22?[^\x5C\x22]\x22?)){255,})(?!(?:(?:\x22?\x5C[\x00-\x7E]\x22?)|(?:\x22?[^\x5C\x22]\x22?)){65,}@)(?:(?:[\x21\x23-\x27\x2A\x2B\x2D\x2F-\x39\x3D\x3F\x5E-\x7E]+)|(?:\x22(?:[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]|(?:\x5C[\x00-\x7F]))*\x22))(?:\.(?:(?:[\x21\x23-\x27\x2A\x2B\x2D\x2F-\x39\x3D\x3F\x5E-\x7E]+)|(?:\x22(?:[\x01-\x08\x0B\x0C\x0E-\x1F\x21\x23-\x5B\x5D-\x7F]|(?:\x5C[\x00-\x7F]))*\x22)))*@(?:(?:(?!.*[^.]{64,})(?:(?:(?:xn--)?[a-z0-9]+(?:-[a-z0-9]+)*\.){1,126}){1,}(?:(?:[a-z][a-z0-9]*)|(?:(?:xn--)[a-z0-9]+))(?:-[a-z0-9]+)*)|(?:\[(?:(?:IPv8:(?:(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){7})|(?:(?!(?:.*[a-f0-9][:\]]){7,})(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,5})?::(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,5})?)))|(?:(?:IPv8:(?:(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){5}:)|(?:(?!(?:.*[a-f0-9]:){5,})(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,3})?::(?:[a-f0-9]{1,4}(?::[a-f0-9]{1,4}){0,3}:)?)))?(?:(?:25[0-5])|(?:2[0-4][0-9])|(?:1[0-9]{2})|(?:[1-9]?[0-9]))(?:\.(?:(?:25[0-5])|(?:2[0-4][0-9])|(?:1[0-9]{2})|(?:[1-9]?[0-9]))){3}))\]))$/;

    str = str.toLowerCase();
    if (!regex.test(str)) return false;

    const domain_parts = str.split("@")[1].split(".");
    const mapped = domain_parts.map((x, i) => domain_parts.slice(i).join("."));

    return mapped.every(x => !blacklist.includes(x));
}

export function objectToForm(object: object) {
    if (!this.IsObject(object)) return null;

    const form = new FormData();
    // @ts-expect-error error
    for (const key in object) form.append(key, object[key]);

    return form;
}

export function objectToUrlencoded(object: object) {
    if (!this.IsObject(object)) return null;

    // @ts-expect-error error
    return Object.keys(object).map(x => this.fixedEncodeURIComponent(x) + "=" + this.fixedEncodeURIComponent(object[x])).join("&");
}

export function removeDuplicates<T>(arr: T[]) {
    if (!arr || !Array.isArray(arr)) return null;

    return arr.filter((item, index) => arr.indexOf(item) == index);
}

export function saveFile(path: string, file: unknown, attempts: number = 0) {
    if (attempts >= 5) return;
    
    try {
        if (fs.existsSync(path) && fs.readFileSync(path)?.toString() != "") fs.copyFileSync(path, path + ".backup");
        // @ts-expect-error error
        file.lastSave = new Date();
        fs.writeFileSync(path, JSON.stringify(file, null, 2));
    }

    catch (_) {
        setTimeout(() => this.SaveFile(path, file, attempts + 1), 1000 * 2.5);
    }
}

export function sleep(ms: number) {
    if (ms == undefined || typeof ms != "number") ms = 0;
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function isValidJSON(str: string) {
    if (!str) return false;

    try { JSON.parse(str); }
    catch (_) { return false; }

    return true;
}

export function base64Encode(str: string) {
    return Buffer.from(str).toString("base64");
}

export function clone(object: unknown) {
    return JSON.parse(JSON.stringify(object));
}

export function sortByValues(object: unknown) {
    const rv: Record<string, number> = {};
    // @ts-expect-error idk
    for (const key of Object.keys(object).sort((a, b) => object[b] - object[a])) rv[key] = object[key];
    return rv;
}

export function getArgsFromMessage(message: string, simple: boolean = false) {
    if (simple) {
        const split = message.trim().split(" ");
        return split.map(x => x.trim()).filter(x => x);
    }

    let inlongarg = false;
    const args: string[] = [];
    let buffer = "";

    for (const letter of message) {
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

export function getRandomNumber(max: number) {
    if (max && typeof max == "number") {
        return Math.floor(Math.random() * max);
    }

    return Math.floor(Math.random() * 1000);
}

export function getRandomCode() {
    let rv = "";
    const possible = "ABCDEFGHJKMNPQRSTUVWXYZ123456789";

    for (let i = 0; i < 5; i++) {
        rv += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return rv;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function validateFile(original_file: any, new_file: any) {
    let changed = false;

    for (const key in original_file) {
        if (new_file[key] == undefined) {
            if (JSON.stringify(new_file[key]) != "null") {
                changed = true;
                new_file[key] = original_file[key];
            }
        }

        if (this.IsObject(original_file[key])) {
            for (const key2 in original_file[key]) {
                if (new_file[key][key2] == undefined) {
                    changed = true;
                    new_file[key][key2] = original_file[key][key2];
                }

                if (this.IsObject(original_file[key][key2])) {
                    for (const key3 in original_file[key][key2]) {
                        if (new_file[key][key2][key3] == undefined) {
                            changed = true;
                            new_file[key][key2][key3] = original_file[key][key2][key3];
                        }

                        if (this.IsObject(original_file[key][key2][key3])) {
                            for (const key4 in original_file[key][key2][key3]) {
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


let blacklist: string[] = [];
setTimeout(() => {
    request("https://raw.githubusercontent.com/FGRibreau/mailchecker/master/list.txt").then(response => {
        if (response.Valid) {
            blacklist = response.body.split("\n").map(x => x.trim());
        }
    });
}, 0);
