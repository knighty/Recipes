interface Token {
    type: number;
    id: number;
    position: number;
    string: string;
    input: string;
    [Key: string]: any
}

export default class Tokens {
    i = 0;
    tokens: Token[] = [];

    constructor() {
    }

    push(item: Token) {
        this.tokens.push(item);
    }

    peek(type: number) {
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

    nextPeek(type: number) {
        if (this.peek(type)) {
            this.next();
            return true;
        }
        return false;
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