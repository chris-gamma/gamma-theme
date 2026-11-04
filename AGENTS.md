# Gamma project guidance

Shared instructions for Codex, GitHub Copilot and other coding agents. Read [README.md](README.md) for task-relevant setup and maintenance context; a Markdown link alone does not establish that its contents were loaded.

## Scope and decisions

- Work inside this repository. Preserve existing edits, historical commits, vendor tags, attribution and [LICENSE.md](LICENSE.md). Start bounded work from current `dev` on a descriptive `feature/*` branch; validate and review the complete diff before local integration. Keep `main` for authorized releases.
- Make minimal, targeted changes. Preserve deliberate Gamma customizations; inspect relevant code and history before replacing them. Avoid unrelated refactors, dependency changes, formatting or file edits.
- Resolve technical decisions in this order: explicit user instructions; current Shopify platform requirements and supported behavior; Horizon architecture and conventions; Gamma's established conventions and customizations; general development practices. Identify conflicts explicitly. This order does not authorize unsupported or unsafe implementations, or replacing working Gamma behavior merely because a newer pattern exists.
- Do not attempt to resolve bugs or issues in upstream Horizon code. Focus on authorized changes within the Gamma project scope. Do not introduce workarounds or modifications for upstream issues unless explicitly authorized. Review and report upstream issues in the response as appropriate.
- Keep work local. Store authentication, connections, previews, uploads, deployments, publication, synchronization and store changes require explicit authorization, including development and unpublished themes. External service writes and hosting operations also require authorization. Never infer a store from a branch name.
- Do not add hooks, scripts, skills, workflows, CI or agent tooling unless explicitly requested or authorized. The buildless-maintenance rule below authorizes relevant local configuration, npm check commands and development dependencies; other tooling still requires explicit authorization.

## Documentation and tests

- Create documentation, tests, fixtures, reports, plans, examples, verification scripts or testing infrastructure only when the user explicitly requests or authorizes those additions. Requests to implement, fix, refactor, clean up or validate something do not, by themselves, authorize them. General best-practice recommendations, templates and tool suggestions are not user authorization.
- Do not materially expand existing documentation or tests without explicit authorization. Keep authorized additions and changes proportionate to the task.
- Prefer existing tests, validators and development tools. Run appropriate existing checks without creating persistent verification artifacts. Do not add dependencies, frameworks, hooks, workflows or configuration to support unrequested documentation or tests.
- Do not create progress logs, implementation summaries, session reports or similar files. Provide requested explanations and verification results in the conversation.
- When additional documentation or tests would provide significant value, briefly suggest them in the conversation instead of implementing them. Continue already authorized work; ask for clarification only when a genuine blocker requires it.
- Necessary, concise comments explaining non-obvious source behavior are permitted during authorized code changes; avoid redundant commentary. Explicit user requests for documentation or tests take precedence over this default policy.

## Theme conventions

- This is a buildless Horizon 4.3.0 Liquid theme. Use `layout/` and `templates/` for page composition, `sections/` and `blocks/` for editor components, `snippets/` for shared rendering, `assets/` for CSS/JavaScript, and `config/` for settings.
- As authorized features are developed, update buildless development infrastructure when their actual code demonstrates a useful improvement: local checks, type declarations, editor configuration and narrowly scoped development dependencies. Keep changes proportionate and grounded in implemented code; do not add infrastructure in anticipation of future features. This permission does not itself authorize compilation/bundling, generated storefront assets, new test infrastructure, hooks, CI or store-connected work.
- Follow nearby Horizon code, native custom elements and event interfaces. Keep useful server-rendered content and progressive enhancement. Preserve section/block ownership, schema IDs, merchant settings, accessibility and performance behavior.
- Keep Shopify authoritative for selected variants, numeric money, cart, pickup and locale/resource URLs. Preserve existing English/French string references and native localization forms.
- For nontrivial Liquid, objects, filters, tags, sections, blocks, snippets, templates, schemas, settings, localization, accessibility, performance or platform restrictions, consult current official Shopify resources and applicable Horizon conventions. Use Shopify AI Toolkit, the Shopify Codex plugin, Shopify Dev MCP, Theme Check or relevant official validation when available and appropriate. Do not assume tools are installed or connected; fall back to [Shopify developer documentation](https://shopify.dev/docs/storefronts/themes). Avoid lookups for trivial edits, and do not use store-management capabilities simply because they are exposed.

## Validation and integration

- Use locked dependencies and install with `npm ci --ignore-scripts`. For authorized infrastructure changes, pin new development dependencies and update only the relevant lockfile entries; do not regenerate lockfiles or upgrade other dependencies incidentally. Run local `npm run check:all` (Theme Check, JavaScript type checking and staged/unstaged whitespace validation); use `npm run check:json` for structured Theme Check diagnostics. Do not use auto-correction or broad formatting.
- Review all diagnostics. The known Horizon warnings are described in `README.md`; distinguish upstream findings from regressions and report unavailable validation accurately. Do not suppress findings to claim success. Local checks do not prove store behavior.
- For each Horizon update, preserve incoming `README.md` as `README-horizon.md`, `LICENSE.md` as `LICENSE-horizon.md`, and `release-notes.md` as `release-notes-horizon.md`, replacing the previous unmodified vendor copies. Resolve rename conflicts, remove duplicate original filenames, and review before integration; `README.md` is the project README.
- Keep only English/French locales: `en.default.json`, `fr.json`, `en.default.schema.json`, `fr.schema.json`. For every Horizon update, inspect all resulting locale files, remove reintroduced non-English/French files, validate retained JSON and storefront/schema key references, and review that diff before integration. Any regional English/French file needs a concrete requirement. These locale and vendor-document steps require manual review, with no automatic enforcement; `.shopifyignore` does not prevent Git merges from adding files.
- Evaluate verified stable Horizon source commits on a feature branch as described in `README.md`; preserve upstream history and deliberate Gamma changes.

## Maintaining these instructions

Update only directly relevant sections when related work verifies a durable architectural or convention change. Add useful findings, remove demonstrably obsolete guidance, and preserve user-established conventions unless explicitly superseded. This maintenance permission does not authorize unrelated documentation or test generation or material expansion without explicit user authorization. Avoid wording-only rewrites, speculative rules, temporary implementation details and recurring maintenance exercises. Keep shared rules here and Copilot-specific discovery guidance in [`.github/copilot-instructions.md`](.github/copilot-instructions.md).
