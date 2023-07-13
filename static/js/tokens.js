export class Tokens {
    constructor() {
        this.i = 0;
        this.tokens = [];
    }

    push(item) {
        this.tokens.push(item);
    }

    peek(type) {
        if (this.done())
            return false;
        if (type == undefined) {
            return this.tokens[this.i].type;
        }
        return this.tokens[this.i].type == type;
    }

    current() {
        return this.tokens[this.i];
    }

    nextPeek(type) {
        if (this.peek(type))
            this.next();
    }

    next() {
        return this.tokens[this.i++];
    }

    peekNext() {
        return this.tokens[this.i];
    }

    done() {
        return this.i > this.tokens.length - 1;
    }
}