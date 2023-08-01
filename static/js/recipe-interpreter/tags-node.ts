export default class TagsNode {
    tags: string[];

    constructor(tags: any[]) {
        this.tags = tags;
    }

    getValue() {
        return this.tags;
    }
}