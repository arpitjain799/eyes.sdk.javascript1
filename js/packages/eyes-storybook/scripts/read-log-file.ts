import {readFileSync, writeFileSync} from 'fs';
import {parseLog} from './parse-log';

const filepath = process.argv[2];
console.log('processing', filepath);

const content = readFileSync(filepath).toString();
const parsedLines = parseLog({content});

// console.log(parsedLines.map(({payload}, i) => `${i} ${payload}`).join('\n'))

// const parsedLog = parsedLines.map(({name, ts, tsElapsed, tsDiff, level, payload, data}) => `${name.padEnd(12)} | ${String(`+${tsElapsed}ms`).padStart(10)} | ${payload}${data ? ` | ${JSON.stringify(data)}` : ''}`).join('\n')
// fs.writeFileSync(filepath.replace(/\.(\w+)$/, '.parsed.$1'), parsedLog)

writeFileSync(filepath.replace(/\.(\w+)$/, '.parsed.$1'), JSON.stringify(parsedLines));
