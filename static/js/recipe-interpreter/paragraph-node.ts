import BaseHTMLContext from "../base-html-context";
import FormattedStringNode from "./formatted-string-node";
import HTMLNode from "./html-node";
import HTMLValueNode from "./html-value-node";

export default class ParagraphNode implements HTMLValueNode {
    node: FormattedStringNode;
    optional: boolean;
    tip: boolean;

    constructor(node: FormattedStringNode, optional: boolean, tip: boolean) {
        this.node = node;
        this.optional = optional;
        this.tip = tip;
    }

    getValue(): HTMLNode {
        return new HTMLNode(this);
    }

    getHTML(context: BaseHTMLContext): string {
        let classes = [];
        if (this.optional)
            classes.push("optional");
        if (this.tip)
            classes.push("tip");
        return context.paragraph(this.node.getHTML(context), classes);
    }
}