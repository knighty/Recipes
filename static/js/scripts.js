import App from "./app.js"
import RecipeCatalogueView from "./pages/catalogue.js";
import RecipeView from "./pages/recipe.js";

customElements.define("x-recipe", RecipeView);
customElements.define("x-recipe-catalogue", RecipeCatalogueView);

customElements.define("x-app", App);