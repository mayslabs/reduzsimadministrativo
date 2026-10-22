import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [indexHtml, appJs, stylesCss, redesignCss, stateApi, migration] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../app.js", import.meta.url), "utf8"),
  readFile(new URL("../styles.css", import.meta.url), "utf8"),
  readFile(new URL("../redesign.css", import.meta.url), "utf8"),
  readFile(new URL("../functions/api/state.js", import.meta.url), "utf8"),
  readFile(new URL("../migrations/0002_marketing.sql", import.meta.url), "utf8"),
]);

test("marketing is a complete team workspace", () => {
  assert.match(indexHtml, /data-section="marketingSection"/);
  assert.match(indexHtml, /id="marketingCalendarViewButton"/);
  assert.match(indexHtml, /id="marketingProductionViewButton"/);
  assert.match(indexHtml, /id="marketingIdeasViewButton"/);
  assert.match(indexHtml, /id="marketingDialog"/);
  assert.match(appJs, /function renderMarketingCalendar/);
  assert.match(appJs, /function renderMarketingProduction/);
  assert.match(appJs, /function convertMarketingIdea/);
  assert.match(appJs, /function syncMarketingTask/);
});

test("marketing content supports multiple publication channels", () => {
  assert.match(indexHtml, /id="marketingChannelPicker"/);
  assert.match(indexHtml, /id="marketingChannelInput" class="marketing-multi-options"/);
  assert.match(appJs, /function normalizeMarketingChannels/);
  assert.match(appJs, /channels:\s*selectedMarketingChannels\(\)/);
  assert.match(appJs, /normalizeMarketingChannels\(item\)\.includes\(channel\)/);
  assert.match(stylesCss, /\.marketing-multi-options label:has\(input:checked\)/);
});

test("marketing calendar distinguishes content formats with pastel colors", () => {
  assert.match(appJs, /class="marketing-calendar-heading"/);
  assert.match(appJs, /class="marketing-format-legend"/);
  assert.match(appJs, /marketing-calendar-entry format-\$\{marketingSlug\(item\.format \|\| "Outro"\)\}/);
  assert.match(appJs, /item\.format \|\| "Sem formato", marketingChannelLabel\(item\)/);
  ["reels", "stories", "post", "carrossel", "video", "artigo", "outro"].forEach((format) => {
    assert.match(stylesCss, new RegExp(`\\.marketing-calendar-entry\\.format-${format}`));
  });
  assert.match(redesignCss, /\.marketing-format-legend/);
  assert.match(redesignCss, /\.marketing-calendar-entry\.format-reels,\s*\.marketing-calendar-entry\.format-video/);
  assert.match(redesignCss, /background:\s*rgba\(7, 77, 64, 0\.08\)/);
});

test("upcoming marketing panel follows the compact redesign", () => {
  assert.match(appJs, /class="marketing-upcoming-heading"/);
  assert.match(appJs, /marketing-upcoming-item format-\$\{marketingSlug\(item\.format \|\| "Outro"\)\}/);
  assert.match(appJs, /item\.status === "Agendado" \? "scheduled" : ""/);
  assert.match(appJs, /\.slice\(0, 5\)/);
  assert.match(redesignCss, /\.marketing-upcoming-item\.scheduled \.marketing-date-block/);
  assert.match(redesignCss, /grid-template-columns:\s*48px minmax\(0, 1fr\)/);
  assert.match(redesignCss, /border:\s*1px dashed #8a8a8a/);
  assert.match(redesignCss, /#marketingSection \.privacy-toolbar\s*\{\s*display:\s*none/);
});

test("marketing production and idea views follow the supplied workspace", () => {
  assert.match(appJs, /class="marketing-board-heading"/);
  assert.match(appJs, /arraste os cartões entre as etapas/);
  assert.match(appJs, /draggable="true" data-marketing-drag-item/);
  assert.match(appJs, /data-marketing-drop-stage/);
  assert.match(appJs, /function bindMarketingPipelineDragAndDrop/);
  assert.doesNotMatch(appJs, /data-marketing-stage-shift/);
  assert.match(appJs, /class="marketing-ideas-heading"/);
  assert.match(appJs, /data-marketing-idea-objective/);
  assert.match(redesignCss, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(redesignCss, /marketing-pipeline-column\.is-drag-over/);
  assert.match(redesignCss, /marketing-pipeline-card\.is-dragging/);
  assert.match(redesignCss, /grid-template-columns:\s*repeat\(auto-fill, minmax\(360px, 1fr\)\)/);
});

test("marketing editors use the content and compact idea layouts", () => {
  assert.match(indexHtml, /id="marketingFormatChoices"/);
  assert.match(indexHtml, /id="marketingPriorityChoices"/);
  assert.match(indexHtml, /01 · Informações/);
  assert.match(indexHtml, /04 · Publicação/);
  assert.match(appJs, /classList\.toggle\("idea-dialog", item\.kind === "idea"\)/);
  assert.match(appJs, /function renderMarketingFormatChoices/);
  assert.match(appJs, /function renderMarketingPriorityChoices/);
  assert.match(redesignCss, /marketing-dialog\.idea-dialog\s*\{\s*width:\s*min\(640px/);
  assert.match(redesignCss, /marketing-dialog-body\s*\{\s*grid-template-columns:\s*repeat\(2/);
});

test("marketing records synchronize securely and preserve history", () => {
  assert.match(stateApi, /stateKey:\s*"marketingItems"/);
  assert.match(stateApi, /table:\s*"marketing_items"/);
  assert.match(stateApi, /protectHistory:\s*true/);
  assert.match(stateApi, /adminDeleteOnly:\s*true/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS marketing_items/);
  assert.match(migration, /marketing_items_active_idx/);
});

test("presentation privacy also masks marketing content", () => {
  assert.match(stylesCss, /#marketingSection \.marketing-calendar-entry strong/);
  assert.match(stylesCss, /#marketingDialog input:not\(\[type="checkbox"\]\)/);
});
