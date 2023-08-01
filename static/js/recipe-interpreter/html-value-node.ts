import BaseHTMLContext from "../base-html-context";

export default interface HTMLValueNode {
    getHTML(context: BaseHTMLContext): string;
}