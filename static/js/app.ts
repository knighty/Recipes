import RecipeRepository from "./recipe-repository";
import { observeScopedEvent, debounceAfterFirst, pluckEventTarget } from "./utils";
import { readConfig } from "./config";
import { currentPage$, goToPage$ } from "./history";
import { BehaviorSubject, EMPTY, Observable, distinctUntilChanged, empty, filter, finalize, fromEvent, map, of, switchMap, tap } from "rxjs";
import RecipeView from "./pages/recipe";
import RecipeCatalogueView from "./pages/catalogue";
import TimerView from "./timer";
import PageView from "./pages/page";
import { Recipe } from "./recipe";

const recipeRepository = new RecipeRepository();

const title$ = new BehaviorSubject("Recipes");
title$.subscribe(title => document.title = title);

class StateObject {
    [Key: string]: any
};

class Route {
    test: RegExp;
    handler: (state: StateObject, ...params: string[]) => Observable<PageView>;
}

export default class App extends HTMLElement {
    genericRoute<T extends PageView>(element: string, title?: string): Observable<T> {
        const view = (document.createElement(element) as T);
        const o = new BehaviorSubject(view);
        return o.pipe(
            tap(view => {
                title$.next(title);
                this.appendChild(view);
            }),
            finalize(() => {
                view.saveState();
                view.classList.add("remove");
                setTimeout(() => this.removeChild(view), 500);
            })
        );
    }

    showRecipe(state: StateObject, recipe: Recipe) {
        return this.genericRoute<RecipeView>("x-recipe", recipe.name).pipe(
            tap(view => view.showRecipe(recipe))
        );
    }

    showCatalogue(state: StateObject) {
        return this.genericRoute<RecipeCatalogueView>("x-recipe-catalogue", "Recipe Catalogue").pipe(
            tap(view => {
                view.recipeRepository$.next(recipeRepository);
                view.setState(state);
            })
        );
    }

    connectedCallback() {
        let routes: Route[] = [
            {
                test: /^\/$/,
                handler: (state: StateObject) => this.showCatalogue(state)
            },
            {
                test: /^\/recipe\/([a-z0-9\-]*)$/,
                handler: (state: StateObject, url: string, id: string) => recipeRepository.findById(id).pipe(
                    switchMap(recipe => this.showRecipe(state, recipe))
                )
            }
        ];

        const baseURI = document.location.origin;

        function fromEventTarget<T>(element: EventTarget, eventName: string): Observable<[Event, T]> {
            return fromEvent<Event>(element, eventName).pipe(
                map(e => [e, e.target as T])
            );
        }

        const clickedLink$ =
            fromEventTarget<HTMLAnchorElement>(document, "click").pipe(
                filter(([e, target]) => target.tagName == "A" && target.href.startsWith(baseURI)),
                tap(([e, target]) => e.preventDefault()),
                map(([e, target]) => target.href),
                tap(href => goToPage$.next([href.substring(baseURI.length), {}]))
            );

        clickedLink$.subscribe();

        currentPage$.pipe(
            distinctUntilChanged(((a, b) => a.uri == b.uri)),
            map(e => {
                const path = e.uri;
                const state = e.state;

                console.log(`Navigating to "${path}" with "${JSON.stringify(state)}"`);

                for (let route of routes) {
                    const matches = route.test.exec(path);
                    if (matches) {
                        return route.handler(state, ...matches);
                    }
                }
                throw new Error(`Non matching route "${path}"`);
            }),
            switchMap(route => route)
        ).subscribe();

        observeScopedEvent(document, "click", "[data-timer]", { capture: true }).pipe(
            pluckEventTarget(),
            map(element => element.dataset.timer),
            filter(time => time !== undefined),
            map(time => parseInt(time)),
            switchMap(time => {
                const timer = new TimerView();
                this.appendChild(timer);
                timer.setTimer(time);

                return EMPTY;

                /*return timer.finished$.pipe(
                    rxjs.operators.first(),
                    rxjs.operators.finalize(() => this.removeChild(timer))
                )*/
            }),
        ).subscribe();

        readConfig("fontSize", 11).pipe(debounceAfterFirst(500)).subscribe(fontSize => document.documentElement.style.setProperty('--base-font-size', `${fontSize}pt`));
    }
}