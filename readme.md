# zine w/ last hope of russian underground

## overview
this project takes input text and applies various transformative effects to create a visually interesting output displayed in a web page, which is meant to be printed. each word in the text may receive one of several effects (translation, reversal, upside-down transformation, crazy case, or corruption) based on probability settings.

## structure
```
.
├── input/             # contains input text files
│   └── kotel_2.txt    # sample input text
├── public/            # public-facing files
│   ├── index.html     # generated output html
│   ├── normalize.css  # css reset
│   └── styles.css     # custom styling
├── src/               # source code
│   ├── effects.ts     # text transformation effects
│   ├── main.ts        # main application logic
│   ├── utils.ts       # utility functions
│   └── templates/     # html templates
├── package.json       # project dependencies
└── tsconfig.json      # typescript configuration
```

## how it works
1. reads text from an input file in the `input/` directory
2. processes each word, applying effects based on configured probabilities
3. generates html with styled spans for each transformed word
4. writes the output to `public/index.html`


## configuration
key configuration options can be found in `src/main.ts`:
- `INPUT_FILE`: path to the input text file
- `OUTPUT_DIR`: directory for output files
- `OUTPUT_FILE`: path for the output html file
- `MAX_EFFECT_CHANCE`: maximum probability for effects
- `PROGRESSION_THRESHOLD`: when to reach maximum effect chance
- `EFFECTS`: array of available effects with their configurations

## debugging
set the following in `src/utils.ts` to enable debug output:
```typescript
export const DEBUG_MODE = true;            
export const DEBUG_VERBOSE = true;
```

## dependencies
- typescript
- ts-node
- @vitalets/google-translate-api (for translation)