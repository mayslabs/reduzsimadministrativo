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
  assert.doesNotMatch(indexHtml, /id="marketingSummary"/);
  assert.doesNotMatch(indexHtml, /id="marketingCalendarViewButton"/);
  assert.doesNotMatch(indexHtml, /id="marketingProductionViewButton"/);
  assert.doesNotMatch(indexHtml, /id="marketingIdeasViewButton"/);
  assert.doesNotMatch(indexHtml, /id="marketingStatusFilter"/);
  assert.match(indexHtml, /id="marketingDialog"/);
  assert.match(appJs, /function renderMarketingCalendar/);
  assert.match(appJs, /function renderMarketingProduction/);
  assert.match(appJs, /\$\{renderMarketingProduction\(items\)\}[\s\S]*\$\{renderMarketingCalendar\(items\)\}/);
  assert.match(appJs, /function convertMarketingIdea/);
  assert.match(appJs, /function syncMarketingTasks\(/);
});

test("marketing content manages production tasks in the central task source", () => {
  assert.match(indexHtml, /id="marketingTasksSection"/);
  assert.match(indexHtml, /id="marketingTaskList"/);
  assert.match(indexHtml, /id="addMarketingTaskButton"/);
  assert.match(indexHtml, /05 · Tarefas de produção/);
  assert.doesNotMatch(indexHtml, /id="marketingGenerateTaskInput"/);
  assert.match(appJs, /let activeMarketingTaskDrafts = \[\]/);
  assert.match(appJs, /function renderMarketingTasksEditor\(/);
  assert.match(appJs, /function syncMarketingTasks\(item\)/);
  assert.match(appJs, /marketingItemId: item\.id/);
  assert.match(appJs, /state\.internalTasks\.unshift\(\.\.\.createdTasks\)/);
  assert.match(appJs, /Salvar conteúdo e \$\{count\}/);
  assert.match(redesignCss, /\.marketing-task-card\.expanded/);
  assert.match(redesignCss, /\.marketing-task-control-row/);
  assert.match(redesignCss, /\.marketing-add-task-button/);
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
  assert.match(redesignCss, /\.marketing-upcoming-item\.scheduled \.marketing-date-block/);
  assert.match(redesignCss, /grid-template-columns:\s*44px minmax\(0, 1fr\)/);
  assert.match(appJs, /\.slice\(0, 3\)/);
  assert.match(appJs, /class="marketing-planning-sidebar"/);
  assert.match(redesignCss, /#marketingSection \.privacy-toolbar\s*\{\s*display:\s*none/);
});

test("marketing production and idea rail follow the supplied workspace", () => {
  assert.match(appJs, /class="marketing-board-heading"/);
  assert.match(appJs, /arraste os cartões entre as etapas/);
  assert.match(appJs, /draggable="true" data-marketing-drag-item/);
  assert.match(appJs, /data-marketing-drop-stage/);
  assert.match(appJs, /data-marketing-stage-expand/);
  assert.match(appJs, /MARKETING_PIPELINE_PREVIEW_LIMIT = 9/);
  assert.match(appJs, /function bindMarketingPipelineDragAndDrop/);
  assert.doesNotMatch(appJs, /data-marketing-stage-shift/);
  assert.match(appJs, /marketing-ideas-panel marketing-ideas-rail/);
  assert.match(appJs, /data-marketing-idea-objective/);
  assert.match(appJs, /data-marketing-ideas-toggle/);
  assert.match(appJs, /MARKETING_IDEA_PREVIEW_LIMIT = 3/);
  assert.match(redesignCss, /grid-template-columns:\s*repeat\(7, minmax\(0, 1fr\)\)/);
  assert.match(redesignCss, /marketing-pipeline-column\.is-drag-over/);
  assert.match(redesignCss, /marketing-pipeline-card\.is-dragging/);
  assert.match(redesignCss, /marketing-ideas-rail \.marketing-ideas-list/);
  assert.match(redesignCss, /marketing-idea-produce/);
});

test("marketing uses one filtered source for production, calendar and ideas", () => {
  assert.match(appJs, /const items = filteredMarketingItems\(\);/);
  assert.match(appJs, /renderMarketingProduction\(items\)/);
  assert.match(appJs, /renderMarketingCalendar\(items\)/);
  assert.match(appJs, /renderMarketingIdeas\(items\)/);
  assert.doesNotMatch(appJs, /function renderMarketingSummary/);
  assert.doesNotMatch(appJs, /activeMarketingView/);
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

test("marketing history timeline can be hidden and shown", () => {
  assert.match(indexHtml, /id="toggleMarketingHistoryButton"/);
  assert.match(indexHtml, /aria-label="Ocultar linha do tempo"/);
  assert.match(appJs, /function setMarketingHistoryExpanded\(expanded\)/);
  assert.match(appJs, /marketingHistoryList\.hidden = !activeMarketingHistoryExpanded/);
  assert.match(appJs, /data-lucide="\$\{activeMarketingHistoryExpanded \? "eye-off" : "eye"\}"/);
  assert.match(redesignCss, /\.marketing-history-heading/);
  assert.match(redesignCss, /\.marketing-history-toggle/);
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
