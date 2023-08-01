import { MonoTypeOperatorFunction, Observable, OperatorFunction, concat, connect, debounceTime, exhaustMap, filter, first, fromEvent, map, mapTo, merge, partition, race, scan, shareReplay, single, startWith, take, timer } from "rxjs";
import { AnyDictionary, StringDictionary } from "./types";

export const escapeHtml = (unsafe: string) => {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function observeScopedEvent<T extends Event>(scopedElement: Node, event: string, selector: string, options?: {
    capture?: boolean,
    stopPropagation?: boolean,
    preventDefault?: boolean,
    filterEvents?: (e: T) => boolean
}): Observable<T> {
    options = {
        capture: false,
        stopPropagation: true,
        preventDefault: true,
        ...options
    };
    return fromEvent<T>(scopedElement, event, { capture: options?.capture ?? false }).pipe(
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

export function pluckEventTarget<R extends HTMLElement>(): OperatorFunction<Event, R> {
    return map((e: Event) => e.target as R);
}

export function observeInput<T extends Event>(element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, event = "input"): Observable<string> {
    return fromEvent<T>(element, event).pipe(
        map(e => element.value)
    );
}

export function observableToggle(setter$: Observable<boolean>, toggler$: Observable<void>, start: boolean = false): Observable<boolean> {
    return merge(
        setter$,
        toggler$.pipe(map(() => undefined)),
    ).pipe(
        startWith(start),
        scan((a, c) => c === undefined ? !a : c, false),
        shareReplay(1)
    );
}

export function observeClick(element: HTMLElement) {
    return fromEvent<MouseEvent>(element, "click");
}

export function groupArray<T>(array: T[], groupingFunction: (o: T) => string) {
    let groups: {
        [Key: string]: T[];
    } = {};

    for (let item of array) {
        let g = groupingFunction(item);
        groups[g] = groups[g] || [];
        groups[g].push(item);
    }

    return groups;
}

export function orderedGroupArray<T>(array: T[], groupingFunction: (o: T) => string) {
    let groups: {
        [Key: string]: {
            group: string,
            items: T[]
        }
    } = {};

    for (let item of array) {
        let g = groupingFunction(item);
        groups[g] = groups[g] || { group: g, items: [] };
        groups[g].items.push(item);
    }

    return Object.values(groups).sort((a, b) => a.group.localeCompare(b.group));
}

export function observeMouseDown(element: HTMLElement, leftClick: boolean = true) {
    return merge(
        fromEvent<MouseEvent>(element, "mousedown").pipe(filter(e => (leftClick == false || e.button == 0))),
        fromEvent<TouchEvent>(element, "touchstart")
    );
}

export function observeMouseUp(element: HTMLElement) {
    return merge(
        fromEvent<MouseEvent>(element, "mouseup"),
        //fromEvent(element, "touchend")
    );
}

export function observeShortLongPress(element: HTMLElement, time: number = 500) {
    const up$ = race(
        timer(time).pipe(mapTo(true)),
        observeMouseUp(element).pipe(mapTo(false)),
        observeMouseMovedThreshold(element).pipe(mapTo(undefined))
    ).pipe(first());

    return partition(observeMouseDown(element).pipe(
        exhaustMap(() => up$),
        filter(v => v !== undefined)
    ), longPress => !longPress);
}

export function createElement<T extends HTMLElement>(type: string, params: {
    classes?: string[];
    text?: string;
    attributes?: StringDictionary;
    data?: AnyDictionary;
    value?: string;
}): T {
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
        if (element instanceof HTMLInputElement ||
            element instanceof HTMLSelectElement ||
            element instanceof HTMLTextAreaElement ||
            element instanceof HTMLOptionElement) {
            element.value = params.value;
        } else {
            throw new Error(`Value was provided for an element without a value`);
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

export function observeMousePosition(element: HTMLElement) {
    return fromEvent<MouseEvent>(element, "mousemove").pipe(
        map(e => {
            const x = e.pageX - element.offsetLeft;
            const y = e.pageY - element.offsetTop;
            return { x, y };
        })
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