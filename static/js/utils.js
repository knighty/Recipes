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

export function observeInput(element, event = "input") {
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

export function observeClick(element) {
    return rxjs.fromEvent(element, "click");
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

Array.prototype.orderedGroup = function (groupingFunction) {
    let groups = {};

    for (let item of this) {
        let g = groupingFunction(item);
        groups[g] = groups[g] || { group: g, items: [] };
        groups[g].items.push(item);
    }

    return Object.values(groups).sort((a, b) => a.group.localeCompare(b.group));
}

export function observeMouseDown(element, leftClick = true) {
    return rxjs.merge(
        rxjs.fromEvent(element, "mousedown").pipe(rxjs.operators.filter(e => (leftClick == false || e.button == 0))),
        rxjs.fromEvent(element, "touchstart")
    );
}

export function observeMouseUp(element) {
    return rxjs.merge(
        rxjs.fromEvent(element, "mouseup"),
        //rxjs.fromEvent(element, "touchend")
    );
}

export function observeShortLongPress(element, time = 500) {
    const up$ = rxjs.race(
        rxjs.timer(time).pipe(rxjs.operators.mapTo(true)),
        observeMouseUp(element).pipe(rxjs.operators.mapTo(false)),
        observeMouseMovedThreshold(element).pipe(rxjs.operators.mapTo(undefined))
    ).pipe(rxjs.operators.first());

    return rxjs.partition(observeMouseDown(element).pipe(
        rxjs.operators.exhaustMap(() => up$),
        rxjs.operators.filter(v => v !== undefined)
    ), longPress => !longPress);
}

export function createElement(type, params) {
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
    if (params.value) {
        element.value = params.value;
    }
    return element;
}

export function appendChildren(element, ...children) {
    for (let child of children) {
        element.appendChild(child);
    }
}

export function removeChildren(element, filterFn) {
    for (let i = element.childNodes.length - 1; i >= 0; i++) {
        if (filterFn) {
            if (!filterFn(element))
                continue;
        }
        element.removeChild(element.childNodes[i]);
    }
}

export function debounceAfterFirst(time, num = 1) {
    return rxjs.operators.connect(value =>
        rxjs.concat(
            value.pipe(rxjs.operators.take(num)),
            value.pipe(rxjs.operators.debounceTime(time))
        )
    )
}

export function toggleMap(condition, t, f = null) {
    //return rxjs.operators.switchMap()
}

export function observeMousePosition(element) {
    return rxjs.fromEvent(element, "mousemove").pipe(
        rxjs.operators.map(e => {
            const x = e.pageX - element.offsetLeft;
            const y = e.pageY - element.offsetTop;
            return { x, y };
        })
    )
}

export function observeMouseMove(element) {
    return rxjs.fromEvent(element, "mousemove").pipe(
        rxjs.operators.map(e => {
            return { x: e.movementX, y: e.movementY };
        })
    )
}

export function observeMouseMovedThreshold(element, threshold = 5) {
    return observeMouseMove(element).pipe(
        rxjs.operators.scan((a, c) => a + Math.sqrt(c.x * c.x + c.y * c.y), 0),
        rxjs.operators.single(moved => moved > threshold),
    )
}

export function observeMouseMovedThreshold2(element, threshold = 5) {
    return observeMousePosition(element).pipe(
        rxjs.operators.scan((a, c) => {
            a = a ?? c;
            const x = a.x - c.x;
            const y = a.y - c.y;
            if (Math.sqrt(x * x + y * y) > threshold) {
                return true;
            }
            return a;
        }, null),
        rxjs.operators.single(moved => moved === true)
    )
}

export function toggleClass(element, c) {
    return visible => element.classList.toggle(c, visible);
}