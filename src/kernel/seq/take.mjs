import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => one(a, "items", []).slice(one(a, "start", 0), one(a, "start", 0) + one(a, "count", 1));
