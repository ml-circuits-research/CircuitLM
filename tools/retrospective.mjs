import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createVM, HOME } from '../src/vm.mjs';
// Preserve an independently existing project document. Do not add it to the authored gold set.
const raw = await readFile(path.join(HOME, 'examples/prior-design-source.md'), 'utf8');
const excerpt = raw.split('## Dynamic installation')[0];
const input = excerpt.replace(/```[\s\S]*?```/g, '').split('\n').filter(line => !line.startsWith('#')).join('\n').replace(/\n{3,}/g, '\n\n').trim();
const vm = await createVM(), r = vm.run('text.summarize', { text: input, limit: 5 });
const report = { source: 'Earlier user-provided project document: 22-DOCUMENT-KNOWLEDGE-AS-CIRCUITS.md, from sop-sllm-complete.zip', scope: 'Retrospective prose-only smoke test, not a new gold-annotated or independent benchmark. The source describes an earlier implementation; its statements are not claims about R1.', preprocessing: 'Excerpt before Dynamic installation; fenced code and headings omitted. All output offsets refer to this extracted input.', input, output: r.text, inputWords: input.split(/\s+/).length, outputWords: r.text.split(/\s+/).length, sourceSentences: r.features.length, selected: r.selected.map(s => ({ index: s.index, text: s.text, start: s.sentence.start, end: s.sentence.end })), sourceSpansExact: r.selected.every(s => input.slice(s.sentence.start, s.sentence.end) === s.text), execution: vm.stats() };
await writeFile(path.join(HOME, 'examples/prior-design-prose.txt'), input + '\n');
await writeFile(path.join(HOME, 'reports/retrospective.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
