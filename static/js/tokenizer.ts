import Tokens from "./tokens";

class TokenizerContext {
    i = 0;
    position = 0;
    tokens = new Tokens();
    string: string;
    input = "";
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
}

interface TokenizerRuleHandler {
    (context: TokenizerContext, matches?: string[]): void;
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
        const context = new TokenizerContext();
        context.input = input;

        while (input.length > context.position) {
            let matched = false;
            for (const rule of this.rules) {
                rule.test.lastIndex = context.position;
                const matches = rule.test.exec(input);
                if (matches) {
                    context.string = matches[0];
                    rule.fn(context, matches);
                    matched = true;
                    context.position += matches[0].length;
                    break;
                }
            }
            if (!matched) {
                throw new Error(`${input.substring(context.position)} didn't match any rules`);
            }
        }

        return context.tokens;
    }
}
