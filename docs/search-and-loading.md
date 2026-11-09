# Search and loading

The home page includes its title, description, canonical URL, social preview and WebSite/Organization structured data in static HTML. The social preview uses the supplied Plemu wordmark. [robots.txt](../public/robots.txt) advertises [sitemap.xml](../public/sitemap.xml), which lists the home page and both canonical policy routes. Keep these URLs aligned with the routes emitted by the build.

Main content and policy links work without JavaScript. The cartridge artwork and native screen images have explicit dimensions. Fonts, screenshots, logos and all three 3D scenes are hosted locally.

The cartridge hero, native-style pack and Seeker scenes load near their sections and share the Three.js environment chunk. Data saver skips both heavy modules while retaining lightweight controls. Native Library, Packs and Market textures load only when selected. Idle rendering stops offscreen and when the document is hidden. Collection and remix illustration animations also pause offscreen; reduced motion starts the scenes paused, with explicit motion controls. See [hero lifecycle](cartridge-hero.md) and [Seeker controls](seeker-showcase.md). Build output reports the current compressed sizes.

After deployment, verify the canonical URLs, robots file, sitemap and social image over HTTPS on plemu.xyz. Local checks cannot establish indexing, search rankings or field Core Web Vitals.
