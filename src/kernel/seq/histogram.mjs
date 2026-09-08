import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => {
    const m = Object.create(null);
    for (const t of one(a, "items", [])) {
        const k = String(t);
        m[k] = (m[k] ?? 0) + 1;
    }
    return m;
};
