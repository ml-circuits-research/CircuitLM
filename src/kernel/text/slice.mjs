import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => String(one(a, "text", "")).slice(one(a, "start", 0), one(a, "end", undefined));
