import FormData from "form-data";
import HttpResponse from "./HttpResponse.js";
import * as os from "os";
import fetch, { AbortError, BodyInit, RequestInit, Response } from "node-fetch";
import { base64Encode, isObject, isValidJSON } from "./Util.js";
import validator from "validator";
import tls from "tls";
import path from "path";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

let ip = "";

export function HOST_IP() {
    if (ip) return ip;

    for (const iface of Object.values(os.networkInterfaces())) {
        if (!iface) {
            continue;
        }
        for (const item of iface) {
            if (item.family == "IPv4" && !item.internal) {
                ip = item.address;
                return ip;
            }
        }
    }

    return "127.0.0.1";
}

export function getExternalIP() {
    return new Promise((resolve, reject) => {
        request("https://checkip.amazonaws.com").then((response: { body: string; }) => {
            if (!response || !response.body) return reject();
            resolve(response.body.trim());
        }).catch(reject);
    });
}

export function APIrequest(endpoint: string, method: Method, body: unknown, headers: { [x: string]: string; }, timeout: number) {
    if (!endpoint || typeof endpoint != "string") return Promise.reject(new Error("Invalid endpoint"));
    if (!process.env.INTERNAL_API_TOKEN) return Promise.reject(new Error("No API token"));

    if (!endpoint.startsWith("/")) endpoint = "/" + endpoint;
        
    const time = Math.round(Date.now() / 1000).toString();
    const name = path.parse(process.argv[1]).base.replace(".js", "");
    const parts = [base64Encode(time), base64Encode("prism_" + name), base64Encode(process.env.INTERNAL_API_TOKEN)].map(x => x.replace(/=/g, ""));
    const token = parts.join(".");

    if (!headers) headers = {};
    headers["authorization"] = token;

    return request("https://prismrust.com" + endpoint, method, body, headers, timeout);
}

export function requestRaw(url: RequestInfo | URL, method?: Method, body?: unknown | { getBoundary: () => string; }, headers: Record<string, string> = {}, timeout: number = 60e3): Promise<Response> {
    return new Promise((resolve, reject) => {
        if (!url || typeof url != "string") return reject(new Error("Invalid URL"));

        if (isNaN(timeout) || timeout < 1) return reject(new Error("Invalid timeout"));

        if (!method) method = "GET";
        if (typeof method != "string") return reject(new Error("Invalid Method"));
        
        //@ts-expect-error idk
        method = method.toUpperCase();

        if (!["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"].includes(method || "")) return reject(new Error("Invalid method"));
        if (!url.startsWith("http://") && !url.startsWith("https://")) return reject(new Error("Invalid URL"));

        const data: RequestInit = { method, headers: {}, body: body ? body as BodyInit : undefined };

        if (isObject(headers)) {
            for (const key in headers) {
                if (typeof headers[key] != "string") {
                    return reject(new Error("Invalid header '" + key + "' value"));
                }
                // @ts-expect-error idk
                data.headers![key.toLowerCase()] = headers[key];
            }
        }

        if (!("user-agent" in data.headers!)) {
            // @ts-expect-error idk
            data.headers!["user-agent"] = "PRISM Utils/2.1";
        }

        //We set the content type if it's not present already
        if (method != "GET" && body && !("content-type" in data.headers!)) {
            if (typeof body == "string" && isValidJSON(body)) {
                // @ts-expect-error idk
                data.headers!["content-type"] = "application/json";
            }
            
            else if (body instanceof FormData) {
                // @ts-expect-error idk
                data.headers!["content-type"] = "multipart/form-data;boundary=" + body.getBoundary();
            }

            else if (typeof body == "string") {
                // @ts-expect-error idk
                data.headers["content-type"] = "text/plain";
            }

            else return reject(new Error("Could not determine body content-type"));
        }

        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), timeout);

        data.signal = ac.signal;

        fetch(url, data).then(resolve).catch(x => {
            if (x instanceof AbortError) {
                reject(new Error("Timed out after " + timeout + " ms"));
            }
            else reject(x);
        }).finally(() => clearTimeout(timer));
    });
}

export function request<T>(url: string, method?: Method, body?: unknown, headers?: Record<string, string>, timeout?: number): Promise<HttpResponse<T>> {
    return new Promise((resolve, reject) => {
        requestRaw(url, method, body, headers, timeout).then(async response => {
            try {
                const buff = await response.arrayBuffer();
                resolve(new HttpResponse<T>(response, Buffer.from(buff)));
            }
            catch (e) { reject(e); }
        }).catch(reject);
    });
}

export function getCertExpirationDays(host: string) {
    return new Promise((resolve, reject) => {
        if (!host) return reject(new Error("No Host"));

        host = host.toLowerCase();

        if (host.startsWith("http://")) return reject(new Error("Host Uses HTTP"));
        if (host.startsWith("https://")) host = host.replace("https://", "");

        let port = 443;
        if (host.includes(":")) {
            const split = host.split(":");
            if (split.length > 1) {
                host = split[0];
                if (!isNaN(Number(split.last()))) port = Number(split.last()); 
            }
        }

        const client = tls.connect(port, {host: host, timeout: 5e3});

        client.on("error", (error: Error) => {
            client.end();
            reject(error);
        });

        client.on("timeout", () => {
            client.end();
            reject(new Error("Host Timed Out"));
        });
        

        client.on("session", () => {
            const valid_to = new Date(client.getPeerCertificate().valid_to);
            const days = (valid_to.getTime() - Date.now()) / (1000 * 3600 * 24);
            client.end();
            resolve(days);
        });
    });
}

export function IPFromRequest(req: { ip: string; }) {
    return CleanIP(req.ip);
}

export function CleanIP(IP: string) {
    if (!IP || typeof IP != "string") throw new Error("Missing IP");

    IP = IP.replace("::ffff:", "");
    if (!IP) throw new Error("Missing IP");
    
    return IP;
}

export function IsLocalhost(ip: string) {
    return ip == "127.0.0.1" || ip == "::1" || ip == HOST_IP();
}

export function isIPAddress(str: string) {
    return !!getIPAddress(str);
}

export function getIPAddress(str: string) {  
    for (const item of str.split(":")) {
        if (validator.isIP(item, "4") && item != HOST_IP()) return item;
    }

    return validator.isIP(str, "4") && str != HOST_IP() ? str : null;
}