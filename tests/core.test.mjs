import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdtemp, rm, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { parse } from '../src/parser.mjs';
import { VM, createVM, HOME } from '../src/vm.mjs';
import { unify, substitute, hash, stable } from '../src/generic.mjs';
import { reify, graphSource, validateGraph } from '../src/graph.mjs';
import { validatePack, auditProofs } from '../src/verify.mjs';
import { factsToSOP } from '../src/compiler.mjs';
import { createService } from '../src/service.mjs';
import { developmentCompletions } from './fixtures.mjs';
const template = await createVM();
const fresh = (options = {}) => { const vm = new VM(options); vm.modules = template.modules; vm.primitives = template.primitives; return vm; };
const pack = template.run('kb.default');
const manual = await readFile(path.join(HOME, 'examples/manual.txt'), 'utf8');
const variable = name => ({ kind: 'variable', name });
const input = 'Atlas retries requests. Atlas writes records. Atlas does not deduplicate requests. Harbor shares storage with Atlas.';
const term = (predicate, subject = 'Atlas', polarity = 'positive') => ({ predicate, subject, object: '', polarity, mode: 'asserted', scope: 'input' });
function invoke(vm, command, bindings) { return vm.primitives.get(command)(Object.fromEntries(Object.entries(bindings).map(([k, v]) => [k, [v]])), vm); }
test('parser: reject duplicate SSA producers', () => assert.throws(() => parse('@x core.true\n@x core.false\n@output result $x'), /duplicate/));
test('parser: reject unbound references', () => assert.throws(() => parse('@x core.identity value $missing\n@output result $x'), /unbound/));
test('parser: reject cyclic graph dependencies', () => assert.throws(() => parse('@a core.identity value $b\n@b core.identity value $a\n@output result $a'), /cyclic/));
test('parser: reject embedded object literals', () => assert.throws(() => parse('@x core.identity value {}\n@output result $x'), /quote literal/));
test('parser: reject dotted wire projection', () => assert.throws(() => parse('@input a\n@x core.identity value $a.b\n@output result $x'), /dotted/));
test('parser: reject old alternative operator rather than reinterpret', () => assert.throws(() => parse('@x core.true | core.false\n@output result $x')));
test('parser: reject unterminated strings', () => assert.throws(() => parse('@output result "abc'), /unterminated/));
test('runtime: forward references and comments in quoted strings', () => { const vm = fresh(); const ast = parse('@a core.identity value $b\n@b core.identity value "# @a remains a string" # comment\n@output result $a'); assert.equal(vm.runAST(ast), '# @a remains a string'); });
test('runtime: defaults preserve false and zero', () => { const vm = fresh(); const ast = parse('@input zero default 0\n@input no default false\n@r kernel.value.record a $zero b $no\n@output result $r'); assert.deepEqual(vm.runAST(ast), { a: 0, b: false }); });
test('runtime: missing input fails', () => assert.throws(() => fresh().run('core.identity'), /missing input/));
test('runtime: input cannot be mutated through a returned value', () => { const value = { a: [1] }; fresh().run('core.identity', { value }); assert.throws(() => value.a.push(2), TypeError); });
test('runtime: each demanded node executes once', () => { const vm = fresh({ trace: true }); const ast = parse('@x core.identity value 7\n@a kernel.seq.make item $x item $x\n@output result $a'); assert.deepEqual(vm.runAST(ast), [7, 7]); assert.equal(vm.trace.filter(x => x.module === '<memory>' && x.wire === 'x').length, 1); });
test('runtime: lazy branch does not call nonexistent alternative', () => { const vm = fresh(); assert.equal(invoke(vm, 'kernel.flow.choose', { condition: true, then: 'core.true', else: 'missing' }), true); });
test('runtime: fuel exhaustion throws, not a false logical answer', () => assert.throws(() => fresh({ fuel: 1 }).run('kb.default'), { code: 'RESOURCE_LIMIT' }));
test('runtime: trace truncation is explicit', () => { const vm = fresh({ trace: true, traceLimit: 1 }); vm.run('kb.default'); assert.equal(vm.stats().traceTruncated, true); });
test('unify: repeated variable is constrained', () => { const x = variable('x'); assert.deepEqual(unify([x, x], [7, 7]), { x: 7 }); assert.equal(unify([x, x], [7, 8]), null); });
test('unify: occurs check prevents infinite terms', () => assert.equal(unify(variable('x'), { inside: variable('x') }), null));
test('unify: exact and partial record matching differ', () => { assert.equal(unify({ a: 1 }, { a: 1, b: 2 }), null); assert.deepEqual(unify({ a: 1 }, { a: 1, b: 2 }, {}, true), {}); });
test('unify: arrays remain exact length under partial records', () => assert.equal(unify([variable('x')], [1, 2], {}, true), null));
test('substitute: resolve alias chain and reject unbound variables', () => { assert.equal(substitute(variable('x'), { x: variable('y'), y: 5 }), 5); assert.throws(() => substitute(variable('missing'), {}), /Unbound/); });
test('matcher: records for captures, literal phrases, no regex', () => { const vm = fresh(); const rows = invoke(vm, 'kernel.seq.match', { items: ['New', 'Atlas', 'writes', 'records'], pattern: [{ kind: 'capture', name: 'subject', min: 1, max: 3 }, 'writes', 'records'] }); assert.deepEqual(rows, [{ subject: ['New', 'Atlas'] }]); });
test('matcher: preserve distinct full-coverage segmentations', () => { const vm = fresh(); const rows = invoke(vm, 'kernel.seq.match', { items: ['a', 'b', 'c'], pattern: [{ kind: 'capture', name: 'x', min: 1, max: 2 }, { kind: 'capture', name: 'y', min: 1, max: 2 }] }); assert.equal(rows.length, 2); });
test('matcher: never accept an unmatched trailing token', () => { assert.deepEqual(invoke(fresh(), 'kernel.seq.match', { items: ['a', 'b'], pattern: ['a'] }), []); });
test('query: two-body join shares variable bindings', () => { const vm = fresh(), facts = [{ id: '1', term: { predicate: 'p', subject: 'A', object: 'B' } }, { id: '2', term: { predicate: 'q', subject: 'B' } }, { id: '3', term: { predicate: 'q', subject: 'C' } }]; const rows = invoke(vm, 'kernel.logic.query', { facts, patterns: [{ predicate: 'p', subject: variable('x'), object: variable('y') }, { predicate: 'q', subject: variable('y') }] }); assert.deepEqual(rows, [{ bindings: { x: 'A', y: 'B' }, witnesses: ['1', '2'] }]); });
test('query: budget overflow throws instead of silent top-k', () => assert.throws(() => invoke(fresh(), 'kernel.logic.query', { facts: [{ id: 'a', term: { p: 1 } }, { id: 'b', term: { p: 1 } }], patterns: [{ p: 1 }], limit: 1 }), { code: 'RESOURCE_LIMIT' }));
test('query: projection index preserves zero and empty string', () => { const vm = fresh(); const rows = invoke(vm, 'kernel.logic.query', { facts: [{ id: 'a', term: { p: 0 } }, { id: 'b', term: { p: '' } }], patterns: [{ p: 0 }], indexKey: 'p' }); assert.equal(rows[0].witnesses[0], 'a'); });
test('fixpoint: stable versus budget-stopped result are different', () => { const vm = fresh(); assert.equal(invoke(vm, 'kernel.flow.fix', { seed: 1, circuit: 'core.state', limit: 1 }).complete, true); const ast = parse('@input state\n@n kernel.math.op op "add" a $state b 1\n@output result $n', 'test.increment'); const own = new Map(vm.modules); vm.modules = own; vm.modules.set('test.increment', ast); const r = invoke(vm, 'kernel.flow.fix', { seed: 0, circuit: 'test.increment', limit: 2 }); assert.deepEqual(r, { value: 2, complete: false, iterations: 2 }); });
for (const c of developmentCompletions)
    test('semantic regression: ' + c.id, () => { const r = fresh().run('text.expand', { text: c.text, pack }); assert.deepEqual(r.selected.map(f => f.term.predicate).sort(), [...c.expected].sort()); });
test('semantic guard: ASCII single-quoted sentence is not an assertion', () => { const r = fresh().run('text.expand', { text: "'Atlas retries requests.' Atlas writes records. Atlas does not deduplicate requests.", pack }); assert.equal(r.text, ''); });
test('semantic parse: ambiguous lexical predicates cause abstention', () => { const vm = fresh(); const duplicate = { ...pack.lexicon.find(x => x.predicate === 'retries'), predicate: 'another' }; const r = vm.run('language.parse', { text: 'Atlas retries requests.', lexicon: [...pack.lexicon, duplicate] }); assert.equal(r.facts.length, 0); });
test('semantic inference: multi-entity join derives impact on the linked entity', () => { const r = fresh().run('text.expand', { text: input, pack }); assert.ok(r.selected.some(f => f.term.predicate === 'integration_review' && f.term.subject === 'Harbor')); assert.ok(!r.selected.some(f => f.term.predicate === 'duplicate_risk' && f.term.subject === 'Harbor')); });
test('semantic provenance: audit every original and derived fact', () => { const r = fresh().run('text.expand', { text: input, pack }); const audit = auditProofs(r.closure.raw, pack, { input, 'examples/manual.txt': manual }); assert.equal(audit.valid, true); assert.equal(audit.derivedFacts, 3); });
test('semantic provenance: corrupt head is independently detected', () => { const r = fresh().run('text.expand', { text: input, pack }); const facts = structuredClone(r.closure.raw); facts.at(-1).term.subject = 'Wrong'; assert.throws(() => auditProofs(facts, pack, { input, 'examples/manual.txt': manual }), /fingerprint/); });
test('semantic provenance: changed source document is rejected', () => { const r = fresh().run('text.expand', { text: input, pack }); assert.throws(() => auditProofs(r.closure.raw, pack, { input: input + ' altered', 'examples/manual.txt': manual }), /hash\/span/); });
test('support: later contradiction invalidates descendants without explosion', () => { const vm = fresh(); const r = vm.run('text.expand', { text: input, pack }); const negative = vm.run('language.parse', { text: 'Atlas deduplicates requests.', lexicon: pack.lexicon }).facts; const closure = vm.run('logic.run', { facts: [...r.closure.raw, ...negative], rules: pack.rules }); assert.ok(!closure.facts.some(f => ['duplicate_risk', 'dedup_review', 'integration_review'].includes(f.term.predicate))); assert.ok(closure.facts.some(f => f.term.predicate === 'retries')); });
test('support: no unrelated background fact is emitted as continuation', () => { const vm = fresh(); const background = vm.run('language.parse', { text: input.replaceAll('Atlas', 'Other').replaceAll('Harbor', 'Different'), lexicon: pack.lexicon }).facts; const r = vm.run('text.expand', { text: 'Atlas is a cache.', pack: { ...pack, facts: background } }); assert.equal(r.text, ''); });
test('completion: output is the exact suffix of a supported sentence', () => { const prefix = 'Atlas has a risk of '; const r = fresh().run('text.complete', { text: input, prefix, pack }); assert.equal(prefix + r.text, r.completedSentence); assert.equal(r.matched, true); });
test('completion: unsupported prefix abstains rather than inventing', () => { const r = fresh().run('text.complete', { text: input, prefix: 'The cure for ', pack }); assert.equal(r.text, ''); assert.equal(r.matched, false); });
test('summary: fully parsed assertions are aggregated without new facts', () => { const r = fresh().run('text.summarize_semantic', { text: input, pack, limit: 4 }); assert.equal(r.method, 'symbolic-aggregation'); assert.match(r.text, /Atlas retries requests, writes records and does not deduplicate requests\./); assert.doesNotMatch(r.text, /risk/); });
test('summary: modal input retains wording through extractive fallback', () => { const text = 'Atlas may retry requests. Atlas writes records.'; const r = fresh().run('text.summarize_semantic', { text, pack, limit: 2 }); assert.equal(r.method, 'extractive-fallback'); assert.match(r.text, /may retry/); });
test('summary: contested facts are never silently aggregated', () => { const r = fresh().run('text.summarize_semantic', { text: 'Atlas deduplicates requests. Atlas does not deduplicate requests.', pack, limit: 2 }); assert.equal(r.method, 'extractive-fallback'); });
test('summary: context-dependent candidate includes its predecessor', () => { const text = 'The evaluation concerned a device. It failed because calibration was missing. The office contains chairs.'; const r = fresh().run('text.summarize', { text, query: 'failed calibration missing', limit: 2 }); const selected = r.selected.map(x => x.index); assert.deepEqual(selected, [0, 1]); });
test('summary: context cluster may not exceed sentence budget', () => { const text = 'A device was tested. It failed because calibration was missing.'; const r = fresh().run('text.summarize', { text, query: 'failed calibration missing', limit: 1 }); assert.deepEqual(r.selected.map(x => x.index), [0]); });
test('summary: empty document yields an empty supported selection', () => { const r = fresh().run('text.summarize', { text: '' }); assert.equal(r.text, ''); assert.equal(r.selected.length, 0); });
test('segmentation: UTF-16 offsets preserve emoji and Romanian characters', () => {
    const text = '🧪 Experimentul a început. Rezultatul nu este concludent.';
    const sentences = invoke(fresh(), 'kernel.text.sentences', { text, locale: 'ro' });
    for (const s of sentences)
        assert.equal(text.slice(s.start, s.end), s.text);
});
test('counterfactual matrix: all 64 signed-evidence combinations', async () => {
    const states = ['unknown', 'positive', 'negative', 'both'], rows = [];
    const entries = ['retries', 'writes', 'deduplicates'].map(p => pack.lexicon.find(e => e.predicate === p));
    let i = 0;
    for (const r of states)
        for (const w of states)
            for (const d of states) {
                const name = 'Entity' + (++i), values = [r, w, d], sentences = [];
                for (let j = 0; j < 3; j++) {
                    if (['positive', 'both'].includes(values[j]))
                        sentences.push(name + ' ' + entries[j].positive + '.');
                    if (['negative', 'both'].includes(values[j]))
                        sentences.push(name + ' ' + entries[j].negative + '.');
                }
                const actual = fresh().run('text.expand', { text: sentences.join(' '), pack }).selected.map(f => f.term.predicate).sort();
                const expected = [];
                if (r === 'positive' && w === 'positive' && d === 'negative')
                    expected.push('duplicate_risk', 'dedup_review');
                if (r === 'positive' && d === 'positive')
                    expected.push('retry_protected');
                expected.sort();
                rows.push({ id: i, retries: r, writes: w, deduplicates: d, actual, expected, pass: stable(actual) === stable(expected) });
                assert.deepEqual(actual, expected, JSON.stringify(values));
            }
    await writeFile(path.join(HOME, 'reports/counterfactual-grid.json'), JSON.stringify({ cases: rows.length, passed: rows.filter(r => r.pass).length, scope: 'One rule-family Cartesian matrix, not 64 independent NLP tasks', rows }, null, 2));
});
test('KB admission: exact manual source spans and safe rule variables', () => assert.equal(validatePack(pack, { sources: { 'examples/manual.txt': manual } }).rules, 8));
test('KB admission: head variable must occur in rule body', () => { const bad = structuredClone(pack); bad.rules[0].head.subject = variable('unbound'); assert.throws(() => validatePack(bad), /unbound variable/); });
test('KB admission: nested function terms rejected by finite profile', () => { const bad = structuredClone(pack); bad.rules[0].head.subject = { constructor: 'invent', value: variable('service') }; assert.throws(() => validatePack(bad), /non-scalar/); });
test('KB admission: a missing realizer rejects promotion', () => { const bad = structuredClone(pack); bad.realizers = bad.realizers.filter(e => e.predicate !== 'integration_review'); assert.throws(() => validatePack(bad), /realization/); });
test('KB admission: forged source quote is rejected', () => { const bad = structuredClone(pack); bad.rules[0].source.quote = 'not in the manual'; assert.throws(() => validatePack(bad, { sources: { 'examples/manual.txt': manual } }), /hash\/span/); });
test('new domain: only SOP files add a library rule chain', async () => { const vm = await createVM(); await vm.load(path.join(HOME, 'examples/library_kb')); const kb = vm.run('library.pack'); const text = 'BookQ is on loan. BookQ is overdue.'; assert.equal(vm.run('text.expand', { text, pack: kb }).text, 'BookQ needs a return reminder. BookQ needs a loan review.'); const manual = await readFile(path.join(HOME, 'examples/library-manual.txt'), 'utf8'); validatePack(kb, { sources: { 'examples/library-manual.txt': manual } }); });
test('offline ingestion: serialize facts back to runnable SOP', () => { const vm = fresh(), parsed = vm.run('language.parse', { text: input, lexicon: pack.lexicon }), compiled = factsToSOP(parsed); const r = vm.runAST(parse(compiled.source, 'compiled.document')); assert.deepEqual(r.facts.map(f => f.term), parsed.facts.map(f => f.term)); assert.equal(r.coverage.complete, true); });
test('offline ingestion: uncovered sentence rejects automatic promotion', () => { const parsed = fresh().run('language.parse', { text: 'Atlas retries requests. We do not understand this sentence.', lexicon: pack.lexicon }); assert.throws(() => factsToSOP(parsed), /Unparsed/); const partial = factsToSOP(parsed, { allowPartial: true }); assert.equal(partial.report.covered, 1); assert.equal(partial.report.uncovered.length, 1); });
test('reflection: rewrite and execute a new graph without changing the original', () => { const r = fresh().run('reflection.demo'); assert.equal(r.original, 'The original circuit remains unchanged.'); assert.equal(r.rewritten, 'The rewritten circuit returns a different value.'); assert.equal(r.handle.kind, 'wire-handle'); });
test('reflection: stale quoted reference fails closed', () => { const vm = fresh(); const q = invoke(vm, 'kernel.registry.quote', { name: 'core.identity' }); assert.throws(() => invoke(vm, 'kernel.flow.call', { circuit: { ...q, contentHash: 'wrong' }, with: { value: 1 } }), /Stale/); });
test('reflection: unknown command and cyclic rewrite are rejected', () => { const vm = fresh(), g = reify(vm.modules.get('core.identity')); const unknown = { ...g, nodes: [{ id: 'a', command: 'unknown.command', args: {} }], output: { kind: 'value', name: 'a' } }; assert.throws(() => validateGraph(unknown, vm), /Unknown/); const cycle = { ...g, nodes: [{ id: 'a', command: 'core.identity', args: { value: [{ kind: 'value', name: 'a' }] } }], output: { kind: 'value', name: 'a' } }; assert.throws(() => validateGraph(cycle, vm), /cyclic/); });
test('reflection: unbound output and executable string injection are rejected', () => { const vm = fresh(), g = reify(vm.modules.get('core.identity')); assert.throws(() => validateGraph({ ...g, output: { kind: 'value', name: 'missing' } }, vm), /unbound/); assert.throws(() => validateGraph({ ...g, output: { kind: 'value', name: 'value\n@evil' } }, vm), /Invalid/); });
test('service: separate requests never share document facts', async () => { const execute = await createService(); assert.match(execute({ task: 'expand', text: input }).text, /duplicate/); assert.equal(execute({ task: 'expand', text: 'Atlas retries requests.' }).text, ''); });
test('service: task extraction preserves additional colons in source text', async () => { const vm = fresh(), p = vm.run('request.parse', { text: 'Summarize: The identifier is urn:example:thing.' }); assert.equal(p.text, ' The identifier is urn:example:thing.'); assert.equal(p.mode, 'summarize'); });
test('CLI: stdin text to supported stdout expansion', () => { const p = spawnSync(process.execPath, ['cli.mjs', 'expand'], { cwd: HOME, input, encoding: 'utf8' }); assert.equal(p.status, 0, p.stderr); assert.match(p.stdout, /risk of producing duplicate/); });
test('CLI: invalid option fails instead of being silently ignored', () => { const p = spawnSync(process.execPath, ['cli.mjs', 'expand', '--invalid'], { cwd: HOME, input, encoding: 'utf8' }); assert.equal(p.status, 1); });
test('parser: reject overflowing numeric literals', () => assert.throws(() => parse('@output result 1e999'), /non-finite/));
test('unification: prototype-like logical variable names do not alter prototypes', () => { const b = unify(variable('__proto__'), { p: 7 }); assert.equal(Object.getPrototypeOf(b), Object.prototype); assert.deepEqual(b.__proto__, { p: 7 }); assert.equal(Object.prototype.p, undefined); });
test('loader: failed staging leaves the registry unchanged', async () => {
    const root = await mkdtemp(path.join(tmpdir(), 'sop-load-'));
    try {
        await mkdir(path.join(root, 'core'));
        await writeFile(path.join(root, 'aaa.sop'), '@output result true');
        await writeFile(path.join(root, 'core/true.sop'), '@output result false');
        const vm = await createVM();
        await assert.rejects(() => vm.load(root), /Duplicate/);
        assert.equal(vm.modules.has('aaa'), false);
        assert.equal(vm.run('core.true'), true);
    }
    finally {
        await rm(root, { recursive: true, force: true });
    }
});
test('ABI: unknown and repeated primitive arguments fail', () => {
    assert.deepEqual(fresh().runAST(parse('@x kernel.value.record constructor 7 toString 8\n@output result $x')), { constructor: 7, toString: 8 });
    assert.throws(() => fresh().runAST(parse('@x kernel.value.hash value 1 typo 2\n@output result $x')), /unknown argument/);
    assert.throws(() => fresh().runAST(parse('@x kernel.value.hash value 1 value 2\n@output result $x')), /repeated argument/);
});
test('ABI: wrong scalar or collection types fail', () => { assert.throws(() => fresh().runAST(parse('@x kernel.seq.take items "not an array"\n@output result $x')), /invalid type/); assert.throws(() => invoke(fresh(), 'kernel.math.op', { op: 'add', a: '1', b: 2 }), /numeric/); });
test('ABI: arithmetic overflow cannot silently hash as null', () => assert.throws(() => invoke(fresh(), 'kernel.math.op', { op: 'mul', a: 1e308, b: 1e308 }), /Non-finite/));
