# CONVICTION Shopify theme: rules for Claude

This repo is the live storefront for conviction.faith (Shopify Online Store 2.0 theme).
Two themes in the store are connected to GitHub: `Conviction/main` (branch `main`) and `Conviction/staging` (branch `staging`). Whichever one is PUBLISHED is live for customers within about a minute of a push, so check `Shopify.theme.name` on the live site before assuming which branch is live.

## How changes ship
1. `git pull --rebase` first. Shopify commits theme-editor edits back to GitHub (author `shopify[bot]`), and those must never be overwritten.
2. Work on a branch, never directly on `main`. Use `staging` when the owner has a draft theme connected to it, otherwise a short descriptive branch.
3. Run the checks before pushing:
   - `python3 .github/scripts/sanity.py` (JSON, schemas, template settings, Liquid tag balance)
   - `python3 .github/scripts/secrets.py` (no keys or tokens)
   - `node -e "new Function(require('fs').readFileSync('assets/theme.js','utf8'))"` (JS parses)
4. Push the branch. The owner previews it as a draft theme and merges the pull request. Merging is publishing.
5. Only push to `main` directly if the owner explicitly says so for that change.

## Never
- Hand-write schema.org JSON-LD with Liquid inside `<script type="application/ld+json">`. Shopify's GitHub sync silently REJECTED every file containing it (layout + snippet) for two days, while GitHub checks passed. Use Shopify's `{{ product | structured_data }}` filter only.
- Assume a push reached the store. After every push, load the live site and check `Shopify.theme` plus a marker from the change (for example `data-no-prefetch` in the layout).
- Add a `render` of a brand-new snippet and push it straight to `main`. If Shopify's sync drops the new file, every page shows a Liquid error. Ship new snippets first (or inline them), and check the live site after each merge.
- Commit secrets, API keys, tokens, customer data or order exports. `.gitignore` and the secret scan back this up.
- Edit `config/settings_data.json` casually. It holds live theme-editor settings, and Shopify may keep its own copy. Prefer code defaults.
- Remove a select option from a schema while a saved setting might still use it. Shopify can reject the file.
- Use the black "Lust is not love / Chemistry is not confirmation" (Galatians 5) shirt photos anywhere.
- Change the owner's About copy wording. It is exact and intentional.

## Security habits
- Escape anything a visitor can influence: `search.terms`, `cart.note`, line item properties, `current_tags`, customer fields. Use `| escape`.
- No new third-party scripts without the owner's approval. Only Google Fonts (Anton) is external today.
- In JS, never build HTML from URL parameters or user input. Use `textContent`.
- Links that open a new tab get `rel="noopener noreferrer"`.

## Performance habits
- Built-in photos live in `assets/cv-<key>.webp`, with smaller copies `cv-<key>-w400/700/1000/1400.webp` (only below the original width). The color grade is baked in. The `cv-photo` snippet builds `srcset`/`sizes`.
- Quality first: build photos from the camera originals with `.github/scripts/rebuild_photos.py` (WebP q86 full size, up to 2560px landscape / 1717px portrait). Don't re-compress an already-compressed WebP.
- When a change makes the snippet reference a NEW file name, ship the file in one merge and the reference in a later one, so a dropped sync can't break images.
- To add a built-in photo: export a WebP from the original, apply the grade (contrast 1.08, saturate 1.1, brightness 1.02), create the width copies, add its size to the `case` list in `snippets/cv-photo.liquid`, then add it to the photo dropdowns.
- Hover-only photos use `defer: true` (loaded only on mouse/trackpad screens).
- Only the first, top-of-page image gets `eager: true` / `fetchpriority="high"`. Everything else stays lazy.
- No scroll-driven effects (they caused lag before). Animate only `transform`/`opacity`.

## Map
- `snippets/cv-look.liquid`: people photos, flip and studio shots per product handle (the three launch products).
- `snippets/cv-photo.liquid`: built-in photo tag with responsive sizes.
- `sections/header.liquid`: menu links are theme blocks (Home, Shop, About us), not the Shopify menu.
- `snippets/css-variables.liquid`: light theme is locked (White, optional Cream).
- `README.md`: owner-facing setup notes.
