import { escapeHtml } from "./utils.js";
import MeasureRenderer from "./measure-renderer.js";

export default class HTMLContext {
    constructor() {
        this.measureRenderer = new MeasureRenderer();
    }

    highlightedWord(word) {
        return `<span class="highlighted">${word}</span>`;
    }

    paragraph(html, classes) {
        return `<p${classes ? ` class="${escapeHtml(classes.join(" "))}"` : ``}>${html}</p>`;
    }

    measure(measure) {
        return `<span class="measure" title="">${this.measureRenderer.render(measure)}</span>`;
    }

    text(text) {
        return escapeHtml(text);
    }
}