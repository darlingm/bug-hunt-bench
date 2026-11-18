# Subscriber cost — how the multipliers were set

*Written 2026-11-18. The figures in force are the ones in
[`data/subscriber-rates.json`](../data/subscriber-rates.json); this file is the working behind them. Change
the two together, in the same commit, or not at all.*

The board's **Subscriber cost** divides a run's API cost (`cost_usd`) by its model family's
multiplier. It allocates part of a $100-or-more subscription's fee to the run, assuming the reader
uses the whole weekly allowance. A multiplier is

> API-priced dollars a full weekly allowance holds ÷ the plan's weekly fee

where the weekly fee is the monthly price × 12 / 52: **$23.08** for a $100 plan, **$46.15** for $200 and
**$115.38** for $500. A plan whose allowance holds $1,200 of API-priced usage a week at $100 a month has a
multiplier of 1,200 / 23.08 = **52**.

Nobody publishes these allowances in dollars. Every figure below is someone's measurement or estimate at
API list prices, and they disagree. The defaults are a judgment across them, which is why the board lets
a reader type their own.

| Rate | Default | Covers |
|---|---|---|
| Claude | **×52** | Every Claude model but Fable, run in Claude Code |
| Claude Fable | **×20** | Fable 5, 5.1, 5.2, run in Claude Code |
| OpenAI | **×27** | Every OpenAI model, run in Codex CLI |

## Where the figures come from

Two kinds of source, and the difference matters:

- **A research summary compiled on 2026-11-18**, which gathered published estimates from Wokey, AI Coding
  Daily, aiplans, SemiAnalysis, BenchLeader and Extra Headroom, combined repeated tests from one publisher
  into one figure, and averaged the publishers equally. The AI Coding Daily, SemiAnalysis, BenchLeader
  and Extra Headroom figures below are as that summary reported them; those articles were not re-read
  for this file.
- **Sources checked directly** include Wokey's 16 November sample, aiplans' 30 October Pro $200 test,
  the providers' plan documentation, Theo Browne's account measurements, mulletiq's meter logging,
  one Ultra account's request logs written up by Anthony Richter, and InventiveHQ's Codex session logs.

## Claude ×52

Every source converted to a multiplier:

| Source | Plan | API value a week | Multiple |
|---|---|---|---|
| Wokey (18 accounts, 16 Nov) | Ultra $200 | $1,576 | 34× |
| Wokey's Pro figure × Anthropic's stated 5× | Max $100 | $815 | 35× |
| AI Coding Daily (Opus 5.5 effort tests, averaged) | Max $100 | $912 | 40× |
| [Theo Browne](https://x.com/theo/status/2104683186215363058) (three accounts run to 0%: $2,086, $2,442, $2,182) | Ultra $200 | $2,237 | 48× |
| Equal-source average of the research summary | Max $100 | $1,179 | 51× |
| Equal-source average of the research summary | Ultra $200 | $2,383 | 52× |
| [mulletiq](https://mulletiq.com/blog/claude-fable-5-2-usage-limits) (one account) | Ultra $200 | $2,494 | 54× |
| SemiAnalysis (Opus 5.5 agentic workloads) | Max $100 | $1,321 | 57× |
| SemiAnalysis | Ultra $200 | $2,706 | 59× |
| BenchLeader (modelled, ~97% cache reads) | Ultra $200 | $2,868 | 62× |
| BenchLeader | Max $100 | $1,667 | 72× |
| [One Ultra account's request logs](https://anthonyrichter.com/the-order-you-burn-your-claude-limits/) (1.1M requests, Aug 11 – Nov 9) | Ultra $200 | $3,421 | 74× |

Wokey valued its Claude accounts at a common traffic mix with about 92% cache reads. Workloads
with different proportions of cached input and output can yield different API values for the
same share of an allowance. [Wokey's measurement method](https://wokey.ai/coding-plan-comparison)
This board's runs are heavier on cache still: across the 30 Opus 5.5 repo legs in
[`results/repo1-metrics.csv`](../results/repo1-metrics.csv) and
[`results/repo2-metrics.csv`](../results/repo2-metrics.csv), cache reads are 98.8% of recorded tokens.
Cache reads earn API dollars while using relatively little allowance, so Wokey's 34× may understate
the allowance for these runs. The other low readings cannot be judged the same way without their
traffic mix.

The summary rounded its working capacities to $1,200/week on Max and $2,400/week on Ultra.
Both give **52** API dollars per dollar of fee. Changing the Claude multiplier moves the non-Fable
Claude estimates together. Fable has its own multiplier.

**Left out:** Extra Headroom's sample of 153 subscribers (median weekly input cost $277 on Max, $688 on
Ultra). It measures what people *used*, not what the allowance *holds*, and excludes output tokens, so it
is a floor on usage, not an estimate of capacity. Claude Pro ($20) is out of scope: under $100, and it does
not include Fable in the plan allowance.

## Claude Fable ×20

[Anthropic's help article](https://support.claude.com/en/articles/15424964-claude-fable-5-on-your-plan)
says Max and Ultra can spend up to 50% of the weekly allowance on Fable, that Fable draws from the same
regular weekly limits as every other model, and that it uses them faster. It does not say how much faster.
Two things follow, and only the second sets the multiplier:

- **The 50% cap** limits how much Fable a subscriber can run in a week. It does not change what any one
  run costs, unless a reader uses nothing but Fable.
- **The burn rate** — how much allowance a dollar of Fable uses compared with a dollar of Opus — does.

Measured burn rates, Fable against Opus 5.5:

| Source | Fable | How measured | Fable / Opus, per API dollar | Claude ×52 ÷ ratio |
|---|---|---|---|---|
| [mulletiq](https://mulletiq.com/blog/claude-fable-5-2-usage-limits) | 5.2 | Regression over 370 hourly meter readings, Oct 23 – Nov 13, $368 of Fable (95% interval 1.2–3.0) | 2.2× | 24 |
| mulletiq | 5.2 | Direct: Fable meter 0→8% for $50.28, so ~$629 per half-week, against ~$1,247 of Opus | 2.0× | 26 |
| [One Ultra account's logs](https://anthonyrichter.com/the-order-you-burn-your-claude-limits/) | 5.2 | A Fable-only month $3,021, against $7,331 of Opus in the same half | 2.4× | 21 |
| Same account | 5.1 | A Fable-only month $2,197, same comparison | 3.3× | 16 |
| AI Coding Daily (via the research summary) | 5.2 | $29.40 for 5% of the Max $100 weekly meter, so $588 a week, against $1,200 of Opus | 2.0× | 25 |

Theo Browne's video "I think I figured it out" (2026-11-13) quotes the same account's figures — about
$3,000 a month of Fable against $14,000 of Opus on Ultra, "less than a fourth as much Fable". That ratio
folds the 50% cap (2×) into the burn rate (about 2.4×); for the cost of a single run only the burn rate
applies.

**20** sits between 16 (Fable 5.1, one account) and 24–26 (Fable 5.2, three readings). The board has
Fable 5, 5.1 and 5.2 rows and treats Fable as one family: the 5.1 reading says it burned faster than 5.2,
but that is one account, and a per-version split would rest on a single number.

## OpenAI ×27

On 29 October 2026 OpenAI doubled the Codex allowance on Pro $100 and Pro $500. Pro $200
subscribers who had the lower allowance moved to the higher limit. [OpenAI's Pro tiers](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers)

| Source | Plan | When | API value a week | Multiple |
|---|---|---|---|---|
| Wokey (six accounts) | Pro $200 | 16 Nov | $736 | 16× |
| [inventivehq](https://inventivehq.com/blog/codex-subscription-usage-measured) (Codex session logs, two clean windows) | Pro $100 | before | $330–380 | 14–16× |
| inventivehq, doubled for the change | Pro $100 | projected after | $660–760 | 29–33× |
| inventivehq | Pro $200 (10× tier) | before | $640–670 | 14–15× |
| inventivehq, projected 20× tier | Pro $200 | projected after | ~$1,300 | 28× |
| AI Coding Daily (selected Astra and Sol tests) | Pro $100 | — | $479–677 | 21–29× |
| SemiAnalysis, doubled by the research summary | Pro $100 | projected after | $487–610 | 21–26× |
| SemiAnalysis, doubled by the research summary | Pro $200 | projected after | $962–1,337 | 21–29× |
| aiplans (one input-heavy Astra test) | Pro $200 | 30 Oct | $1,222 | 26.5× |
| Equal-source average of the research summary | Pro $100 / $200 / $500 | after | $495 / $1,036 / $2,702 | 21 / 22 / 23× |

The board uses **27** as a pooled assumption for Pro $100, $200 and $500. It leans on the one direct
log measurement: InventiveHQ measured Pro $100 at $330–380 a week before the change, which projects to
29–33× once doubled. aiplans' post-change Pro $200 result (26.5×) corroborates it, conditionally: it is
a single input-heavy Astra workload, and aiplans notes the plan upgrade it relied on is user-reported
and not independently verified. Wokey's six-account sample (16×) sits well below, and the research
summary's tier estimates round to 22–23×; both are in the table so the spread behind the pooled figure
stays visible. The $500 figure is extrapolated. [aiplans quota measurements](https://aiplans.dev/en/quota-bench) · [Wokey plan measurements](https://wokey.ai/coding-plan-comparison)

## What would change a figure

- **mulletiq's full measured week** (planned for 19–26 November 2026) — the first Fable reading longer
  than one day. If it lands well outside 2–2.5×, revisit ×20.
- **Additional post-change Codex measurements**, particularly on Pro $100 and $500, would reduce
  reliance on tier scaling and allow a check on the pooled rate.
- **OpenAI's shared allowance.** On Plus and Pro, Codex already shares one agentic allowance with ChatGPT
  Work, Word, Excel and PowerPoint ([OpenAI on credits](https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans)),
  so a subscriber who uses those too has less of it for Codex; the ×27 assumes it all goes to Codex.
  ChatGPT conversations reportedly join a shared pool in December 2026, which could shrink it further.
- **Generation and model weights.** Before the change a GPT-5.6 run bought about 1.6× more API value per
  point of allowance than a GPT-6 run (inventivehq), and nobody has published how much allowance GPT-6
  Luna uses per dollar. The board applies one figure per family; a published per-model weight would be a
  reason to split one.
- **Any vendor added.** A new rate needs its own source table here before it goes in the JSON.

## The sources

- Anthropic Help Center: [Claude Fable on your plan](https://support.claude.com/en/articles/15424964-claude-fable-5-on-your-plan),
  and [usage credits for paid plans](https://support.claude.com/en/articles/12429409-manage-usage-credits-for-paid-claude-plans)
  (the separate weekly Fable limit on Max and Ultra)
- Theo Browne on X: [a $200 Claude Code sub, three accounts run to zero](https://x.com/theo/status/2104683186215363058),
  and the video "I think I figured it out" (YouTube, 2026-11-13), from about 3:00 and 16:30
- mulletiq: [Claude Fable 5.2 on Max and Ultra — we measured it](https://mulletiq.com/blog/claude-fable-5-2-usage-limits) (2026-11-14)
- Anthony Richter: [The order you burn your Claude limits in is worth $4,309](https://anthonyrichter.com/the-order-you-burn-your-claude-limits/)
  (one Ultra account's logs, from Jonathan Vitela); also reported by
  [FourWeekMBA](https://fourweekmba.com/ai-claude-ultra-limit-measured-at-14662-of-opus-5-5-a-month/)
- tokn.watch: [Claude's Fable weekly limit, explained](https://tokn.watch/blog/claude-max-fable-weekly-limit/)
  (the Fable meter on a live Max account)
- inventivehq: [Codex subscription usage, measured](https://inventivehq.com/blog/codex-subscription-usage-measured) (2026-10-04)
- OpenAI Help Center: [About ChatGPT Pro tiers](https://help.openai.com/en/articles/9793128-about-chatgpt-pro-tiers)
  (read 2026-11-18): Pro 100 and Pro 500 "now include twice their previous Work and Codex allowance. On Pro
  200, only the lower allowance doubled." The page does not date the change; 29 October is from the reports.
- Paying past the allowance: [OpenAI credits for flexible usage](https://help.openai.com/en/articles/12642688-using-credits-for-flexible-usage-in-chatgpt-personal-plans)
  (read 2026-11-18; "These credits are not API credits", and Codex has its own token rates) and
  [Claude usage bundles](https://support.claude.com/en/articles/14246112-buy-usage-bundles) (bundles cost up to
  30% less than standard credit rates) - why the caveat says the provider's credit pricing applies, not the API price
- Wokey: [weekly plan measurements](https://wokey.ai/coding-plan-comparison) (data of 2026-11-16);
  aiplans: [quota measurements](https://aiplans.dev/en/quota-bench) (Pro $200 verified 2026-10-30)
- Via the 18 November research summary, not re-read: AI Coding Daily, SemiAnalysis, BenchLeader, Extra Headroom
