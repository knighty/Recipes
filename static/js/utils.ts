import { MonoTypeOperatorFunction, Observable, OperatorFunction, concat, connect, debounceTime, exhaustMap, filter, first, fromEvent, map, mapTo, merge, partition, race, scan, shareReplay, single, startWith, take, timer, takeUntil } from "rxjs";
import { AnyDictionary, StringDictionary } from "./types";

export const escapeHtml = (unsafe: string) => {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export type InputEvents = {
    input: InputEvent;
    change: InputEvent;
}

export type MouseEvents = {
    click: MouseEvent;
    mousedown: MouseEvent;
    mouseup: MouseEvent;
    mousemove: MouseEvent;
}

export type TouchEvents = {
    touchstart: TouchEvent;
    touchend: TouchEvent;
}

export type StorageEvents = {
    storage: StorageEvent;
}

export type StateEvents = {
    popstate: PopStateEvent;
}

export type Events = InputEvents & MouseEvents & TouchEvents & StorageEvents & StateEvents;

type ScopedEventOptions<T> = {
    /**
     * @prop Whether the event should be captured during the top down DOM traversal pass
     */
    capture: boolean,
    /**
     * @prop Whether the event should stop propagating after it's caught
     */
    stopPropagation: boolean,
    /**
     * @prop Whether the default behaviour of the event should be cancelled when it's caught
     */
    preventDefault: boolean,
    /**
     * Callback to check whether the event should be captured or not
     * @param e The captured event
     * @returns 
     */
    filterEvents: (e: T) => boolean
}

function ScopedEventOptionsDefaults<T>({
    capture = false,
    stopPropagation = true,
    preventDefault = true,
}: Partial<ScopedEventOptions<T>> = {}) {
    return { capture, stopPropagation, preventDefault };
}

/**
 * Observe an event emitted from the scoped element's children
 * @param scopedElement The parent element to watch for events
 * @param event Event to watch for
 * @param selector CSS selector for child elements to watch
 * @param options
 */
export function observeScopedEvent<T extends keyof Events>(scopedElement: Node, event: T, selector: string, options?: Partial<ScopedEventOptions<Events[T]>>): Observable<Events[T]> {
    options = ScopedEventOptionsDefaults(options);
    return fromEvent<Events[T]>(scopedElement, event, { capture: options?.capture ?? false }).pipe(
        map(e => {
            if (options?.filterEvents && !options.filterEvents(e)) {
                return null;
            }
            let element = e.target as HTMLElement;
            do {
                if (element.matches(selector)) {
                    if (options.stopPropagation)
                        e.stopPropagation();
                    if (options.preventDefault)
                        e.preventDefault();
                    return e;
                }
                element = element.parentNode as HTMLElement;
            } while (element != scopedElement && element != null);
            return null;
        }),
        filter(e => e != null)
    );
}

/**
 * Observe a DOM event
 * @param element Element to observe
 * @param event Event to observe
 */
export function fromDomEvent<E extends EventTarget, T extends keyof Events>(element: E, event: T) {
    return fromEvent<Events[T]>(element, event);
}

/**
 * Plucks the target out of an event
 */
export function pluckEventTarget<R extends HTMLElement>(): OperatorFunction<Event, R> {
    return map((e: Event) => e.target as R);
}

type ValueElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Observe an input element's value as it changes
 */
export function observeInput<T extends keyof InputEvents>(element: ValueElement, event: T = ("input" as T)): Observable<string> {
    return fromEvent<T>(element, event).pipe(map(e => element.value));
}

export function observableToggle(setter$: Observable<boolean>, toggler$: Observable<void>, start: boolean = false): Observable<boolean> {
    return merge(
        setter$.pipe(startWith(start), map(set => (current: boolean) => set)),
        toggler$.pipe(map(() => (current: boolean) => !current)),
    ).pipe(
        scan((a, c) => c(a), false),
        shareReplay(1)
    );
}

/**
 * Groups an array based on the result of the grouping function
 * @param array 
 * @param groupingFunction Should return a string for which group the array item is in
 */
export function groupArray<T>(array: T[], groupingFunction: (o: T) => string) {
    const groups: Record<string, T[]> = {};

    for (let item of array) {
        let g = groupingFunction(item);
        groups[g] = groups[g] || [];
        groups[g].push(item);
    }

    return groups;
}

/**
 * Groups an array based on the result of the grouping function. Also orders the resultant groups by name
 * @param array 
 * @param groupingFunction Should return a string for which group the array item is in
 * @returns 
 */
export function orderedGroupArray<T>(array: T[], groupingFunction: (o: T) => string) {
    type Group = {
        group: string,
        items: T[]
    };

    const groups: Record<string, Group> = {};
    for (let item of array) {
        let g = groupingFunction(item);
        groups[g] = groups[g] || { group: g, items: [] };
        groups[g].items.push(item);
    }

    return Object.values(groups).sort((a, b) => a.group.localeCompare(b.group));
}

export function observeMouseDown(element: HTMLElement, leftClick: boolean = true) {
    return merge(
        fromDomEvent(element, "mousedown").pipe(filter(e => (leftClick == false || e.button == 0))),
        fromDomEvent(element, "touchstart")
    );
}

export function observeMouseUp(element: HTMLElement) {
    return merge(
        fromDomEvent(element, "mouseup"),
        //fromEvent(element, "touchend")
    );
}

/**
 * Observe a short or long press on an element. Returns a tuple of the short and long press observables
 * @param element 
 * @param longPressSeconds How long the element must be held to trigger a long press
 */
export function observeShortLongPress(element: HTMLElement, longPressSeconds: number = 500) {
    const up$ = race(
        timer(longPressSeconds).pipe(map(() => true)),
        observeMouseUp(element).pipe(map(() => false)),
    ).pipe(
        takeUntil(observeMouseMovedThreshold(element)),
        first()
    );

    return partition(observeMouseDown(element).pipe(
        exhaustMap(() => up$),
    ), longPress => !longPress);
}

/**
 * Programatically create an html element
 * @param type 
 * @param params 
 * @returns 
 */
export function createElement<T extends HTMLElement>(type: string, params: Partial<{
    classes: string[];
    text: string;
    attributes: Record<string, string>;
    data: Record<string, any>;
    value: string;
}>): T {
    const element = document.createElement(type);
    if (params.classes) {
        element.classList.add(...params.classes);
    }
    if (params.text) {
        element.innerText = params.text;
        element.textContent = params.text;
    }
    if (params.attributes) {
        for (let attr in params.attributes) {
            element.setAttribute(attr, params.attributes[attr]);
        }
    }
    if (params.data) {
        for (let data in params.data) {
            element.dataset[data] = params.data[data];
        }
    }
    if (params.value) {
        if ("value" in element) {
            element.value = params.value;
        } else {
            throw new SyntaxError(`Value was provided for an element without a value`);
        }
    }
    return element as T;
}

export function appendChildren(element: HTMLElement, ...children: HTMLElement[]) {
    for (let child of children) {
        element.appendChild(child);
    }
}

export function setChildren(element: HTMLElement, ...children: HTMLElement[]) {
    removeChildren(element);
    appendChildren(element, ...children);
}

export function removeChildren(element: HTMLElement, filterFn?: (element: HTMLElement) => boolean) {
    for (let i = element.childNodes.length - 1; i >= 0; i++) {
        if (filterFn) {
            if (!filterFn(element))
                continue;
        }
        element.removeChild(element.childNodes[i]);
    }
}

export function debounceAfterFirst<T>(time: number, num: number = 1): MonoTypeOperatorFunction<T> {
    return connect(value =>
        concat(
            value.pipe(take(num)),
            value.pipe(debounceTime(time))
        )
    )
}

/**
 * Observe the mouse position
 * @param element Element to calculate the position relative to. Can be empty for global position
 */
export function observeMousePosition(element?: HTMLElement) {
    return fromDomEvent(element ?? document.documentElement, "mousemove").pipe(
        map(e => ({
            x: e.pageX - element?.offsetLeft ?? 0,
            y: e.pageY - element?.offsetTop ?? 0,
        }))
    )
}

export function observeMouseMove(element: HTMLElement) {
    return fromEvent<MouseEvent>(element, "mousemove").pipe(
        map(e => ({ x: e.movementX, y: e.movementY }))
    );
}

export function observeMouseMovedThreshold(element: HTMLElement, threshold = 5) {
    return observeMouseMove(element).pipe(
        scan((a, c) => a + Math.sqrt(c.x * c.x + c.y * c.y), 0),
        single(moved => moved > threshold),
    )
}

export function observeMouseMovedThreshold2(element: HTMLElement, threshold = 5) {
    return observeMousePosition(element).pipe(
        scan((a, c) => {
            a = a ?? c;
            const x = a.x - c.x;
            const y = a.y - c.y;
            if (Math.sqrt(x * x + y * y) > threshold) {
                return true;
            }
            return a;
        }, null),
        single(moved => moved === true)
    )
}

export function toggleClass(element: HTMLElement, c: string) {
    return (visible: boolean) => element.classList.toggle(c, visible);
}