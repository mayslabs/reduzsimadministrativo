(() => {
  if (typeof renderGoalsDashboard === "function") return;

  const DEFAULT_GOAL_SETTINGS = {
    floor: "R$ 15.000,00",
    target: "R$ 20.000,00",
    stretch: "R$ 25.000,00",
  };

  let activeGoalsYear = "2026";
  let activeGoalsMonth = "2026-06";

  const refs = {};

  function getState() {
    return typeof state === "undefined" ? null : state;
  }

  function getUser() {
    return typeof currentUser === "undefined" ? null : currentUser;
  }

  function iconRefresh() {
    if (typeof refreshIcons === "function") {
      refreshIcons();
      return;
    }
    if (window.lucide?.createIcons) window.lucide.createIcons();
  }

  function html(value) {
    if (typeof escapeHtml === "function") return escapeHtml(value);
    return String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    }[char]));
  }

  function digits(value) {
    if (typeof onlyDigits === "function") return onlyDigits(value);
    return String(value || "").replace(/\D/g, "");
  }

  function currencyAmountValue(value) {
    if (typeof currencyAmount === "function") return currencyAmount(value);
    const cleanDigits = digits(value);
    return cleanDigits ? Number(cleanDigits) / 100 : null;
  }

  function calculatedCurrencyValue(value) {
    if (typeof calculatedCurrency === "function") return calculatedCurrency(value);
    if (value === null || Number.isNaN(value)) return "Não informado";
    return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  }

  function calculatedPercentValue(value) {
    if (typeof calculatedPercent === "function") return calculatedPercent(value);
    if (value === null || Number.isNaN(value)) return "Não informado";
    return `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  }

  function flexibleCurrencyAmount(value) {
    const text = String(value || "").trim();
    if (!text) return null;
    if (/^\d+$/.test(text)) return Number(text);
    const clean = text.replace(/[^\d,.-]/g, "");
    if (!clean) return null;
    if (clean.includes(",")) {
      const amount = Number(clean.replace(/\./g, "").replace(",", "."));
      return Number.isNaN(amount) ? null : amount;
    }
    const amount = Number(clean.replace(/\./g, ""));
    return Number.isNaN(amount) ? null : amount;
  }

  function formatFlexibleCurrencyValuePatch(value) {
    if (typeof formatFlexibleCurrencyValue === "function") return formatFlexibleCurrencyValue(value);
    const amount = flexibleCurrencyAmount(value);
    return amount === null ? "" : calculatedCurrencyValue(amount);
  }

  function formatDateValue(value) {
    if (typeof formatDate === "function") return formatDate(value);
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pt-BR");
  }

  function currentMonthKeyPatch(date = new Date()) {
    if (typeof currentMonthKey === "function") return currentMonthKey(date);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function ownerNameValue(userId) {
    if (typeof ownerName === "function") return ownerName(userId);
    const appState = getState();
    return appState?.users?.find((user) => user.id === userId)?.name || "Sem responsável";
  }

  function normalizeGoals(goals = {}) {
    return {
      floor: formatFlexibleCurrencyValuePatch(goals.floor || DEFAULT_GOAL_SETTINGS.floor),
      target: formatFlexibleCurrencyValuePatch(goals.target || DEFAULT_GOAL_SETTINGS.target),
      stretch: formatFlexibleCurrencyValuePatch(goals.stretch || DEFAULT_GOAL_SETTINGS.stretch),
    };
  }

  function ensureGoals() {
    const appState = getState();
    if (!appState) return DEFAULT_GOAL_SETTINGS;
    appState.goals = normalizeGoals(appState.goals);
    return appState.goals;
  }

  function goalNumericSettings() {
    const settings = ensureGoals();
    return {
      floor: currencyAmountValue(settings.floor) || 15000,
      target: currencyAmountValue(settings.target) || 20000,
      stretch: currencyAmountValue(settings.stretch) || 25000,
    };
  }

  function monthName(monthKey) {
    const date = new Date(`${monthKey}-01T00:00:00`);
    return date.toLocaleDateString("pt-BR", { month: "long" }).replace(/^./, (letter) => letter.toUpperCase());
  }

  function goalContracts() {
    const appState = getState();
    if (!appState) return [];
    const clientContracts = (appState.clients || [])
      .map((client) => ({
        id: client.id,
        source: "INSS de obras",
        sourceType: "client",
        clientName: client.clientName,
        contractClosedDate: client.contractClosedDate,
        amount: currencyAmountValue(client.feeValue),
        origin: client.clientOrigin,
        ownerId: client.internalOwner,
        financeStatus: client.financeStatus,
      }))
      .filter((contract) => contract.contractClosedDate && contract.amount !== null);

    const regularizationContracts = (appState.regularizationClients || [])
      .map((process) => ({
        id: process.id,
        source: "Regularização",
        sourceType: "regularization",
        clientName: process.clientName,
        contractClosedDate: process.contractClosedDate,
        amount: currencyAmountValue(process.feeValue),
        origin: "",
        ownerId: "",
        financeStatus: process.status,
      }))
      .filter((contract) => contract.contractClosedDate && contract.amount !== null);

    return [...clientContracts, ...regularizationContracts].sort((a, b) => a.contractClosedDate.localeCompare(b.contractClosedDate));
  }

  function companyGoalsData(year) {
    const appState = getState();
    const contracts = goalContracts().filter((contract) => contract.contractClosedDate?.startsWith(`${year}-`));
    const months = Array.from({ length: 12 }, (_, index) => {
      const key = `${year}-${String(index + 1).padStart(2, "0")}`;
      const monthContracts = contracts.filter((contract) => contract.contractClosedDate?.startsWith(key));
      return {
        key,
        label: monthName(key),
        contracts: monthContracts,
        total: monthContracts.reduce((sum, contract) => sum + contract.amount, 0),
      };
    });
    return {
      contracts,
      months,
      total: contracts.reduce((sum, contract) => sum + contract.amount, 0),
      missingRegularization: (appState?.regularizationClients || []).filter((process) => {
        return !process.contractClosedDate || currencyAmountValue(process.feeValue) === null;
      }),
    };
  }

  function monthlyGoalLevel(total, settings) {
    if (total >= settings.stretch) return { label: "Supermeta batida", className: "super" };
    if (total >= settings.target) return { label: "Meta batida", className: "target" };
    if (total >= settings.floor) return { label: "Piso batido", className: "floor" };
    return { label: "Abaixo do piso", className: "below" };
  }

  function goalMonthMessage(total, settings) {
    if (total >= settings.stretch) return "Supermeta batida";
    if (total >= settings.target) return `Meta batida | faltam ${calculatedCurrencyValue(settings.stretch - total)} para a supermeta`;
    if (total >= settings.floor) return `Piso batido | faltam ${calculatedCurrencyValue(settings.target - total)} para a meta`;
    return `Faltam ${calculatedCurrencyValue(settings.floor - total)} para o piso`;
  }

  function goalLevelLabel(total, target, stretch) {
    if (total >= stretch) return "Supermeta anual batida";
    if (total >= target) return "Meta anual batida";
    return "Em andamento";
  }

  function goalMissingRegularizationLabel(process = {}) {
    const missing = [];
    if (!process.contractClosedDate) missing.push("mês de fechamento");
    if (currencyAmountValue(process.feeValue) === null) missing.push("valor dos honorários");
    return `Falta ${missing.join(" e ")}`;
  }

  function renderGoalSummaryCard(item) {
    return `
      <article class="goal-summary-card">
        <span>${html(item.label)}</span>
        <strong>${html(item.value)}</strong>
        <small>${html(item.hint)}</small>
      </article>
    `;
  }

  function renderGoalMonthCard(month, settings) {
    const percent = settings.stretch ? Math.min(100, Math.round((month.total / settings.stretch) * 100)) : 0;
    const level = monthlyGoalLevel(month.total, settings);
    return `
      <button class="goal-month-card ${level.className} ${month.key === activeGoalsMonth ? "active" : ""}" type="button" data-goal-month="${month.key}">
        <header>
          <strong>${html(month.label)}</strong>
          <span>${month.contracts.length} contrato(s)</span>
        </header>
        <div class="goal-month-total">${html(calculatedCurrencyValue(month.total))}</div>
        <div class="goal-progress-track">
          <span style="width:${percent}%"></span>
          <i style="left:${Math.min(100, Math.round((settings.floor / settings.stretch) * 100))}%"></i>
          <i style="left:${Math.min(100, Math.round((settings.target / settings.stretch) * 100))}%"></i>
        </div>
        <div class="goal-month-marks">
          <span>Piso ${html(calculatedCurrencyValue(settings.floor))}</span>
          <span>Meta ${html(calculatedCurrencyValue(settings.target))}</span>
          <span>Supermeta ${html(calculatedCurrencyValue(settings.stretch))}</span>
        </div>
        <p>${html(goalMonthMessage(month.total, settings))}</p>
      </button>
    `;
  }

  function renderGoalContracts(data) {
    const month = data.months.find((item) => item.key === activeGoalsMonth) || data.months[0];
    if (!month || !refs.contractsTitle || !refs.contractsList) return;
    refs.contractsTitle.textContent = `Contratos de ${month.label}`;
    refs.contractsList.innerHTML = month.contracts.length
      ? month.contracts.map((contract) => `
          <article class="goal-contract-row">
            <div>
              <strong>${html(contract.clientName || "Cliente sem nome")}</strong>
              <span>${html(contract.source)} | ${formatDateValue(contract.contractClosedDate)} | ${html(ownerNameValue(contract.ownerId))}</span>
            </div>
            <div>
              <strong>${html(calculatedCurrencyValue(contract.amount))}</strong>
              <span>${html([contract.origin, contract.financeStatus].filter(Boolean).join(" | ") || "Sem detalhe")}</span>
            </div>
            ${
              contract.sourceType === "client"
                ? `<button class="small-button" type="button" data-open-goal-client="${contract.id}"><i data-lucide="external-link"></i> Abrir</button>`
                : `<button class="small-button" type="button" data-edit-regularization="${contract.id}"><i data-lucide="pencil"></i> Editar</button>`
            }
          </article>
        `).join("")
      : `<p class="empty-state compact">Nenhum contrato fechado neste mês.</p>`;
  }

  function renderGoalMissingData(items) {
    if (!refs.missingData) return;
    refs.missingData.innerHTML = items.length
      ? items.map((process) => `
          <article class="goal-contract-row missing">
            <div>
              <strong>${html(process.clientName || "Cliente sem nome")}</strong>
              <span>${html(goalMissingRegularizationLabel(process))}</span>
            </div>
            <button class="small-button" type="button" data-edit-regularization="${process.id}"><i data-lucide="pencil"></i> Preencher</button>
          </article>
        `).join("")
      : `<p class="empty-state compact">Todas as regularizações têm data e valor quando aplicável.</p>`;
  }

  function bindGoalActions() {
    document.querySelectorAll("[data-goal-month]").forEach((button) => {
      button.onclick = () => {
        activeGoalsMonth = button.dataset.goalMonth;
        renderGoalsDashboardPatch();
      };
    });
    document.querySelectorAll("[data-open-goal-client]").forEach((button) => {
      button.onclick = () => {
        if (typeof openClientById === "function") openClientById(button.dataset.openGoalClient);
      };
    });
    document.querySelectorAll("#goalsSection [data-edit-regularization]").forEach((button) => {
      button.onclick = () => openRegularizationDialog(button.dataset.editRegularization);
    });
  }

  function renderGoalsDashboardPatch() {
    ensureRefs();
    if (!refs.summary || !refs.monthlyGrid || !refs.yearSelect) return;
    const appState = getState();
    if (!appState) return;
    ensureGoals();
    activeGoalsYear = activeGoalsYear || "2026";
    refs.yearSelect.value = activeGoalsYear;
    if (!activeGoalsMonth || !activeGoalsMonth.startsWith(activeGoalsYear)) {
      const current = currentMonthKeyPatch();
      activeGoalsMonth = current.startsWith(activeGoalsYear) ? current : `${activeGoalsYear}-01`;
    }

    if (refs.editButton) refs.editButton.style.display = getUser()?.role === "admin" ? "" : "none";

    const data = companyGoalsData(activeGoalsYear);
    const settings = goalNumericSettings();
    const annualTarget = settings.target * 12;
    const annualStretch = settings.stretch * 12;
    const remainingTarget = Math.max(annualTarget - data.total, 0);
    const percent = annualTarget ? (data.total / annualTarget) * 100 : 0;
    const averageTicket = data.contracts.length ? data.total / data.contracts.length : 0;

    refs.summary.innerHTML = [
      { label: "Meta anual", value: calculatedCurrencyValue(annualTarget), hint: `Supermeta: ${calculatedCurrencyValue(annualStretch)}` },
      { label: "Fechado no ano", value: calculatedCurrencyValue(data.total), hint: `${data.contracts.length} contrato(s)` },
      { label: "Falta para meta", value: calculatedCurrencyValue(remainingTarget), hint: remainingTarget ? "Para bater a meta anual" : "Meta anual batida" },
      { label: "Percentual atingido", value: calculatedPercentValue(percent), hint: goalLevelLabel(data.total, annualTarget, annualStretch) },
      { label: "Ticket médio", value: calculatedCurrencyValue(averageTicket), hint: "Honorários por contrato" },
      { label: "Contratos", value: data.contracts.length, hint: "INSS de obras + Regularização" },
    ].map(renderGoalSummaryCard).join("");

    refs.monthlyGrid.innerHTML = data.months.map((month) => renderGoalMonthCard(month, settings)).join("");
    renderGoalContracts(data);
    renderGoalMissingData(data.missingRegularization);
    bindGoalActions();
    iconRefresh();
  }

  function openGoalsDialogPatch() {
    const appState = getState();
    if (!appState || getUser()?.role !== "admin") return;
    appState.goals = normalizeGoals(appState.goals);
    openSimpleDialog("Editar metas", [
      { label: "Piso mensal", name: "floor", type: "text", value: appState.goals.floor },
      { label: "Meta mensal", name: "target", type: "text", value: appState.goals.target },
      { label: "Supermeta mensal", name: "stretch", type: "text", value: appState.goals.stretch },
    ], (values) => {
      const next = normalizeGoals(values);
      if (currencyAmountValue(next.floor) <= 0 || currencyAmountValue(next.target) <= 0 || currencyAmountValue(next.stretch) <= 0) {
        alert("Informe valores maiores que zero para as metas.");
        return false;
      }
      if (currencyAmountValue(next.floor) > currencyAmountValue(next.target) || currencyAmountValue(next.target) > currencyAmountValue(next.stretch)) {
        alert("Use a ordem Piso menor que Meta menor que Supermeta.");
        return false;
      }
      appState.goals = next;
      if (typeof saveState === "function") saveState();
      renderGoalsDashboardPatch();
      return true;
    });
  }

  function ensureRefs() {
    refs.section = document.getElementById("goalsSection");
    refs.yearSelect = document.getElementById("goalsYearSelect");
    refs.editButton = document.getElementById("editGoalsButton");
    refs.summary = document.getElementById("goalsSummary");
    refs.monthlyGrid = document.getElementById("goalsMonthlyGrid");
    refs.contractsTitle = document.getElementById("goalsContractsTitle");
    refs.contractsList = document.getElementById("goalsContractsList");
    refs.missingData = document.getElementById("goalsMissingData");

    if (typeof el !== "undefined") {
      Object.assign(el, {
        goalsYearSelect: refs.yearSelect,
        editGoalsButton: refs.editButton,
        goalsSummary: refs.summary,
        goalsMonthlyGrid: refs.monthlyGrid,
        goalsContractsTitle: refs.contractsTitle,
        goalsContractsList: refs.contractsList,
        goalsMissingData: refs.missingData,
      });
    }
  }

  function bindGoalEvents() {
    ensureRefs();
    if (refs.yearSelect && !refs.yearSelect.dataset.goalsPatchBound) {
      refs.yearSelect.dataset.goalsPatchBound = "true";
      refs.yearSelect.addEventListener("change", () => {
        activeGoalsYear = refs.yearSelect.value || "2026";
        activeGoalsMonth = `${activeGoalsYear}-01`;
        renderGoalsDashboardPatch();
      });
    }
    if (refs.editButton && !refs.editButton.dataset.goalsPatchBound) {
      refs.editButton.dataset.goalsPatchBound = "true";
      refs.editButton.addEventListener("click", openGoalsDialogPatch);
    }
  }

  function patchRegularizationNormalization() {
    if (typeof normalizeRegularizationClient !== "function" || normalizeRegularizationClient.__goalsPatch) return;
    const originalNormalize = normalizeRegularizationClient;
    normalizeRegularizationClient = function patchedNormalizeRegularizationClient(process = {}) {
      const normalized = originalNormalize(process);
      normalized.contractClosedDate = process.contractClosedDate || "";
      normalized.feeValue = formatFlexibleCurrencyValuePatch(process.feeValue || "");
      return normalized;
    };
    normalizeRegularizationClient.__goalsPatch = true;
  }

  function patchRegularizationDialog() {
    if (typeof openRegularizationDialog !== "function" || openRegularizationDialog.__goalsPatch) return;
    openRegularizationDialog = function patchedOpenRegularizationDialog(processId = null) {
      const appState = getState();
      if (!appState) return;
      const process = (appState.regularizationClients || []).find((item) => item.id === processId);
      const current = normalizeRegularizationClient(process || {});
      openSimpleDialog(process ? "Editar regularização" : "Novo processo de regularização", [
        { label: "Nome do cliente", name: "clientName", type: "text", value: current.clientName },
        { label: "Tipo de imóvel", name: "propertyType", type: "text", value: current.propertyType },
        { label: "Cidade/Estado", name: "cityState", type: "text", value: current.cityState },
        { label: "Endereço", name: "address", type: "text", value: current.address },
        { label: "Matrícula", name: "registryNumber", type: "text", value: current.registryNumber },
        { label: "Fechamento do contrato", name: "contractClosedDate", type: "date", value: current.contractClosedDate },
        { label: "Valor dos honorários", name: "feeValue", type: "text", value: current.feeValue },
        {
          label: "Status",
          name: "status",
          type: "select",
          value: current.status,
          options: regularizationStatusOptions().map((status) => ({ value: status, label: status })),
        },
        { label: "Próxima ação", name: "nextAction", type: "textarea", rows: 3, value: current.nextAction },
        { label: "Observações", name: "notes", type: "textarea", rows: 3, value: current.notes },
      ], (values) => {
        if (!values.clientName) {
          alert("Informe o nome do cliente para salvar o processo.");
          return false;
        }
        const now = new Date().toISOString();
        const payload = normalizeRegularizationClient({
          ...current,
          ...values,
          feeValue: formatFlexibleCurrencyValuePatch(values.feeValue || ""),
          updatedAt: now,
          createdAt: current.createdAt || now,
        });
        if (process) {
          Object.assign(process, payload);
          recordActivity("client", `Atualizou regularização: ${payload.clientName}.`, payload.status);
        } else {
          appState.regularizationClients.unshift({ ...payload, id: id(), createdAt: now, updatedAt: now });
          recordActivity("client", `Criou regularização: ${payload.clientName}.`, payload.status);
        }
        saveState();
        renderRegularizationClients();
        renderGoalsDashboardPatch();
        renderUpdates();
        return true;
      });
    };
    openRegularizationDialog.__goalsPatch = true;
  }

  function patchRenderAll() {
    if (typeof renderAll !== "function" || renderAll.__goalsPatch) return;
    const originalRenderAll = renderAll;
    renderAll = function patchedRenderAll(...args) {
      const result = originalRenderAll.apply(this, args);
      bindGoalEvents();
      renderGoalsDashboardPatch();
      return result;
    };
    renderAll.__goalsPatch = true;
  }

  function patchSwitchSection() {
    if (typeof switchSection !== "function" || switchSection.__goalsPatch) return;
    const originalSwitchSection = switchSection;
    switchSection = function patchedSwitchSection(sectionId) {
      const result = originalSwitchSection.apply(this, arguments);
      if (sectionId === "goalsSection") renderGoalsDashboardPatch();
      return result;
    };
    switchSection.__goalsPatch = true;
  }

  function renderRegularizationCardWithGoalData() {
    if (typeof renderRegularizationCard !== "function" || renderRegularizationCard.__goalsPatch) return;
    const originalRenderCard = renderRegularizationCard;
    renderRegularizationCard = function patchedRenderRegularizationCard(process) {
      const htmlText = originalRenderCard(process);
      const meta = `
        <span><i data-lucide="calendar-check"></i>${html(process.contractClosedDate ? `Fechado em ${formatDateValue(process.contractClosedDate)}` : "Sem fechamento")}</span>
        <span><i data-lucide="circle-dollar-sign"></i>${html(process.feeValue || "Honorários não informados")}</span>
      `;
      return htmlText.replace('</div>\n      <p>', `${meta}</div>\n      <p>`);
    };
    renderRegularizationCard.__goalsPatch = true;
  }

  function migrateRegularizationGoalFields() {
    const appState = getState();
    if (!appState?.regularizationClients) return;
    appState.regularizationClients = appState.regularizationClients.map((process) => normalizeRegularizationClient(process));
  }

  function install() {
    patchRegularizationNormalization();
    patchRegularizationDialog();
    renderRegularizationCardWithGoalData();
    patchRenderAll();
    patchSwitchSection();
    bindGoalEvents();
    ensureGoals();
    migrateRegularizationGoalFields();
    renderGoalsDashboardPatch();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
