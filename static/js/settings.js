import { setConfig } from "./config.js";
import { observeInput } from "./utils.js";
import { voices$, selectedVoice$ } from "./voice.js";

export default class SettingsView extends HTMLElement {
    constructor() {
        super();
        this.disconnected$ = new rxjs.Subject();
        this.toggleVisible$ = new rxjs.Subject();
        this.visible$ = new rxjs.BehaviorSubject(false);
    }

    toggle() {
        this.toggleVisible$.next();
    }

    disconnectedCallback() {
        this.disconnected$.next();
    }

    connectedCallback() {
        rxjs.merge(this.visible$, this.toggleVisible$).pipe(
            rxjs.operators.scan((a, c) => c === undefined ? !a : c),
            rxjs.operators.tap(() => this.classList.toggle("visible", true)),
            rxjs.operators.delay(1),
            rxjs.operators.tap(visible => this.classList.toggle("showing", visible)),
            rxjs.operators.switchMap(visible => visible ? rxjs.of(true) : rxjs.timer(500).pipe(rxjs.operators.mapTo(false))),
            rxjs.operators.tap(visible => this.classList.toggle("visible", visible)),
        ).subscribe();

        const styleElement = document.getElementById("stylesheet");

        const themeSelector = this.querySelector("[name=theme]");
        const themeSelector$ = rxjs.fromEvent(themeSelector, "input").pipe(
            rxjs.operators.map(e => e.target.value),
            rxjs.operators.tap(console.log)
        );

        const themes = {
            default: "/static/css/style.css",
            simple: "/static/css/simple.css",
        }

        themeSelector$.pipe(
            rxjs.operators.startWith("default"),
            rxjs.operators.tap(theme => themeSelector.value = theme),
            rxjs.operators.takeUntil(this.disconnected$)
        ).subscribe(theme => styleElement.href = themes[theme]);

        const voiceSelect = this.querySelector("[name=voice]");
        voices$.pipe(
            rxjs.operators.tap(voices => {
                voiceSelect.innerHTML = "";
                for (let i = 0; i < voices.length; i++) {
                    const option = document.createElement("option");
                    option.textContent = `${voices[i].name}`;

                    if (voices[i].default) {
                        option.textContent += "";
                    }

                    option.value = voices[i].voiceURI;
                    option.setAttribute("data-lang", voices[i].lang);
                    option.setAttribute("data-name", voices[i].name);
                    voiceSelect.appendChild(option);
                }
            })
        ).subscribe();

        selectedVoice$.subscribe(([index, voice]) => {
            voiceSelect.value = voice.voiceURI;
        });

        observeInput(voiceSelect, "input").subscribe(voice => setConfig("voice", voice));

        observeInput(this.querySelector("[name=close]"), "click").subscribe(e => this.toggle());
    }
}