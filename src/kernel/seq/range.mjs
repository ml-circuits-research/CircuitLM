import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => {
    const n = one(a, "count", 0);
    if (!Number.isInteger(n) || n < 0 || n > 100000)
        throw Error("Range bounds");
    return Array.from({ length: n }, (_, i) => i);
};
