import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => Object.fromEntries(Object.entries(a).map(([k, v]) => {
    if (v.length !== 1)
        throw Error("Record fields must have one value");
    return [k, v[0]];
}));
