import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
/** Generic conjunctive term matching. Record patterns are partial; array patterns are exact. */
export default (a, vm) => {
    const facts = one(a, "facts", []), patterns = one(a, "patterns", []), limit = one(a, "limit", 1000), indexKey = one(a, "indexKey", "predicate");
    let cached = vm.queryCache.get(facts);
    if (!cached) {
        cached = new Map();
        vm.queryCache.set(facts, cached);
    }
    let index = cached.get(indexKey);
    if (!index) {
        index = new Map();
        for (const f of facts) {
            vm.tick();
            const k = stable(get(f.term, indexKey));
            if (!index.has(k))
                index.set(k, []);
            index.get(k).push(f);
        }
        cached.set(indexKey, index);
    }
    let rows = [{ bindings: {}, witnesses: [] }];
    for (const p of patterns) {
        const next = [];
        for (const row of rows) {
            let k = p[indexKey];
            if (isVar(k))
                k = row.bindings[k.name];
            const options = k !== undefined && !isVar(k) ? index.get(stable(k)) ?? [] : facts;
            for (const f of options) {
                vm.tick();
                const b = unify(p, f.term, row.bindings, true);
                if (b !== null) {
                    next.push({ bindings: b, witnesses: [...row.witnesses, f.id] });
                    if (next.length > limit) {
                        const e = Error("Query row budget exceeded");
                        e.code = "RESOURCE_LIMIT";
                        throw e;
                    }
                }
            }
        }
        rows = next;
        if (!rows.length)
            break;
    }
    return rows;
};
