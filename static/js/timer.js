import { observableToggle, observeMouseDown, observeMouseUp, observeShortLongPress } from "./utils.js";

export default class TimerView extends HTMLElement {
    constructor() {
        super();
        this.disconnected$ = new rxjs.Subject();

        this.setTimer$ = new rxjs.ReplaySubject(1);
        this.addTime$ = new rxjs.Subject();

        this.setRunning$ = new rxjs.ReplaySubject(1);
        this.toggleRunning$ = new rxjs.Subject();
        this.reset$ = new rxjs.Subject();
        this.running$ = observableToggle(rxjs.merge(this.setRunning$, this.reset$.pipe(rxjs.operators.mapTo(false))), this.toggleRunning$);

        const oneSecondTimer$ = rxjs.interval(1000).pipe(rxjs.operators.mapTo(-1));
        const setTimer$ = this.setTimer$.pipe(rxjs.operators.map(seconds => () => seconds));
        const resetTimer$ = this.reset$.pipe(rxjs.operators.map(() => () => 0));
        const countdownTimer$ = this.running$.pipe(rxjs.operators.switchMap(running => running ? oneSecondTimer$ : rxjs.empty()));
        const modulateTimer$ = rxjs.merge(countdownTimer$, this.addTime$).pipe(
            rxjs.operators.map(seconds => current => current + seconds)
        );
        this.timer$ = rxjs.merge(modulateTimer$, setTimer$, resetTimer$).pipe(
            rxjs.operators.scan((a, c) => Math.max(0, c(a)), 0),
            rxjs.operators.distinctUntilChanged(),
            rxjs.operators.takeUntil(this.disconnected$),
            rxjs.operators.share()
        );

        this.finished$ = this.timer$.pipe(
            rxjs.operators.pairwise(),
            rxjs.operators.filter(([previous, current]) => (current == 0 && previous == 1)),
            rxjs.operators.tap(() => this.setRunning$.next(false)),
            rxjs.operators.share()
        );

        this.sounds = {
            alarm: new Audio('/static/sounds/alarm.wav'),
            click: new Audio('/static/sounds/click.mp3'),
        };
    }

    setTimer(seconds) {
        seconds = 5;
        this.setTimer$.next(seconds);
        this.setRunning$.next(true);
    }

    connectedCallback() {
        this.innerHTML = `
            <span class="time" data-element="time"></span>
            <button name="stop">
                <span data-element="startStop">Stop</span>
                <span>Reset</span>
            </button>
            <button name="add10s">10s</button>
            <button name="add1min">1m</button>
            <button name="close">X</button>
        `;

        const timerElement = this.querySelector("[data-element=time]");
        const stopButton = this.querySelector("[name=stop]");
        const stopText = this.querySelector("[data-element=startStop]");
        const add10sButton = this.querySelector("[name=add10s]");
        const add1minButton = this.querySelector("[name=add1min]");
        const closeButton = this.querySelector("[name=close]");

        const click = () => {
            //const a = new Audio('/static/sounds/click.mp3');
            //a.play();
            this.sounds.click.play();
        }

        const [shortPressStop$, longPressStop$] = observeShortLongPress(stopButton);

        const clickAdd10SecButton$ = observeMouseDown(add10sButton).pipe(
            rxjs.operators.switchMap(e => rxjs.timer(500).pipe(
                rxjs.operators.switchMap(e => rxjs.interval(200)),
                rxjs.operators.startWith(1),
                rxjs.operators.tap(click),
                rxjs.operators.takeUntil(observeMouseUp(add10sButton))
            ))
        );

        rxjs.merge(
            this.timer$.pipe(
                rxjs.operators.startWith(0),
                rxjs.operators.map(seconds => {
                    const minutes = Math.floor(seconds / 60);
                    seconds -= minutes * 60;
                    return `${String(minutes).padStart(1, "0")}:${String(seconds).padStart(2, "0")}`;
                }),
                rxjs.operators.tap(time => timerElement.setAttribute("data-time", time))
            ),

            this.running$.pipe(rxjs.operators.tap(running => stopText.innerText = running ? "Stop" : "Start")),

            rxjs.merge(
                rxjs.fromEvent(add1minButton, "click").pipe(rxjs.operators.mapTo(60)),
                clickAdd10SecButton$.pipe(rxjs.operators.mapTo(10))
            ).pipe(
                rxjs.operators.tap(time => this.addTime$.next(time))
            ),

            shortPressStop$.pipe(
                rxjs.operators.tap(click),
                rxjs.operators.tap(() => this.toggleRunning$.next(false))
            ),

            longPressStop$.pipe(
                rxjs.operators.tap(click),
                rxjs.operators.tap(() => this.reset$.next())
            ),

            this.finished$.pipe(
                rxjs.operators.tap(() => {
                    this.sounds.alarm.play();
                })
            ),

            rxjs.fromEvent(closeButton, "click").pipe(
                rxjs.operators.tap(() => this.parentNode.removeChild(this))
            )
        ).pipe(rxjs.operators.takeUntil(this.disconnected$)).subscribe();

    }

    disconnectedCallback() {
        console.log("disconnected");
        this.disconnected$.next();
    }
}