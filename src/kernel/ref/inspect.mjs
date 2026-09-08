import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => {
    const h = one(a, "handle");
    if (!h || h.kind !== "wire-handle")
        throw Error("Expected wire handle");
    return h;
};
