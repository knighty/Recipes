import { goToPage$, observePreviousPage } from "../history";
import HTMLContext from "../html-context";
import PlainTextContext from "../plain-text-context";
import { groupArray, pluckEventTarget, observeScopedEvent } from "../utils";
import { selectedVoice$ } from "../voice";
import images from "../images";
import PageView from "./page";
import { ReplaySubject, switchMap, Observable, map, fromEvent, tap, merge, withLatestFrom, startWith, takeUntil, filter } from "rxjs";
import { Recipe } from "../recipe";

export default class RecipeView extends PageView {
    disconnected$ = new ReplaySubject<void>(1);

    constructor() {
        super();
    }

    saveState() {

    }

    spicyToText(recipe: Recipe) {
        switch (recipe.intensity) {
            case 0: return "Non Spicy";
            case 1: return "Mild";
            case 2: return "Medium";
            case 3: return "Spicy";
            case 4: return "Very Spicy";
        }
        return "Non Spicy";
    }

    meatToImage(recipe: Recipe) {
        switch (recipe.meat.toLowerCase()) {
            case "beef": return images.meat.beef;
            case "egg": return images.meat.egg;
            case "chicken": return images.meat.chicken;
            case "pork": return images.meat.pork;
            case "fish": return images.meat.fish;
            case "salmon": return images.meat.salmon;
            case "none": return images.meat.vegetarian;
            default: return images.meat.none;
        }
    }

    showRecipe(recipe: Recipe) {
        const htmlContext = new HTMLContext();
        const plainTextContext = new PlainTextContext();

        this.innerHTML = `
            <div class="top-bar"></div>
            <main>
                <h1>${recipe.name} <button class="button" name="back">Back</button></h1>
                <ul class="meta">
                    ${recipe.duration ? `<li><img src="${images.icons.duration}"></img><span>${recipe.duration.min / 60} mins</span></li>` : ``} 
                    <li><img src="${images.icons.servings}"></img><span>Serves ${recipe.serves}</span></li>
                    ${recipe.meat ? `<li><img src="${this.meatToImage(recipe)}"></img><span>${recipe.meat}</span></li>` : ``} 
                    ${recipe.intensity && recipe.intensity > 0 ? `<li><img src="${images.icons.spicy}"></img><span>${this.spicyToText(recipe)}</span></li>` : ``}
                </ul>
                ${recipe.description ? `<div class="description">${recipe.description.getHTML(htmlContext)}</div>` : ``}
                <div class="steps" data-element="steps"></div>
            </main>
            <aside>
                ${recipe.image ? `<img class="image" src="${recipe.image}" />` : ``}
                <h1>Ingredients</h1>
                <div class="ingredients" data-element="ingredients"></div>
                <button name="deselect">Deselect All</button>
            </aside>
        `;
        //<li><img src="images/calories-coloured.png"></img><span>~${recipe.calories}kcal</span></li>
        const elements = {
            ingredients: this.querySelector<HTMLElement>(`[data-element="ingredients"]`),
            steps: this.querySelector<HTMLElement>(`[data-element="steps"]`),
        };

        //observeMouseMove(elements.ingredients).pipe(operators.tap(console.log)).subscribe();

        // Steps
        this.element<HTMLElement>("steps").innerHTML = recipe.steps.map((step, index) => {
            return `<section data-text="${step.html.getHTML(plainTextContext)}">
                <div class="duration"${step.duration ? ` data-timer="${step.duration.min}"` : ``}>${step.duration ? `<span data-num="${step.duration.min / 60}" data-units="min${step.duration.min > 1 ? `s` : ``}"></span>` : ``}</div>
                <div class="text">
                    ${step.html.getHTML(htmlContext)}
                </div>
            </section>`;
        }).join("");

        const ingredientContext = new HTMLContext();

        // Ingredients
        elements.ingredients.innerHTML = Object.entries(
            groupArray(recipe.ingredients, ingredient => ingredient.category)
        ).map(([group, items]) => `
            ${group != "-" ? `<h2>${group}</h2>` : ``}
            ${items.map(ingredient => `<label${ingredient.optional ? ` class="optional"` : ``}><input type="checkbox" /><span>${ingredient.html.getHTML(ingredientContext)}</span></label>`).join("")}
            `).join("");

        function read(step: HTMLElement, line: string) {
            return selectedVoice$.pipe(
                switchMap(voice =>
                    Observable.create((observer: { complete: () => void; }) => {
                        step.classList.add("reading");
                        const utterance = new SpeechSynthesisUtterance(line);
                        utterance.pitch = 1;
                        utterance.rate = 1;
                        utterance.voice = voice;
                        utterance.addEventListener("end", e => {
                            observer.complete();
                        });
                        window.speechSynthesis.speak(utterance);

                        return () => {
                            step.classList.remove("reading");
                            window.speechSynthesis.cancel();
                        }
                    })
                )
            )
        }

        const readStep$ = observeScopedEvent<MouseEvent>(
            this.querySelector(".steps"), "click", "section",
            { filterEvents: e => (e.target as HTMLElement).tagName != "A" }
        ).pipe(
            pluckEventTarget(),
            map(element => [element, element.dataset.text] as const)
        );

        const clickDeselect$ = fromEvent(this.querySelector("[name=deselect]"), "click").pipe(
            tap(() => [...elements.ingredients.querySelectorAll("input")].filter(c => c.checked).forEach(c => c.checked = false)),
        );

        merge(
            readStep$.pipe(
                switchMap(([element, line]) => read(element, line)),
            ),

            fromEvent(this.querySelector("[name=back]"), "click").pipe(
                withLatestFrom(
                    observePreviousPage("/"),
                    (e, previousIsCatalogue) => previousIsCatalogue
                ),
                tap(previousIsCatalogue => previousIsCatalogue ? history.back() : goToPage$.next(["/", {}]))
            ),

            merge(clickDeselect$, observeScopedEvent(elements.ingredients, "input", "input")).pipe(
                map(e => [...elements.ingredients.querySelectorAll("input")].reduce((a, c) => c.checked || a, false)),
                startWith(false),
                tap(anyChecked => this.querySelector("[name=deselect]").classList.toggle("hidden", !anyChecked))
            )
        ).pipe(
            takeUntil(this.disconnected$)
        ).subscribe();
    }

    disconnectedCallback() {
        this.disconnected$.next();
    }
}