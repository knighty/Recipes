import FormattedStringNode from "./formatted-string-node";
import HTMLNode from "./html-node";
import NodeVisitor from "./node-visitor";
import VisitableNode from "./visitable-node";

export default class IngredientNode implements VisitableNode {
    valueNode: FormattedStringNode;
    category: string;
    optional: boolean;

    constructor(valueNode: FormattedStringNode, category: string, optional: boolean) {
        this.valueNode = valueNode;
        this.category = category;
        this.optional = optional;
    }

    visit(visitor: NodeVisitor) {
        visitor.addIngredient({
            html: new HTMLNode(this.valueNode),
            category: this.category ?? "-",
            optional: this.optional
        });
    }
}