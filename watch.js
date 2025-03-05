const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Start TypeScript compiler in watch mode
const tsc = spawn('npx', ['tsc', '-watch', '-p', './'], { shell: true });

tsc.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // When compilation is complete, copy assets
  if (output.includes('Watching for file changes')) {
    copyAssets();
  }
});

tsc.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

// Function to copy assets
function copyAssets() {
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
}

// Initial copy
copyAssets(); 