/** Authored evaluation fixtures. Synthetic and small; not an external language benchmark. */
export const summaryCases = [
    { id: 'dev-cache', split: 'development', gold: [0, 3, 5], sentences: [
            'The team evaluated a cache to reduce document retrieval latency.',
            'The planning meeting took place on a Tuesday.',
            'The office has a blue door and a large conference table.',
            'The cache reduced median retrieval latency by 40 percent.',
            'The demonstration used the standard presentation template.',
            'However, stale entries remained after updates, so the team delayed deployment.'
        ] },
    { id: 'dev-sensor', split: 'development', gold: [0, 3, 5], sentences: [
            'The experiment tested whether a low-cost sensor could detect water leaks.',
            'The sensor enclosure was painted grey.',
            'The project notebook includes photographs of the laboratory.',
            'The sensor detected 18 of 20 leaks in the controlled trial.',
            'The team met with a supplier at the annual exhibition.',
            'However, performance in outdoor conditions has not been measured.'
        ] },
    { id: 'dev-queue', split: 'development', gold: [0, 2, 5], sentences: [
            'The service lost messages during a simulated power failure.',
            'The incident review started at ten in the morning.',
            'The worker acknowledged messages before persisting the corresponding records.',
            'The report used a new font and a revised company logo.',
            'Engineers stored the meeting notes in the internal wiki.',
            'The team decided to persist records before acknowledging messages.'
        ] },
    { id: 'dev-library', split: 'development', gold: [0, 3, 5], sentences: [
            'The library piloted extended evening opening hours for students.',
            'The reading room contains twelve green chairs.',
            'The entrance sign was replaced during the same month.',
            'Evening attendance increased by 30 percent during the pilot.',
            'The pilot was discussed in a regular staff meeting.',
            'However, staffing costs exceeded the allocated budget.'
        ] },
    { id: 'dev-ro-cache', split: 'development', locale: 'ro', gold: [0, 2, 5], sentences: [
            'Echipa a evaluat un cache pentru a reduce latența căutărilor în documente.',
            'Sala de ședințe are o tablă nouă.',
            'Cache-ul a redus latența mediană cu 35 la sută.',
            'Raportul include fotografii ale biroului.',
            'Prezentarea a folosit noul șablon grafic.',
            'Totuși, actualizările au lăsat intrări învechite, iar echipa a decis să amâne lansarea.'
        ] },
    { id: 'dev-negative-result', split: 'development', gold: [0, 3, 5], sentences: [
            'The researchers tested whether extra training data improved classification accuracy.',
            'The laboratory newsletter mentioned the start of the experiment.',
            'The experiment ran on equipment borrowed from another department.',
            'Accuracy remained at 82 percent after the additional data were included.',
            'The team archived the installation instructions with the report.',
            'The result did not support the claim that more data would improve this classifier.'
        ] },
    { id: 'dev-long-distractor', split: 'development', gold: [0, 2, 5], sentences: [
            'The migration aimed to reduce service interruption during database upgrades.',
            'The team discussed database naming conventions, database documentation, database logos, and database meeting schedules in a long administrative session.',
            'The new migration procedure reduced interruption from twelve minutes to ninety seconds.',
            'The presentation used a photograph of the company building.',
            'The migration team received updated stationery.',
            'However, the rollback procedure failed and must be repaired before production use.'
        ] },
    { id: 'dev-query', split: 'development', query: 'What prevented deployment?', gold: [3, 5], limit: 2, sentences: [
            'The team evaluated a new retrieval service.',
            'The retrieval service reduced median latency by 25 percent.',
            'The service dashboard has three configurable panels.',
            'The service failed the access-control test required for deployment.',
            'The evaluation was recorded in the internal project tracker.',
            'The deployment was blocked until access-control failures were corrected.'
        ] },
    // Holdout fixtures are evaluated after the development revision. Their grammar and annotation were authored by the same assistant.
    { id: 'holdout-backup', split: 'holdout', gold: [0, 3, 6], sentences: [
            'The company tested whether its backups could restore the complete customer archive.',
            'The backup dashboard uses a new colour scheme.',
            'The test coordinator reserved a room near reception.',
            'The restoration recovered all files but took eleven hours instead of the four-hour target.',
            'The backup team updated the meeting calendar.',
            'The archive cabinets were labelled alphabetically.',
            'The team decided to improve restore speed before accepting the backup process.'
        ] },
    { id: 'holdout-bus', split: 'holdout', gold: [0, 3, 5], sentences: [
            'The town piloted a direct bus route between the university and the railway station.',
            'The buses carried temporary blue signs.',
            'The route leaflet was printed on recycled paper.',
            'Average journey time fell from 28 minutes to 17 minutes.',
            'The consultation received several comments about the leaflet design.',
            'However, weekend demand remained too low to justify the proposed timetable.'
        ] },
    { id: 'holdout-compression', split: 'holdout', gold: [0, 3, 5], sentences: [
            'The study compared two lossless compression methods for research archives.',
            'The authors used the same document template as the previous study.',
            'The laboratory website announced the experiment.',
            'The new method reduced archive size by 18 percent but doubled decompression time.',
            'The presentation ended with photographs of the laboratory.',
            'The authors recommended the method for infrequently accessed archives rather than interactive workloads.'
        ] },
    { id: 'holdout-ro-school', split: 'holdout', locale: 'ro', gold: [0, 2, 5], sentences: [
            'Școala a testat un program de tutorat pentru elevii care aveau dificultăți la matematică.',
            'Profesorii au schimbat afișele de pe coridor.',
            'Rezultatele medii au crescut cu 12 puncte după opt săptămâni de tutorat.',
            'Directorul a prezentat fotografii din sala de clasă.',
            'Raportul a fost distribuit la ședința lunară.',
            'Totuși, studiul nu a avut un grup de control, deci efectul tutoratului rămâne incert.'
        ] },
    { id: 'holdout-ro-network', split: 'holdout', locale: 'ro', gold: [0, 3, 5], sentences: [
            'Echipa a testat o nouă configurație a rețelei pentru a elimina întreruperile.',
            'Administratorii au cumpărat etichete noi pentru cabluri.',
            'Documentația folosește un antet diferit.',
            'Numărul întreruperilor a scăzut de la zece la două pe săptămână.',
            'Sala serverelor a primit un dulap nou.',
            'Totuși, conexiunea de rezervă nu a funcționat în testul de avarie.'
        ] },
    { id: 'holdout-open-science', split: 'holdout', gold: [0, 3, 5], sentences: [
            'The project published an executable reproduction of the simulation study.',
            'The repository contains a banner designed by the communications team.',
            'The authors presented the repository at a departmental meeting.',
            'Independent reruns reproduced the main trend but not the reported confidence interval.',
            'The issue tracker also contains requests for a different website theme.',
            'The mismatch was traced to an undocumented filtering step in the original analysis.'
        ] },
    { id: 'holdout-no-cue', split: 'holdout', gold: [0, 3, 5], sentences: [
            'The museum introduced a timed-entry system to shorten entrance queues.',
            'Tickets include a small illustration of the building.',
            'The gift shop sells postcards with the same illustration.',
            'Median waiting time changed from 45 minutes to 16 minutes.',
            'The museum repainted its staff room during the trial.',
            'Visitors arriving without online reservations were turned away even when galleries were half empty.'
        ] },
    { id: 'holdout-privacy', split: 'holdout', gold: [0, 2, 5], sentences: [
            'The team evaluated a method for sharing aggregate research data without releasing individual records.',
            'The project held a workshop with a new slide template.',
            'The released aggregates preserved the overall trend but obscured the smallest subgroups.',
            'The workshop catering included vegetarian sandwiches.',
            'The project website has a redesigned footer.',
            'The report warns that useful aggregate accuracy does not establish privacy against every attack.'
        ] },
    { id: 'holdout-garden', split: 'holdout', gold: [0, 3, 5], sentences: [
            'The gardeners compared two irrigation schedules for newly planted trees.',
            'The garden entrance received a new wooden sign.',
            'The volunteer coordinator changed the meeting location.',
            'Trees watered twice a week survived at the same rate as trees watered every day.',
            'The garden newsletter included pictures of the sign.',
            'The twice-weekly schedule used 55 percent less water during the trial.'
        ] },
    { id: 'holdout-ro-archive', split: 'holdout', locale: 'ro', gold: [0, 2, 5], sentences: [
            'Arhiva a testat recunoașterea automată a textului pentru documente istorice.',
            'Dosarele au primit etichete colorate.',
            'Sistemul a transcris corect 94 la sută dintre caracterele din paginile tipărite.',
            'Echipa a reorganizat rafturile din depozit.',
            'Prezentarea a inclus imagini ale clădirii.',
            'Totuși, precizia a scăzut la 61 la sută pentru documentele scrise de mână.'
        ] }
];
const base = 'Atlas writes records. Atlas does not deduplicate requests.';
export const developmentCompletions = [
    { id: 'positive-chain', text: 'Atlas retries requests. ' + base, expected: ['duplicate_risk', 'dedup_review'] },
    { id: 'explicit-negative', text: 'Atlas does not retry requests. ' + base, expected: [] },
    { id: 'modal-may', text: 'Atlas may retry requests. ' + base, expected: [] },
    { id: 'modal-must', text: 'Atlas must retry requests. ' + base, expected: [] },
    { id: 'unknown-is-not-negative', text: 'Atlas retries requests. Atlas writes records.', expected: [] },
    { id: 'conflict', text: 'Atlas retries requests. Atlas deduplicates requests. ' + base, expected: [] },
    { id: 'reported-speech', text: 'Mara said that Atlas retries requests. ' + base, expected: [] },
    { id: 'conditional', text: 'If Atlas retries requests, the operation may fail. ' + base, expected: [] },
    { id: 'quoted-assertion', text: '"Atlas retries requests." ' + base, expected: [] },
    { id: 'question', text: 'Atlas retries requests? ' + base, expected: [] },
    { id: 'unknown-subject', text: 'Orion retries requests. ' + base, expected: [] },
    { id: 'protected-retry', text: 'Atlas retries requests. Atlas deduplicates requests.', expected: ['retry_protected'] },
    { id: 'worker-loss', text: 'Delta is a worker. Delta acknowledges messages before persisting them. Delta uses volatile memory.', expected: ['loss_risk', 'durability_review'] },
    { id: 'cache-stale', text: 'Cedar is a cache. Cedar has an expiration limit. Cedar does not invalidate entries after updates.', expected: ['stale_risk', 'cache_review'] },
    { id: 'empty-evidence', text: 'The meeting ended after lunch.', expected: [] }
];
