import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => substitute(one(a, "term"), one(a, "bindings", {}));
