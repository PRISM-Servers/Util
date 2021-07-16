Array.prototype.remove = function(...item) {
    if (Array.isArray(item)) {
        let rv = true;
        
        for (let i of item) {
            if (this.includes(i)) {
                this.splice(this.indexOf(i), 1);
            }
            else rv = false;
        }

        return rv;
    }

    if (this.includes(item)) {
        this.splice(this.indexOf(item), 1);
        return true;
    }

    return false;
};

Array.prototype.last = function() {
    return this[this.length - 1];
};

String.prototype.reverse = function() {
    return this.split("").reverse().join("");
};

Number.prototype.isDecimal = function() {
    return this % 1 != 0;
};