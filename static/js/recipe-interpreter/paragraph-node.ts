import BaseHTMLContext from "../base-html-context";
import FormattedStringNode from "./formatted-string-node";
import HTMLNode from "./html-node";
import HTMLValueNode from "./html-value-node";

export default class ParagraphNode implements HTMLValueNode {
    nodes: FormattedStringNode[];
    optional: boolean;
    tip: boolean;

    constructor(nodes: FormattedStringNode[], optional: boolean, tip: boolean) {
        this.nodes = nodes;
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
        return context.paragraph(this.nodes.map(node => node.getHTML(context)).join(""), classes);
    }
}