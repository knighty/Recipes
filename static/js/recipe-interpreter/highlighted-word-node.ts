import BaseHTMLContext from "../base-html-context";
import FormattedStringNode from "./formatted-string-node";
import HTMLValueNode from "./html-value-node";

export default class HighlightedWordNode implements HTMLValueNode {
    wordNode: FormattedStringNode;

    constructor(wordNode: FormattedStringNode) {
        this.wordNode = wordNode;
    }

    getHTML(context: BaseHTMLContext) {
        return context.highlightedWord(this.wordNode.getHTML(context));
    }
}