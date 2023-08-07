import BaseHTMLContext from "../base-html-context";
import FormattedStringNode from "./formatted-string-node";
import HTMLValueNode from "./html-value-node";
import StringValueNode from "./string-value-node";

export type TableColumn =
[
    FormattedStringNode,
    {align: boolean}
]

export class TableNode implements StringValueNode, HTMLValueNode {
    columns: TableColumn[];
    rows: FormattedStringNode[][];

    constructor(rows: FormattedStringNode[][], columns?: TableColumn[]) {
        this.rows = rows;
        this.columns = columns;
    }

    getHTML(context: BaseHTMLContext): string {
        return context.table(this);
    }

    getValue(): string {
        return "No Table";
    }
}