#!/usr/bin/env node

'use strict';

if (process.argv.length < 3) {
  console.log(`Usage: timee [repetitions=10] <command>`);
  return;
}

const childProcess = require('child_process');
const spawn = childProcess.spawnSync;

const performanceNow = () => {
  const hrTime = process.hrtime();
  return hrTime[0] * 1000000 + hrTime[1] / 1000;
}

const overhead = (() => {
  for (let i = 0; i < 10; i++) {
    spawn('true');
  }
  const start = performanceNow();
  for (let i = 0; i < 100; i++) {
    spawn('true');
  }
  const end = performanceNow();
  return (end - start) / 100;
})();

let hasRepetitions = false;
let repetitions = 10;
if (/^[0-9]+$/.test(process.argv[2])) {
  hasRepetitions = true;
  repetitions = parseInt(process.argv[2], 10);
}

const command = process.argv[hasRepetitions ? 3 : 2];
const args = process.argv.slice(hasRepetitions ? 4 : 3);
const times = new Array(repetitions);
for (let i = 0; i < repetitions; i++) {
  const start = performanceNow();
  spawn(command, args);
  const end = performanceNow();
  times[i] = end - start - overhead;
}

const formatTime = time => {
  return (time / 1000).toFixed(3) + 'ms';
}

const avg = times.reduce((a, b) => a + b) / repetitions;
const min = times.reduce((a, b) => Math.min(a, b));
const max = times.reduce((a, b) => Math.max(a, b));

console.log(`
avg: ${formatTime(avg)}    -    ${formatTime(min)} ~ ${formatTime(max)}

${distributionTable(times, min, max)}
`);

function distributionTable(times, min, max) {
  const tableHeight = 10;
  const table = new Array(tableHeight);
  for (let i = 0; i < tableHeight; i++) {
    table[i] = [''];
  }
  const distance = (max - min + 1) / tableHeight;
  for (let time of times) {
    const slot = Math.floor((time - min) / distance);
    table[slot].push('');
  }
  return table.map((row, i) => 
    `[${row.join('@')}${new Array(times.length - row.length).join(' ')}] ` +
    `${formatTime(min + (i * distance))} ~ ${formatTime(min + ((i+1) * distance))}`
    ).join('\n');
}
