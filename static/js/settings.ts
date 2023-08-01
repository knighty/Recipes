import { Subject, defer, distinctUntilChanged, fromEvent, merge, switchMap, takeUntil, tap, timer } from "rxjs";
import { config, readConfig, setConfig } from "./config";
import css from "./css";
import { appendChildren, createElement, observableToggle, observeInput, removeChildren, setChildren } from "./utils";
import { voices$, selectedVoice$ } from "./voice";
import { StringDictionary } from "./types";

export default class SettingsView extends HTMLElement {
    disconnected$ = new Subject<void>();
    toggleVisible$ = new Subject<void>();
    setVisible$ = new Subject<boolean>();

    constructor() {
        super();
    }

    toggle() {
        this.toggleVisible$.next();
    }

    disconnectedCallback() {
        this.disconnected$.next();
    }

    connectedCallback() {
        const dialog = this.querySelector("dialog");
        const styleElement = document.getElementById("stylesheet") as HTMLLinkElement;

        const themeSelector = this.querySelector<HTMLSelectElement>("[name=theme]");
        const themeSelector$ = observeInput(themeSelector);

        const themes: StringDictionary = {
            default: css.style,
            simple: css.dark,
        }

        const show$ = defer(() => {
            dialog.showModal();
            return timer(1).pipe(tap(() => dialog.classList.toggle("showing", true)));
        });
        const hide$ = defer(() => {
            dialog.classList.toggle("showing", false);
            return fromEvent(dialog, "transitionend").pipe(tap(() => dialog.close()));
        });
        observableToggle(this.setVisible$, this.toggleVisible$, false).pipe(
            distinctUntilChanged(),
            switchMap(visible => visible ? show$ : hide$)
        ).subscribe();

        merge(themeSelector$, readConfig("theme", "default")).pipe(
            tap(theme => themeSelector.value = theme),
            takeUntil(this.disconnected$)
        ).subscribe(theme => {
            setConfig("theme", theme);
            styleElement.href = themes[theme];
        });

        const voiceSelect = this.querySelector<HTMLSelectElement>("[name=voice]");
        voices$.pipe(
            tap(voices => setChildren(voiceSelect, ...voices.map(voice => createElement("option", {
                text: voice.name,
                value: voice.voiceURI,
                data: { lang: voice.lang, name: voice.name }
            }))))
        ).subscribe();

        selectedVoice$.subscribe(voice => voiceSelect.value = voice.voiceURI);

        observeInput(voiceSelect).subscribe(voice => setConfig("voice", voice));

        for (let element of document.querySelectorAll<HTMLElement>("[data-config]")) {
            const configName = element.dataset.config;
            const def = element.dataset.default;
            /*if (element instanceof HTMLInputElement) {
                readConfig(configName, def).subscribe(v => element.value = v);
                observeInput(element).subscribe(v => setConfig(configName, v));    
            }
            readConfig(configName, def).subscribe(v => element.value = v);
            observeInput(element).pipe(
                map(value => (element.type == "checkbox" ? element.checked : value))
            ).subscribe(v => setConfig(configName, v));*/
        }

        observeInput(this.querySelector("[name=close]"), "click").subscribe(e => this.setVisible$.next(false));
        fromEvent(dialog, "cancel").subscribe(e => {
            e.preventDefault();
            this.setVisible$.next(false)
        });

        this.querySelector<HTMLTextAreaElement>("[name=sources]").value = config.sources.join("\n");
    }
}