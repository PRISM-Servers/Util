export default class HttpResponse<T> {
    response: Response;
    raw: Buffer;
    body: string;
    headers: Record<string, string>;
    #_json?: T;

    constructor(response: any, raw: Buffer) {
        if (!response) throw new Error("Missing Response");

        this.response = response;
        this.raw = raw;
        this.body = this.raw.toString();
        this.headers = {};

        if (response.headers) {
            for (let entry of response.headers.entries()) {
                this.headers[entry[0]] = entry[1];
            }
        }

        if (this.body) {
            try { this.#_json = JSON.parse(this.body); }
            catch (_) { /**/ }
        }
    }

    get Valid() {
        return this.response.status < 400;
    }

    get StatusCode() {
        return this.response.status;
    }

    get StatusText() {
        return this.response.statusText;
    }

    get Status() {
        return this.StatusText ? (this.StatusText + " (" + this.StatusCode + ")") : this.StatusCode;
    }

    get json() {
        return this.#_json;
    }
}