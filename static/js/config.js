export const config = {
    sources: [
        "/recipes.txt",
        "/recipes-chicken.txt"
    ],
}

const setConfigValue$ = new rxjs.Subject();

const localStorageUpdated$ = rxjs.fromEvent(window, "storage").pipe(
    rxjs.operators.filter(e => e.key == "config")
);

export const localConfig$ = localStorageUpdated$.pipe(
    rxjs.operators.startWith(true),
    rxjs.operators.map(() => localStorage.getItem("config")),
    rxjs.operators.map(str => str ? JSON.parse(str) : {}),
    rxjs.operators.switchMap(config => {
        return setConfigValue$.pipe(
            rxjs.operators.tap(([key, value]) => {
                //console.log(`Set ${key} to ${value}`);
                config[key] = value;
                localStorage.setItem("config", JSON.stringify(config))
            }),
            rxjs.operators.startWith(config),
            rxjs.operators.mapTo(config)
        )
    }),
    rxjs.operators.shareReplay(1)
);

localConfig$.subscribe();

export function setConfig(key, value) {
    setConfigValue$.next([key, value]);
}

export function readConfig(key, def) {
    return localConfig$.pipe(
        rxjs.operators.map(config => config[key] ?? undefined),
        rxjs.operators.map(value => value === undefined ? def : value),
        rxjs.operators.distinctUntilChanged()
    );
}