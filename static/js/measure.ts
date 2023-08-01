export default class Measure {
    min: number;
    max: number | null;
    type: string;

    constructor(min: number, max: number | null, type: string) {
        this.min = min;
        this.max = max;
        this.type = type;
    }
}