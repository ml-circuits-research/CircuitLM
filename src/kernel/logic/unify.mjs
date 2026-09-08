import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => { const bindings = unify(one(a, "left"), one(a, "right"), one(a, "bindings", {}), one(a, "partial", false)); return { success: bindings !== null, bindings: bindings ?? {} }; };
