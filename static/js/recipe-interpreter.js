import { Tokenizer } from "./tokenizer.js";

let i = 0;
const tokenTypes = {
    openBrace: i++,
    closeBrace: i++,
    section: i++,
    bullet: i++,
    hash: i++,
    comma: i++,
    duration: i++,
    linebreak: i++,
    optional: i++,
    key: i++,
    measure: i++,
    number: i++,
    word: i++,
    whitespace: i++
};

const tokenNames = [];
for (let name in tokenTypes) {
    tokenNames[tokenTypes[name]] = name;
}

class RecipeNode {
    constructor(sectionNodes) {
        this.sectionNodes = sectionNodes;
    }

    visit(visitor) {
        for (let section of this.sectionNodes) {
            section.visit(visitor);
        }
    }
}

class SectionNode {
    visit(visitor) {

    }
}

class IngredientsNode extends SectionNode {
    constructor(ingredients) {
        super();
        this.ingredients = ingredients;
    }

    visit(visitor) {
        for (const ingredient of this.ingredients) {
            ingredient.visit(visitor);
        }
    }
}

class IngredientNode {
    constructor(valueNode, category, optional) {
        this.valueNode = valueNode;
        this.category = category;
        this.optional = optional;
    }

    visit(visitor) {
        visitor.addIngredient({
            html: this.valueNode,
            category: this.category ?? "-",
            optional: this.optional
        });
    }
}

class HTMLNode {
    constructor(valueNode) {
        this.valueNode = valueNode;
    }

    getValue() {
        return this.valueNode.getValue();
    }

    getHTML(context) {
        return this.valueNode.getHTML(context);
    }
}

class FormattedSentenceNode {
    constructor(fragmentNodes) {
        this.fragmentNodes = fragmentNodes;
    }

    getValue() {
        return this.fragmentNodes.map(frag => frag.getValue()).join("");
    }

    getHTML(context) {
        return this.fragmentNodes.map(frag => frag.getHTML(context)).join("");
    }
}

class ParagraphNode {
    constructor(nodes, optional, tip) {
        this.nodes = nodes;
        this.optional = optional;
        this.tip = tip;
    }

    getValue() {
        return new HTMLNode(this);
    }

    getHTML(context) {
        let classes = [];
        if (this.optional)
            classes.push("optional");
        if (this.tip)
            classes.push("tip");
        return context.paragraph(this.nodes.map(node => node.getHTML(context)).join(""), classes);
    }
}

class HighlightedWordNode {
    constructor(wordNode) {
        this.wordNode = wordNode;
    }

    getHTML(context) {
        return context.highlightedWord(this.wordNode.getHTML(context));
    }
}

class InfosNode extends SectionNode {
    constructor(nodes) {
        super();
        this.nodes = nodes;
    }

    visit(visitor) {
        for (let node of this.nodes) {
            node.visit(visitor);
        }
    }
}

class InfoNode {
    constructor(key, valueNode, html) {
        this.key = key;
        this.valueNode = valueNode;
        this.isHtml = html;
    }

    getKey() {
        return this.key;
    }

    getValue() {
        switch (this.key) {
            case "duration": return this.valueNode.getValue()
            default:
                return (this.isHtml) ? this.valueNode : this.valueNode.getValue();

        }
    }

    visit(visitor) {
        visitor.setInfo(this.getKey(), this.getValue());
    }
}

class TagsNode {
    constructor(tags) {
        this.tags = tags;
    }

    getValue() {
        return this.tags;
    }
}

class StepsNode extends SectionNode {
    constructor(steps) {
        super();
        this.steps = steps;
    }

    visit(visitor) {
        for (let step of this.steps) {
            visitor.addStep(step.getValue());
        }
    }
}

class StepNode {
    constructor(paragraphNodes, durationNode) {
        this.paragraphNodes = paragraphNodes;
        this.durationNode = durationNode;
    }

    getValue() {
        return {
            html: new HTMLNode(this),
            duration: this.durationNode ? this.durationNode.getValue() : null
        }
    }

    getHTML(context) {
        return this.paragraphNodes.map(p => p.getHTML(context)).join("");
    }
}

class SentenceNode {
    constructor(fragments) {
        this.fragments = fragments;
    }

    getValue() {
        return this.fragments.map(fragment => (typeof fragment == "string") ? fragment : fragment.getValue()).join("");
    }

    getHTML(context) {
        return this.fragments.map(fragment => (typeof fragment == "string") ? fragment : fragment.getHTML(context)).join("");
    }
}

class Measure {
    constructor(min, max, type) {
        this.min = min;
        this.max = max;
        this.type = type;
    }
}

class MeasureNode {
    constructor(measure) {
        this.measure = measure;
    }

    getValue() {
        return this.measure;
    }

    getHTML(context) {
        return context.measure(this.measure);
    }
}

class NumberNode {
    constructor(number) {
        this.number = number;
    }

    getValue() {
        return this.number;
    }

    getHTML() {
        return this.number;
    }
}

class WordNode {
    constructor(number) {
        this.number = number;
    }

    getValue() {
        return this.number;
    }

    getHTML() {
        return this.number;
    }
}

export class RecipeInterpreter {
    constructor() {
        const measures = [
            // Weight
            {
                regex: /^(g)|(grams?)/,
                type: "weight",
                normalize: 1
            },
            {
                regex: /^(kg)|(kilograms?)/,
                type: "weight",
                normalize: 1000
            },
            {
                regex: /^(lbs?)|(pounds?)/,
                type: "weight",
                normalize: 453.592
            },
            {
                regex: /^(ozs?)|(ounces?)/,
                type: "weight",
                normalize: 28.3495
            },

            // Distance
            {
                regex: /^(metres?)/,
                type: "distance",
                normalize: 1
            },
            {
                regex: /^(cms?)/,
                type: "distance",
                normalize: 0.01
            },

            // Time
            {
                regex: /^(secs?)|(seconds?)/,
                type: "time",
                normalize: 1
            },
            {
                regex: /^(mins?)|(minutes?)/,
                type: "time",
                normalize: 60
            },
            {
                regex: /^(hrs?)|(hours?)/,
                type: "time",
                normalize: 3600
            },

            // Temperature
            {
                regex: /^(c)|(degrees)/,
                type: "temperature",
                normalize: 1
            },
            {
                regex: /^(f)|(farenheit)/,
                type: "temperature",
                normalize: 1
            },

            // Tablespoons
            {
                regex: /^(tsps?)/,
                type: "teaspoons",
                normalize: 1
            },
            {
                regex: /^(tbsps?)/,
                type: "teaspoons",
                normalize: 3
            },

            // Volume
            {
                regex: /^(mls?)/,
                type: "volume",
                normalize: 0.001
            },
            {
                regex: /^(litres?)/,
                type: "volume",
                normalize: 1
            },
        ]

        const tokenizer = new Tokenizer();

        tokenizer.addRule(/\[/y, (context, matches) => context.accept(tokenTypes.openBrace));

        tokenizer.addRule(/\]/y, (context, matches) => context.accept(tokenTypes.closeBrace));

        tokenizer.addRule(/--/y, (context, matches) => context.accept(tokenTypes.section));

        tokenizer.addRule(/-/y, (context, matches) => context.accept(tokenTypes.bullet));

        tokenizer.addRule(/\,/y, (context, matches) => context.accept(tokenTypes.comma));

        tokenizer.addRule(/(\r\n|\r|\n)/y, (context, matches) => context.accept(tokenTypes.linebreak));

        tokenizer.addRule(/\!optional/y, (context, matches) => context.accept(tokenTypes.optional));

        tokenizer.addRule(/([^\s]+)\:\s/y, (context, matches) => context.accept(tokenTypes.key, { key: matches[1].toLowerCase(), word: matches[0] }));

        function handleMeasure(min, max, units) {
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

            return context.accept(tokenTypes.measure, { word: matches[0], measure: handleMeasure(min, max, units) });
        });

        tokenizer.addRule(/(\d+\.?\d*)\b/y, (context, matches) => context.accept(tokenTypes.number, { number: parseFloat(matches[1]), word: matches[0] }));

        tokenizer.addRule(/[^\s\]\,]+/y, (context, matches) => context.accept(tokenTypes.word, { word: matches[0] }));

        tokenizer.addRule(/[^\S\r\n]+/y, (context, matches) => context.accept(tokenTypes.whitespace, { whitespace: matches[0], word: matches[0] }));

        this.tokenizer = tokenizer;
    }

    tokenize(recipe) {
        const tokens = this.tokenizer.parse(recipe);
        return tokens;
    }

    interpret(recipe) {
        const tokens = this.tokenize(recipe);
        return this.parseRecipe(tokens);
    }

    /*error(token, expected) {
        throw new Error(`Unexpected ${token.type} at ${token.id}. Expected ${expected}`);
    }*/

    error(tokens, expected) {
        const token = tokens.next();
        const recipeBefore = token.input.substr(0, token.position);
        const recipeAfter = token.input.substr(token.position);
        const lineBreaks = (recipeBefore.match(/\n/g) || []).length;

        throw new Error(`Unexpected ${tokenNames[token.type]} "${token.string}" on line ${lineBreaks + 1} at position ${token.position} ..."${recipeAfter.substr(0, 100)}"...`);
    }

    skipLinebreaks(tokens) {
        while (tokens.peek(tokenTypes.linebreak)) tokens.next();
    }

    skipWhitespace(tokens) {
        while (tokens.peek(tokenTypes.whitespace)) tokens.next();
    }

    skipAll(tokens) {
        while (tokens.peek(tokenTypes.whitespace) || tokens.peek(tokenTypes.linebreak)) tokens.next();
    }

    parseRecipe(tokens) {
        const sectionNodes = [];

        while (!tokens.done()) {
            sectionNodes.push(this.sectionExpression(tokens));
        }

        const recipeNode = new RecipeNode(sectionNodes);
        return recipeNode;
    }

    sectionExpression(tokens) {
        this.skipAll(tokens);
        if (tokens.peek(tokenTypes.section)) {
            tokens.next();
            this.skipWhitespace(tokens);
            const sectionName = this.sentenceExpression(tokens).getValue().trim();
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

    ingredientsExpression(tokens) {
        const ingredientNodes = [];
        while (tokens.peek(tokenTypes.bullet)) {
            tokens.next();
            this.skipAll(tokens);
            ingredientNodes.push(this.ingredientExpression(tokens));
            this.skipAll(tokens);
        }
        return new IngredientsNode(ingredientNodes);
    }

    ingredientExpression(tokens) {
        let category = null;
        let optionalNode = null;
        let textNodes = [];
        while (true) {
            this.skipWhitespace(tokens);

            const ingredientCategoryExpression = this.ingredientCategoryExpression(tokens);
            if (ingredientCategoryExpression !== false) {
                category = ingredientCategoryExpression;
                continue;
            }

            const sentenceExpression = this.sentenceExpression(tokens);
            if (sentenceExpression !== false) {
                textNodes.push(sentenceExpression);
                continue;
            }

            const optionalExpression = this.optionalExpression(tokens);
            if (optionalExpression !== false) {
                optionalNode = true;
                continue;
            }

            break;
        }
        return new IngredientNode(new HTMLNode(new FormattedSentenceNode(textNodes)), category?.getValue(), optionalNode);
    }

    ingredientCategoryExpression(tokens) {
        if (tokens.peek(tokenTypes.openBrace)) {
            tokens.next();
            const sentence = this.sentenceExpression(tokens);
            if (!tokens.peek(tokenTypes.closeBrace)) this.error(tokens, "]");
            tokens.next();
            return sentence;
        }

        return false;
    }

    stepsExpression(tokens) {
        const stepNodes = [];
        while (true) {
            const stepNode = this.stepExpression(tokens);
            if (stepNode !== false) {
                stepNodes.push(stepNode);
                this.skipAll(tokens);
                continue;
            }

            break;
        }

        return new StepsNode(stepNodes);
    }

    infoSectionExpression(tokens) {
        const infoNodes = [];
        while (true) {
            this.skipAll(tokens);
            const infoExpression = this.infoExpression(tokens);
            if (infoExpression !== false) {
                infoNodes.push(infoExpression);
                continue;
            }
            return new InfosNode(infoNodes);
        }
    }

    infoExpression(tokens) {
        if (tokens.peek(tokenTypes.key)) {
            const keyToken = tokens.next();
            let isHtml = false;
            this.skipAll(tokens);
            const f = (key, tokens) => {
                let r = false;
                switch (key) {
                    case "description": r = this.paragraphExpression(tokens); isHtml = true; break;
                    case "tags": r = this.tagsExpression(tokens); break;
                    case "duration": r = this.measureExpression(tokens); break;
                    case "serves":
                    case "calories":
                    case "difficulty":
                    case "intensity":
                        r = this.numberExpression(tokens); break;
                    default: r = this.sentenceExpression(tokens);
                }
                if (r === false) {
                    this.error(tokens, `info expression for "${key}"`);
                }
                return r;
            }
            return new InfoNode(keyToken.key, f(keyToken.key, tokens), isHtml);
        }
        return false;
    }

    tagsExpression(tokens) {
        const tags = [];
        let i = 0;
        while (true) {
            const tagExpression = this.tagExpression(tokens);
            if (tagExpression !== false) {
                tags.push(tagExpression);
                if (tokens.peek(tokenTypes.comma)) {
                    tokens.next();
                    continue;
                }
            }
            if (tags.length == 0)
                return false;
            return new TagsNode(tags);
        }
        return false;
    }

    tagExpression(tokens) {
        let tag = "";
        while (true) {
            if (tokens.peek(tokenTypes.word) || tokens.peek(tokenTypes.number) || tokens.peek(tokenTypes.whitespace)) {
                const token = tokens.next();
                tag += token.word;
                continue;
            }

            tag = tag.trim();
            if (tag == "") {
                this.error(tokens, "tag expression");
            }
            return tag;
        }
    }

    stepExpression(tokens) {
        let durationNode = null;
        const paragraphNodes = [];
        while (true) {
            this.skipWhitespace(tokens);

            const stepDurationExpression = this.stepDurationExpression(tokens);
            if (stepDurationExpression !== false) {
                this.skipWhitespace(tokens);
                durationNode = stepDurationExpression;
                if (tokens.peek(tokenTypes.linebreak)) {
                    tokens.next();
                }
                continue;
            }

            const paragraphExpression = this.paragraphExpression(tokens);
            if (paragraphExpression !== false) {
                paragraphNodes.push(paragraphExpression);
                if (tokens.peek(tokenTypes.linebreak)) {
                    tokens.next();
                }
                continue;
            }

            if (paragraphNodes.length == 0)
                return false;
            return new StepNode(paragraphNodes, durationNode);
        }

    }

    tipExpression(tokens) {
        if (tokens.peek(tokenTypes.key)) {
            const token = tokens.next();
            if (token.key == "tip")
                return true;
        }
        return false;
    }

    stepDurationExpression(tokens) {
        if (tokens.peek(tokenTypes.openBrace)) {
            tokens.next();
            if (!tokens.peek(tokenTypes.measure))
                this.error(tokens);
            const token = tokens.next();
            if (!tokens.peek(tokenTypes.closeBrace))
                this.error(tokens);
            tokens.next();
            return new MeasureNode(token.measure);
        }
        return false;
    }

    paragraphExpression(tokens) {
        let tip = false;
        let optional = false;
        const formattedSentenceNodes = [];
        while (true) {
            const tipExpression = this.tipExpression(tokens);
            if (tipExpression !== false) {
                tip = true;
                continue;
            }

            const formattedSentenceExpression = this.formattedSentenceExpression(tokens);
            if (formattedSentenceExpression !== false) {
                formattedSentenceNodes.push(formattedSentenceExpression);
                continue;
            }

            const optionalExpression = this.optionalExpression(tokens);
            if (optionalExpression !== false) {
                optional = optionalExpression;
                continue;
            }

            if (formattedSentenceNodes.length == 0)
                return false;

            return new ParagraphNode(formattedSentenceNodes, optional, tip);
        }
    }

    formattedSentenceExpression(tokens) {
        const nodes = [];
        while (true) {
            const highlightedWordsExpression = this.highlightedWordsExpression(tokens);
            if (highlightedWordsExpression) {
                nodes.push(highlightedWordsExpression);
                continue;
            }

            const sentenceExpression = this.sentenceExpression(tokens);
            if (sentenceExpression) {
                nodes.push(sentenceExpression);
                continue;
            }

            if (nodes.length == 0)
                return false;
            return new FormattedSentenceNode(nodes);
        }
    }

    highlightedWordsExpression(tokens) {
        if (tokens.peek(tokenTypes.openBrace)) {
            tokens.next();
            const sentence = this.sentenceExpression(tokens);
            if (!tokens.peek(tokenTypes.closeBrace))
                this.error(tokens);
            tokens.next();
            return new HighlightedWordNode(sentence);
        }
        return false;
    }

    numberExpression(tokens) {
        if (tokens.peek(tokenTypes.number)) {
            const token = tokens.next();
            return new NumberNode(token.number);
        }
        return false;
    }

    measureExpression(tokens) {
        if (tokens.peek(tokenTypes.measure)) {
            const token = tokens.next();
            return new MeasureNode(token.measure);
        }
        return false;
    }

    sentenceExpression(tokens) {
        const fragments = [];
        while (true) {
            const sentenceFragmentExpression = this.sentenceFragmentExpression(tokens);
            if (sentenceFragmentExpression !== false) {
                fragments.push(sentenceFragmentExpression);
                continue;
            }

            if (fragments.length == 0)
                return false;
            return new SentenceNode(fragments);
        }
    }

    sentenceFragmentExpression(tokens) {
        return this.wordExpression(tokens);
    }

    wordExpression(tokens) {
        if (tokens.peek(tokenTypes.word)) {
            return tokens.next().word;
        }
        return this.whitespaceExpression(tokens);
    }

    whitespaceExpression(tokens) {
        if (tokens.peek(tokenTypes.whitespace)) {
            const token = tokens.next();
            return token.whitespace;
        }
        return this.numberWordExpression(tokens);
    }

    numberWordExpression(tokens) {
        if (tokens.peek(tokenTypes.number)) {
            const token = tokens.next();
            return token.word;
        }
        return this.bulletWordExpression(tokens);
    }

    bulletWordExpression(tokens) {
        if (tokens.peek(tokenTypes.bullet)) {
            tokens.next();
            return "-";
        }
        return this.keyWordExpression(tokens);
    }

    keyWordExpression(tokens) {
        if (tokens.peek(tokenTypes.key)) {
            const key = tokens.next();
            return key.word;
        }
        return this.measureWordExpression(tokens);
    }

    measureWordExpression(tokens) {
        if (tokens.peek(tokenTypes.measure)) {
            const measure = tokens.next();
            return new MeasureNode(measure.measure);
        }
        return this.commaExpression(tokens);
    }

    commaExpression(tokens) {
        if (tokens.peek(tokenTypes.comma)) {
            tokens.next();
            return ",";
        }
        return false;
    }

    optionalExpression(tokens) {
        if (tokens.peek(tokenTypes.optional)) {
            tokens.next();
            return "";
        }
        return false;
    }
}