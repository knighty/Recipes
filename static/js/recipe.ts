import Measure from "./measure";
import HTMLNode from "./recipe-interpreter/html-node";

export class Recipe {
    ingredients: Ingredient[] = [];
    steps: Step[] = [];

    id: string;
    name: string;
    meat: string;
    tags: string[];
    type: string;
    duration: Measure;
    serves: number;
    image: string;
    description: HTMLNode;
    intensity: number;
    calories: number;
    difficulty: number;
}

export class Ingredient {
    category: string;
    text: string;
    optional: boolean;
    html: HTMLNode | null;

    constructor(text: string, optional: boolean) {
        this.category = "-";
        this.text = text.trim();
        this.optional = optional;
    }
}

export class Step {
    html: HTMLNode | null;
    duration: Measure;

    constructor(html: HTMLNode, duration: Measure) {
        this.html = html;
        this.duration = duration;
    }
}