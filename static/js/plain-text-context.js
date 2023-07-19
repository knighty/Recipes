import MeasureRenderer from "./measure-renderer.js";

export default class PlainTextContext {
    constructor() {
        this.measureRenderer = new MeasureRenderer({html: false});
    }

    highlightedWord(word) {
        return word;
    }

    paragraph(html, classes) {
        return html + "\n\n";
    }

    measure(measure) {
        return this.measureRenderer.render(measure);
    }
}