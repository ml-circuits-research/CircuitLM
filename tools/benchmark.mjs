import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createVM, VM, HOME } from '../src/vm.mjs';
import { createService } from '../src/service.mjs';
import { unify, stable } from '../src/generic.mjs';
const quantile = (xs, q) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) * q)];
const text = 'Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests. Harbor shares storage with Atlas.';
const start = performance.now(), execute = await createService(), boot = performance.now() - start;
execute({ task: 'expand', text });
execute({ task: 'semantic-summary', text, limit: 4 });
const latency = {};
for (const task of ['summarize', 'semantic-summary', 'expand']) {
    const samples = [];
    let steps;
    for (let i = 0; i < 30; i++) {
        const t = performance.now(), r = execute({ task, text, limit: 4 });
        samples.push(performance.now() - t);
        steps = r.execution.steps;
    }
    latency[task] = { runs: samples.length, medianMs: quantile(samples, .5), p95Ms: quantile(samples, .95), steps };
}
const vm = await createVM({ fuel: 50000000 });
const facts = Array.from({ length: 50000 }, (_, i) => ({ id: String(i), term: { predicate: 'p' + (i % 1000), subject: 'S' + i } }));
const patterns = [{ predicate: 'p500', subject: { kind: 'variable', name: 'x' } }];
const args = { facts: [facts], patterns: [patterns] };
const query = () => vm.primitives.get('kernel.logic.query')(args, vm);
let t = performance.now(), before = vm.used;
const cold = query();
const coldMs = performance.now() - t, coldSteps = vm.used - before;
const runs = [];
for (let i = 0; i < 30; i++) {
    t = performance.now();
    query();
    runs.push(performance.now() - t);
}
before = vm.used;
query();
const warmSteps = vm.used - before;
t = performance.now();
const naive = facts.filter(f => unify(patterns[0], f.term, {}, true) !== null);
const naiveMs = performance.now() - t;
if (stable(cold.map(x => x.witnesses[0])) !== stable(naive.map(x => x.id)))
    throw Error('Index disagrees with scan');
const report = { environment: { node: process.version, icu: process.versions.icu, platform: process.platform, arch: process.arch, cpuReportedByHost: os.cpus()[0]?.model, logicalCPUsReportedByHost: os.cpus().length }, scope: 'Single-process shared CaaS measurements, not a performance guarantee or end-to-end large-KB benchmark', bootMs: boot, latency, index: { facts: facts.length, predicateBuckets: 1000, resultRows: cold.length, coldBuildAndQueryMs: coldMs, coldSteps, warmMedianMs: quantile(runs, .5), warmSteps, naiveSingleScanMs: naiveMs, sameResultsAsScan: true, note: 'Index is by predicate and fact-array identity; each changed fact array has a new index. All rule descriptors are still visited per inference round.' }, processRSSBytes: process.memoryUsage().rss };
await writeFile(path.join(HOME, 'reports/benchmark.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
