class Response {
    /**
     * @param {any} response 
     * @param {Buffer} raw
     */
    constructor(response, raw) {
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
            try { this._json = JSON.parse(this.body); }
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
        return this._json;
    }
}

module.exports = Response;