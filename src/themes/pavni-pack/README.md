# Pavni theme pack

This pack adapts Pavni's 25 portfolio designs to Profolio's existing theme runtime. Every manifest uses a stable `pavni-` layout key and a literal dynamic import, so only the selected theme component is loaded.

The themes consume the canonical `PortfolioData` and `ThemeConfig` types through the shared pack adapter. That adapter provides safe contact links, profile-image fallbacks, complete resume-section rendering, visibility controls, empty-state filtering, and configured section ordering while leaving each theme's layout and visual language isolated in its own CSS Module.

The legacy incoming `noir-fashion` implementation is intentionally registered as **Retro Desktop** under `pavni-retro-desktop`. The unreferenced noir mascot images and all standalone incoming application infrastructure were intentionally excluded.

Public portfolio themes are display-only. Local image upload and replacement controls from the reference package are not part of the integrated components.
