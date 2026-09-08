import { writeFile, mkdir } from 'node:fs/promises';
import { createVM } from '../src/vm.mjs';
import { summaryCases, developmentCompletions } from '../tests/fixtures.mjs';
const initial = process.argv.includes('--initial');
const vm = await createVM({ fuel: 40000000 });
if (initial) {
    vm.modules.clear();
    await vm.load(new URL('../experiments/iteration-0/sop/', import.meta.url).pathname);
}
const pack = vm.run('kb.default');
const summaries = [];
for (const c of summaryCases.filter(c => !initial || c.split === 'development')) {
    const text = c.sentences.join(' '), start = performance.now();
    const r = vm.run('text.summarize', { text, query: c.query ?? '', limit: c.limit ?? 3, locale: c.locale ?? 'en' });
    const selected = r.selected.map(x => x.index), matched = c.gold.filter(i => selected.includes(i)).length;
    const lead = Array.from({ length: c.limit ?? 3 }, (_, i) => i);
    summaries.push({ id: c.id, split: c.split, locale: c.locale ?? 'en', input: text, gold: c.gold, selected, recall: matched / c.gold.length, precision: matched / (selected.length || 1), leadRecall: c.gold.filter(i => lead.includes(i)).length / c.gold.length, exactSource: r.selected.every(x => text.slice(x.sentence.start, x.sentence.end) === x.text), milliseconds: performance.now() - start, output: r.text });
}
const completions = [];
for (const c of developmentCompletions) {
    const r = vm.run('text.expand', { text: c.text, pack });
    const actual = r.selected.map(x => x.term.predicate).sort();
    completions.push({ ...c, actual, pass: JSON.stringify(actual) === JSON.stringify([...c.expected].sort()), output: r.text, parsed: r.parsed.facts.map(f => f.term) });
}
const average = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
const report = { stage: initial ? 'iteration-0-before-robustness-revision' : 'current', node: process.version, scope: 'Small authored fixtures, not an independent language benchmark', summary: { cases: summaries.length, recall: average(summaries.map(x => x.recall)), leadRecall: average(summaries.map(x => x.leadRecall)), sourceFaithfulness: summaries.filter(x => x.exactSource).length }, completion: { cases: completions.length, passed: completions.filter(x => x.pass).length }, summaries, completions };
await mkdir(new URL('../reports/', import.meta.url), { recursive: true });
await writeFile(new URL(initial ? '../reports/iteration-0.json' : '../reports/evaluation.json', import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ summary: report.summary, completion: report.completion, failedCompletions: completions.filter(x => !x.pass).map(x => x.id), summaries: summaries.map(x => ({ id: x.id, recall: x.recall, selected: x.selected })) }, null, 2));
