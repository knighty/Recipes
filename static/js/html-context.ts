import { escapeHtml } from "./utils";
import MeasureRenderer from "./measure-renderer";
import Measure from "./measure";
import BaseHTMLContext from "./base-html-context";
import FormattedStringNode from "./recipe-interpreter/formatted-string-node";

export default class HTMLContext implements BaseHTMLContext {
    measureRenderer = new MeasureRenderer({ html: true });

    highlightedWord(word: string) {
        return `<span class="highlighted">${word}</span>`;
    }

    paragraph(html: string, classes?: string[]) {
        return `<p${classes ? ` class="${classes ? escapeHtml(classes.join(" ")) : ""}"` : ``}>${html}</p>`;
    }

    measure(measure: Measure) {
        return this.measureRenderer.render(measure);
    }

    text(text: string) {
        return escapeHtml(text);
    }

    list(elements: string[], ordered: boolean): string {
        const listType = ordered ? `ol` : `ul`;
        return `<${listType}>${elements.map(element => `<li>${element}</li>`).join("\n")}</${listType}>`;
    }

    link(url: string, text?: FormattedStringNode, title?: string): string {
        return `<a href="${escapeHtml(url)}" title="${title ? title : ""}" data-url="${escapeHtml(url)}">${text ? text.getHTML(this) : escapeHtml(url)}</a>`;
    }
}