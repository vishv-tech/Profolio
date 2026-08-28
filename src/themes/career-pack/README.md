# Career theme pack

This folder is the starter architecture for ten career-oriented portfolio themes. The components intentionally render as simple, accessible foundations. They are not polished themes, they are not connected to the production Theme Store, and no preview screenshots have been fabricated.

## Contract

Every component accepts the existing frozen contracts without adapting or extending them:

```tsx
<Theme data={portfolioData} config={themeConfig} />
```

`PortfolioData` remains the only source of portfolio content. `ThemeConfig` controls appearance, section order and hiding, and profile/contact/link visibility. The shared helpers normalize those data concerns; they do not impose a common visual component system.

## Registry and loading

`careerThemePack` is an ordered array of manifests. Each manifest contains:

- a globally namespaced `layoutKey`
- user-facing name and description
- one category plus non-exclusive career/style recommendation tags
- an optional preview image path
- a lazy component loader

`careerThemeRegistry` provides lookup by layout key. Unknown keys return `null`. `createThemeRegistry()` rejects duplicate keys when packs are composed. Lazy loaders keep the ten component modules out of the initial registry module graph and leave room for production dynamic imports later.

The supported category vocabulary lives in `types.ts`: All, Professional, Creative, Technology, Engineering, Finance, Legal, Healthcare, Design, Business, and Experimental. Career tags are discovery hints, never access restrictions.

## Adding Theme 11

1. Add a new career folder containing an independent theme component and `manifest.ts`.
2. Give it a namespaced, unique layout key and add that key to `CareerThemeLayoutKey`.
3. Define the manifest with `defineCareerTheme()` and a lazy `component` import.
4. Export the folder locally, then append its manifest to `careerThemePack` in `registry.ts`.
5. Add the key to `EXPECTED_LAYOUT_KEYS` in `registry.test.ts`.
6. Exercise the full and sparse fixtures in `/dev/career-themes` and run all verification commands.

The new component can replace every layout decision inside its own file. It needs to share the data/config contract and safe helpers, not the visual structure of an existing theme.

## Combining with the Pavni pack

Keep each pack independently owned, then compose them at the production integration boundary:

```ts
export const ALL_THEMES = [...pavniThemePack, ...careerThemePack];
export const ALL_THEME_REGISTRY = createThemeRegistry(
  pavniThemePack,
  careerThemePack,
);
```

This starter does not create or alter the Pavni pack, the production renderer, or the Theme Store.

## Preview convention

When a genuine preview has been captured for a finished theme, place it at:

```text
/public/theme-previews/career-pack/{layoutKey}.webp
```

Then add `/theme-previews/career-pack/{layoutKey}.webp` as that manifest's optional `previewImage`. Do not set the field before the real asset exists.

## Development playground

Run `npm run dev` and visit `/dev/career-themes`. The playground switches among all ten manifests and the full/sparse `PortfolioData` fixtures. The server page calls `notFound()` whenever `NODE_ENV` is not `development`, so it is not a production Theme Store or a public preview route.

## Quality checklist

- Keep user content in `PortfolioData`; never hardcode it in a theme.
- Respect `ThemeConfig` appearance, ordering, hidden sections, and visibility flags.
- Omit empty sections and survive sparse data.
- Normalize dates and reject unsafe external URL protocols through shared helpers.
- Keep headings semantic, links descriptive, images labelled, focus behavior native, and layouts responsive.
- Use the font allowlist instead of loading arbitrary font values.
- Preserve lazy component loaders and unique global layout keys.
- Add a real preview only after the theme is visually finished and captured.
- Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.

The current ten components are starter scaffolds only. Their spacing and basic structures prove the architecture and data contract; a future design phase owns polished visuals, screenshots, and production integration.
