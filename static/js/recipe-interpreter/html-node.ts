import BaseHTMLContext from "../base-html-context";
import HTMLValueNode from "./html-value-node";

export default class HTMLNode {
    valueNode: HTMLValueNode;

    constructor(valueNode: HTMLValueNode) {
        this.valueNode = valueNode;
    }

    getHTML(context: BaseHTMLContext) {
        return this.valueNode.getHTML(context);
    }
}