import BaseHTMLContext from "../base-html-context";
import FormattedStringNode from "./formatted-string-node";
import HTMLValueNode from "./html-value-node";
import StringValueNode from "./string-value-node";

export default class LinkNode implements HTMLValueNode, StringValueNode {
    url: string;
    text: FormattedStringNode;
    title: string;

    constructor(url: string, text?: FormattedStringNode, title?: string) {
        this.url = url;
        this.text = text;
        this.title = title;
    }

    getValue(): string {
        return this.url;
    }

    getHTML(context: BaseHTMLContext): string {
        let url = this.url;
        const matches = /recipe:\/\/([a-z\-]+)/.exec(url);
        if (matches) {
            url = `/recipe/${matches[1]}`;
        }
        return context.link(url, this.text, this.title);
    }
}