import RecipeRepository from "./recipe-repository.js";

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
        }).pipe(
            rxjs.operators.finalize(_ => {
                view.classList.add("remove");
                setTimeout(() => this.removeChild(view), 500);
            })
        );
    }

    showRecipe(recipe) {
        return this.genericRoute("x-recipe", recipe.name).pipe(
            rxjs.operators.tap(view => view.showRecipe(recipe))
        );
    }

    showCatalogue() {
        return this.genericRoute("x-recipe-catalogue", "Recipe Catalogue").pipe(
            rxjs.operators.tap(view => view.recipeRepository$.next(recipeRepository))
        );
    }

    connectedCallback() {
        const routes = [
            {
                route: /^\/$/,
                handler: () => this.showCatalogue()
            },
            {
                route: /^\/recipe\/([a-z0-9\-]*)$/,
                handler: (url, id) => recipeRepository.getById(id).pipe(
                    rxjs.operators.switchMap(recipe => this.showRecipe(recipe))
                )
            }
        ]

        const baseURI = document.location.origin;

        const clickedLink$ =
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
                for (let route of routes) {
                    const matches = route.route.exec(path);
                    if (matches) {
                        return route.handler(...matches);
                    }
                }
                throw new Error(`Non matching route "${path}"`);
            }),
            rxjs.operators.switchMap(route => route)
        ).subscribe();

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