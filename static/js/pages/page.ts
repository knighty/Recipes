export default class PageView extends HTMLElement {
    constructor() {
        super();
    }

    element<T>(name: string) {
        return this.querySelector(`[data-element="${name}"]`) as T;
    }

    setState(state: any) {
    }

    saveState() {
    }
}