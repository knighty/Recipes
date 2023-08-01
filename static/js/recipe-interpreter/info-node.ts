import { Recipe } from "../recipe";
import NodeVisitor from "./node-visitor";
import VisitableNode from "./visitable-node";

export interface InfoNodeValue<T> {
    getValue(): T;
}

export class SimpleInfoNodeValue<T> implements InfoNodeValue<T> {
    value: T;
    constructor(value: T) {
        this.value = value;
    }

    getValue(): T {
        return this.value;
    }
}

export class InfoNode<T> implements VisitableNode {
    key: keyof Recipe;
    value: T;

    constructor(key: keyof Recipe, value: T) {
        this.key = key;
        this.value = value;
    }

    getKey() {
        return this.key;
    }

    getValue(): T {
        /*switch (this.key) {
            case "duration": return this.valueNode.getValue()
            default:
                return (this.isHtml) ? this.valueNode : this.valueNode.getValue();
        }*/
        return this.value;
    }

    visit(visitor: NodeVisitor) {
        visitor.setInfo<T>(this.getKey(), this.getValue());
    }
}