export {};

declare global {
    interface Array<T> {
        remove: (...item) => boolean;
        random: () => T;
        last: () => T;
        distinct: () => Array<T>;
    }

    interface String {
        reverse: () => string;
    }

    interface Number {
        isDecimal: () => boolean;
    }
}