import { build } from 'esbuild';
await build({ entryPoints: ['public/notebook-visual.js'], bundle: true, format: 'esm', target: ['es2022'],
  outfile: 'public/vendor/visual-editor.js', minify: true, logLevel: 'info' });
