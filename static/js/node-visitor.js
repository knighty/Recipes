import { Ingredient, Step } from "./recipe.js";
import HTMLContext from "./html-context.js";
import MeasureRenderer from "./measure-renderer.js";

class PlainTextContext {
    constructor() {
        this.measureRenderer = new MeasureRenderer({html: false});
    }

    highlightedWord(word) {
        return word;
    }

    paragraph(html, classes) {
        return html;
    }

    measure(measure) {
        return this.measureRenderer.render(measure);
    }
}

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