const formData = require("form-data");
const Response = require("./Response");
const Util = require("./Util");
const validator = require("validator");

const pending = [];
let fetch = (...args) => {
    return new Promise((resolve, reject) => {
        pending.push({args, resolve, reject});
    });
};

import("node-fetch").then(d => {
    fetch = d.default;
    for (const key in d) {
        if (key != "default") {
            fetch[key] = d[key];
        }
    }

    for (const item of pending) {
        fetch(...item.args).then(item.resolve).catch(item.reject);
    }
}).catch(console.log);

class Net {
    constructor() {
        throw new Error("This class cannot be instantiated!");
    }

    static #ip = "";

    static get HOST_IP() {
        if (this.#ip) return this.#ip;

        const os = require("os");

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

    static GetExternalIP() {
        return new Promise((resolve, reject) => {
            this.request("https://checkip.amazonaws.com").then(response => {
                if (!response || !response.body) return reject();
                resolve(response.body.trim());
            }).catch(reject);
        });
    }

    /**
     * @param {string} endpoint 
     * @param {"GET" | "POST" | "PUT" | "PATCH" | "DELETE"} method 
     * @param {any} body 
     * @param {Record<string, string>} headers 
     * @param {number} timeout
     */
    static APIrequest(endpoint, method, body, headers, timeout) {
        if (!endpoint || typeof endpoint != "string") return Promise.reject(new Error("Invalid endpoint"));
        if (!process.env.INTERNAL_API_TOKEN) return Promise.reject(new Error("No API token"));

        if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
            
        let time = Math.round(Date.now() / 1000).toString();
        let name = require("path").parse(process.argv[1]).base.replace(".js", "");
        let parts = [Util.Base64Encode(time), Util.Base64Encode("prism_" + name), Util.Base64Encode(process.env.INTERNAL_API_TOKEN)].map(x => x.replace(/=/g, ""));
        let token = parts.join(".");

        if (!headers) headers = {};
        headers["authorization"] = token;

        return this.request("https://prismrust.com" + endpoint, method, body, headers, timeout);
    }

    /**
     * @param {string} url 
     * @param {"GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE"} method 
     * @param {any} body 
     * @param {Record<string, string>} headers
     * @param {number} timeout
     * @returns {Promise<fetch.Response>}
     */
    static requestRaw(url, method, body, headers = {}, timeout = 60e3) {
        return new Promise((resolve, reject) => {
            if (!url || typeof url != "string") return reject(new Error("Invalid URL"));

            if (isNaN(timeout) || timeout < 1) return reject(new Error("Invalid timeout"));

            if (!method) method = "GET";
            if (typeof method != "string") return reject(new Error("Invalid Method"));
            
            method = method.toUpperCase();

            if (!["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method)) return reject(new Error("Invalid method"));
            if (!url.startsWith("http://") && !url.startsWith("https://")) return reject(new Error("Invalid URL"));

            let data = { method, headers: {} };
            
            if (body) data.body = body;

            if (Util.IsObject(headers)) {
                for (let key in headers) {
                    if (typeof headers[key] != "string") {
                        return reject(new Error("Invalid header '" + key + "' value"));
                    }
                    data.headers[key.toLowerCase()] = headers[key];
                }
            }

            if (!("user-agent" in data.headers)) {
                data.headers["user-agent"] = "PRISM Utils/2.1";
            }

            //We set the content type if it's not present already
            if (method != "GET" && body && !("content-type" in data.headers)) {
                if (typeof body == "string" && Util.IsValidJSON(body)) {
                    data.headers["content-type"] = "application/json";
                }
                
                else if (body instanceof formData) {
                    data.headers["content-type"] = "multipart/form-data;boundary=" + body.getBoundary();
                }

                else if (typeof body == "string") {
                    data.headers["content-type"] = "text/plain";
                }

                else return reject(new Error("Could not determine body content-type"));
            }

            let ac = new AbortController();
            let timer = setTimeout(() => ac.abort(), timeout);

            data.signal = ac.signal;

            fetch(url, data).then(resolve).catch(x => {
                if (x instanceof fetch.AbortError) {
                    reject(new Error("Timed out after " + timeout + " ms"));
                }
                else reject(x);
            }).finally(() => clearTimeout(timer));
        });
    }

    /**
     * @param {string} url 
     * @param {"GET" | "HEAD" | "POST" | "PUT" | "PATCH" | "DELETE"} method 
     * @param {any} body 
     * @param {Record<string, string>} headers
     * @param {number} timeout
     * @returns {Promise<Response>}
     */
    static request(url, method, body, headers, timeout) {
        return new Promise((resolve, reject) => {
            this.requestRaw(url, method, body, headers, timeout).then(async response => {
                try {
                    const buff = await response.arrayBuffer();
                    resolve(new Response(response, Buffer.from(buff)));
                }
                catch (e) { reject(e); }
            }).catch(reject);
        });
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
     * @param {string} ip 
     */
    static IsLocalhost(ip) {
        return ip == "127.0.0.1" || ip == "::1" || ip == this.HOST_IP || process.env.LOCALHOST_IPS?.includes(ip);
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
}

module.exports = Net;