import { Tokens } from "./tokens.js";

export class Tokenizer {
    constructor() {
        this.rules = [];
    }

    addRule(rule, fn) {
        this.rules.push({ rule, fn });
    }

    parse(input) {
        const tokens = new Tokens();

        const context = {
            i: 0,
            position: 0,
            tokens: [],
            string: null,
            accept: function (type, extra = {}) {
                const token = {
                    type,
                    position: this.position,
                    string: this.string,
                    input,
                    ...extra
                };
                token.id = this.i++;
                tokens.push(token);
            }
        };

        while (input.length > context.position) {
            let matched = false;
            for (const rule of this.rules) {
                rule.rule.lastIndex = context.position;
                const matches = rule.rule.exec(input);
                if (matches) {
                    context.string = matches[0];
                    rule.fn(context, matches);
                    matched = true;
                    context.position += matches[0].length;
                    break;
                }
            }
            if (!matched) {
                throw new Error(`${input.substr(context.position)} didn't match any rules`);
            }
        }

        return tokens;
    }
}
