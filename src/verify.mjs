import { hash, isVar, stable } from './generic.mjs';
/** Profile-level admission/audit tooling, not language interpretation or inference. */
const FIELDS = ['predicate', 'subject', 'object', 'polarity', 'mode', 'scope'];
function fail(message) { throw Error('Verification: ' + message); }
function vars(term) { return new Set(Object.values(term).filter(isVar).map(x => x.name)); }
function checkTerm(t, pattern = false) {
    if (!t || Object.keys(t).sort().join() !== [...FIELDS].sort().join())
        fail('term schema');
    for (const k of FIELDS)
        if (typeof t[k] !== 'string' && !(pattern && isVar(t[k]) && ['subject', 'object'].includes(k)))
            fail('non-scalar or unsupported variable in ' + k);
    if (!t.predicate || !['positive', 'negative'].includes(t.polarity) || !['asserted', 'possible', 'required'].includes(t.mode) || !t.scope)
        fail('invalid term enum');
}
export function verifySource(s, sources) {
    if (!s || typeof s.source !== 'string' || typeof s.hash !== 'string' || !Number.isInteger(s.start) || !Number.isInteger(s.end) || s.start < 0 || s.end < s.start || typeof s.quote !== 'string')
        fail('source schema');
    if (sources !== undefined) {
        const text = sources[s.source];
        if (typeof text !== 'string')
            fail('unknown source ' + s.source);
        if (hash(text) !== s.hash || text.slice(s.start, s.end) !== s.quote)
            fail('source hash/span mismatch');
    }
}
export function validatePack(pack, { sources } = {}) {
    for (const k of ['facts', 'lexicon', 'rules', 'realizers'])
        if (!Array.isArray(pack?.[k]))
            fail('pack field ' + k);
    const ids = new Set(), realizers = new Map();
    for (const e of pack.realizers) {
        if (typeof e.predicate !== 'string' || realizers.has(e.predicate))
            fail('duplicate/invalid realizer');
        realizers.set(e.predicate, e);
    }
    for (const rule of pack.rules) {
        if (typeof rule.id !== 'string' || ids.has(rule.id) || !Array.isArray(rule.body) || rule.body.length < 1 || rule.body.length > 8)
            fail('rule identity/body');
        ids.add(rule.id);
        const bound = new Set();
        for (const p of rule.body) {
            checkTerm(p, true);
            if (p.mode !== 'asserted')
                fail('modal antecedents unsupported in R1');
            for (const v of vars(p))
                bound.add(v);
        }
        checkTerm(rule.head, true);
        for (const v of vars(rule.head))
            if (!bound.has(v))
                fail('unbound variable in rule head');
        if (rule.head.mode !== 'asserted')
            fail('modal conclusion unsupported in R1');
        const realizer = realizers.get(rule.head.predicate);
        if (typeof realizer?.[rule.head.polarity] !== 'string')
            fail('missing head realization');
        verifySource(rule.source, sources);
    }
    for (const f of pack.facts) {
        checkTerm(f.term);
        if (f.id !== hash(f.term) || !Array.isArray(f.sources))
            fail('invalid fact');
        for (const s of f.sources)
            verifySource(s, sources);
    }
    for (const e of pack.lexicon) {
        if (typeof e.predicate !== 'string' || !Array.isArray(e.forms) || !realizers.has(e.predicate))
            fail('lexicon entry');
        for (const form of e.forms) {
            if (!Array.isArray(form.tokens) || form.tokens.length < 1)
                fail('empty form');
        }
    }
    return { rules: pack.rules.length, facts: pack.facts.length, lexicon: pack.lexicon.length, sourceSpansChecked: sources !== undefined };
}
/** Independent ground matcher: does not use kernel unification, substitution or query. */
function groundMatch(pattern, ground, bindings) {
    for (const k of FIELDS) {
        const p = pattern[k], v = ground[k];
        if (isVar(p)) {
            if (Object.hasOwn(bindings, p.name) && bindings[p.name] !== v)
                fail('inconsistent proof binding');
            bindings[p.name] = v;
        }
        else if (p !== v)
            fail('proof antecedent mismatch');
    }
}
function groundHead(pattern, bindings) {
    return Object.fromEntries(FIELDS.map(k => {
        const p = pattern[k];
        if (isVar(p)) {
            if (!Object.hasOwn(bindings, p.name))
                fail('proof head unbound');
            return [k, bindings[p.name]];
        }
        return [k, p];
    }));
}
export function auditProofs(facts, pack, sources) {
    const byId = new Map(facts.map(f => [f.id, f])), rules = new Map(pack.rules.map(r => [r.id, r]));
    let roots = 0, derived = 0;
    const visiting = new Set(), done = new Set();
    function visit(f) {
        if (done.has(f.id))
            return;
        if (visiting.has(f.id))
            fail('proof cycle');
        visiting.add(f.id);
        checkTerm(f.term);
        if (f.id !== hash(f.term) || f.proofId !== hash({ term: f.term, parents: f.parents, rule: f.rule, sources: f.sources }))
            fail('fact/proof fingerprint');
        for (const s of f.sources)
            verifySource(s, sources);
        if (!f.rule) {
            if (f.parents.length !== 0 || f.sources.length < 1)
                fail('invalid source fact');
            roots++;
        }
        else {
            const rule = rules.get(f.rule);
            if (!rule || f.parents.length !== rule.body.length || stable(f.sources) !== stable([rule.source]))
                fail('invalid rule witness');
            const b = {};
            for (let i = 0; i < f.parents.length; i++) {
                const parent = byId.get(f.parents[i]);
                if (!parent)
                    fail('missing parent');
                visit(parent);
                groundMatch(rule.body[i], parent.term, b);
            }
            if (stable(groundHead(rule.head, b)) !== stable(f.term))
                fail('invalid derived head');
            derived++;
        }
        visiting.delete(f.id);
        done.add(f.id);
    }
    for (const f of facts)
        visit(f);
    return { facts: done.size, sourceFacts: roots, derivedFacts: derived, valid: true, scope: 'structural derivation and source integrity; not validation of the source meaning or truth' };
}
