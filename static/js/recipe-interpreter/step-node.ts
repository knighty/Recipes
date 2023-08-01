import BaseHTMLContext from "../base-html-context";
import HTMLNode from "./html-node";
import HTMLValueNode from "./html-value-node";
import MeasureNode from "./measure-node";

export default class StepNode {
    blockNodes: HTMLValueNode[];
    durationNode: MeasureNode;

    constructor(blockNodes: HTMLValueNode[], durationNode: MeasureNode) {
        this.blockNodes = blockNodes;
        this.durationNode = durationNode;
    }

    getValue() {
        return {
            html: new HTMLNode(this),
            duration: this.durationNode ? this.durationNode.getValue() : null
        }
    }

    getHTML(context: BaseHTMLContext) {
        return this.blockNodes.map(p => p.getHTML(context)).join("");
    }
}