import StringValueNode from "./string-value-node";

export default class NumberNode implements StringValueNode {
    number: number;

    constructor(number: number) {
        this.number = number;
    }

    getValue(): string {
        return this.number.toString();
    }
}