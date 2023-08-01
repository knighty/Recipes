import BaseHTMLContext from "./base-html-context";
import Measure from "./measure";
import MeasureRenderer from "./measure-renderer";
import FormattedStringNode from "./recipe-interpreter/formatted-string-node";
import { escapeHtml } from "./utils";

export default class PlainTextContext implements BaseHTMLContext {
    measureRenderer = new MeasureRenderer({html: false});

    text(text: string): string {
        return escapeHtml(text);
    }

    highlightedWord(word: string) {
        return word;
    }

    paragraph(html: string, classes?: string[]) {
        return html + "\n\n";
    }

    measure(measure: Measure) {
        return this.measureRenderer.render(measure);
    }

    list(elements: string[], ordered: boolean): string {
        return elements.join("\n");
    }

    link(url: string, text?: FormattedStringNode, title?: string): string {
        return `${text ? text.getHTML(this) : ""}`;
    }
}