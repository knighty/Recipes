import App from "./app.js"
import RecipeCatalogueView from "./pages/catalogue.js";
import RecipeView from "./pages/recipe.js";
import SettingsView from "./settings.js";
import TimerView from "./timer.js";

customElements.define("x-recipe", RecipeView);
customElements.define("x-recipe-catalogue", RecipeCatalogueView);

//const theme$ = new rxjs.BehaviorSubject("default");

customElements.define("x-toolbar", class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `<button name='settings'><i class="fa fa-cogs"></i> Settings</button><button name="reload"><i class="fa fa-refresh"></i> Reload</button>`;
        rxjs.fromEvent(this.querySelector("[name=settings]"), "click").pipe(
            rxjs.operators.map(e => e.target.value)
        ).subscribe(() => document.querySelector("x-settings").toggle())
        rxjs.fromEvent(this.querySelector("[name=reload]"), "click").pipe().subscribe(() => document.location.reload())
    }
});

customElements.define("x-app", App);
customElements.define("x-settings", SettingsView);
customElements.define("x-timer", TimerView);
