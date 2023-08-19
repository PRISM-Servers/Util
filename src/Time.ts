import { normalizeNumber } from "./Util";

export function format(format: string, date: Date, utc = false) {
    if (!(date instanceof Date) || !this.isValidDate(date)) {
        throw new Error("Invalid date");
    }

    let rv = format;
    rv = rv.replace(/YYYY/g, (utc ? date.getUTCFullYear() : date.getFullYear()).toString());
    rv = rv.replace(/YY/g, (utc ? date.getUTCFullYear() : date.getFullYear()).toString().substr(2, 4));

    const month = utc ? date.getUTCMonth() : date.getMonth();
    rv = rv.replace(/MONTH/g, ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][month]);
    rv = rv.replace(/MON/g, ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][month]);
    rv = rv.replace(/MM/g, (month + 1).toString().padStart(2, "0"));
    rv = rv.replace(/M/g, (month + 1).toString());

    const day = utc ? date.getUTCDate() : date.getDate();
    rv = rv.replace(/FDAY/g, ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][day]);
    rv = rv.replace(/DAY/g, ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day]);
    rv = rv.replace(/DI/g, day + ([undefined, "st", "nd", "rd"][day / 10 % 10 ^ 1 && day % 10])!.toString() || "th");
    rv = rv.replace(/DD/g, day.toString().padStart(2, "0"));
    rv = rv.replace(/D/g, day.toString());

    const hour = utc ? date.getUTCHours() : date.getHours();
    rv = rv.replace(/HH/g, hour.toString().padStart(2, "0"));
    rv = rv.replace(/H/g, hour.toString());

    const hourP = hour == 0 ? 12 : hour < 12 ? hour : hour % 12;
    rv = rv.replace(/hh/g, hourP.toString().padStart(2, "0"));
    rv = rv.replace(/h/g, hourP.toString());

    rv = rv.replace(/AP/g, hour < 12 ? "AM" : "PM");

    const minute = utc ? date.getUTCMinutes() : date.getMinutes();
    rv = rv.replace(/mm/g, minute.toString().padStart(2, "0"));
    rv = rv.replace(/m/g, minute.toString());

    const seconds = utc ? date.getUTCSeconds() : date.getSeconds();
    rv = rv.replace(/SS/g, seconds.toString().padStart(2, "0"));
    rv = rv.replace(/S/g, seconds.toString());

    return rv;
}

export function wipeDateString(date: Date) {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date();

    let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let day = date.getUTCDate();

    return monthNames[date.getUTCMonth()] + " " + day + ([undefined, "st", "nd", "rd"][day / 10 % 10 ^ 1 && day % 10] || "th") + ", " + date.getUTCFullYear();
}

export function isValidDate(val: string | Date) {
    if (typeof val == "string") {
        return !isNaN(new Date(val).getTime());
    }

    return val instanceof Date && !isNaN(val.getTime());
}

export function formatDate(date: Date) {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date();

    let monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let dayStr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    let day = date.getDate();

    return dayStr + ", " + day + ([undefined, "st", "nd", "rd"][day / 10 % 10 ^ 1 && day % 10] || "th") + " of " + monthNames[date.getMonth()] + " " + date.getFullYear();
}

export function YMD(date: Date, separator = "-") {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date();

    return date.getUTCFullYear() + separator + (date.getUTCMonth() + 1) + separator + date.getUTCDate();
}

export function logFormat(date: Date) {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date();

    return date.getUTCFullYear() + "_" + (date.getUTCMonth() + 1) + "_" + date.getUTCDate() + "_" + date.getUTCHours() + "_" + date.getUTCMinutes() + "_" + date.getUTCSeconds();
}

export function UTC(date: Date) {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date(date);

    return date.toUTCString().replace("GMT", "UTC");
}

export function getTimeSpanFromMs(ms: number, short = false) {
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

    let arr: string[] = [];
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

export function getHoursFromSeconds(seconds: number) {
    return seconds / 3600;
}

export function daysBetween(date1: Date, date2: Date, short = false) {
    if (typeof date1 == "string") date1 = new Date(date1);
    if (typeof date2 == "string") date2 = new Date(date2);

    if (!this.isValidDate(date1) || !this.isValidDate(date2)) return "Unknown";

    // Convert both dates to milliseconds
    let date1_ms = date1.getTime();
    let date2_ms = date2.getTime();

    // Calculate the difference in milliseconds
    let difference_ms = Math.abs(date2_ms - date1_ms);

    return this.GetTimeSpanFromMs(difference_ms, short);
}

export function shortFormat(date: Date) {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date();

    return date.getUTCFullYear() + "-" + normalizeNumber(date.getUTCMonth() + 1) + "-" + normalizeNumber(date.getUTCDate()) + " " + normalizeNumber(date.getUTCHours()) + ":" + normalizeNumber(date.getUTCMinutes()) + ":" + normalizeNumber(date.getUTCSeconds());
}

export function increaseFromTimespan(time: string, limited = false, date = new Date()) {
    let pre: number | null = null;
    let current = new Date();

    const months: Record<string, number> = {
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
        "jun": 5,
        "july": 6,
        "jul": 6,
        "august": 7,
        "aug": 7,
        "september": 8,
        "sept": 8,
        "sep": 8,
        "october": 9,
        "oct": 9,
        "november": 10,
        "nov": 10,
        "december": 11,
        "dec": 11
    };

    const days: Record<string, number> = {
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

    if (!isNaN(Number(time[0])) || time[0] == ".") {
        const dictionary: Record<string, number> = {
            "year": 31536000,
            "month": 2592000,
            "week": 604800,
            "day": 86400,
            "hour": 3600,
            "minute": 60,
            "second": 1,
            "yr": 31536000,
            "y": 31536000,
            "mon": 2592000,
            "mo": 2592000,
            "w": 604800,
            "d": 86400,
            "hr": 3600,
            "h": 3600,
            "min": 60,
            "m": 60,
            "sec": 1,
            "s": 1
        };

        const f = Object.keys(dictionary).find(x => time.endsWith(x));
        if (f) {
            const num = Number(time.replace(f, "").trim());
            if (!isNaN(num)) {
                pre = num * dictionary[f];
                if (pre < 7200 && limited) {
                    return "Minimum is 2h";
                }
            }
        }
    }

    if (pre) {
        date.setTime(date.getTime() + pre * 1000);
    }
    else if (Object.keys(days).some(x => time.toLowerCase().startsWith(x))) {
        let day = days[Object.keys(days).find(x => time.toLowerCase().startsWith(x))!];
    
        date.setUTCHours(12, 0, 0, 0);
        date.setUTCFullYear(current.getUTCFullYear());

        if (current.getUTCDay() >= day) {
            let to_add = current.getUTCDay() == day ? 7 : 6 - current.getUTCDay() + day + 1;
            date.setUTCDate(date.getUTCDate() + to_add);
        }
        else date.setUTCDate(date.getUTCDate() + (day - current.getUTCDay()));
    }
    else if (Object.keys(months).some(x => time.toLowerCase().startsWith(x))) {
        let month = months[Object.keys(months).find(x => time.toLowerCase().startsWith(x))!];
        let day = Number(time.split(" ")[1] || 1);
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