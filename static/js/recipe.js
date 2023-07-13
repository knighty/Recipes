class Recipe {

}

export class Ingredient {
    constructor(text, optional) {
        this.category = "-";
        this.text = text.trim();
        this.optional = optional;
    }
}

export class Step {
    constructor(html, duration) {
        this.html = html;
        this.duration = duration;
    }
}