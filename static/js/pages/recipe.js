import HTMLContext from "../html-context.js";

export default class RecipeView extends HTMLElement {
    parseIngredients(ingredients) {
        let categories = {};

        for (let ingredient of ingredients) {
            categories[ingredient.category] = categories[ingredient.category] || { name: ingredient.category, ingredients: [] };
            categories[ingredient.category].ingredients.push(ingredient);
        }

        return categories;
    }

    spicyToText(recipe) {
        switch (recipe.intensity) {
            case 0: return "Non Spicy";
            case 1: return "Mild";
            case 2: return "Medium";
            case 3: return "Spicy";
            case 4: return "Very Spicy";
        }
        return "Non Spicy";
    }

    meatToImage(recipe) {
        switch (recipe.meat.toLowerCase()) {
            case "beef": return "beef.png";
            case "egg": return "egg.png";
            case "chicken": return "chicken.png";
            case "pork": return "pork.png";
            case "fish": return "fish.png";
            case "salmon": return "salmon.png";
            case "none": return "vegetarian.png";
            default: return "meat-fish.png";
        }
    }

    showRecipe(recipe) {
        const htmlContext = new HTMLContext();

        /*<div class="top-curve"></div>
            <div class="bottom-curve"></div>*/

        this.innerHTML = `
            <div class="top-bar"></div>
            <main>
                <h1>${recipe.name} <a class="button" href="/">Back</a></h1>
                <ul class="meta">
                    ${recipe.duration ? `<li><img src="/static/images/duration-coloured.png"></img><span>${recipe.duration.min / 60} mins</span></li>` : ``} 
                    <li><img src="/static/images/servings-coloured.png"></img><span>Serves ${recipe.serves}</span></li>
                    ${recipe.meat ? `<li><img src="/static/images/${this.meatToImage(recipe)}"></img><span>${recipe.meat}</span></li>` : ``} 
                    ${recipe.intensity && recipe.intensity > 0 ? `<li><img src="/static/images/spicy-coloured.png"></img><span>${this.spicyToText(recipe)}</span></li>` : ``}
                </ul>
                ${recipe.description ? `<div class="description">${recipe.description.getHTML(htmlContext)}</div>` : ``}
                <div class="steps" data-element="steps"></div>
            </main>
            <aside>
                ${recipe.image ? `<img class="image" src="${recipe.image}" />` : ``}
                <h1>Ingredients</h1>
                <div class="ingredients" data-element="ingredients"></div>
            </aside>
        `;
        //<li><img src="images/calories-coloured.png"></img><span>~${recipe.calories}kcal</span></li>
        this.elements = {
            ingredients: this.querySelector(`[data-element="ingredients"]`),
            steps: this.querySelector(`[data-element="steps"]`),
        };

        // Steps
        this.elements.steps.innerHTML = recipe.steps.map((step, index) => {
            return `<section>
                <div class="duration">${step.duration ? `<span data-num="${step.duration.min / 60}" data-units="min${step.duration.min > 1 ? `s` : ``}"></span>` : ``}</div>
                <div class="text">
                    ${step.html.getHTML(htmlContext)}
                </div>
            </section>`;
        }).join("");

        // Ingredients
        const categories = this.parseIngredients(recipe.ingredients);
        this.elements.ingredients.innerHTML = Object.values(categories).map(category => `
            ${category.name != "-" ? `<h2>${category.name}</h2>` : ``}
            ${category.ingredients.map(ingredient => `<label${ingredient.optional ? ` class="optional"` : ``}><input type="checkbox" /><span></span>${ingredient.html}</label>`).join("")}
            `).join("");
    }

    connectedCallback() {
        /*const recipeSelector = document.getElementById("recipe-selector");
        recipeSelector.selectedRecipe$.subscribe(this.showRecipe.bind(this));*/
    }
}