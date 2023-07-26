export const goToPage$ = new rxjs.Subject();
export const replaceState$ = new rxjs.Subject();

const stateEvent$ = rxjs.merge(
    rxjs.of(window.location.pathname).pipe(
        rxjs.operators.map(href => ({ type: "start", uri: href, state: null }))
    ),
    goToPage$.pipe(
        rxjs.operators.tap(([uri, state]) => history.pushState(state, "", uri)),
        rxjs.operators.map(([uri, state]) => ({ type: "push", uri, state }))
    ),
    replaceState$.pipe(
        rxjs.operators.map(state => ({ type: "replace", state })),
    ),
    rxjs.fromEvent(window, "popstate").pipe(
        rxjs.operators.map(e => ({ type: "pop", uri: document.location.pathname, state: e.state })), rxjs.operators.tap(() => console.log("popped"))
    ),
);

/*export const history$ = stateEvent$.pipe(
    rxjs.operators.scan((a, c) => {
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
    rxjs.operators.tap(console.log),
    rxjs.operators.shareReplay(1)
);*/

export const history$ = stateEvent$.pipe(
    rxjs.operators.startWith(null),
    //rxjs.operators.filter(e => e.uri),
    rxjs.operators.pairwise(),
    //rxjs.operators.tap(console.log),
    rxjs.operators.shareReplay(1)
);

export const currentPage$ = history$.pipe(
    rxjs.operators.map(([a, b]) => b)
);

export const previousPage$ = history$.pipe(
    rxjs.operators.map(([a, b]) => a),
    rxjs.operators.filter(a => a)
);

export function observePreviousPage(uri) {
    return previousPage$.pipe(
        rxjs.operators.map(previous => previous.uri == uri),
        rxjs.operators.startWith(false)
    );
}

history$.subscribe();