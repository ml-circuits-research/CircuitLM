import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default (a, vm) => {
    let value = one(a, "seed");
    const limit = one(a, "limit", 12);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
        throw Error("Fixpoint limit");
    for (let i = 0; i < limit; i++) {
        vm.tick();
        const next = vm.run(one(a, "circuit"), { ...one(a, "with", {}), state: value, iteration: i });
        if (stable(next) === stable(value))
            return { value: next, complete: true, iterations: i + 1 };
        value = next;
    }
    return { value, complete: false, iterations: limit };
};
