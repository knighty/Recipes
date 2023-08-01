import { Observable, ReplaySubject, Subject, distinctUntilChanged, empty, filter, fromEvent, interval, map, mapTo, merge, pairwise, scan, share, startWith, switchMap, takeUntil, tap, timer } from "rxjs";
import sounds from "./sounds";
import { observableToggle, observeMouseDown, observeMouseUp, observeShortLongPress } from "./utils";

export default class TimerView extends HTMLElement {
    disconnected$ = new Subject<void>();
    setTimer$ = new ReplaySubject<number>(1);
    addTime$ = new Subject<number>();
    setRunning$ = new ReplaySubject<boolean>(1);
    toggleRunning$ = new Subject<void>();
    reset$ = new Subject<void>();
    running$ = observableToggle(merge(this.setRunning$, this.reset$.pipe(mapTo(false))), this.toggleRunning$);

    timer$: Observable<number>;
    finished$: Observable<void>;

    sounds = {
        alarm: new Audio(sounds.alarm),
        click: new Audio(sounds.click),
    };

    constructor() {
        super();

        const oneSecondTimer$ = interval(1000).pipe(mapTo(-1));
        const setTimer$ = this.setTimer$.pipe(map(seconds => () => seconds));
        const resetTimer$ = this.reset$.pipe(map(() => () => 0));
        const countdownTimer$ = this.running$.pipe(switchMap(running => running ? oneSecondTimer$ : empty()));
        const modulateTimer$ = merge(countdownTimer$, this.addTime$).pipe(
            map(seconds => (current: number) => current + seconds)
        );
        this.timer$ = merge(modulateTimer$, setTimer$, resetTimer$).pipe(
            scan((a, c) => Math.max(0, c(a)), 0),
            distinctUntilChanged(),
            takeUntil(this.disconnected$),
            share()
        );

        this.finished$ = this.timer$.pipe(
            pairwise(),
            filter(([previous, current]) => (current == 0 && previous == 1)),
            tap(() => this.setRunning$.next(false)),
            map(() => null),
            share()
        );
    }

    setTimer(seconds: number) {
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

        const timerElement = this.querySelector<HTMLElement>("[data-element=time]");
        const stopButton = this.querySelector<HTMLElement>("[name=stop]");
        const stopText = this.querySelector<HTMLElement>("[data-element=startStop]");
        const add10sButton = this.querySelector<HTMLElement>("[name=add10s]");
        const add1minButton = this.querySelector<HTMLElement>("[name=add1min]");
        const closeButton = this.querySelector<HTMLElement>("[name=close]");

        const click = () => {
            //const a = new Audio('/static/sounds/click.mp3');
            //a.play();
            this.sounds.click.play();
        }

        const [shortPressStop$, longPressStop$] = observeShortLongPress(stopButton);

        const clickAdd10SecButton$ = observeMouseDown(add10sButton).pipe(
            switchMap(e => timer(500).pipe(
                switchMap(e => interval(200)),
                startWith(1),
                tap(click),
                takeUntil(observeMouseUp(add10sButton))
            ))
        );

        merge(
            this.timer$.pipe(
                startWith(0),
                map(seconds => {
                    const minutes = Math.floor(seconds / 60);
                    seconds -= minutes * 60;
                    return `${String(minutes).padStart(1, "0")}:${String(seconds).padStart(2, "0")}`;
                }),
                tap(time => timerElement.setAttribute("data-time", time))
            ),

            this.running$.pipe(tap(running => stopText.innerText = running ? "Stop" : "Start")),

            merge(
                fromEvent(add1minButton, "click").pipe(mapTo(60)),
                clickAdd10SecButton$.pipe(mapTo(10))
            ).pipe(
                tap(time => this.addTime$.next(time))
            ),

            shortPressStop$.pipe(tap(click), tap(() => this.toggleRunning$.next())),

            longPressStop$.pipe(tap(click), tap(() => this.reset$.next())),

            this.finished$.pipe(tap(() => this.sounds.alarm.play())),

            fromEvent(closeButton, "click").pipe(
                tap(() => this.parentNode.removeChild(this))
            )
        ).pipe(takeUntil(this.disconnected$)).subscribe();

    }

    disconnectedCallback() {
        console.log("disconnected");
        this.disconnected$.next();
    }
}