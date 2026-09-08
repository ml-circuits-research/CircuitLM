/** Generic machine ABI validation. No language, knowledge-domain, or task semantics. */
const record = x => x !== null && typeof x === 'object' && !Array.isArray(x);
const types = { any: x => x !== undefined, string: x => typeof x === 'string', number: x => typeof x === 'number' && Number.isFinite(x), boolean: x => typeof x === 'boolean', array: Array.isArray, record, key: x => typeof x === 'string' || Number.isInteger(x), sized: x => typeof x === 'string' || Array.isArray(x), callable: x => typeof x === 'string' || record(x) };
// A trailing '?' means optional; '*' means a repeated named argument.
export const contracts = {
    'value.record': { '*': 'any' }, 'value.get': { value: 'any', key: 'key', default: 'any?' }, 'value.hash': { value: 'any' }, 'value.equal': { left: 'any', right: 'any' }, 'value.merge': { value: 'record*' },
    'seq.make': { item: 'any*' }, 'seq.concat': { items: 'array*' }, 'seq.flat': { items: 'array?', depth: 'number?' }, 'seq.count': { items: 'sized?' }, 'seq.take': { items: 'array?', count: 'number?', start: 'number?' }, 'seq.unique': { items: 'array?', key: 'key?' }, 'seq.sort': { items: 'array?', key: 'key?', descending: 'boolean?' }, 'seq.includes': { items: 'array?', item: 'any' }, 'seq.range': { count: 'number?' }, 'seq.group': { items: 'array?', key: 'key' }, 'seq.histogram': { items: 'array?' }, 'seq.intersection': { left: 'array?', right: 'array?' }, 'seq.difference': { left: 'array?', right: 'array?' }, 'seq.match': { items: 'array?', pattern: 'array?', limit: 'number?', casefold: 'boolean?' },
    'math.op': { op: 'string', a: 'any?', b: 'any?' },
    'text.tokens': { text: 'string?', locale: 'string?', lower: 'boolean?' }, 'text.sentences': { text: 'string?', locale: 'string?' }, 'text.lower': { text: 'string?' }, 'text.join': { items: 'array?', separator: 'string?' }, 'text.slice': { text: 'string?', start: 'number?', end: 'number?' }, 'text.prefix': { text: 'string?', prefix: 'string?' }, 'text.contains': { text: 'string?', part: 'string?' }, 'text.index': { text: 'string?', part: 'string?' }, 'text.trim': { text: 'string?' },
    'flow.map': { items: 'array?', circuit: 'string', with: 'record?' }, 'flow.filter': { items: 'array?', circuit: 'string', with: 'record?' }, 'flow.fold': { items: 'array?', seed: 'any', circuit: 'string', with: 'record?' }, 'flow.choose': { condition: 'boolean', then: 'string', else: 'string', with: 'record?' }, 'flow.call': { circuit: 'callable', with: 'record?' }, 'flow.fix': { seed: 'any', circuit: 'string', with: 'record?', limit: 'number?' },
    'logic.variable': { name: 'string' }, 'logic.unify': { left: 'any', right: 'any', bindings: 'record?', partial: 'boolean?' }, 'logic.substitute': { term: 'any', bindings: 'record?' }, 'logic.query': { facts: 'array?', patterns: 'array?', limit: 'number?', indexKey: 'string?' },
    'registry.quote': { name: 'string' }, 'ref.inspect': { handle: 'record' }, 'graph.validate': { program: 'record' }, 'graph.execute': { program: 'record', with: 'record?' }
};
export function validateArgs(name, args) {
    const spec = contracts[name.replace(/^kernel\./, '')];
    if (!spec)
        throw Error('Missing primitive contract ' + name);
    for (const [key, values] of Object.entries(args)) {
        const rule = Object.hasOwn(spec, key) ? spec[key] : spec['*'];
        if (!rule)
            throw Error(name + ': unknown argument ' + key);
        const repeat = rule.endsWith('*'), type = rule.replace(/[?*]$/, '');
        if (!repeat && values.length !== 1)
            throw Error(name + ': repeated argument ' + key);
        if (!values.every(types[type]))
            throw Error(name + ': invalid type for ' + key);
    }
    for (const [key, rule] of Object.entries(spec))
        if (key !== '*' && !/[?*]$/.test(rule) && !Object.hasOwn(args, key))
            throw Error(name + ': missing argument ' + key);
}
