import { escapeHtml } from "./utils";
import MeasureRenderer from "./measure-renderer";
import Measure from "./measure";
import BaseHTMLContext from "./base-html-context";
import FormattedStringNode from "./recipe-interpreter/formatted-string-node";
import { TableNode } from "./recipe-interpreter/table-node";

export default class HTMLContext implements BaseHTMLContext {
    measureRenderer = new MeasureRenderer({ html: true });

    highlightedWord(word: string) {
        return `<span class="highlighted">${word}</span>`;
    }

    paragraph(html: string, classes?: string[]) {
        return `<p${classes ? ` class="${classes ? escapeHtml(classes.join(" ")) : ""}"` : ``}>${html}</p>`;
    }

    measure(measure: Measure) {
        return this.measureRenderer.render(measure);
    }

    text(text: string) {
        return escapeHtml(text);
    }

    list(elements: string[], ordered: boolean): string {
        const listType = ordered ? `ol` : `ul`;
        return `<${listType}>${elements.map(element => `<li>${element}</li>`).join("\n")}</${listType}>`;
    }

    link(url: string, text?: FormattedStringNode, title?: string): string {
        return `<a href="${escapeHtml(url)}" title="${title ? title : ""}" data-url="${escapeHtml(url)}">${text ? text.getHTML(this) : escapeHtml(url)}</a>`;
    }

    table(table: TableNode): string {
        const align = (i: number) => ` style="text-align: ${table.columns[i][1].align}"`;

        return `
        <table>
            ${table.columns ? `
                <thead>
                    <tr>${table.columns.map(([column, options]) => `<th>${column.getHTML(this).trim()}</th>`).join("")}</tr>
                </thead>` : ``}
            <tbody>
            ${table.rows.map(row => `<tr>${row.map((item, i) => `<td${table.columns ? align(i) : ``}>${item.getHTML(this).trim()}</td>\n`).join("")}</tr>`).join("")}
            </tbody>
        </table>`
    }
}