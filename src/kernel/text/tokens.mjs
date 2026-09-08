import { one, all, stable, hash, get, isVar, unify, substitute } from '../../generic.mjs';
export default a => { const text = String(one(a, "text", "")), locale = one(a, "locale", "en"); return [...new Intl.Segmenter(locale, { granularity: "word" }).segment(text)].filter(x => x.isWordLike).map(x => one(a, "lower", false) ? x.segment.normalize("NFKC").toLowerCase() : x.segment); };
