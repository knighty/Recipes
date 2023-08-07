import { Ingredient, Recipe, Step } from "../recipe";
import PlainTextContext from "../plain-text-context";
import HTMLNode from "./html-node";
import Measure from "../measure";

const plainTextContext = new PlainTextContext();

export default class NodeVisitor {
    recipe = new Recipe();

    addIngredient(ingredient: {
        category: string;
        html: HTMLNode;
        optional: boolean;
    }) {
        const i = new Ingredient(ingredient.html.getHTML(plainTextContext), ingredient.optional);
        i.category = ingredient.category;
        i.html = ingredient.html;
        this.recipe.ingredients.push(i);
    }

    addStep(step: Step) {
        this.recipe.steps.push(step);
    }

    setInfo<K extends keyof Recipe>(key: K, value: Recipe[K]) {
        this.recipe[key] = value;
        /*switch (key) {
            case "id": this.recipe.id = value as string; break;
            case "name": this.recipe.name = value as string; break;
            case "meat": this.recipe.meat = value as string; break;
            case "meat": this.recipe.meat = value as string; break;
            case "tags": this.recipe.tags = value as string[]; break;
            case "type": this.recipe.type = value as string; break;
            case "duration": this.recipe.duration = value as Measure; break;
            case "serves": this.recipe.serves = value as number; break;
            case "image": this.recipe.image = value as string; break;
            case "description": this.recipe.description = value as HTMLNode; break;
            case "intensity": this.recipe.intensity = value as number; break;
        }*/

        //this.setInfo("calories")
    }
}