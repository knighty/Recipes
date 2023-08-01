import BaseHTMLContext from "../base-html-context";
import Measure from "../measure";
import HTMLValueNode from "./html-value-node";

export default class MeasureNode implements HTMLValueNode {
    measure: Measure;

    constructor(measure: Measure) {
        this.measure = measure;
    }

    getValue() {
        return this.measure;
    }

    getHTML(context: BaseHTMLContext) {
        return context.measure(this.measure);
    }
}