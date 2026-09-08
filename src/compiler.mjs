/** Offline serializer only: interpretation already happened in SOP. No rule induction is claimed. */
export function factsToSOP(parsed, { source = 'input', allowPartial = false } = {}) {
    const covered = new Set(parsed.facts.map(f => f.sentence));
    const report = { sentences: parsed.sentences.length, covered: covered.size, uncovered: parsed.sentences.filter(s => !covered.has(s.index)).map(s => ({ index: s.index, text: s.text })), mode: 'CNL facts only; not automatic manual-rule extraction' };
    if (report.uncovered.length && !allowPartial)
        throw Object.assign(Error('Unparsed source spans; inspect the coverage report or use --allow-partial explicitly'), { coverage: report });
    const lines = ['# Generated from accepted SOP interpretations. Review before promoting into a KB.'];
    let n = 0;
    const literal = x => JSON.stringify(x);
    for (const fact of parsed.facts) {
        const i = n++;
        lines.push(`@term${i} sem.term`);
        for (const [k, v] of Object.entries(fact.term))
            lines.push(`  ${k} ${literal(v)}`);
        const s = fact.sources[0];
        lines.push(`@source${i} kernel.value.record source ${literal(source)} hash ${literal(s.hash)} start ${s.start} end ${s.end} quote ${literal(s.quote)}`);
        lines.push(`@sources${i} kernel.seq.make item $source${i}`, `@parents${i} kernel.seq.make`, `@fact${i} sem.fact term $term${i} sources $sources${i} parents $parents${i} sentence ${fact.sentence}`);
    }
    lines.push('@facts kernel.seq.make ' + Array.from({ length: n }, (_, i) => `item $fact${i}`).join(' '));
    lines.push(`@coverage kernel.value.record sentences ${report.sentences} covered ${report.covered} complete ${report.uncovered.length === 0}`);
    lines.push('@result kernel.value.record facts $facts coverage $coverage', '@output result $result');
    return { source: lines.join('\n') + '\n', report };
}
