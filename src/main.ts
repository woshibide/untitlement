import * as path from 'path';
import { 
  reverseWord, 
  crazyCaseWord, 
  upsideDownWord, 
  translateWord,
  corruptWord
} from './effects';
import {
  DEBUG_MODE,
  DEBUG_VERBOSE,
  log,
  logVerbose,
  readInputFile,
  writeOutputFile,
  generateHTML
} from './utils';

// configuration
const OUTPUT_DIR = path.join(__dirname, '../public');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'index.html'); // this will be the consolidated page

// input files for the three issues
const INPUT_ISSUE_1_FILE = path.join(__dirname, '../input/issue-1.txt');
const INPUT_ISSUE_2_FILE = path.join(__dirname, '../input/issue-2.txt');
const INPUT_ISSUE_3_FILE = path.join(__dirname, '../input/issue-3.txt');

// template file
const TEMPLATE_FILE = path.join(__dirname, 'templates/tmp_index.html');

const MAX_EFFECT_CHANCE = 1;          // at maximum
const PROGRESSION_THRESHOLD = 0.75;   // when to reach max effect chance

interface Effect {
  name: string;
  apply: (word: string) => Promise<string> | string;
  probability?: number; // default 0.5
  step?: number;        // probability progression
}

// available effects
const EFFECTS: Effect[] = [
  {
    name: 'translate',
    apply: translateWord,
    probability: 0.1,
    step: 0.005
  },
  {
    name: 'reverse',
    apply: reverseWord,
    probability: 0.05,
    step: 0.0
  },
  {
    name: 'upside-down',
    apply: upsideDownWord,
    probability: 0.9,
    step: 0.02
  },
  {
    name: 'crazy-case',
    apply: crazyCaseWord,
    probability: 0.85,
    step: 0.005
  },
  {
    name: 'corrupt',
    apply: corruptWord,
    probability: 0.75,
    step: 0.05
  }
];

// no effect fallback
const NO_EFFECT: Effect = {
    name: 'none',
    apply: (word: string) => word,
    probability: 0
};

/**
 * calculates the probability of applying an effect based on position in text
 */
function getEffectProbability(position: number, total: number): number {
  const progress = Math.min(position / total / PROGRESSION_THRESHOLD, 1);
  const probability = progress * MAX_EFFECT_CHANCE;
  logVerbose(`position: ${position}/${total}, 
              progress: ${Math.round(progress * 100)}%, 
              probability: ${probability.toFixed(4)}`);

  return probability;
}

/**
 * selects an effect using progressive probabilities
 */
function selectEffectWithProgression(
  globalProbability: number, 
  currentProbabilities: Record<string, number>
): Effect {
  // first check if we should apply any effect at all
  const random = Math.random();
  if (random > globalProbability) {
    logVerbose(`random ${random.toFixed(4)} > probability 
                                            ${globalProbability.toFixed(4)}
                                            , no effect selected`);

    return NO_EFFECT;
  }
  
  // select effect based on current individual probabilities
  const effectsWithProbabilities = EFFECTS.map(effect => ({
    effect,
    probability: currentProbabilities[effect.name] || 0.5
  }));
  
  // normalize probabilities to sum to 1
  const totalProbability = effectsWithProbabilities.reduce(
    (sum, item) => sum + item.probability, 0
  );
  
  // select an effect using weighted random selection
  const randomValue = Math.random() * totalProbability;
  let cumulativeProbability = 0;
  
  for (const item of effectsWithProbabilities) {
    cumulativeProbability += item.probability;
    if (randomValue <= cumulativeProbability) {
      logVerbose(`selected effect: ${item.effect.name} 
                  (current probability: ${item.probability.toFixed(2)})`);
                  
      return item.effect;
    }
  }
  
  // fallback in case of rounding errors
  logVerbose(`fallback to last effect: ${EFFECTS[EFFECTS.length - 1].name}`);
  return EFFECTS[EFFECTS.length - 1];
}

/**
 * applies the selected effect to a word
 */
async function applyEffect(word: string, effect: Effect): Promise<{
  word: string;
  effect: Effect;
  originalWord: string;
}> {
  const startTime = performance.now();
  const transformedWord = await Promise.resolve(effect.apply(word));
  const duration = performance.now() - startTime;
  
  if (effect !== NO_EFFECT) {
    logVerbose(`applied ${effect.name} to "${word}" -> "${transformedWord}" in ${duration.toFixed(2)}ms`);
  }
  
  return { word: transformedWord, effect, originalWord: word };
}


/**
 * processes the input text and applies transformations
 */
async function transformText(text: string): Promise<string> {
  // split into words, preserving spaces and punctuation
  const words = text.match(/\S+|\s+/g) || [];
  const totalWords = words.filter(w => /\S/.test(w)).length;
  let wordCount = 0;
  let effectsApplied = 0;
  const effectCounts: Record<string, number> = {};
  
  // track effect probabilities as they increase
  const currentProbabilities: Record<string, number> = {};
  
  log(`beginning transformation of ${totalWords} words...`);
  
  // initialize effect counters and starting probabilities
  EFFECTS.forEach(effect => {
    effectCounts[effect.name] = 0;
    currentProbabilities[effect.name] = effect.probability || 0.5;
  });
  
  // process each word
  const transformedWords = await Promise.all(words.map(async (word, index) => {
    // ignore whitespace
    if (/^\s+$/.test(word)) {
      return word;
    }
    
    wordCount++;
    const globalProbability = getEffectProbability(wordCount, totalWords);
    const effect = selectEffectWithProgression(globalProbability, currentProbabilities);
    
    // increase probabilities for next word
    EFFECTS.forEach(e => {
      const step = e.step || 0;
      if (step > 0) {
        // increase probability based on progression through text
        const progressFactor = wordCount / totalWords;
        currentProbabilities[e.name] = Math.min(
          (currentProbabilities[e.name] || 0.5) + (step * progressFactor), 
          1
        );
      }
    });
    
    if (effect !== NO_EFFECT) {
      effectsApplied++;
      effectCounts[effect.name] = (effectCounts[effect.name] || 0) + 1;
    }
    
    const result = await applyEffect(word, effect);
    
    // wrap the word in a span with the appropriate class
    if (result.effect === NO_EFFECT) {
      return `<span>${result.word}</span>`;
    } else {
      return `<span class="effect-${result.effect.name}" title="Original: ${result.originalWord}">${result.word}</span>`;
    }
  }));
  
  log(`transformation complete - applied effects to ${effectsApplied} 
        of ${wordCount} words (${Math.round(effectsApplied/wordCount*100)}%)`);
  
  // log statistics for each effect
  const effectStats = Object.entries(effectCounts)
    .filter(([_, count]) => count > 0)
    .map(([name, count]) => `${name}: ${count} (${Math.round(count/effectsApplied*100)}%)`)
    .join(', ');
  
  log(`effect distribution: ${effectStats}`);
  
  return transformedWords.join('');
}

/**
 * main function that orchestrates the text transformation process
 */
async function main(): Promise<void> {
  console.log('starting unified page generation...');

  // 1. read content for issue 1 (raw)
  console.time('read input (issue 1)');
  const rawContentIssue1 = readInputFile(INPUT_ISSUE_1_FILE);
  console.timeEnd('read input (issue 1)');
  console.log(`read ${rawContentIssue1.length} characters for issue 1 from: ${INPUT_ISSUE_1_FILE}`);

  // 2. read and transform content for issue 2
  console.time('read input (issue 2)');
  const inputTextIssue2 = readInputFile(INPUT_ISSUE_2_FILE);
  console.timeEnd('read input (issue 2)');
  console.log(`read ${inputTextIssue2.length} characters for issue 2 from: ${INPUT_ISSUE_2_FILE}`);
  
  console.log('\ntransforming text for issue 2...');
  log(`available effects (${EFFECTS.length}): ${EFFECTS.map(e => e.name).join(', ')}`);
  log(`effect probability ranges from 0 to ${MAX_EFFECT_CHANCE} (max at ${PROGRESSION_THRESHOLD * 100}% of text)`);
  console.time('transform (issue 2)');
  const transformedContentIssue2 = await transformText(inputTextIssue2);
  console.timeEnd('transform (issue 2)');

  // 3. read content for issue 3 (raw)
  console.time('read input (issue 3)');
  const rawContentIssue3 = readInputFile(INPUT_ISSUE_3_FILE);
  console.timeEnd('read input (issue 3)');
  console.log(`read ${rawContentIssue3.length} characters for issue 3 from: ${INPUT_ISSUE_3_FILE}`);

  // 4. read html template
  console.time('read template');
  const templateHtml = readInputFile(TEMPLATE_FILE);
  console.timeEnd('read template');
  console.log(`read template file: ${TEMPLATE_FILE}`);

  // 5. inject content into template
  console.time('inject content into template');
  let finalHtml = templateHtml.replace(
    '<!-- FIRST_ISSUE -->', 
    rawContentIssue1.replace(/\n/g, ' ')
  );
  finalHtml = finalHtml.replace(
    '<!-- SECOND_ISSUE -->', 
    transformedContentIssue2
  );
  finalHtml = finalHtml.replace(
    '<!-- THIRD_ISSUE -->', 
    rawContentIssue3.replace(/\n/g, ' ')
  );
  console.timeEnd('inject content into template');
  
  // 6. write the final html to the main output file
  console.time('write final output');
  writeOutputFile(finalHtml, OUTPUT_FILE);
  console.timeEnd('write final output');
  
  console.log(`\nunified page generation complete! output: ${OUTPUT_FILE}`);
}

// run the main function
main().catch(error => {
  console.error(`an error occurred: ${error}`);
  process.exit(1);
});