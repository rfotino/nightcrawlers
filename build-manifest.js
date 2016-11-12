const MANIFEST_FILENAME = 'assets/manifest.json';
const fs = require('fs');

// Read the manifest
const content = fs.readFileSync(MANIFEST_FILENAME, 'UTF-8');

// Update the file sizes
let manifest = JSON.parse(content);
manifest.forEach(obj => {
  obj.files.forEach(file => {
    file.size = fs.statSync(file.src)['size'];
  });
});


// Write the manifest back to the file
const newContent = JSON.stringify(manifest, null, 2);
fs.writeFileSync(MANIFEST_FILENAME, newContent);
