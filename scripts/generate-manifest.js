const { createHash } = require('node:crypto');
const { readdir, readFile, writeFile } = require('node:fs/promises');
const path = require('node:path');

const rootDirectory = path.resolve(__dirname, '..');
const dataDirectory = path.join(rootDirectory, 'data');
const manifestPath = path.join(rootDirectory, 'manifest.json');

async function getFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.DS_Store') {
      continue;
    }

    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await getFiles(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

async function generateManifest() {
  const files = (await getFiles(dataDirectory)).sort();
  const manifest = {};

  for (const filePath of files) {
    const contents = await readFile(filePath);
    const relativePath = path.relative(dataDirectory, filePath).split(path.sep).join('/');
    manifest[relativePath] = createHash('sha256').update(contents).digest('hex');
  }

  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Generated ${path.relative(rootDirectory, manifestPath)} for ${files.length} files.`);
}

generateManifest().catch((error) => {
  console.error('Failed to generate manifest:', error);
  process.exitCode = 1;
});
