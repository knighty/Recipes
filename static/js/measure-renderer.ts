import Measure from "./measure";
import { escapeHtml } from "./utils";

class MeasureRendererOptions {
    html?: boolean;
}

export default class MeasureRenderer {
    options: MeasureRendererOptions;

    constructor(options: MeasureRendererOptions) {
        this.options = options;
    }

    pluralize(num: number, text: string) {
        return `${text}${num > 1 ? "s" : ""}`;
    }

    handleNumber(num: number) {
        return Math.floor(num);
    }

    handleTime(measure: Measure) {
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

    handleWeight(measure: Measure) {
        return {
            min: measure.min,
            units: "g",
        }
    }

    handleDistance(measure: Measure) {
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
                units: this.pluralize(measure.min, "metre"),
            }
        }
    }

    handleTemperature(measure: Measure) {
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

    handleVolume(measure: Measure) {
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

    handleTeaspoons(measure: Measure) {
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

    handle(measure: Measure): {
        units: string,
        min: number,
        space?: boolean
    } {
        switch (measure.type) {
            case "time": return this.handleTime(measure);
            case "weight": return this.handleWeight(measure);
            case "distance": return this.handleDistance(measure);
            case "temperature": return this.handleTemperature(measure);
            case "volume": return this.handleVolume(measure);
            case "teaspoons": return this.handleTeaspoons(measure);
        }
    }

    render(measure: Measure) {
        const p = this.handle(measure);

        let number = p.min;
        let numberText = number.toString();
        let whole = Math.floor(number);
        let wholeText = whole.toString();
        let decimal = number - whole;
        if (decimal != 0) {
            if (whole == 0) {
                wholeText = "";
            }

            if (decimal == 0.5) {
                numberText = `${wholeText}½`;
            }
            else if (decimal == 0.25) {
                numberText = `${wholeText}¼`;
            }
            else if (decimal == 0.125) {
                numberText = `${wholeText}⅛`;
            }
            else {
                numberText = this.handleNumber(number).toString();
            }
        }

        const text = `${numberText}${p.space ? " " : ""}${p.units}`;
        if (this.options?.html) {
            return `<span class="measure" title="" ${measure.type == "time" ? `data-timer="${measure.min}"` : ``}>${escapeHtml(text)}</span>`;
        } else {
            return text;
        }
    }
}