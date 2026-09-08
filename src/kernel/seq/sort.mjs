import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => { const key = one(a, "key", null), dir = one(a, "descending", false) ? -1 : 1; return [...one(a, "items", [])].sort((a, b) => { a = key === null ? a : get(a, key); b = key === null ? b : get(b, key); return (a < b ? -1 : a > b ? 1 : 0) * dir; }); };
