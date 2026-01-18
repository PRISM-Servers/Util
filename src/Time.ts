import { normalizeNumber } from "./Util.js";

export function format(format: string, date: Date, utc = false) {
    if (!(date instanceof Date) || !isValidDate(date)) {
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

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const day = date.getUTCDate();

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

    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const dayStr = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
    const day = date.getDate();

    return dayStr + ", " + day + ([undefined, "st", "nd", "rd"][day / 10 % 10 ^ 1 && day % 10] || "th") + " of " + monthNames[date.getMonth()] + " " + date.getFullYear();
}

export function YMD(date: Date, separator = "-") {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date();

    return date.getUTCFullYear() + separator + (date.getUTCMonth() + 1) + separator + date.getUTCDate();
}

export function logFormat(date?: Date) {
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
    const seconds = Math.floor(ms % 60);
    ms = ms / 60;
    const minutes = Math.floor(ms % 60);
    ms = ms / 60;
    const hours = Math.floor(ms % 24);
    let days = Math.floor(ms / 24);
    const years = Math.floor(days / 365);
    days -= years * 365;

    const year_s = years + " year" + (years != 1 ? "s" : "");
    const day_s = days + " day" + (days != 1 ? "s" : "");
    const hour_s = hours + " hour" + (hours != 1 ? "s" : "");
    const mins_s = minutes + " minute" + (minutes != 1 ? "s" : "");
    const sec_s = seconds + " second" + (seconds != 1 ? "s" : "");

    const arr: string[] = [];
    if (years > 0) arr.push(year_s);
    if (days > 0) arr.push(day_s);
    if (hours > 0) arr.push(hour_s);
    if (minutes > 0) arr.push(mins_s);
    if (seconds > 0 && (!short || arr.length < 1)) arr.push(sec_s);

    if (arr.length < 1) return "Unknown";
    if (arr.length < 2) return arr[0];

    const last = arr.last();
    arr.pop();

    return arr.join(", ") + " and " + last;
}

export function getHoursFromSeconds(seconds: number) {
    return seconds / 3600;
}

export function daysBetween(date1: Date, date2: Date, short = false) {
    if (typeof date1 == "string") date1 = new Date(date1);
    if (typeof date2 == "string") date2 = new Date(date2);

    if (!isValidDate(date1) || !isValidDate(date2)) return "Unknown";

    // Convert both dates to milliseconds
    const date1_ms = date1.getTime();
    const date2_ms = date2.getTime();

    // Calculate the difference in milliseconds
    const difference_ms = Math.abs(date2_ms - date1_ms);

    return getTimeSpanFromMs(difference_ms, short);
}

export function shortFormat(date: Date) {
    if (!date) date = new Date();
    if (!(date instanceof Date)) date = new Date();

    return date.getUTCFullYear() + "-" + normalizeNumber(date.getUTCMonth() + 1) + "-" + normalizeNumber(date.getUTCDate()) + " " + normalizeNumber(date.getUTCHours()) + ":" + normalizeNumber(date.getUTCMinutes()) + ":" + normalizeNumber(date.getUTCSeconds());
}

export function increaseFromTimespan(time: string, limited = false, date = new Date()) {
    let pre: number | null = null;
    const current = new Date();

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

    // Parse combined numeric times like "1h10m", "1.5h", "2d4h30m", and also "1h15 min"
    // longer unit names first so 'month'/'mon' match before single 'm'
    const tokenRegex = /(\d*\.?\d+)\s*(years?|yrs?|y|months?|mons?|month|mon|mo|weeks?|w|days?|d|hours?|hrs?|h|minutes?|mins?|min|m|seconds?|secs?|sec|s)(?=\s|$|\d)/gi;
    let match;
    let totalSeconds = 0;
    while ((match = tokenRegex.exec(time)) !== null) {
        const num = parseFloat(match[1]);
        const unit = match[2].toLowerCase();
        let unitSeconds = 0;
        if (unit.startsWith("y")) unitSeconds = 31536000;
        else if (unit === "mon" || unit.startsWith("month") || unit === "mo") unitSeconds = 2592000;
        else if (unit.startsWith("w")) unitSeconds = 604800;
        else if (unit.startsWith("d")) unitSeconds = 86400;
        else if (unit.startsWith("h")) unitSeconds = 3600;
        else if (unit === "m" || unit.startsWith("min")) unitSeconds = 60;
        else if (unit.startsWith("s")) unitSeconds = 1;

        totalSeconds += num * unitSeconds;
    }

    if (totalSeconds > 0) {
        pre = totalSeconds;
        if (pre < 7200 && limited) {
            return "Minimum is 2h";
        }
    }

    if (pre) {
        date.setTime(date.getTime() + pre * 1000);
    }
    else if (Object.keys(days).some(x => time.toLowerCase().startsWith(x))) {
        const day = days[Object.keys(days).find(x => time.toLowerCase().startsWith(x))!];
    
        date.setUTCHours(12, 0, 0, 0);
        date.setUTCFullYear(current.getUTCFullYear());

        if (current.getUTCDay() >= day) {
            const to_add = current.getUTCDay() == day ? 7 : 6 - current.getUTCDay() + day + 1;
            date.setUTCDate(date.getUTCDate() + to_add);
        }
        else date.setUTCDate(date.getUTCDate() + (day - current.getUTCDay()));
    }
    else if (Object.keys(months).some(x => time.toLowerCase().startsWith(x))) {
        const month = months[Object.keys(months).find(x => time.toLowerCase().startsWith(x))!];
        const day = Number(time.split(" ")[1] || 1);
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