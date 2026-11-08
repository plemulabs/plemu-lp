import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const defaultLegalSource = fileURLToPath(
  new URL("../legal/legal-documents.json", import.meta.url),
);
export const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );

export async function readLegalDocuments(
  source = process.env.PLEMU_LEGAL_SOURCE || defaultLegalSource,
) {
  let raw;
  try {
    raw = await readFile(source, "utf8");
  } catch (cause) {
    throw new Error(
      "Reviewed legal source is unavailable. This standalone repository requires legal/legal-documents.json or an explicit PLEMU_LEGAL_SOURCE. No fallback copy is used.",
      { cause },
    );
  }
  const data = JSON.parse(raw);
  for (const field of [
    "publisher",
    "contact",
    "version",
    "prepared",
    "status",
  ]) {
    if (typeof data[field] !== "string" || !data[field].trim())
      throw new Error(`Missing legal ${field}`);
  }
  for (const key of ["terms", "privacy"]) {
    const document = data[key];
    if (
      !document ||
      !document.title ||
      !document.description ||
      !document.summary ||
      !Array.isArray(document.sections) ||
      !document.sections.length
    )
      throw new Error(`Incomplete ${key} document`);
    const ids = new Set();
    for (const section of document.sections) {
      if (
        !/^[a-z0-9-]+$/.test(section.id) ||
        ids.has(section.id) ||
        !section.title ||
        !Array.isArray(section.paragraphs) ||
        !section.paragraphs.length ||
        section.paragraphs.some((p) => typeof p !== "string" || !p.trim())
      )
        throw new Error(`Invalid ${key} section`);
      ids.add(section.id);
    }
  }
  const sha256 = createHash("sha256").update(raw).digest("hex");
  if (source === defaultLegalSource) {
    const record = JSON.parse(
      await readFile(new URL("../legal/source.json", import.meta.url), "utf8"),
    );
    if (
      record.sha256 !== sha256 ||
      !/^[a-f0-9]{40}$/.test(record.canonicalCommit) ||
      record.canonicalRepository !== "https://github.com/plemulabs/plemu-web" ||
      record.version !== data.version ||
      record.status !== data.status ||
      record.effectiveDate !== (data.effectiveDate ?? null)
    )
      throw new Error(
        "Reviewed legal export does not match its pinned source record",
      );
  }
  return { data, sha256 };
}

export function renderLegalPage(data, key, stylesheet = "/src/styles.css") {
  if (!["terms", "privacy"].includes(key))
    throw new Error("Unknown legal page");
  const document = data[key];
  const path = key === "terms" ? "/toc" : "/privacy";
  const other =
    key === "terms"
      ? { path: "/privacy", title: "Privacy policy" }
      : { path: "/toc", title: "Terms of service" };
  const e = escapeHtml;
  const sections = document.sections
    .map(
      (section, index) =>
        `<section id="${e(section.id)}"><h2>${index + 1}. ${e(section.title)}</h2>${section.paragraphs.map((p) => `<p>${e(p)}</p>`).join("\n")}</section>`,
    )
    .join("\n");
  const navigation = document.sections
    .map(
      (section, index) =>
        `<li><a href="#${e(section.id)}">${index + 1}. ${e(section.title)}</a></li>`,
    )
    .join("\n");
  const effective = data.effectiveDate
    ? `Effective: ${e(data.effectiveDate)}`
    : "No effective date has been set.";
  return `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#111317"><meta name="description" content="${e(document.description)}"><link rel="canonical" href="https://plemu.xyz${path}"><link rel="icon" href="/brand/plemu-pixel-face.png" type="image/png"><link rel="stylesheet" href="${e(stylesheet)}"><title>${e(document.title)} | Plemu</title></head>
<body><a class="skip-link" href="#main">Skip to content</a><header class="site-header"><div class="container header-inner"><a class="brand" href="/" aria-label="Plemu home"><span class="brand-art"><img src="/brand/plemu-wordmark-lime.png" alt="" width="1920" height="1080"></span></a><nav aria-label="Main navigation"><a href="/">Back to Plemu</a><a href="${other.path}">${other.title}</a></nav><a class="header-cta" href="https://devnet.plemu.xyz">Open Devnet app <span aria-hidden="true">↗</span></a></div></header>
<main id="main" class="legal-main container"><div class="legal-heading"><p class="section-kicker">${e(data.publisher)}</p><h1>${e(document.title)}</h1><p class="legal-summary">${e(document.summary)}</p><p class="legal-status">${e(data.status)}</p><p class="legal-meta">Version ${e(data.version)} · Prepared ${e(data.prepared)}<br>${effective}</p></div><div class="legal-layout"><nav class="legal-nav" aria-label="On this page"><h2>On this page</h2><ol>${navigation}</ol></nav><div class="legal-body">${sections}<div class="legal-crosslink"><a href="${other.path}">${other.title}</a><a href="#main">Back to top ↑</a></div><p class="legal-footer-note">${e(data.publisher)}${data.address ? ` · ${e(data.address)}` : ""}<br><a href="mailto:${e(data.contact)}">${e(data.contact)}</a></p></div></div></main>
<footer class="site-footer"><div class="container"><div class="footer-bottom"><small>© 2026 ${e(data.publisher)}</small><nav aria-label="Legal and contact"><a href="/toc">Terms of service</a><a href="/privacy">Privacy policy</a><a href="mailto:${e(data.contact)}">Contact</a></nav></div></div></footer></body></html>`;
}
