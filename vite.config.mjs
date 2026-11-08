import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { defineConfig } from "vite";
import { readLegalDocuments, renderLegalPage } from "./scripts/legal-pages.mjs";

const appRoot = fileURLToPath(new URL(".", import.meta.url));
const routes = { "/toc": "terms", "/privacy": "privacy" };

export default defineConfig({
  root: appRoot,
  appType: "mpa",
  server: { host: "127.0.0.1" },
  plugins: [
    {
      name: "canonical-plemu-legal-pages",
      async buildStart() {
        await readLegalDocuments();
      },
      configureServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const pathname = new URL(
            request.url,
            "http://localhost",
          ).pathname.replace(/\/$/, "");
          const key = routes[pathname];
          if (!key) return next();
          try {
            const { data } = await readLegalDocuments();
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(renderLegalPage(data, key));
          } catch (error) {
            next(error);
          }
        });
      },
      configurePreviewServer(server) {
        server.middlewares.use(async (request, response, next) => {
          const pathname = new URL(
            request.url,
            "http://localhost",
          ).pathname.replace(/\/$/, "");
          if (!routes[pathname]) return next();
          try {
            const html = await readFile(
              resolve(appRoot, "dist", pathname.slice(1), "index.html"),
              "utf8",
            );
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(html);
          } catch (error) {
            next(error);
          }
        });
      },
      async closeBundle() {
        const { data, sha256 } = await readLegalDocuments();
        const output = resolve(appRoot, "dist");
        const home = await readFile(resolve(output, "index.html"), "utf8");
        const stylesheet = [...home.matchAll(/<link\b[^>]*>/g)]
          .map(([tag]) =>
            /rel="stylesheet"/.test(tag)
              ? /href="([^"]+)"/.exec(tag)?.[1]
              : null,
          )
          .find(Boolean);
        if (!stylesheet) throw new Error("Built landing stylesheet is missing");
        for (const [path, key] of Object.entries(routes)) {
          const directory = resolve(output, path.slice(1));
          await mkdir(directory, { recursive: true });
          await writeFile(
            resolve(directory, "index.html"),
            renderLegalPage(data, key, stylesheet),
          );
        }
        await writeFile(
          resolve(output, "legal-source.json"),
          JSON.stringify(
            {
              sha256,
              version: data.version,
              status: data.status,
              effectiveDate: data.effectiveDate ?? null,
              sections: {
                terms: data.terms.sections.length,
                privacy: data.privacy.sections.length,
              },
            },
            null,
            2,
          ) + "\n",
        );
      },
    },
  ],
});
