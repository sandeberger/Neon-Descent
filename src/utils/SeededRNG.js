export class SeededRNG {
    constructor(seed) {
        this.s = seed >>> 0;
    }
    next() {
        this.s = (Math.imul(1664525, this.s) + 1013904223) >>> 0;
        return this.s / 0x100000000;
    }
    int(lo, hi) {
        return lo + Math.floor(this.next() * (hi - lo + 1));
    }
    float(lo, hi) {
        return lo + this.next() * (hi - lo);
    }
    pick(arr) {
        return arr[this.int(0, arr.length - 1)];
    }
    weightedPick(items, weights) {
        const total = weights.reduce((a, b) => a + b, 0);
        let r = this.next() * total;
        for (let i = 0; i < items.length; i++) {
            r -= weights[i];
            if (r <= 0)
                return items[i];
        }
        return items[items.length - 1];
    }
    shuffle(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }
    /** Generate a deterministic daily seed from a date string */
    static dailySeed(dateStr) {
        const str = 'NEON_DESCENT_DAILY_' + (dateStr ?? SeededRNG.todayDateString());
        // DJB2 hash
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash + str.charCodeAt(i)) >>> 0;
        }
        return hash;
    }
    /** Get today's date as UTC YYYY-MM-DD string */
    static todayDateString() {
        const d = new Date();
        return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
    }
}
