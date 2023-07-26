import { config, readConfig, setConfig } from "./config.js";
import { appendChildren, createElement, observableToggle, observeInput, removeChildren } from "./utils.js";
import { voices$, selectedVoice$ } from "./voice.js";

export default class SettingsView extends HTMLElement {
    constructor() {
        super();
        this.disconnected$ = new rxjs.Subject();
        this.toggleVisible$ = new rxjs.Subject();
        this.setVisible$ = new rxjs.Subject();
    }

    toggle() {
        this.toggleVisible$.next();
    }

    disconnectedCallback() {
        this.disconnected$.next();
    }

    connectedCallback() {
        const dialog = this.querySelector("dialog");
        const styleElement = document.getElementById("stylesheet");

        const themeSelector = this.querySelector("[name=theme]");
        const themeSelector$ = rxjs.fromEvent(themeSelector, "input").pipe(rxjs.operators.map(e => e.target.value));

        const themes = {
            default: "/static/css/style.css",
            simple: "/static/css/dark.css",
        }

        const show$ = rxjs.defer(() => {
            dialog.showModal();
            return rxjs.timer(1).pipe(rxjs.operators.tap(() => dialog.classList.toggle("showing", true)));
        });
        const hide$ = rxjs.defer(() => {
            dialog.classList.toggle("showing", false);
            return rxjs.fromEvent(dialog, "transitionend").pipe(rxjs.operators.tap(() => dialog.close()));
        });
        observableToggle(this.setVisible$, this.toggleVisible$, false).pipe(
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.switchMap(visible => visible ? show$ : hide$)
        ).subscribe();

        rxjs.merge(themeSelector$, readConfig("theme", "default")).pipe(
            rxjs.operators.tap(theme => themeSelector.value = theme),
            rxjs.operators.takeUntil(this.disconnected$)
        ).subscribe(theme => {
            setConfig("theme", theme);
            styleElement.href = themes[theme];
        });

        const voiceSelect = this.querySelector("[name=voice]");
        voices$.pipe(
            rxjs.operators.tap(voices => {
                removeChildren(voiceSelect);
                appendChildren(voiceSelect, ...voices.map(voice => createElement("option", {
                    text: voice.name,
                    value: voice.voiceURI,
                    attributes: { "data-lang": voice.lang, "data-name": voice.name }
                })))
            })
        ).subscribe();

        selectedVoice$.subscribe(([index, voice]) => {
            voiceSelect.value = voice.voiceURI;
        });

        observeInput(voiceSelect).subscribe(voice => setConfig("voice", voice));

        for (let element of document.querySelectorAll("[data-config]")) {
            const configName = element.dataset.config;
            const def = element.dataset.default;
            readConfig(configName, def).subscribe(v => element.value = v);
            observeInput(element).pipe(
                rxjs.operators.map(value => (element.type == "checkbox" ? element.checked : value))
            ).subscribe(v => setConfig(configName, v));
        }

        //readConfig("fontSize", 11).subscribe(fontSize => this.querySelector("[name=font-size]").value = fontSize);
        //observeInput(this.querySelector("[name=font-size]")).subscribe(fontSize => setConfig("fontSize", fontSize));

        observeInput(this.querySelector("[name=close]"), "click").subscribe(e => this.setVisible$.next());
        rxjs.fromEvent(dialog, "cancel").subscribe(e => {
            e.preventDefault();
            this.setVisible$.next(false)
        });

        this.querySelector("[name=sources]").value = config.sources.join("\n");
    }
}