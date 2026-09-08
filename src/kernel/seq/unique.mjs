import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => {
    const key = one(a, "key", null), seen = new Set();
    return one(a, "items", []).filter(x => {
        const k = stable(key === null ? x : get(x, key));
        if (seen.has(k))
            return false;
        seen.add(k);
        return true;
    });
};
