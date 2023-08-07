import { ReplaySubject, BehaviorSubject, Subject, combineLatest, combineLatestWith, map, merge, startWith, switchMap, takeUntil, tap } from "rxjs";
import { debounceAfterFirst, observeInput, orderedGroupArray } from "../utils";
import PageView from "./page";
import RecipeRepository from "../recipe-repository";
import { Recipe } from "../recipe";

export default class RecipeCatalogueView extends PageView<{}> {
    selectRecipe$ = new ReplaySubject(1);
    grouping$ = new BehaviorSubject("meat");
    search$ = new BehaviorSubject("");
    name$ = new BehaviorSubject("");
    disconnected$ = new ReplaySubject(1);
    recipeRepository$ = new ReplaySubject<RecipeRepository>(1);
    saveState$ = new Subject<void>();

    constructor() {
        super();
    }

    setState(state: any) {
        console.log(state);
        if (state?.grouping) {
            this.grouping$.next(state.grouping);
        }
        if (state?.search) {
            this.search$.next(state.search);
        }
    }

    disconnectedCallback() {
        this.disconnected$.next(true);
    }

    saveState() {
        this.saveState$.next();
    }

    connectedCallback() {
        this.innerHTML = "";

        const filterElement = document.createElement("div");
        filterElement.className = "filter";
        filterElement.innerHTML = `
            <label>
                Search:
                <input name="search"></input>
            </label>
            <label class="group">
                Group By: 
                <select name="grouping">
                    <option value="none">None</option>
                    <option value="type">Type</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="duration">Duration</option>
                    <option value="meat">Meat</option>
                </select>
            </label>
        `;

        const groupingSelect = filterElement.querySelector<HTMLSelectElement>(`[name="grouping"]`);
        const searchInput = filterElement.querySelector<HTMLInputElement>(`[name="search"]`);

        const grouping$ = merge(
            observeInput(groupingSelect, "input"),
            this.grouping$
        ).pipe(
            startWith(groupingSelect.value),
            tap(value => groupingSelect.value = value)
        );

        const search$ = merge(
            observeInput(searchInput, "input").pipe(debounceAfterFirst(300)),
            this.search$.asObservable()
        ).pipe(
            startWith(searchInput.value),
            tap(value => searchInput.value = value)
        );

        combineLatest([grouping$, search$]).pipe(
            takeUntil(this.saveState$),
            //last(),
            map(([grouping, search]) => {
                return { grouping: grouping, search: search }
            }),
            //tap(state => console.log(`Replacing state: ${JSON.stringify(state)}`))
        ).subscribe(state => history.replaceState(state, ""));

        const recipesList = document.createElement("div");
        search$.pipe(
            map(search => search.toLowerCase()),
            startWith(""),
            combineLatestWith(this.recipeRepository$),
            switchMap(([search, repository]) => repository.find(search)),
            combineLatestWith(grouping$),
            map(([recipes, grouping]) => {
                let groupingFunc = (recipe: Recipe) => "";
                let orderingFunc = (a: Recipe, b: Recipe) => a.name.localeCompare(b.name);
                switch (grouping) {
                    case "meat":
                        groupingFunc = recipe => recipe.meat;
                        orderingFunc = (a, b) => a.meat.localeCompare(b.meat);
                        break;
                    case "alphabetical":
                        groupingFunc = recipe => recipe.name[0];
                        break;
                    case "type":
                        groupingFunc = recipe => recipe.type || "Meal";
                        break;
                    case "duration":
                        groupingFunc = recipe => {
                            if (recipe.duration.min < 10) return "< 10 mins";
                            if (recipe.duration.min < 20) return "< 20 mins";
                            if (recipe.duration.min < 30) return "< 30 mins";
                            if (recipe.duration.min < 45) return "< 45 mins";
                            if (recipe.duration.min < 60) return "< 1 hour";
                            if (recipe.duration.min < 120) return "< 2 hours";
                            return "Unknown";
                        };
                        orderingFunc = (a, b) => (a.duration.min || 0) - (b.duration.min || 0);
                        break;
                }
                return orderedGroupArray(recipes.sort(orderingFunc), groupingFunc);
            }),
            map(groups => {
                for (const group of groups) {
                    group.items.sort(((a, b) => a.name.localeCompare(b.name)));
                }
                return groups;
            }),
            takeUntil(this.disconnected$)
        ).subscribe(groups => {
            let html = "";
            let num = 1;
            for (const group of groups) {
                html += `<h1><span>${group.group}</span></h1><ul>${group.items.map(recipe => `<li><a href="/recipe/${recipe.id}">${recipe.name}</a></li>`).join("")}</ul>`;
            };
            recipesList.innerHTML = html;
        });

        this.appendChild(filterElement);
        this.appendChild(recipesList);
    }
}