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
    <title>webzine</title>
    <link rel="stylesheet" href="./styles.css">
    <link rel="stylesheet" href="./normalize.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Hina+Mincho&family=Syne:wght@400..800&display=swap" rel="stylesheet">
</head>
<body>
    <nav class="main-nav">
        <div class="nav-container">
            <div class="logo">webzine</div>
            <ul class="nav-links">
                <li><a href="#first-issue">issue 01</a></li>
                <li><a href="#second-issue">issue 02</a></li>
                <li><a href="#third-issue">issue 03</a></li>
            </ul>
        </div>
    </nav>
    
    <div id="first-issue" class="section">
        <h2>issue 01: interview</h2>
        <div class="container">
            <!-- first issue content will be placed here -->
            <p class="placeholder">// first issue placeholder - this will contain an interview</p>
        </div>
    </div>
    
    <div id="second-issue" class="section">
        <h2>issue 02: unreadeable interview</h2>
        <div class="container">
            ${content}
        </div>
    </div>
    
    <div id="third-issue" class="section">
        <h2>issue 03: text</h2>
        <div class="container">
            <!-- third issue content will be placed here -->
            <p class="placeholder">// third issue placeholder - here will be text about namegiving</p>
        </div>
    </div>
    
    <footer>
        <div class="footer-container">
            <p>${new Date().getFullYear()}</p>
            <p>kabk coding y3</p>
        </div>
    </footer>
</body>
</html>`;
}