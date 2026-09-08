/** SOP-R1: an explicit executable profile of the stable @ / $ / ~ lexical core. */
export function parse(source, name = '<memory>') {
    const tokens = [];
    let i = 0, line = 1;
    while (i < source.length) {
        const c = source[i];
        if (/\s/u.test(c)) {
            if (c === '\n')
                line++;
            i++;
            continue;
        }
        if (c === '#') {
            while (i < source.length && source[i] !== '\n')
                i++;
            continue;
        }
        if (c === '"') {
            const start = i++, ln = line;
            let escaped = false, closed = false;
            while (i < source.length) {
                const ch = source[i++];
                if (ch === '\n')
                    line++;
                if (ch === '"' && !escaped) {
                    closed = true;
                    break;
                }
                if (ch === '\\' && !escaped)
                    escaped = true;
                else
                    escaped = false;
            }
            if (!closed)
                throw Error(`${name}:${ln}: unterminated literal`);
            let value;
            try {
                value = JSON.parse(source.slice(start, i));
            }
            catch {
                throw Error(`${name}:${ln}: invalid string literal`);
            }
            tokens.push({ kind: 'literal', value, line: ln });
            continue;
        }
        const start = i;
        while (i < source.length && !/\s/u.test(source[i]) && source[i] !== '#')
            i++;
        const text = source.slice(start, i);
        tokens.push({ kind: 'word', value: text, line });
    }
    const chunks = [];
    for (const t of tokens) {
        if (t.kind === 'word' && t.value.startsWith('@'))
            chunks.push([t]);
        else {
            if (!chunks.length)
                throw Error(`${name}:${t.line}: expected @ declaration`);
            chunks.at(-1).push(t);
        }
    }
    const inputs = new Map(), nodes = new Map();
    let output = null;
    const ident = /^[A-Za-z][A-Za-z0-9_-]*$/;
    const value = t => {
        if (t.kind === 'literal')
            return { kind: 'literal', value: t.value };
        if (/^[\$~][A-Za-z][A-Za-z0-9_-]*$/.test(t.value))
            return { kind: t.value[0] === '$' ? 'value' : 'handle', name: t.value.slice(1) };
        if (/^-?(?:\d+\.?\d*|\d*\.\d+)(?:e[+-]?\d+)?$/i.test(t.value)) {
            const n = Number(t.value);
            if (!Number.isFinite(n))
                throw Error(`${name}:${t.line}: non-finite numeric literal`);
            return { kind: 'literal', value: n };
        }
        if (t.value === 'true' || t.value === 'false' || t.value === 'null')
            return { kind: 'literal', value: JSON.parse(t.value) };
        throw Error(`${name}:${t.line}: quote literal '${t.value}'; dotted wire references and embedded DSLs are not in SOP-R1`);
    };
    for (const [decl, ...rest] of chunks) {
        const id = decl.value.slice(1);
        if (!ident.test(id))
            throw Error(`${name}:${decl.line}: invalid declaration`);
        if (id === 'input') {
            const key = rest.shift()?.value;
            if (!key || !ident.test(key) || inputs.has(key) || nodes.has(key))
                throw Error(`${name}: duplicate/invalid input ${key}`);
            let defaultValue;
            if (rest.length) {
                if (rest.length !== 2 || rest[0].value !== 'default')
                    throw Error(`${name}: input expects optional default literal`);
                defaultValue = value(rest[1]);
                if (defaultValue.kind !== 'literal')
                    throw Error('Input default must be literal');
            }
            inputs.set(key, { defaultValue });
            continue;
        }
        if (id === 'output') {
            if (output || rest.length !== 2 || rest[0].value !== 'result')
                throw Error(`${name}: expected one @output result VALUE`);
            output = value(rest[1]);
            continue;
        }
        if (nodes.has(id) || inputs.has(id))
            throw Error(`${name}: duplicate producer @${id}`);
        const command = rest.shift()?.value;
        if (!command || !/^[a-zA-Z][\w-]*(?:\.[\w-]+)*$/.test(command))
            throw Error(`${name}: invalid command ${command}`);
        if (rest.length % 2)
            throw Error(`${name}:${decl.line}: arguments must be name/value pairs`);
        const args = Object.create(null);
        for (let j = 0; j < rest.length; j += 2) {
            const k = rest[j].value;
            if (!/^[\p{L}][\p{L}\p{N}_-]*$/u.test(k))
                throw Error(`${name}: invalid argument ${k}`);
            (args[k] ??= []).push(value(rest[j + 1]));
        }
        nodes.set(id, { id, command, args, line: decl.line });
    }
    if (!output)
        throw Error(`${name}: missing @output`);
    for (const ref of [...nodes.values()].flatMap(n => Object.values(n.args).flat()).concat([output])) {
        if (ref.kind !== 'literal' && !inputs.has(ref.name) && !nodes.has(ref.name))
            throw Error(`${name}: unbound reference ${ref.name}`);
    }
    const visited = new Set(), visiting = new Set();
    function visit(id) {
        if (inputs.has(id) || visited.has(id))
            return;
        if (visiting.has(id))
            throw Error(`${name}: cyclic dependency ${id}`);
        visiting.add(id);
        for (const r of Object.values(nodes.get(id).args).flat())
            if (r.kind !== 'literal')
                visit(r.name);
        visiting.delete(id);
        visited.add(id);
    }
    for (const id of nodes.keys())
        visit(id);
    return { name, inputs, nodes, output };
}
