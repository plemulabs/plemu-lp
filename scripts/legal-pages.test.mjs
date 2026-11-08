import test from "node:test";
import assert from "node:assert/strict";
import {
  readLegalDocuments,
  renderLegalPage,
  escapeHtml,
} from "./legal-pages.mjs";

test("both static policies include every canonical paragraph and section, metadata and cross-links", async () => {
  const { data, sha256 } = await readLegalDocuments();
  assert.match(sha256, /^[a-f0-9]{64}$/);
  for (const key of ["terms", "privacy"]) {
    const html = renderLegalPage(data, key, "/assets/main.css");
    for (const section of data[key].sections) {
      assert.ok(html.includes(`id="${section.id}"`));
      assert.ok(html.includes(`href="#${section.id}"`));
      for (const paragraph of section.paragraphs)
        assert.ok(
          html.includes(escapeHtml(paragraph)),
          `Missing ${key} paragraph`,
        );
    }
    assert.ok(html.includes(escapeHtml(data.status)));
    assert.ok(html.includes(`Version ${escapeHtml(data.version)}`));
    assert.ok(html.includes('href="/toc"'));
    assert.ok(html.includes('href="/privacy"'));
    assert.ok(html.includes('href="/assets/main.css"'));
    assert.ok(!html.includes("<script"));
  }
});

test("legal generation fails closed without its canonical source", async () => {
  await assert.rejects(
    readLegalDocuments("/no-such-plemu-legal-source.json"),
    /No fallback copy/,
  );
});

test("policy content is escaped rather than interpreted as page markup", () => {
  assert.equal(
    escapeHtml("<script>\"&'</script>"),
    "&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;",
  );
});
