import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => { const r = new Set(one(a, "right", []).map(stable)); return one(a, "left", []).filter(x => !r.has(stable(x))); };
