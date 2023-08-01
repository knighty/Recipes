interface MeasureDefinition {
    regex: RegExp;
    type: string;
    normalize: number;
}

const measures: MeasureDefinition[] = [
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

export default measures;