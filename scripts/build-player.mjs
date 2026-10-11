import { build } from 'esbuild';
await build({entryPoints:['src/player/entry.ts'],bundle:true,format:'iife',target:['chrome110','firefox115','safari17'],minify:true,outfile:'src/player/runtime.generated.txt',legalComments:'none'});
