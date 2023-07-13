import { escapeHtml } from "./utils.js";

export default class MeasureRenderer {
    constructor(options) {
        this.options = options;
    }

    pluralize(num, text) {
        return `${text}${num > 1 ? "s" : ""}`;
    }

    handleNumber(num) {
        return Math.floor(num);
    }

    handleTime(measure) {
        if (measure.min > 3600) {
            return {
                min: measure.min / 3600,
                space: true,
                units: "hours",
            }
        } else if (measure.min % 60 == 0) {
            const number = measure.min / 60;
            return {
                min: number,
                space: true,
                units: this.pluralize(number, "minute"),
            }
        } else {
            const number = measure.min;
            return {
                min: number,
                space: true,
                units: this.pluralize(number, "second"),
            }
        }
    }

    handleWeight(measure) {
        return {
            min: measure.min,
            units: "g",
        }
    }

    handleDistance(measure) {
        if (measure.min < 1) {
            return {
                min: measure.min * 100,
                space: false,
                units: "cm",
            }
        } else {
            return {
                min: measure.min,
                space: true,
                units: pluralize(number, "metre"),
            }
        }
    }

    handleTemperature(measure) {
        let number = measure.min;
        let units = "°C";
        const gasMarks = [
            { num: 135, gasMark: 1 },
            { num: 149, gasMark: 2 },
            { num: 163, gasMark: 3 },
            { num: 177, gasMark: 4 },
            { num: 191, gasMark: 5 },
            { num: 204, gasMark: 6 },
            { num: 218, gasMark: 7 },
            { num: 232, gasMark: 8 },
            { num: 246, gasMark: 9 },
            { num: 270, gasMark: 10 },
        ];
        let gasMark = null;
        for (let gm of gasMarks) {
            if (measure.min > gm.num) {
                gasMark = gm.gasMark;
            }
        }
        if (gasMark) {
            units += ` (Gas Mark ${gasMark})`;
        }

        return {
            min: number,
            units: units
        }
    }

    handleVolume(measure) {
        if (measure.min < 1) {
            return {
                min: this.handleNumber(measure.min * 1000),
                space: false,
                units: "ml",
            }
        } else {
            return {
                min: this.handleNumber(measure.min),
                space: true,
                units: "l",
            }
        }
    }

    handleTeaspoons(measure) {
        if (measure.min % 3 == 0 && measure.min > 3) {
            return {
                min: measure.min / 3,
                space: false,
                units: "tbsp",
            }
        } else {
            return {
                min: measure.min,
                space: false,
                units: "tsp",
            }
        }
    }

    handle(measure) {
        switch (measure.type) {
            case "time": return this.handleTime(measure);
            case "weight": return this.handleWeight(measure);
            case "distance": return this.handleDistance(measure);
            case "temperature": return this.handleTemperature(measure);
            case "volume": return this.handleVolume(measure);
            case "teaspoons": return this.handleTeaspoons(measure);
        }
    }

    render(measure) {
        const p = this.handle(measure);

        let number = p.min;
        let whole = Math.floor(number);
        let decimal = number - whole;
        if (decimal != 0) {
            if (whole == 0) {
                whole = "";
            }
            
            if (decimal == 0.5) {
                number = `${whole}½`;
            }
            else if (decimal == 0.25) {
                number = `${whole}¼`;
            }
            else if (decimal == 0.125) {
                number = `${whole}⅛`;
            }
            else {
                number = this.handleNumber(number);
            }
        }

        const text = `${number}${p.space ? " " : ""}${p.units}`;
        if (this.options?.html) {
            return `<span class="measure" title="">${escapeHtml(text)}</span>`;
        } else {
            return text;
        }
    }
}