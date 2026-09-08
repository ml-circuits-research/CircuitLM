import { readFile, readdir, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse } from './parser.mjs';
import { validateArgs } from './contracts.mjs';
import { hash, freeze, one } from './generic.mjs';
const HOME = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
async function walk(root, ext, prefix = '') {
    const out = [];
    for (const e of (await readdir(path.join(root, prefix), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
        if (e.isSymbolicLink())
            throw Error('Symlinks are not allowed in circuit roots');
        const rel = path.join(prefix, e.name);
        if (e.isDirectory())
            out.push(...await walk(root, ext, rel));
        else if (rel.endsWith(ext))
            out.push(rel);
    }
    return out;
}
export class VM {
    constructor({ fuel = 4000000, depth = 100, trace = false, traceLimit = 10000 } = {}) { this.modules = new Map(); this.primitives = new Map(); this.fuel = fuel; this.used = 0; this.maxDepth = depth; this.depth = 0; this.traceEnabled = trace; this.trace = []; this.traceLimit = traceLimit; this.traceTruncated = false; this.frames = 0; this.queryCache = new WeakMap(); }
    async load(root = path.join(HOME, 'sop'), { prefix = '' } = {}) {
        const staged = new Map(this.modules);
        for (const rel of await walk(root, '.sop')) {
            let name = prefix + rel.slice(0, -4).split(path.sep).join('.');
            if (!/^[A-Za-z][\w-]*(?:\.[\w-]+)*$/.test(name) || name.startsWith('kernel.'))
                throw Error('Invalid circuit path');
            if (staged.has(name))
                throw Error(`Duplicate module ${name}`);
            staged.set(name, parse(await readFile(path.join(root, rel), 'utf8'), name));
        }
        this.modules = staged;
        return this;
    }
    async boot() {
        for (const rel of await walk(path.join(HOME, 'src/kernel'), '.mjs')) {
            const name = 'kernel.' + rel.slice(0, -4).split(path.sep).join('.');
            const m = await import(pathToFileURL(path.join(HOME, 'src/kernel', rel)));
            if (typeof m.default !== 'function')
                throw Error(`No primitive implementation ${name}`);
            this.primitives.set(name, m.default);
        }
        await this.load();
        return this;
    }
    add(name, source) {
        if (this.modules.has(name) || this.primitives.has(name) || !/^[A-Za-z][\w-]*(?:\.[\w-]+)*$/.test(name))
            throw Error('Invalid or duplicate circuit name');
        this.modules.set(name, parse(source, name));
    }
    tick(n = 1) {
        this.used += n;
        if (this.used > this.fuel) {
            const e = Error(`Fuel exhausted after ${this.used} steps`);
            e.code = 'RESOURCE_LIMIT';
            throw e;
        }
    }
    run(name, bindings = {}) {
        const m = this.modules.get(name);
        if (!m)
            throw Error(`Unknown circuit ${name}`);
        return this.runAST(m, bindings);
    }
    runAST(m, bindings = {}) {
        const name = m.name;
        this.tick();
        if (++this.depth > this.maxDepth) {
            this.depth--;
            throw Error('Circuit call depth limit exceeded');
        }
        try {
            const values = new Map();
            const frame = ++this.frames;
            for (const [k, def] of m.inputs) {
                if (Object.hasOwn(bindings, k))
                    values.set(k, freeze(bindings[k]));
                else if (def.defaultValue)
                    values.set(k, def.defaultValue.value);
                else
                    throw Error(`${name}: missing input ${k}`);
            }
            const ev = ref => {
                if (ref.kind === 'literal')
                    return ref.value;
                const v = node(ref.name);
                if (ref.kind === 'value')
                    return v;
                return freeze({ kind: 'wire-handle', frame, module: name, wire: ref.name, valueHash: hash(v), producer: m.nodes.get(ref.name)?.command ?? 'input' });
            };
            const node = id => {
                if (values.has(id))
                    return values.get(id);
                this.tick();
                const n = m.nodes.get(id);
                const args = Object.fromEntries(Object.entries(n.args).map(([k, v]) => [k, v.map(ev)]));
                let value;
                if (this.primitives.has(n.command)) {
                    validateArgs(n.command, args);
                    value = this.primitives.get(n.command)(args, this);
                }
                else
                    value = this.run(n.command, Object.fromEntries(Object.entries(args).map(([k, v]) => {
                        if (v.length !== 1)
                            throw Error('Repeated arguments require a primitive collection constructor');
                        return [k, v[0]];
                    })));
                if (value === undefined)
                    throw Error(`${name}:${n.line}: undefined result`);
                freeze(value);
                values.set(id, value);
                if (this.traceEnabled) {
                    if (this.trace.length < this.traceLimit)
                        this.trace.push({ frame, module: name, wire: id, command: n.command, line: n.line, valueHash: hash(value) });
                    else
                        this.traceTruncated = true;
                }
                return value;
            };
            return ev(m.output);
        }
        finally {
            this.depth--;
        }
    }
    stats() { return { steps: this.used, frames: this.frames, traceNodes: this.trace.length, traceTruncated: this.traceTruncated }; }
}
export async function createVM(options = {}) { return new VM(options).boot(); }
export { HOME };
