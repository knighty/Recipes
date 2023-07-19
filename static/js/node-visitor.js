import { Ingredient, Step } from "./recipe.js";
import HTMLContext from "./html-context.js";
import PlainTextContext from "./plain-text-context.js";

export class NodeVisitor {
    constructor() {
        this.recipe = {
            ingredients: [],
            steps: []
        }
        this.plainTextContext = new PlainTextContext();
        this.ingredientHTMLContext = new HTMLContext();
    }

    addIngredient(ingredient) {
        const i = new Ingredient(ingredient.html.getHTML(this.plainTextContext), ingredient.optional);
        i.category = ingredient.category;
        i.html = ingredient.html.getHTML(this.ingredientHTMLContext);
        this.recipe.ingredients.push(i);
    }

    addStep(step) {
        this.recipe.steps.push(step);
    }

    setInfo(key, value) {
        this.recipe[key] = value;
    }
}