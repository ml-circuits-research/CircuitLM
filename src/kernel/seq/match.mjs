import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
/** Bounded contiguous sequence matching; pattern items are literals or typed capture records. No regex grammar. */
export default (a, vm) => {
    const input = one(a, "items", []), pattern = one(a, "pattern", []), max = one(a, "limit", 128), fold = one(a, "casefold", false), out = [];
    const eq = (l, r) => fold && typeof l === "string" && typeof r === "string" ? l.normalize("NFKC").toLowerCase() === r.normalize("NFKC").toLowerCase() : stable(l) === stable(r);
    function scan(i, j, bindings) {
        vm.tick();
        if (j === pattern.length) {
            if (i === input.length) {
                out.push(bindings);
                if (out.length > max)
                    throw Error("Sequence ambiguity budget exceeded");
            }
            return;
        }
        const p = pattern[j];
        if (p && p.kind === "capture") {
            const lo = p.min ?? 1, hi = Math.min(p.max ?? input.length, input.length - i);
            for (let n = lo; n <= hi; n++) {
                const value = input.slice(i, i + n);
                if (Object.hasOwn(bindings, p.name) && !eq(bindings[p.name], value))
                    continue;
                scan(i + n, j + 1, { ...bindings, [p.name]: value });
            }
        }
        else if (i < input.length && eq(p, input[i]))
            scan(i + 1, j + 1, bindings);
    }
    scan(0, 0, {});
    return out;
};
