import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => {
    const groups = new Map(), key = one(a, "key");
    for (const item of one(a, "items", [])) {
        const k = stable(get(item, key));
        if (!groups.has(k))
            groups.set(k, { key: get(item, key), items: [] });
        groups.get(k).items.push(item);
    }
    return [...groups.values()];
};
