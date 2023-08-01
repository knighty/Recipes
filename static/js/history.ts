import { Subject, filter, fromEvent, map, merge, of, pairwise, shareReplay, startWith, tap } from "rxjs";

export const goToPage$ = new Subject();
export const replaceState$ = new Subject();

class StateEvent {
    type: string;
    uri: string;
    state: { [Key: string]: any };
}

const stateEvent$ = merge(
    of(window.location.pathname).pipe(
        map(href => ({ type: "start", uri: href, state: null }))
    ),
    goToPage$.pipe(
        tap(([uri, state]) => history.pushState(state, "", uri)),
        map(([uri, state]) => ({ type: "push", uri, state }))
    ),
    /*replaceState$.pipe(
        map(state => ({ type: "replace", state })),
    ),*/
    fromEvent<PopStateEvent>(window, "popstate").pipe(
        map(e => ({ type: "pop", uri: document.location.pathname, state: e.state })), tap(() => console.log("popped"))
    ),
);

/*export const history$ = stateEvent$.pipe(
    scan((a, c) => {
        switch (c.type) {
            case "start":
                a.push(c);
                break;

            case "push":
                //history.pushState(c.state, "", c.uri);
                a.push(c);
                break;

            case "pop":
                a.pop();
                break;

            case "replace":
                a[a.length - 1].state = c.state;
                history.replaceState(c.state);
                break;
        }

        return a;
    }, []),
    tap(console.log),
    shareReplay(1)
);*/

export const history$ = stateEvent$.pipe(
    startWith(null),
    //filter(e => e.uri),
    pairwise(),
    //tap(console.log),
    shareReplay(1)
);

export const currentPage$ = history$.pipe(
    map(([a, b]) => b)
);

export const previousPage$ = history$.pipe(
    map(([a, b]) => a),
    filter(a => a != null)
);

export function observePreviousPage(uri: string) {
    return previousPage$.pipe(
        map(previous => previous.uri == uri),
        startWith(false)
    );
}

history$.subscribe();