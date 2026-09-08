import { createHash } from 'node:crypto';
export const one = (a, k, d = undefined) => a[k]?.length ? a[k][0] : d;
export const all = (a, k) => a[k] ?? [];
export function stable(x) {
    if (x === null || typeof x !== 'object')
        return JSON.stringify(x);
    if (Array.isArray(x))
        return '[' + x.map(stable).join(',') + ']';
    return '{' + Object.keys(x).sort().map(k => JSON.stringify(k) + ':' + stable(x[k])).join(',') + '}';
}
export const hash = x => createHash('sha256').update(stable(x)).digest('hex').slice(0, 24);
export const isVar = x => x && typeof x === 'object' && x.kind === 'variable' && typeof x.name === 'string';
export function walk(x, b) {
    const seen = new Set();
    while (isVar(x) && Object.hasOwn(b, x.name)) {
        if (seen.has(x.name))
            throw Error('Cyclic substitution');
        seen.add(x.name);
        x = b[x.name];
    }
    return x;
}
function occurs(name, x, b) {
    x = walk(x, b);
    if (isVar(x))
        return x.name === name;
    if (x && typeof x === 'object')
        return Object.values(x).some(v => occurs(name, v, b));
    return false;
}
export function unify(a, b, bindings = Object.create(null), partial = false) {
    const env = Object.assign(Object.create(null), bindings);
    const go = (l, r) => {
        l = walk(l, env);
        r = walk(r, env);
        if (isVar(l) && isVar(r) && l.name === r.name)
            return true;
        if (isVar(l)) {
            if (occurs(l.name, r, env))
                return false;
            env[l.name] = r;
            return true;
        }
        if (isVar(r)) {
            if (occurs(r.name, l, env))
                return false;
            env[r.name] = l;
            return true;
        }
        if (l === r)
            return true;
        if (l === null || r === null || typeof l !== 'object' || typeof r !== 'object')
            return false;
        if (Array.isArray(l) !== Array.isArray(r))
            return false;
        const keys = Object.keys(l);
        if (!partial && keys.length !== Object.keys(r).length)
            return false;
        if (Array.isArray(l) && l.length !== r.length)
            return false;
        return keys.every(k => Object.hasOwn(r, k) && go(l[k], r[k]));
    };
    return go(a, b) ? Object.fromEntries(Object.entries(env)) : null;
}
export function substitute(t, b) {
    t = walk(t, b);
    if (isVar(t))
        throw Error(`Unbound logic variable ${t.name}`);
    if (Array.isArray(t))
        return t.map(x => substitute(x, b));
    if (t && typeof t === 'object')
        return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, substitute(v, b)]));
    return t;
}
export function freeze(x) {
    if (x && typeof x === 'object' && !Object.isFrozen(x)) {
        for (const v of Object.values(x))
            freeze(v);
        Object.freeze(x);
    }
    return x;
}
export function get(x, key, d = null) {
    if (x == null)
        return d;
    return Object.hasOwn(x, key) ? x[key] : d;
}
