# Search and loading

The home page includes its title, description, canonical URL, social preview and WebSite/Organization structured data in static HTML. The social preview uses the supplied Plemu wordmark. [robots.txt](../public/robots.txt) advertises [sitemap.xml](../public/sitemap.xml), which lists the home page and both canonical policy routes. Keep these URLs aligned with the routes emitted by the build.

Main content and policy links work without JavaScript. The hero screenshot has explicit intrinsic dimensions and high fetch priority. Fonts, screenshots, logos and the optional 3D viewer are hosted locally.

The viewer loads near the viewport and is skipped with data saver enabled. Its Library texture loads only when selected, avoiding an unused 276,705-byte image request during initial scene setup. The initial entry script remains approximately 1.5 KB gzip; the separate viewer is approximately 148.5 KB gzip. See [viewer controls and resource lifecycle](seeker-showcase.md).

After deployment, verify the canonical URLs, robots file, sitemap and social image over HTTPS on plemu.xyz. Local checks cannot establish indexing, search rankings or field Core Web Vitals.
