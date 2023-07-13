export default class RecipeCatalogueView extends HTMLElement {
    constructor() {
        super();
        this.selectRecipe$ = new rxjs.ReplaySubject(1);
        this.grouping$ = new rxjs.BehaviorSubject("meat");
        this.search$ = new rxjs.BehaviorSubject("");
        this.name$ = new rxjs.BehaviorSubject("");
        this.disconnected$ = new rxjs.ReplaySubject(1);
        this.recipeRepository$ = new rxjs.ReplaySubject(1);
    }

    disconnectedCallback() {
        this.disconnected$.next();
    }

    connectedCallback() {
        this.innerHTML = "";

        const filter = document.createElement("div");
        filter.className = "filter";
        filter.innerHTML = `
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

        const recipesList = document.createElement("div");
        this.search$.pipe(
            rxjs.operators.map(search => search.toLowerCase()),
            rxjs.operators.debounceTime(300),
            rxjs.operators.startWith(""),
            rxjs.operators.combineLatest(this.recipeRepository$),
            rxjs.operators.switchMap(([search, repository]) => repository.find(search)),
            rxjs.operators.combineLatest(this.grouping$, (recipes, grouping) => {
                const groups = {};
                let groupingFunc = () => "";
                let orderingFunc = (a, b) => a.name.localeCompare(b.name);
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
                            if (recipe.duration < 10) return "< 10 mins";
                            if (recipe.duration < 20) return "< 20 mins";
                            if (recipe.duration < 30) return "< 30 mins";
                            if (recipe.duration < 45) return "< 45 mins";
                            if (recipe.duration < 60) return "< 1 hour";
                            if (recipe.duration < 120) return "< 2 hours";
                            return "Unknown";
                        };
                        orderingFunc = (a, b) => (a.duration || 0) - (b.duration || 0);
                        break;
                }
                const sortedRecipes = recipes.sort(orderingFunc);
                let id = 0;
                for (let recipe of sortedRecipes) {
                    groups[groupingFunc(recipe)] ??= { recipes: [], name: groupingFunc(recipe), id: id++ };
                    groups[groupingFunc(recipe)].recipes.push(recipe);
                }
                return groups;
            }),
            rxjs.operators.map(groups => {
                for (const group in groups) {
                    groups[group].recipes.sort(((a, b) => a.name.localeCompare(b.name)));
                }
                const sortedGroups = Object.values(groups).sort((a, b) => a.id - b.id);
                return sortedGroups;
            }),
            rxjs.operators.takeUntil(this.disconnected$)
        ).subscribe(groups => {
            let html = "";
            let num = 1;
            for (const group of groups) {
                html += `<h1><span>${group.name}</span></h1><ul>${group.recipes.map(recipe => `<li><a href="/recipe/${recipe.id}">${recipe.name}</a></li>`).join("")}</ul>`;
            };
            recipesList.innerHTML = html;
        });

        this.appendChild(filter);
        this.appendChild(recipesList);

        const groupingSelect = filter.querySelector(`[name="grouping"]`);
        const searchInput = filter.querySelector(`[name="search"]`);

        this.grouping$.pipe(rxjs.operators.takeUntil(this.disconnected$)).subscribe(grouping => groupingSelect.value = grouping);
        this.search$.pipe(rxjs.operators.takeUntil(this.disconnected$)).subscribe(search => searchInput.value = search);

        rxjs.fromEvent(groupingSelect, "input").pipe(
            rxjs.operators.takeUntil(this.disconnected$),
        ).subscribe(grouping => this.grouping$.next(grouping.target.value));

        rxjs.fromEvent(searchInput, "input").pipe(
            rxjs.operators.takeUntil(this.disconnected$),
        ).subscribe(e => this.search$.next(e.target.value));

        rxjs.fromEvent(this, "click").pipe(
            rxjs.operators.map(e => e.target.dataset.recipe),
            rxjs.operators.filter(recipe => recipe),
            rxjs.operators.takeUntil(this.disconnected$),
        ).subscribe(recipe => this.selectRecipe$.next(recipe));
    }
}