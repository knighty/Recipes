import Tokenizer from "../tokenizer";
import Tokens from "../tokens";
import FormattedStringNode from "./formatted-string-node";
import HighlightedWordNode from "./highlighted-word-node";
import { InfoNode } from "./info-node";
import InfosNode from "./infos-node";
import IngredientNode from "./ingredient-node";
import IngredientsNode from "./ingredients-node";
import MeasureNode from "./measure-node";
import NumberNode from "./number-node";
import ParagraphNode from "./paragraph-node";
import RecipeNode from "./recipe-node";
import StepNode from "./step-node";
import StepsNode from "./steps-node";
import TagsNode from "./tags-node";
import Measure from "../measure";
import StringNode from "./string-node";
import FormattedStringFragment from "./formatted-string-fragment";
import measures from "./measure-definitions";
import ListNode from "./list-node";
import LinkNode from "./link-node";
import { TableColumn, TableNode } from "./table-node";
import { Recipe } from "../recipe";

enum TokenType {
    openBrace,
    closeBrace,
    openParenthesis,
    closeParenthesis,
    tableDivider,
    section,
    bullet,
    hash,
    comma,
    pipe,
    duration,
    linebreak,
    optional,
    url,
    key,
    measure,
    orderedBullet,
    number,
    word,
    whitespace
};

export class RecipeInterpreter {
    tokenizer: Tokenizer;

    constructor() {
        const tokenizer = new Tokenizer();

        tokenizer.addRule(/\/\/.*/y, (context) => false);

        tokenizer.addRule(/\/\*[\s\S]*\*\//y, (context) => false);

        tokenizer.addRule(/\[/y, (context) => context.accept(TokenType.openBrace));

        tokenizer.addRule(/\]/y, (context) => context.accept(TokenType.closeBrace));

        tokenizer.addRule(/\(/y, (context) => context.accept(TokenType.openParenthesis));

        tokenizer.addRule(/\)/y, (context) => context.accept(TokenType.closeParenthesis));

        tokenizer.addRule(/:?-{3,}:?/y, (context, matches) => {
            const start = matches[0].startsWith(":");
            const end = matches[0].endsWith(":");
            let align = "left";
            if (start && end) {
                align = "center";
            }
            else if (end) {
                align = "right";
            }
            context.accept(TokenType.tableDivider, { align });
        });

        tokenizer.addRule(/--/y, (context) => context.accept(TokenType.section));

        tokenizer.addRule(/-/y, (context) => context.accept(TokenType.bullet));

        tokenizer.addRule(/\,/y, (context) => context.accept(TokenType.comma));

        tokenizer.addRule(/\|/y, (context) => context.accept(TokenType.pipe));

        tokenizer.addRule(/(\r\n|\r|\n)/y, (context) => context.accept(TokenType.linebreak));

        tokenizer.addRule(/\!optional/y, (context) => context.accept(TokenType.optional));

        tokenizer.addRule(/\w+:\/\/[-a-zA-Z0-9@:%_\+.~#?&=\/]+/y, (context) => context.accept(TokenType.url));

        tokenizer.addRule(/([^\s]+)\:\s/y, (context, matches) => context.accept(TokenType.key, { key: matches[1].toLowerCase(), word: matches[0] }));

        function handleMeasure(min: number, max: number | null, units: string) {
            for (let measureType of measures) {
                const measureMatches = measureType.regex.exec(units);
                if (measureMatches) {
                    return new Measure(min * measureType.normalize, max ? max * measureType.normalize : null, measureType.type);
                }
            }
            throw new Error("No matching measure");
        }

        tokenizer.addRule(/(\d+\.?\d*)\-?(\d+\.?\d*)? ?(cm|g|tsp|tbsp|ml|lb|C|F|mins?|secs?|minutes?)\b/y, (context, matches) => {
            const min = parseFloat(matches[1]);
            const max = matches[2] ? parseFloat(matches[2]) : null;
            const units = matches[3].toLowerCase();

            return context.accept(TokenType.measure, { word: matches[0], measure: handleMeasure(min, max, units) });
        });

        tokenizer.addRule(/(\d+)\.\s/y, (context, matches) => context.accept(TokenType.orderedBullet, { number: parseInt(matches[1]), word: matches[0] }));

        tokenizer.addRule(/(\d+\.?\d*)\b/y, (context, matches) => context.accept(TokenType.number, { number: parseFloat(matches[1]), word: matches[0] }));

        tokenizer.addRule(/[^\s\]\[\,]+/y, (context, matches) => context.accept(TokenType.word, { word: matches[0] }));

        tokenizer.addRule(/[^\S\r\n]+/y, (context, matches) => context.accept(TokenType.whitespace, { whitespace: matches[0], word: matches[0] }));

        this.tokenizer = tokenizer;
    }

    tokenize(recipe: string) {
        const tokens = this.tokenizer.parse(recipe);
        return tokens;
    }

    interpret(recipe: string) {
        const tokens = this.tokenize(recipe);
        const p = this.parseRecipe(tokens);
        //console.log(p);
        return p;
    }

    error(tokens: Tokens, expected?: string) {
        const token = tokens.next();
        const recipeBefore = token.input.substring(0, token.position);
        const recipeAfter = token.input.substring(token.position);
        const lineBreaks = (recipeBefore.match(/\n/g) || []).length;

        throw new Error(`Unexpected ${TokenType[token.type]} "${token.string}" on line ${lineBreaks + 1} at position ${token.position} ..."${recipeAfter.substring(0, 100)}"...`);
    }

    skipLinebreaks(tokens: Tokens) {
        while (tokens.peek(TokenType.linebreak)) tokens.next();
    }

    skipWhitespace(tokens: Tokens) {
        while (tokens.peek(TokenType.whitespace)) tokens.next();
    }

    skipAll(tokens: Tokens) {
        while (tokens.peek(TokenType.whitespace) || tokens.peek(TokenType.linebreak)) tokens.next();
    }

    parseRecipe(tokens: Tokens) {
        const sectionNodes = [];

        while (!tokens.done()) {
            sectionNodes.push(this.sectionExpression(tokens));
        }

        const recipeNode = new RecipeNode(sectionNodes);
        return recipeNode;
    }

    sectionExpression(tokens: Tokens) {
        this.skipAll(tokens);
        if (tokens.peek(TokenType.section)) {
            tokens.next();
            this.skipWhitespace(tokens);
            const sectionName = this.stringExpression(tokens).getValue().trim();
            this.skipAll(tokens);
            switch (sectionName) {
                case "Steps":
                    return this.stepsExpression(tokens);
                case "Ingredients":
                    return this.ingredientsExpression(tokens);
                case "Info":
                    return this.infoSectionExpression(tokens);
                default:
                    throw new Error(`Invalid section: ${sectionName}`);
            }
        } else {
            this.error(tokens);
        }
    }

    ingredientsExpression(tokens: Tokens) {
        const ingredientNodes = [];
        while (tokens.peek(TokenType.bullet)) {
            tokens.next();
            this.skipAll(tokens);
            ingredientNodes.push(this.ingredientExpression(tokens));
            this.skipAll(tokens);
        }
        return new IngredientsNode(ingredientNodes);
    }

    ingredientExpression(tokens: Tokens) {
        let category = null;
        let optional = false;
        let textNodes = [];
        while (true) {
            this.skipWhitespace(tokens);

            if (category == null) {
                const ingredientCategoryExpression = this.ingredientCategoryExpression(tokens);
                if (ingredientCategoryExpression) {
                    category = ingredientCategoryExpression;
                    continue;
                }
            }

            const sentenceExpression = this.formattedStringExpression(tokens);
            if (sentenceExpression) {
                textNodes.push(sentenceExpression);
                continue;
            }

            const optionalExpression = this.optionalExpression(tokens);
            if (optionalExpression !== false) {
                optional = true;
                continue;
            }

            break;
        }
        return new IngredientNode(new FormattedStringNode(textNodes), category?.getValue(), optional);
    }

    ingredientCategoryExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.openBrace)) {
            tokens.next();
            const sentence = this.stringExpression(tokens);
            if (!tokens.peek(TokenType.closeBrace)) this.error(tokens, "]");
            tokens.next();
            return sentence;
        }

        return null;
    }

    stepsExpression(tokens: Tokens) {
        const stepNodes = [];
        while (true) {
            const stepNode = this.stepExpression(tokens);
            if (stepNode) {
                stepNodes.push(stepNode);
                this.skipAll(tokens);
                continue;
            }

            return new StepsNode(stepNodes);
        }
    }

    infoSectionExpression(tokens: Tokens) {
        const infoNodes: InfoNode<any>[] = [];
        while (true) {
            this.skipAll(tokens);
            const infoExpression = this.infoExpression(tokens);
            if (infoExpression !== null) {
                infoNodes.push(infoExpression);
                continue;
            }
            return new InfosNode(infoNodes);
        }
    }

    infoExpression(tokens: Tokens): InfoNode<any> {
        if (tokens.peek(TokenType.key)) {
            const keyToken = tokens.next();
            this.skipAll(tokens);
            const f = (key: keyof Recipe, tokens: Tokens): InfoNode<any> => {
                switch (key) {
                    case "description": return new InfoNode(key, this.paragraphExpression(tokens).getValue());
                    case "tags": return new InfoNode(key, this.tagsExpression(tokens).getValue());
                    case "duration": return new InfoNode(key, this.measureExpression(tokens).getValue());
                    case "serves":
                    case "calories":
                    case "difficulty":
                    case "intensity":
                        return new InfoNode(key, this.numberExpression(tokens).number);
                    case "meat":
                    case "name":
                    case "type":
                    case "image":
                        return new InfoNode(key, this.stringExpression(tokens).getValue());
                    default:
                        throw new Error();
                }
            }
            return f(keyToken.key, tokens);
        }
        return null;
    }

    tagsExpression(tokens: Tokens): TagsNode {
        const tags = [];
        let i = 0;
        while (true) {
            const tagExpression = this.tagExpression(tokens);
            if (tagExpression !== false) {
                tags.push(tagExpression);
                if (tokens.peek(TokenType.comma)) {
                    tokens.next();
                    continue;
                }
            }
            if (tags.length == 0)
                return null;
            return new TagsNode(tags);
        }
    }

    tagExpression(tokens: Tokens) {
        let tag = "";
        while (true) {
            if (tokens.peek(TokenType.word) || tokens.peek(TokenType.number) || tokens.peek(TokenType.whitespace)) {
                const token = tokens.next();
                tag += token.word;
                continue;
            }

            tag = tag.trim();
            if (tag == "") {
                this.error(tokens, "tag expression");
                return false;
            }
            return tag;
        }
    }

    stepExpression(tokens: Tokens) {
        let durationNode = null;
        const nodes = [];
        while (true) {
            this.skipWhitespace(tokens);

            const stepDurationExpression = this.stepDurationExpression(tokens);
            if (stepDurationExpression) {
                this.skipWhitespace(tokens);
                durationNode = stepDurationExpression;
                if (tokens.peek(TokenType.linebreak)) {
                    tokens.next();
                }
                continue;
            }

            const blockExpression = this.blockExpression(tokens);
            if (blockExpression) {
                nodes.push(blockExpression);
                continue;
            }

            if (nodes.length == 0)
                return null;
            return new StepNode(nodes, durationNode);
        }
    }

    blockExpression(tokens: Tokens) {
        return this.tableExpression(tokens) ??
            this.unorderedListExpression(tokens) ??
            this.orderedListExpression(tokens) ??
            this.paragraphExpression(tokens);
    }

    tableExpression(tokens: Tokens) {
        const rows = [];
        let columns: TableColumn[] = null;
        const firstRowExpression = this.tableRowExpression(tokens);
        if (firstRowExpression) {
            tokens.nextPeek(TokenType.linebreak);
        }
        const dividerRowExpression = this.tableDividerRowExpression(tokens);
        if (dividerRowExpression) {
            tokens.nextPeek(TokenType.linebreak);
            columns = firstRowExpression.map((column, i) => [column, dividerRowExpression[i]])
        }

        while (true) {
            const tableRowExpression = this.tableRowExpression(tokens);
            if (tableRowExpression) {
                tokens.nextPeek(TokenType.linebreak);
                rows.push(tableRowExpression);
                continue;
            }
            if (firstRowExpression == null)
                return null;
            return new TableNode(columns ? rows : [firstRowExpression, ...rows], columns);
        }
    }

    tableDividerRowExpression(tokens: Tokens) {
        return tokens.scope((tokens, consume) => {
            if (tokens.peek(TokenType.pipe)) {
                tokens.next();
                const dividers = [];
                while (true) {
                    this.skipWhitespace(tokens);

                    const divider = this.tableDividerExpression(tokens);
                    if (divider) {
                        this.skipWhitespace(tokens);
                        dividers.push(divider);
                        tokens.nextPeek(TokenType.pipe);
                        continue;
                    }

                    return dividers.length > 0 ? dividers : null;
                }
            }

            return null;
        })
    }

    tableRowExpression(tokens: Tokens) {
        return tokens.scope((tokens, consume) => {
            if (tokens.peek(TokenType.pipe)) {
                tokens.next();
                const columns = [];
                while (true) {
                    this.skipWhitespace(tokens);

                    const column = this.formattedStringExpression(tokens);
                    if (column) {
                        this.skipWhitespace(tokens);
                        columns.push(column);
                        tokens.nextPeek(TokenType.pipe);
                        continue;
                    }

                    return columns.length > 0 ? columns : null;
                }
            }

            return null;
        })
        /*if (tokens.peek(TokenType.pipe)) {
            tokens.next();
            let type = "data";
            const columns = [];
            const dividers = [];
            while (true) {
                this.skipWhitespace(tokens);

                const divider = this.tableDividerExpression(tokens);
                if (divider) {
                    this.skipWhitespace(tokens);
                    dividers.push(divider);
                    tokens.nextPeek(TokenType.pipe);
                    type = "dividers";
                    continue;
                }

                const column = this.formattedStringExpression(tokens);
                if (column) {
                    this.skipWhitespace(tokens);
                    columns.push(column);
                    tokens.nextPeek(TokenType.pipe);
                    type = "data";
                    continue;
                }

                return columns.length > 0 ? { columns, type } : null;
            }
        }

        return null;*/
    }

    tableDividerExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.tableDivider)) {
            const token = tokens.next();
            return { align: token.align };
        }
    }

    tipExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.key)) {
            const token = tokens.next();
            if (token.key == "tip")
                return true;
        }
        return false;
    }

    stepDurationExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.openBrace)) {
            tokens.next();
            if (!tokens.peek(TokenType.measure))
                this.error(tokens);
            const token = tokens.next();
            if (!tokens.peek(TokenType.closeBrace))
                this.error(tokens);
            tokens.next();
            return new MeasureNode(token.measure);
        }
        return null;
    }

    unorderedListExpression(tokens: Tokens) {
        const elements: FormattedStringNode[] = [];

        while (true) {
            const unorderedListElementExpression = this.unorderedListElementExpression(tokens);
            if (unorderedListElementExpression) {
                elements.push(unorderedListElementExpression);
                continue;
            }

            if (elements.length == 0)
                return null;

            return new ListNode(elements, false);
        }
    }

    unorderedListElementExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.bullet)) {
            tokens.next();
            const formattedStringExpression = this.formattedStringExpression(tokens);
            if (tokens.nextPeek(TokenType.linebreak)) {
                return formattedStringExpression;
            }
            this.error(tokens);
        }
        return null;
    }

    orderedListExpression(tokens: Tokens) {
        const elements: FormattedStringNode[] = [];

        while (true) {
            const orderedListElementExpression = this.orderedListElementExpression(tokens);
            if (orderedListElementExpression) {
                elements.push(orderedListElementExpression);
                continue;
            }

            if (elements.length == 0)
                return null;

            return new ListNode(elements, true);
        }
    }

    orderedListElementExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.orderedBullet)) {
            tokens.next();
            const formattedStringExpression = this.formattedStringExpression(tokens);
            if (tokens.nextPeek(TokenType.linebreak)) {
                return formattedStringExpression;
            }
            this.error(tokens);
        }
        return null;
    }

    paragraphExpression(tokens: Tokens) {
        const tipExpression = this.tipExpression(tokens);
        const tip = tipExpression !== false;

        const formattedStringExpression = this.formattedStringExpression(tokens);
        if (formattedStringExpression == null)
            return null;

        const optionalExpression = this.optionalExpression(tokens);
        const optional = optionalExpression !== false;

        if (tokens.peek(TokenType.linebreak)) {
            tokens.next();
        }

        return new ParagraphNode(formattedStringExpression, optional, tip);
    }

    formattedStringExpression(tokens: Tokens): FormattedStringNode {
        const nodes: FormattedStringFragment[] = [];
        while (true) {
            const formattedStringFragmentExpression = this.formattedStringFragmentExpression(tokens);
            if (formattedStringFragmentExpression) {
                nodes.push(formattedStringFragmentExpression);
                continue;
            }

            if (nodes.length == 0)
                return null;
            return new FormattedStringNode(nodes);
        }
    }

    formattedStringFragmentExpression(tokens: Tokens): FormattedStringFragment {
        return this.highlightedWordsExpression(tokens) ?? this.measureExpression(tokens) ?? this.basicStringExpression(tokens);
    }

    highlightedWordsExpression(tokens: Tokens): FormattedStringFragment {
        if (tokens.peek(TokenType.openBrace)) {
            tokens.next();
            const sentence = this.formattedStringExpression(tokens);
            if (!tokens.peek(TokenType.closeBrace))
                this.error(tokens);
            tokens.next();

            if (tokens.nextPeek(TokenType.openParenthesis)) {
                const link = tokens.next();
                if (link.type != TokenType.url) {
                    this.error(tokens);
                }
                if (!tokens.nextPeek(TokenType.closeParenthesis)) {
                    this.error(tokens);
                }
                return new LinkNode(link.string, sentence);
            }

            return new HighlightedWordNode(sentence);
        }
        return null;
    }

    numberExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.number)) {
            const token = tokens.next();
            return new NumberNode(token.number);
        }
        return null;
    }

    measureExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.measure)) {
            const token = tokens.next();
            return new MeasureNode(token.measure);
        }
        return null;
    }

    stringExpression(tokens: Tokens): StringNode {
        const fragments: string[] = [];
        while (true) {
            const stringFragmentExpression = this.measureStringExpression(tokens);
            if (stringFragmentExpression !== null) {
                fragments.push(stringFragmentExpression);
                continue;
            }

            if (fragments.length == 0)
                return null;
            return new StringNode(fragments.join(""));
        }
    }

    basicStringExpression(tokens: Tokens): StringNode {
        const fragments: string[] = [];
        while (true) {
            const stringFragmentExpression = this.basicStringFragmentExpression(tokens);
            if (stringFragmentExpression !== null) {
                fragments.push(stringFragmentExpression);
                continue;
            }

            if (fragments.length == 0)
                return null;
            return new StringNode(fragments.join(""));
        }
    }

    measureStringExpression(tokens: Tokens): string {
        if (tokens.peek(TokenType.measure)) {
            return tokens.next().word;
        }
        return this.basicStringFragmentExpression(tokens);
    }

    basicStringFragmentExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.word)) {
            return tokens.next().word;
        }
        if (tokens.peek(TokenType.whitespace)) {
            return tokens.next().whitespace;
        }
        if (tokens.peek(TokenType.number)) {
            return tokens.next().word;
        }
        if (tokens.peek(TokenType.bullet)) {
            tokens.next();
            return "-";
        }
        if (tokens.peek(TokenType.orderedBullet)) {
            return tokens.next().string;
        }
        if (tokens.peek(TokenType.key)) {
            return tokens.next().word;
        }
        if (tokens.peek(TokenType.url)) {
            return tokens.next().string;
        }
        if (tokens.peek(TokenType.openParenthesis)) {
            tokens.next();
            return "(";
        }
        if (tokens.peek(TokenType.closeParenthesis)) {
            tokens.next();
            return ")";
        }
        if (tokens.peek(TokenType.comma)) {
            tokens.next();
            return ",";
        }
        /*if (tokens.peek(TokenType.pipe)) {
            tokens.next();
            return "|";
        }*/
        return null;
    }

    optionalExpression(tokens: Tokens) {
        if (tokens.peek(TokenType.optional)) {
            tokens.next();
            return "";
        }
        return false;
    }
}