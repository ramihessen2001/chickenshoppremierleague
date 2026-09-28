/**
 * The league rules, grouped under headings. Each group is a bordered,
 * numbered card -- same shape as the league details table on the homepage --
 * and rule numbers run continuously across groups (01-12) rather than
 * restarting each section, so "rule 7" still means the same thing it always
 * did.
 */

interface RuleGroup {
  title: string
  rules: string[]
}

const RULE_GROUPS: RuleGroup[] = [
  {
    title: 'Format',
    rules: [
      'Games are played 6v6: five outfielders and one goalkeeper per team.',
      'Halves are 20 minutes each, 40 minutes total, with about 3 minutes for halftime.',
      'The clock never stops unless the ball leaves the field (the gated area).',
    ],
  },
  {
    title: 'Play',
    rules: [
      'A player cannot score directly off a kick-in unless the ball touches another player, including the goalkeeper, before it goes in -- except on a corner kick.',
      'If a player passes the ball back to the goalkeeper, the goalkeeper cannot pick it up.',
      'The offside rule will not be enforced.',
      'Slide tackles are not allowed. Blocks are permitted at the referee’s discretion.',
    ],
  },
  {
    title: 'Conduct',
    rules: [
      'Fighting, cussing, or any other misbehavior can result in a yellow or red card and potential disqualification from the rest of the league -- and possibly future leagues.',
      'Blue cards will be enforced. A blue card ejects a player from the game for about two minutes, during which their team plays a man down.',
      'The referee’s calls are final. Arguing a call may result in a yellow card.',
    ],
  },
  {
    title: 'Gear',
    rules: [
      'No jewelry is allowed during games.',
      'Players must wear a jersey with their name on it at every game, or they will receive a yellow card.',
    ],
  },
]

/** Precomputed once at module load so the component never mutates during render. */
const NUMBERED_RULE_GROUPS: { title: string; rules: { number: number; text: string }[] }[] =
  (() => {
    let n = 0
    return RULE_GROUPS.map((group) => ({
      title: group.title,
      rules: group.rules.map((text) => ({ number: ++n, text })),
    }))
  })()

export function RulesList() {
  return (
    <div className="space-y-10">
      {NUMBERED_RULE_GROUPS.map((group) => (
        <section key={group.title}>
          <h2 className="text-[20px] font-semibold text-ink">{group.title}</h2>
          <ol className="mt-4 rounded-lg border border-hairline bg-surface">
            {group.rules.map(({ number, text }) => (
              <li
                key={number}
                className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 border-t border-hairline px-5 py-4 first:border-t-0 sm:px-6"
              >
                <span className="tabular font-util text-[13px] text-ink-tertiary">
                  {String(number).padStart(2, '0')}
                </span>
                <p className="text-[15px] leading-relaxed text-ink">{text}</p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}
