import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => String(one(a, "text", "")).normalize("NFKC").toLowerCase();
