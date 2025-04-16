import * as fs from 'fs';
import * as path from 'path';

// debug configuration
export const DEBUG_MODE = true;            
export const DEBUG_VERBOSE = true;

// debug logger function
export function log(...args: any[]): void {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// verbose debug logger
export function logVerbose(...args: any[]): void {
  if (DEBUG_MODE && DEBUG_VERBOSE) {
    console.log('[verbose]', ...args);
  }
}

/**
 * reads the input file and returns its content
 */
export function readInputFile(filePath: string): string {
  try {
    log(`attempting to read from ${filePath}`);
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`error reading file: ${error}`);
    process.exit(1);
  }
}

/**
 * writes the output html file
 */
export function writeOutputFile(html: string, filePath: string): void {
  try {
    // ensure the output directory exists
    log(`creating output directory if needed: ${path.dirname(filePath)}`);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    
    log(`writing ${html.length} characters to ${filePath}`);
    fs.writeFileSync(filePath, html);
    log(`output written to ${filePath}`);
  } catch (error) {
    console.error(`error writing output file: ${error}`);
  }
}

/**
 * generates the html template with transformed content
 */
export function generateHTML(content: string): string {
  log(`generating html output with ${content.length} characters`);
  
  // inline basic styles directly in the html
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transformed Text</title>
    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="./normalize.css">
</head>
<body>
    <div class="container">
        ${content}
    </div>
</body>
</html>`;
}