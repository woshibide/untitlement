// this file defines word-level text transformation effects
// each effect takes a single word and returns a modified version
// all functions are for use in the main transformation logic



/**
 * reverses the characters in a word
 */
export function reverseWord(word: string): string {
    return word.split('').reverse().join('');
  }

  
/**
 * applies random casing to each character in a word
 */
export function crazyCaseWord(word: string): string {
  return word
    .split('')
    .map(char => Math.random() > 0.5 ? char.toUpperCase() : char.toLowerCase())
    .join('');
}
  

/**
 * flips individual characters via css 
 */
export function upsideDownWord(word: string): string {
    // split the word into characters and randomly flip each one
    const characters = word.split('');
    const result = characters.map(char => {

      const shouldFlip = Math.random() < 0.5;
      
      if (shouldFlip) {
        return `<span class="effect-upside-down">${char}</span>`;
      }
      
      // otherwise return the character as is
      return char;
    });
    
    // join all characters (some wrapped, some not)
    return result.join('');
    
  }
  


// /**
//  * translates a word using google translate api, but too many requests is no bueno
//  */
// export async function translateWord(word: string, targetLang: string = 'fr'): Promise<string> {
//   try {
//     // using the imported google translate api
//     const { translate } = require('@vitalets/google-translate-api');
//     const result = await translate(word, { to: targetLang });
//     return result.text;
//   } catch (error) {
//     // fallback in case of api error
//     console.error(`translation error: ${error}`);
//     return word;
//   }
// }

/**
 * adds a french-like suffix to words to simulate translation
 */
export async function translateWord(word: string): Promise<string> {
  
  // don't modify very short words
  if (word.length <= 2) {
    return word; 
  }
  
  // simple rules to make words look "french-like" without actual translation
    if (word.endsWith('е')) {
      return word + 'au';
    } else if (word.endsWith('т')) {
      return word + 'é';
    } else if (word.endsWith('н')) {
      return word + 'ne';
    } else if (word.endsWith('у')) {
      return word.slice(0, -1) + 'й';
    } else if (word.endsWith('ер')) {
      return word.slice(0, -2) + 'eur';
    } else if (word.match(/[aeiou]$/i)) {
      return word + 'ment';
    } else {
      // default - add common french suffix
      return word + 'ique';
    }
  }


/**
 * adds diacrites to characters for corrupt look
 */
export function corruptWord(word: string): string {
    // array of combining diacritical marks for the corruption effect
    const combiningChars = [
      '\u0300', '\u0301', '\u0302', '\u0303', '\u0304', '\u0305', '\u0306', '\u0307', 
      '\u0308', '\u0309', '\u030A', '\u030B', '\u030C', '\u030D', '\u030E', '\u030F', 
      '\u0310', '\u0311', '\u0312', '\u0313', '\u0314', '\u0315', '\u0316', '\u0317', 
      '\u0318', '\u0319', '\u031A', '\u031B', '\u031C', '\u031D', '\u031E', '\u031F', 
      '\u0320', '\u0321', '\u0322', '\u0323', '\u0324', '\u0325', '\u0326', '\u0327', 
      '\u0328', '\u0329', '\u032A', '\u032B', '\u032C', '\u032D', '\u032E', '\u032F', 
      '\u0330', '\u0331', '\u0332', '\u0333', '\u0334', '\u0335', '\u0336', '\u0337',
      '\u0338', '\u0339', '\u033A', '\u033B', '\u033C', '\u033D', '\u033E', '\u033F'
    ];
  
    // process each character in the word
    return word.split('').map(char => {

    const chanceOfCorruption = 0.2;
    const maxDiacriticalMarks = 25;
    const numCombiningChars = Math.random() < chanceOfCorruption ? 
                              Math.floor(Math.random() * maxDiacriticalMarks) + 1 : 0;
    
      // add random combining characters
      let corruptedChar = char;
      for (let i = 0; i < numCombiningChars; i++) {
        const randomIndex = Math.floor(Math.random() * combiningChars.length);
        corruptedChar += combiningChars[randomIndex];
      }
      
      return corruptedChar;
    }).join('');
  }