import BaseHTMLContext from "../base-html-context";
import FormattedStringFragment from "./formatted-string-fragment";

export default class FormattedStringNode implements FormattedStringFragment {
    fragmentNodes: FormattedStringFragment[];

    constructor(fragmentNodes: FormattedStringFragment[]) {
        this.fragmentNodes = fragmentNodes;
    }

    getHTML(context: BaseHTMLContext) {
        return this.fragmentNodes.map(frag => frag.getHTML(context)).join("");
    }
}