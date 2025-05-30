import * as fs from 'fs';
import * as path from 'path';

// load configuration from config.json
const CONFIG_PATH = path.join(__dirname, '../config.json');
export const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8').replace(/\/\/.*$/gm, ''));

// debug configuration from config file
export const DEBUG_MODE = config.global.debugMode;            
export const DEBUG_VERBOSE = config.global.debugVerbose;

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
  
  try {
    const templatePath = path.join(__dirname, 'templates/tmp_index.html');
    log(`reading template file from ${templatePath}`);
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // replace the placeholder with the actual content
    const html = template.replace('<!-- CONTENT_PLACEHOLDER -->', content);
    log('html generated successfully using template');
    return html;
  } catch (error) {
    console.error(`error generating html from template: ${error}`);
    // fallback to hardcoded html if template fails
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
        <h2>oh well, something didnt work!</h2>
    </div>
  
    <footer>
        <div class="footer-container">
            <p>kabk coding y3</p>
        </div>
    </footer>
</body>
</html>`;
  }
}