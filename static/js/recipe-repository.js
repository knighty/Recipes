import { RecipeInterpreter } from "./recipe-interpreter.js";
import { NodeVisitor } from "./node-visitor.js";
import { config } from "./config.js";

export default class RecipeRepository {
    constructor() {
        function nameToId(name) {
            const lower = name.toLowerCase();
            const noSpaces = lower.replaceAll(/\s+/g, "-");
            const ascii = noSpaces.replaceAll(/([^a-z0-9\-])+/g, "");
            return ascii;
        }

        const sources$ = rxjs.from(config.sources).pipe(
            rxjs.operators.mergeMap(source => rxjs.ajax.ajax({
                url: source,
                responseType: 'text'
            })),
            rxjs.operators.map(response => response.response),
            rxjs.operators.map(text => text.split(/\-{5}/))
        );

        this.recipes$ = sources$.pipe(
            rxjs.operators.tap(_ => console.log("Processing recipes...")),
            rxjs.operators.map(recipes => recipes.map(recipe => {
                const interpreter = new RecipeInterpreter();
                const node = interpreter.interpret(recipe);
                const visitor = new NodeVisitor();
                node.visit(visitor);
                //console.log(visitor.recipe);
                return visitor.recipe;
            })),
            rxjs.operators.tap(recipes => recipes.map((recipe, id) => {
                recipe.id = nameToId(recipe.name);
                return recipe;
            })),
            rxjs.operators.tap(_ => console.log(`Processed ${_.length} recipes`)),
            rxjs.operators.reduce((a, c) => [...a, ...c], []),
            rxjs.operators.shareReplay(1)
        )

        /*this.recipes$ = rxjs.ajax.ajax({
            url: "/recipes.txt",
            responseType: 'text'
        }).pipe(
            rxjs.operators.map(response => response.response),
            rxjs.operators.map(text => text.split(/\-{5}/)),
            rxjs.operators.tap(_ => console.log("Processing recipes...")),
            rxjs.operators.map(recipes => recipes.map(recipe => {
                const interpreter = new RecipeInterpreter();
                const node = interpreter.interpret(recipe);
                const visitor = new NodeVisitor();
                node.visit(visitor);
                //console.log(visitor.recipe);
                return visitor.recipe;
            })),
            rxjs.operators.tap(recipes => recipes.map((recipe, id) => {
                recipe.id = nameToId(recipe.name);
                return recipe;
            })),
            //rxjs.operators.delay(3000),
            rxjs.operators.tap(_ => console.log(`Processed ${_.length} recipes`)),
            rxjs.operators.shareReplay(1)
        );;*/
    }

    getById(id) {
        return this.recipes$.pipe(
            rxjs.operators.map(recipes => recipes.find(recipe => recipe.id == id)),
            rxjs.operators.first()
        )
    }

    find(search) {
        if (search == "")
            return this.recipes$;
        return this.recipes$.pipe(
            rxjs.operators.map(recipes =>
                recipes.filter(recipe =>
                    //(recipe.ingredients && recipe.ingredients.find(ingredient => ingredient.text.toLowerCase().includes(search)) != null) ||
                    (recipe.tags && recipe.tags.find(tag => tag.toLowerCase().includes(search)) != null) ||
                    recipe.name.toLowerCase().includes(search)
                )
            )
        );
    }
}