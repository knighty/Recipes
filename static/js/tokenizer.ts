import Tokens from "./tokens";

class TokenizerContext<T> {
    i = 0;
    position = 0;
    tokens = new Tokens();
    string: string;
    input = "";

    constructor(input: string) {
        this.input = input;
    }

    accept(type: number, extra: { [Key: string]: any } = {}) {
        const token = {
            id: this.i++,
            type,
            position: this.position,
            string: this.string,
            input: this.input,
            ...extra
        };
        this.tokens.push(token);
    }

    process(fn: (context: TokenizerContext<any>) => void): Tokens {
        fn(this);
        return this.tokens;
    }
}

interface TokenizerRuleHandler {
    (context: TokenizerContext<any>, matches?: string[]): void;
};

class TokenizerRule {
    test: RegExp;
    fn: TokenizerRuleHandler;
}

export default class Tokenizer {
    rules: TokenizerRule[] = [];

    constructor() {
    }

    addRule(rule: RegExp, fn: TokenizerRuleHandler) {
        this.rules.push({ test: rule, fn });
    }

    parse(input: string): Tokens {
        return (new TokenizerContext(input)).process(context => {
            while (input.length > context.position) {
                let matched = false;
                for (const rule of this.rules) {
                    rule.test.lastIndex = context.position;
                    const matches = rule.test.exec(input);
                    if (matches) {
                        context.string = matches[0];
                        context.position += matches[0].length;
                        rule.fn(context, matches);
                        matched = true;
                        break;
                    }
                }
                if (!matched) {
                    throw new Error(`${input.substring(context.position)} didn't match any rules`);
                }
            }
        });
    }
}
