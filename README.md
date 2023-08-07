# Personal Recipe Catalogue

# Recipe Format

```
-- Info
Key: Value

-- Ingredients
- 2tbsp Some Ingredient
- [Category] 500g Something Else
- Optional Ingredient !optional

-- Steps
[10 minutes]
Step one text goes here. [Highlighted words]
New lines supported for paragraphs. 

[5 minutes]
Step two text goes here.
Tip: Tips can be shown by prefixing the paragraph with tip:
Optional paragraphs are supported too !optional
```

## Info Section

| Key | Type | Example |
| --- | --- | --- |
| Name | string | Chicken Korma |
| Meat | string | Chicken |
| Tags | string | Curry, Indian |
| Difficulty | number | 3 |
| Intensity | number | 1 |
| Serves | number | 3 |
| Duration | measure | 40 minutes |
| Calories | number | 450 |
| Description | string | A really rich and creamy chicken korma recipe with tender chicken breast pieces in a mildly spiced curry sauce. |
| Image | string | https://carameltintedlife.com/wp-content/uploads/2020/11/Chicken-Korma-1-of-1-2.jpg |

## Ingredients Section

Ingredients are provided in a bulleted list. Each ingredient can have a `[Category]` provided to place it under a subheader with other ingredients sharing that category. You can also end an ingredient with `!optional` to mark it as being optional.

## Steps Section

Each step can begin with a duration like so: `[5mins]` to mark it as taking that long to complete. Steps support a limited subset of markdown for formatting.

## Building

```
npm run build
```

or

```
yarn build
```
