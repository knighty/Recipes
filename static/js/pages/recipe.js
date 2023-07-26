import { goToPage$, observePreviousPage } from "../history.js";
import HTMLContext from "../html-context.js";
import PlainTextContext from "../plain-text-context.js";
import { escapeHtml, groupArray, observeMouseMove, observeScopedEvent } from "../utils.js";
import { selectedVoice$ } from "../voice.js";

export default class RecipeView extends HTMLElement {
    constructor() {
        super();
        this.disconnected$ = new rxjs.ReplaySubject(1);
    }

    saveState() {

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
        const plainTextContext = new PlainTextContext();

        this.innerHTML = `
            <div class="top-bar"></div>
            <main>
                <h1>${recipe.name} <button class="button" name="back">Back</button></h1>
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
                <button name="deselect">Deselect All</button>
            </aside>
        `;
        //<li><img src="images/calories-coloured.png"></img><span>~${recipe.calories}kcal</span></li>
        this.elements = {
            ingredients: this.querySelector(`[data-element="ingredients"]`),
            steps: this.querySelector(`[data-element="steps"]`),
        };

        //observeMouseMove(this.elements.ingredients).pipe(rxjs.operators.tap(console.log)).subscribe();

        // Steps
        this.elements.steps.innerHTML = recipe.steps.map((step, index) => {
            return `<section data-text="${step.html.getHTML(plainTextContext)}">
                <div class="duration"${step.duration ? ` data-timer="${step.duration.min}"` : ``}>${step.duration ? `<span data-num="${step.duration.min / 60}" data-units="min${step.duration.min > 1 ? `s` : ``}"></span>` : ``}</div>
                <div class="text">
                    ${step.html.getHTML(htmlContext)}
                </div>
            </section>`;
        }).join("");

        // Ingredients
        this.elements.ingredients.innerHTML = Object.entries(recipe.ingredients.group(ingredient => ingredient.category)).map(([group, items]) => `
            ${group != "-" ? `<h2>${group}</h2>` : ``}
            ${items.map(ingredient => `<label${ingredient.optional ? ` class="optional"` : ``}><input type="checkbox" /><span>${ingredient.html}</span></label>`).join("")}
            `).join("");

        function read(step, line) {
            return selectedVoice$.pipe(
                rxjs.operators.switchMap(([index, voice]) =>
                    rxjs.Observable.create(observer => {
                        step.classList.add("reading");
                        const utterance = new SpeechSynthesisUtterance(line);
                        utterance.pitch = 1;
                        utterance.rate = 1;
                        utterance.voice = voice;
                        utterance.addEventListener("end", (e) => {
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

        const readStep$ = observeScopedEvent(this.querySelector(".steps"), "click", "section").pipe(
            rxjs.operators.map(([element, e]) => [element, element.dataset.text])
        );

        const clickDeselect$ = rxjs.fromEvent(this.querySelector("[name=deselect]"), "click").pipe(
            rxjs.operators.tap(() => [...this.elements.ingredients.querySelectorAll("input")].filter(c => c.checked).forEach(c => c.checked = false)),
        );

        rxjs.merge(
            readStep$.pipe(
                rxjs.operators.switchMap(([element, line]) => read(element, line)),
            ),

            rxjs.fromEvent(this.querySelector("[name=back]"), "click").pipe(
                rxjs.operators.withLatestFrom(
                    observePreviousPage("/"),
                    (e, previousIsCatalogue) => previousIsCatalogue
                ),
                rxjs.operators.tap(previousIsCatalogue => previousIsCatalogue ? history.back() : goToPage$.next(["/", {}]))
            ),

            rxjs.merge(clickDeselect$, observeScopedEvent(this.elements.ingredients, "input", "input")).pipe(
                rxjs.operators.map(e => [...this.elements.ingredients.querySelectorAll("input")].reduce((a, c) => c.checked || a, false)),
                rxjs.operators.startWith(false),
                rxjs.operators.tap(anyChecked => this.querySelector("[name=deselect]").classList.toggle("hidden", !anyChecked))
            )
        ).pipe(
            rxjs.operators.takeUntil(this.disconnected$)
        ).subscribe();
    }

    disconnectedCallback() {
        this.disconnected$.next();
    }
}