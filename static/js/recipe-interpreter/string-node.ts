import BaseHTMLContext from "../base-html-context";
import FormattedStringFragment from "./formatted-string-fragment";

export default class StringNode implements FormattedStringFragment {
    string: string;

    constructor(string: string) {
        this.string = string;
    }

    getHTML(context: BaseHTMLContext): string {
        return this.string;
    }

    getValue() {
        return this.string;
    }
}