const Util = require("./Util");

class Time {
    constructor() {
        throw new Error("This class cannot be instantiated!");
    }

    /**
     * @param {Date} date
     */
    static WipeDateString(date) {
        if (!date) date = new Date();
        if (!(date instanceof Date)) date = new Date();

        let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let day = date.getUTCDate();

        return monthNames[date.getUTCMonth()] + " " + day + ([undefined, "st", "nd", "rd"][day / 10 % 10 ^ 1 && day % 10] || "th") + ", " + date.getUTCFullYear();
    }

    /**
     * @param {Date} date 
     */
    static formatDate(date) {
        if (!date) date = new Date();
        if (!(date instanceof Date)) date = new Date();

        let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        let dayStr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
        let day = date.getDate();
    
        return dayStr + ", " + day + ([undefined, "st", "nd", "rd"][day / 10 % 10 ^ 1 && day % 10] || "th") + " of " + monthNames[date.getMonth()] + " " + date.getFullYear();
    }

    /**
     * @param {Date} date 
     * @param {string} separator 
     */
    static MonthAndDayFromDate(date, separator = "-") {
        if (!date) date = new Date();
        if (!(date instanceof Date)) date = new Date();

        return date.getUTCFullYear() + separator + (date.getUTCMonth() + 1) + separator + date.getUTCDate();
    }

    /**
     * @param {Date} date 
     */
    static LogFormat(date) {
        if (!date) date = new Date();
        if (!(date instanceof Date)) date = new Date();

        return date.getUTCFullYear() + "_" + (date.getUTCMonth() + 1) + "_" + date.getUTCDate() + "_" + date.getUTCHours() + "_" + date.getUTCMinutes() + "_" + date.getUTCSeconds();
    }

    /**
     * @param {Date} date 
     */
    static UTC(date) {
        if (!date) date = new Date();
        if (!(date instanceof Date)) date = new Date(date);

        return date.toUTCString().replace("GMT", "UTC");
    }

    /**
     * @param {number} ms 
     * @param {boolean} short 
     */
    static GetTimeSpanFromMs(ms, short = false) {
        if (ms < 1000) return "Less than a second";
        ms = ms / 1000;
        let seconds = Math.floor(ms % 60);
        ms = ms / 60;
        let minutes = Math.floor(ms % 60);
        ms = ms / 60;
        let hours = Math.floor(ms % 24);
        let days = Math.floor(ms / 24);
        let years = Math.floor(days / 365);
        days -= years * 365;

        let year_s = years + " year" + (years != 1 ? "s" : "");
        let day_s = days + " day" + (days != 1 ? "s" : "");
        let hour_s = hours + " hour" + (hours != 1 ? "s" : "");
        let mins_s = minutes + " minute" + (minutes != 1 ? "s" : "");
        let sec_s = seconds + " second" + (seconds != 1 ? "s" : "");

        let arr = [];
        if (years > 0) arr.push(year_s);
        if (days > 0) arr.push(day_s);
        if (hours > 0) arr.push(hour_s);
        if (minutes > 0) arr.push(mins_s);
        if (seconds > 0 && (!short || arr.length < 1)) arr.push(sec_s);

        if (arr.length < 1) return "Unknown";
        if (arr.length < 2) return arr[0];

        let last = arr.last();
        arr.pop();

        return arr.join(", ") + " and " + last;
    }

    /**
     * @param {number} seconds 
     */
    static GetHoursFromSeconds(seconds) {
        return seconds / 3600;
    }

    /**
     * @param {Date} date1 
     * @param {Date} date2 
     * @param {boolean} short 
     */
    static daysBetween(date1, date2, short = false) {
        if (typeof date1 == "string") date1 = new Date(date1);
        if (typeof date2 == "string") date2 = new Date(date2);

        if (date1 == "Invalid Date" || date2 == "Invalid Date") return "Unknown";

        // Convert both dates to milliseconds
        let date1_ms = date1.getTime();
        let date2_ms = date2.getTime();

        // Calculate the difference in milliseconds
        let difference_ms = Math.abs(date2_ms - date1_ms);

        return this.GetTimeSpanFromMs(difference_ms, short);
    }

    /**
     * @param {Date} date 
     */
    static ShortFormat(date) {
        if (!date) date = new Date();
        if (!(date instanceof Date)) date = new Date();

        return date.getUTCFullYear() + "-" + Util.NormalizeNumber(date.getUTCMonth() + 1) + "-" + Util.NormalizeNumber(date.getUTCDate()) + " " + Util.NormalizeNumber(date.getUTCHours()) + ":" + Util.NormalizeNumber(date.getUTCMinutes()) + ":" + Util.NormalizeNumber(date.getUTCSeconds());
    }

    /**
     * @param {string} time 
     * @returns {Date | string | null} parsed time as seconds
     */
    static IncreaseFromTimespan(time, limited = false, date = new Date()) {
        let pre = null;
        let current = new Date();

        const months = {
            "january": 0,
            "jan": 0,
            "february": 1,
            "feb": 1,
            "march": 2,
            "mar": 2,
            "april": 3,
            "apr": 3,
            "may": 4,
            "june": 5,
            "july": 6,
            "jul": 6,
            "august": 7,
            "aug": 7,
            "september": 8,
            "sep": 8,
            "october": 9,
            "oct": 9,
            "november": 10,
            "nov": 10,
            "december": 11,
            "dec": 11
        };

        const days = {
            "sun": 0,
            "sunday": 0,
            "mon": 1,
            "monday": 1,
            "tue": 2,
            "tuesday": 2,
            "wed": 3,
            "wednesday": 3,
            "thu": 4,
            "thursday": 4,
            "fri": 5,
            "friday": 5,
            "sat": 6,
            "saturday": 6
        };

        if (!isNaN(time[0])) {
            let num = "";
            for (let letter of time) {
                if (isNaN(letter)) break; 
                else num += letter;
            }

            if (num && !isNaN(num)) {
                time = time.replace(num, "");
                let dictionary = {
                    "year": "YEAR",
                    "month": "MONTH",
                    "week": "WEEK",
                    "day": "DAY",
                    "hour": "HOUR",
                    "minute": "MINUTE",
                    "second": "SECOND",
                    "yr": "YEAR",
                    "y": "YEAR",
                    "mon": "MONTH",
                    "mo": "MONTH",
                    "w": "WEEK",
                    "d": "DAY",
                    "hr": "HOUR",
                    "h": "HOUR",
                    "min": "MINUTE",
                    "m": "MINUTE",
                    "sec": "SECOND",
                    "s": "SECOND"
                };

                let found = dictionary[Object.keys(dictionary).find(x => x == time.toLowerCase() || x + "s" == time.toLowerCase())];
                if (found) pre = {amount: Number(num), type: found};
            }
        }

        if (pre) {
            switch (pre.type) {
                case "YEAR": {
                    date.setUTCFullYear(date.getUTCFullYear() +  pre.amount);
                    break;
                }

                case "MONTH": {
                    date.setUTCMonth(date.getUTCMonth() +  pre.amount);
                    break;
                }

                case "WEEK": {
                    date.setUTCDate(date.getUTCDate() + (pre.amount * 7));
                    break;
                }

                case "DAY": {
                    date.setUTCDate(date.getUTCDate() + pre.amount);
                    break;
                }

                case "HOUR": {
                    if (limited) return "Minimum is 1 day";
                    date.setUTCHours(date.getUTCHours() + pre.amount);
                    break;
                }

                case "MINUTE": {
                    if (limited) return "Minimum is 1 day";
                    date.setUTCMinutes(date.getUTCMinutes() + pre.amount);
                    break;
                }

                case "SECOND": {
                    if (limited) return "Minimum is 1 day";
                    date.setUTCSeconds(date.getUTCSeconds() + pre.amount);
                    break;
                }
            }
        }
    
        else if (Object.keys(days).some(x => time.toLowerCase().startsWith(x))) {
            let day = days[Object.keys(days).find(x => time.toLowerCase().startsWith(x))];
        
            date.setUTCHours(12, 0, 0, 0);
            date.setUTCFullYear(current.getUTCFullYear());

            if (current.getUTCDay() >= day) {
                let to_add = current.getUTCDay() == day ? 7 : 6 - current.getUTCDay() + day + 1;
                date.setUTCDate(date.getUTCDate() + to_add);
            }
            else date.setUTCDate(date.getUTCDate() + (day - current.getUTCDay()));
        }

        else if (Object.keys(months).some(x => time.toLowerCase().startsWith(x)) && time.includes(" ")) {
            let month = months[Object.keys(months).find(x => time.toLowerCase().startsWith(x))];
            let day = Number(time.split(" ")[1]);
            if (isNaN(day) || day < 0) return null;

            if ((month == 1 && day > 28) || (([3, 5, 8, 10].includes(month) && day > 30) || ([0, 2, 4, 6, 7, 9, 11].includes(month) && day > 31))) {
                return "That month does not have that many days!";
            }

            date.setUTCHours(12, 0, 0, 0);

            if (current.getMonth() < month) {
                date.setUTCFullYear(current.getUTCFullYear());
                date.setUTCMonth(month);
                date.setUTCDate(day);
            }

            else if (current.getMonth() == month) {
                if (current.getDate() == day) return "Needs more precision";

                if (current.getDate() < day) {
                    date.setUTCFullYear(current.getUTCFullYear());
                    date.setUTCMonth(month);
                    date.setUTCDate(day);
                }
            
                else {
                    date.setUTCFullYear(current.getUTCFullYear() + 1);
                    date.setUTCMonth(month);
                    date.setUTCDate(day);
                }
            }

            else {
                date.setUTCFullYear(current.getUTCFullYear() + 1);
                date.setUTCMonth(month);
                date.setUTCDate(day);
            }
        }
        else return null;

        return date;
    }
}

module.exports = Time;