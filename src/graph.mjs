import { parse } from './parser.mjs';
import { hash } from './generic.mjs';
/** Serialize only the SOP lexical subset. JSON is an in-memory trace format, not an authoring language. */
export function refText(r) {
    if (!r || typeof r !== 'object')
        throw Error('Invalid graph reference');
    if (r.kind === 'value' || r.kind === 'handle') {
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(r.name))
            throw Error('Invalid graph wire');
        return (r.kind === 'value' ? '$' : '~') + r.name;
    }
    if (r.kind !== 'literal' || (r.value !== null && !['string', 'number', 'boolean'].includes(typeof r.value)))
        throw Error('Only scalar SOP literals are supported');
    if (typeof r.value === 'number' && !Number.isFinite(r.value))
        throw Error('Non-finite literal');
    return JSON.stringify(r.value);
}
export function graphSource(program) {
    if (!program || !Array.isArray(program.inputs) || !Array.isArray(program.nodes) || program.nodes.length > 512)
        throw Error('Invalid or oversized graph');
    const lines = [];
    for (const input of program.inputs) {
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(input.name))
            throw Error('Invalid input');
        lines.push('@input ' + input.name + (input.defaultValue ? ' default ' + refText(input.defaultValue) : ''));
    }
    for (const n of program.nodes) {
        if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(n.id) || !/^[A-Za-z][\w-]*(?:\.[\w-]+)*$/.test(n.command))
            throw Error('Invalid graph node');
        lines.push('@' + n.id + ' ' + n.command);
        for (const [k, vs] of Object.entries(n.args)) {
            if (!/^[\p{L}][\p{L}\p{N}_-]*$/u.test(k) || !Array.isArray(vs))
                throw Error('Invalid node arguments');
            for (const v of vs)
                lines.push('  ' + k + ' ' + refText(v));
        }
    }
    lines.push('@output result ' + refText(program.output));
    return lines.join('\n') + '\n';
}
export function reify(m) { return { kind: 'sop-graph', name: m.name, inputs: [...m.inputs].map(([name, d]) => ({ name, ...d })), nodes: [...m.nodes.values()], output: m.output }; }
export function validateGraph(program, vm) {
    const source = graphSource(program), m = parse(source, 'anonymous-' + hash(source).slice(0, 12));
    for (const n of m.nodes.values())
        if (!vm.modules.has(n.command) && !vm.primitives.has(n.command))
            throw Error('Unknown command ' + n.command);
    return { module: m, program: { ...reify(m), contentHash: hash(source) } };
}
