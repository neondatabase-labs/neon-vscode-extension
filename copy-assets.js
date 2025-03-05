const fs = require('fs');
const path = require('path');

// Create the output directory if it doesn't exist
const outDir = path.join(__dirname, 'out', 'auth');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Copy the callback.html file
const srcFile = path.join(__dirname, 'src', 'auth', 'callback.html');
const destFile = path.join(__dirname, 'out', 'auth', 'callback.html');

fs.copyFileSync(srcFile, destFile);
console.log(`Copied ${srcFile} to ${destFile}`); 