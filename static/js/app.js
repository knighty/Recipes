import RecipeRepository from "./recipe-repository.js";
import { observeScopedEvent, debounceAfterFirst, observeMouseMove } from "./utils.js";
import { readConfig } from "./config.js";
import { currentPage$, goToPage$ } from "./history.js";

const recipeRepository = new RecipeRepository();

const title$ = new rxjs.BehaviorSubject("Recipes");
title$.subscribe(title => document.title = title);

export default class App extends HTMLElement {
    genericRoute(element, title) {
        const view = document.createElement(element);
        return rxjs.Observable.create(observer => {
            title$.next(title);
            this.appendChild(view);
            observer.next(view);

            return () => view.saveState();
        }).pipe(
            rxjs.operators.finalize(_ => {
                view.classList.add("remove");
                setTimeout(() => this.removeChild(view), 500);
            })
        );
    }

    showRecipe(state, recipe) {
        return this.genericRoute("x-recipe", recipe.name).pipe(
            rxjs.operators.tap(view => view.showRecipe(recipe))
        );
    }

    showCatalogue(state) {
        return this.genericRoute("x-recipe-catalogue", "Recipe Catalogue").pipe(
            rxjs.operators.tap(view => {
                view.recipeRepository$.next(recipeRepository);
                view.setState(state);
            })
        );
    }

    connectedCallback() {
        const routes = [
            {
                route: /^\/$/,
                handler: (state) => this.showCatalogue(state)
            },
            {
                route: /^\/recipe\/([a-z0-9\-]*)$/,
                handler: (state, url, id) => recipeRepository.getById(id).pipe(
                    rxjs.operators.switchMap(recipe => this.showRecipe(state, recipe))
                )
            }
        ]

        const baseURI = document.location.origin;

        /*const clickedLink$ =
            rxjs.fromEvent(document, "click").pipe(
                rxjs.operators.filter(e => e.target.tagName == "A" && e.target.href.startsWith(baseURI)),
                rxjs.operators.tap(e => e.preventDefault()),
                rxjs.operators.map(e => e.target.href),
                rxjs.operators.tap(href => {
                    history.pushState({}, "", href);
                }),
                rxjs.operators.map(href => {
                    return {
                        uri: href.substr(baseURI.length),
                        state: null
                    }
                })
            );

        const poppedState$ = rxjs.fromEvent(window, "popstate").pipe(
            rxjs.operators.map(e => {
                return {
                    uri: document.location.pathname,
                    state: e.state
                }
            })
        );

        const startLocation$ = rxjs.of(window.location.pathname).pipe(
            rxjs.operators.map(href => {
                return {
                    uri: href,
                    state: null
                }
            })
        );

        rxjs.merge(clickedLink$, poppedState$, startLocation$).pipe(
            rxjs.operators.distinctUntilChanged(((a, b) => a.uri == b.uri)),
            rxjs.operators.map(e => {
                const path = e.uri;
                const state = e.state;

                console.log(`Navigating to "${path}" with "${JSON.stringify(state)}"`);

                for (let route of routes) {
                    const matches = route.route.exec(path);
                    if (matches) {
                        return route.handler(state, ...matches);
                    }
                }
                throw new Error(`Non matching route "${path}"`);
            }),
            rxjs.operators.switchMap(route => route)
        ).subscribe();*/

        const clickedLink$ =
            rxjs.fromEvent(document, "click").pipe(
                rxjs.operators.filter(e => e.target.tagName == "A" && e.target.href.startsWith(baseURI)),
                rxjs.operators.tap(e => e.preventDefault()),
                rxjs.operators.map(e => e.target.href),
                rxjs.operators.tap(href => goToPage$.next([href.substr(baseURI.length), {}]))
            );

        clickedLink$.subscribe();

        currentPage$.pipe(
            rxjs.operators.distinctUntilChanged(((a, b) => a.uri == b.uri)),
            rxjs.operators.map(e => {
                const path = e.uri;
                const state = e.state;

                console.log(`Navigating to "${path}" with "${JSON.stringify(state)}"`);

                for (let route of routes) {
                    const matches = route.route.exec(path);
                    if (matches) {
                        return route.handler(state, ...matches);
                    }
                }
                throw new Error(`Non matching route "${path}"`);
            }),
            rxjs.operators.switchMap(route => route)
        ).subscribe();

        observeScopedEvent(document, "click", "[data-timer]", true).pipe(
            rxjs.operators.map(([element, e]) => element.dataset.timer),
            rxjs.operators.filter(time => time !== undefined),
            rxjs.operators.map(time => parseInt(time)),
            rxjs.operators.switchMap(time => {
                const timer = document.createElement("x-timer");
                this.appendChild(timer);
                timer.setTimer(time);

                return rxjs.of(true);

                /*return timer.finished$.pipe(
                    rxjs.operators.first(),
                    rxjs.operators.finalize(() => this.removeChild(timer))
                )*/
            }),
        ).subscribe();

        readConfig("fontSize", 11).pipe(debounceAfterFirst(500)).subscribe(fontSize => document.documentElement.style.setProperty('--base-font-size', `${fontSize}pt`));

        /* rxjs.fromEvent(window, "hashchange").pipe(
            rxjs.operators.map(e => e.newURL),
            rxjs.operators.startWith(window.location.href),
            rxjs.operators.map(url => url.split("#")[1]),
            rxjs.operators.map(path => {
                for (let route of routes) {
                    const matches = route.route.exec(path);
                    if (matches) {
                        return route.handler(...matches);
                    }
                }
                throw new Error(`Non matching route "${path}"`);
            }),
            rxjs.operators.switchMap(route => route)
        ).subscribe();*/
    }
}