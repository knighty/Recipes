import { RecipeInterpreter } from "./recipe-interpreter/recipe-interpreter";
import { config } from "./config";
import { Observable, first, from, map, mergeMap, reduce, shareReplay, tap } from "rxjs";
import { ajax } from 'rxjs/ajax';
import { Recipe } from "./recipe";
import NodeVisitor from "./recipe-interpreter/node-visitor";

export default class RecipeRepository {
    recipes$: Observable<Recipe[]>;

    constructor() {
        function nameToId(name: string) {
            const lower = name.toLowerCase();
            const noSpaces = lower.replaceAll(/\s+/g, "-");
            const ascii = noSpaces.replaceAll(/([^a-z0-9\-])+/g, "");
            return ascii;
        }

        let i = 0;
        const sources$ = from(config.sources).pipe(
            mergeMap(source => ajax<string>({
                url: source,
                responseType: 'text'
            })),//.pipe(delay(i++ * 3000))),
            map(response => response.response),
            map(text => text.split(/\-{5}/))
        );

        this.recipes$ = sources$.pipe(
            //tap(_ => console.log("Processing recipes...")),
            map(recipes => recipes.map(recipe => {
                const interpreter = new RecipeInterpreter();
                const node = interpreter.interpret(recipe);
                const visitor = new NodeVisitor();
                node.visit(visitor);
                return visitor.recipe;
            })),
            tap(recipes => recipes.map(recipe => {
                recipe.id = nameToId(recipe.name);
                return recipe;
            })),
            tap(_ => console.log(`Processed ${_.length} recipes`)),
            reduce((a, c) => [...a, ...c], []),
            tap(_ => console.log(`Total ${_.length} recipes`)),
            shareReplay(1)
        );
    }

    findById(id: string) {
        return this.recipes$.pipe(map(recipes => recipes.find(recipe => recipe.id == id)), first());
    }

    find(search: string) {
        if (search == "")
            return this.recipes$;
        return this.recipes$.pipe(
            map(recipes =>
                recipes.filter(recipe =>
                    //(recipe.ingredients && recipe.ingredients.find(ingredient => ingredient.text.toLowerCase().includes(search)) != null) ||
                    (recipe.tags && recipe.tags.find(tag => tag.toLowerCase().includes(search)) != null) ||
                    recipe.name.toLowerCase().includes(search)
                )
            )
        );
    }
}
