import Measure from "./measure";
import FormattedStringNode from "./recipe-interpreter/formatted-string-node";

export default interface BaseHTMLContext {

    highlightedWord(word: string): string;

    paragraph(html: string, classes?: string[]): string;

    measure(measure: Measure): string;

    text(text: string): string;

    list(elements: string[], ordered: boolean): string;

    link(url: string, text?: FormattedStringNode, title?: string): string;
}