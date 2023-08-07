import App from "./app"
import RecipeCatalogueView from "./pages/catalogue";
import RecipeView from "./pages/recipe";
import SettingsView from "./settings";
import TimerView from "./timer";

import css from "./css";

import { fromEvent, map } from "rxjs";
import { fromDomEvent } from "./utils";

customElements.define("x-recipe", RecipeView);
customElements.define("x-recipe-catalogue", RecipeCatalogueView);

customElements.define("x-toolbar", class extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `<button name='settings'><i class="fa fa-cogs"></i> Settings</button><button name="reload"><i class="fa fa-refresh"></i> Reload</button>`;
        fromDomEvent(this.querySelector("[name=settings]"), "click").pipe(
            map(e => (e.target as HTMLInputElement).value)
        ).subscribe(() => (document.querySelector("x-settings") as SettingsView).toggle())
        fromEvent(this.querySelector("[name=reload]"), "click").pipe().subscribe(() => document.location.reload())
    }
});

customElements.define("x-app", App);
customElements.define("x-settings", SettingsView);
customElements.define("x-timer", TimerView);
