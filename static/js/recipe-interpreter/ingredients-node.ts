import IngredientNode from "./ingredient-node";
import NodeVisitor from "./node-visitor";
import SectionNode from "./section-node";

export default class IngredientsNode implements SectionNode {
    ingredients: IngredientNode[];

    constructor(ingredients: IngredientNode[]) {
        this.ingredients = ingredients;
    }

    visit(visitor: NodeVisitor) {
        for (const ingredient of this.ingredients) {
            ingredient.visit(visitor);
        }
    }
}