import BaseHTMLContext from "../base-html-context";
import FormattedStringNode from "./formatted-string-node";
import HTMLNode from "./html-node";
import HTMLValueNode from "./html-value-node";

export default class ListNode implements HTMLValueNode {
    elements: FormattedStringNode[];
    ordered: boolean;

    constructor(elements: FormattedStringNode[], ordered = false) {
        this.elements = elements;
        this.ordered = ordered;
    }

    getValue(): HTMLNode {
        return new HTMLNode(this);
    }

    getHTML(context: BaseHTMLContext): string {
        return context.list(
            this.elements.map(node => node.getHTML(context)),
            this.ordered
        );
    }
}