# Portfolio theme integration

Portfolio theme components belong here.

Every theme will eventually consume the shared `PortfolioData` and
`ThemeConfig` contracts through an interface shaped approximately like:

```tsx
<Theme data={portfolioData} config={themeConfig} />
```

The final contracts will be defined in a later phase. Themes must not hardcode
user-specific data.
