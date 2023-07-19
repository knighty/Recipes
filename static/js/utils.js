export const escapeHtml = (unsafe) => {
    return unsafe.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

export function observeScopedEvent(scopedElement, event, selector, capture = false) {
    return rxjs.fromEvent(scopedElement, event, { capture: capture }).pipe(
        rxjs.operators.map(e => {
            let element = e.target;
            do {
                if (element.matches(selector)) {
                    e.stopPropagation();
                    e.preventDefault();
                    return [element, e];
                }
                element = element.parentNode;
            } while (element != scopedElement && element != null);
            return null;
        }),
        rxjs.operators.filter(e => e != null)
    );
}

export function observeInput(element, event) {
    return rxjs.fromEvent(element, event).pipe(
        rxjs.operators.map(e => e.target.value)
    );
}

export function observableToggle(setter$, toggler$, start = false) {
    return rxjs.merge(
        setter$,
        toggler$.pipe(rxjs.operators.mapTo(undefined)),
    ).pipe(
        rxjs.operators.startWith(start),
        rxjs.operators.scan((a, c) => c === undefined ? !a : c, false),
        rxjs.operators.shareReplay(1)
    );
}

export function groupArray(array, groupingFunction) {
    let groups = {};

    for (let item of array) {
        let g = groupingFunction(item);
        groups[g] = groups[g] || [];
        groups[g].push(item);
    }

    return groups;
}

Array.prototype.group = function (groupingFunction) {
    return groupArray(this, groupingFunction);
}

export function observeMouseDown(element) {
    return rxjs.merge(
        rxjs.fromEvent(element, "mousedown"),
        rxjs.fromEvent(element, "touchstart")
    ).pipe(rxjs.operators.throttleTime(100));
}

export function observeMouseUp(element) {
    return rxjs.merge(
        rxjs.fromEvent(element, "mouseup"),
        rxjs.fromEvent(element, "touchend")
    );
}