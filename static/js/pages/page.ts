export default class PageView<Elements> extends HTMLElement {
    constructor() {
        super();
    }

    element<T extends keyof Elements>(name: T) {
        return this.querySelector(`[data-element="${String(name)}"]`) as Elements[T];
    }

    setState(state: any) {
    }

    saveState() {
    }
}