const STORAGE_KEY = "reduzsim_client_flow_v1";
const SESSION_KEY = "reduzsim_current_user";
const NOTE_EDIT_WINDOW_MS = 15 * 60 * 1000;

function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cloneData(value) {
  if (window.structuredClone) return window.structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

const defaultStatuses = [
  ["Contrato pago", "#009f7f"],
  ["Procuracao e-CAC pendente", "#c78000"],
  ["Documentos da obra pendentes", "#2f80ed"],
  ["Aguardando engenheiro", "#7c3aed"],
  ["Dados dos trabalhadores", "#455a64"],
  ["Recibos em elaboracao", "#007f68"],
  ["Recibos para assinatura", "#d14343"],
  ["CNO pendente", "#9a6b00"],
  ["eSocial em andamento", "#2563eb"],
  ["Remuneracao mensal enviada", "#0f766e"],
  ["Guia emitida", "#0891b2"],
  ["Guia enviada ao cliente", "#0284c7"],
  ["Aguardando pagamento da guia", "#d14343"],
  ["Requerimento Receita", "#7c3aed"],
  ["Aguardando decisao Receita", "#9333ea"],
  ["CND emitida", "#15803d"],
  ["NF pendente", "#f97316"],
  ["Pendencia do cliente", "#b91c1c"],
  ["Finalizado", "#4d4d4d"],
].map(([name, color]) => ({ id: id(), name, color }));

const defaultUsers = [
  {
    id: id(),
    name: "Proprietaria",
    email: "admin@reduzsim.com.br",
    password: "admin123",
    role: "admin",
  },
  {
    id: id(),
    name: "Colaboradora",
    email: "colaboradora@reduzsim.com.br",
    password: "reduzsim123",
    role: "user",
  },
];

const defaultClient = () => {
  const statusByName = Object.fromEntries(state.statuses.map((status) => [status.name, status.id]));
  return {
    id: id(),
    clientName: "Cliente exemplo",
    fullName: "Cliente exemplo",
    cpf: "000.000.000-00",
    phone: "(63) 99999-9999",
    whatsappDdd: "63",
    infoOwner: "Cliente",
    internalOwner: state.users[0]?.id || "",
    folderPath: "C:\\Users\\...\\OneDrive\\Clientes\\Cliente exemplo",
    nextAction: "Conferir procuracao e validar documentos iniciais.",
    statusIds: [
      statusByName["Procuracao e-CAC pendente"],
      statusByName["Documentos da obra pendentes"],
      statusByName["Aguardando pagamento da guia"],
    ].filter(Boolean),
    workResponsible: "Engenheiro responsavel",
    destination: "Residencial",
    workType: "Construcao",
    concrete: "Sim",
    state: "TO",
    startDate: "2026-01-01",
    endDate: "2026-03-31",
    area: "180 m2",
    monthly: [
      {
        id: id(),
        month: "2026-01",
        receiptPaid: true,
        receiptSigned: true,
        remunerationSent: true,
        guideIssued: true,
        guideSent: true,
        guidePaid: false,
        notes: "Aguardando comprovante.",
      },
      {
        id: id(),
        month: "2026-02",
        receiptPaid: false,
        receiptSigned: false,
        remunerationSent: false,
        guideIssued: false,
        guideSent: false,
        guidePaid: false,
        notes: "",
      },
    ],
    tasks: [
      {
        id: id(),
        title: "Confirmar acesso no e-CAC",
        ownerId: state.users[1]?.id || state.users[0]?.id || "",
        dueDate: "2026-05-20",
        status: "Pendente",
      },
    ],
    deadlines: [
      {
        id: id(),
        title: "Pagamento da guia de janeiro",
        type: "Guia",
        ownerId: state.users[0]?.id || "",
        date: "2026-05-24",
      },
    ],
    notes: [
      {
        id: id(),
        text: "Cliente pediu para tratar documentos diretamente com o engenheiro.",
        userId: state.users[0]?.id || "",
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    ],
    documents: [
      { id: id(), name: "Alvara", status: "Pendente", path: "" },
      { id: id(), name: "Habite-se", status: "Nao possui", path: "" },
    ],
    workersNotes: "Joao - R$ 2.200,00 - jan/2026\nMaria - R$ 2.000,00 - jan/2026",
    feeValue: "R$ 4.500,00",
    paymentMethod: "Asaas - 3 parcelas",
    installments: "3x",
    financeStatus: "Parcial",
    referralCommission: "10%",
    referrer: "Indicador exemplo",
    financeNotes: "Primeira parcela paga.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

let state;
state = loadState();
let currentUser = null;
let activeClient = null;
let activeViewMode = "list";

const el = {
  loginView: document.getElementById("loginView"),
  appView: document.getElementById("appView"),
  loginForm: document.getElementById("loginForm"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginError: document.getElementById("loginError"),
  loginStatus: document.getElementById("loginStatus"),
  repairAccessButton: document.getElementById("repairAccessButton"),
  currentUserLabel: document.getElementById("currentUserLabel"),
  logoutButton: document.getElementById("logoutButton"),
  newClientButton: document.getElementById("newClientButton"),
  metricsGrid: document.getElementById("metricsGrid"),
  searchInput: document.getElementById("searchInput"),
  statusFilter: document.getElementById("statusFilter"),
  listModeButton: document.getElementById("listModeButton"),
  boardModeButton: document.getElementById("boardModeButton"),
  listView: document.getElementById("listView"),
  boardView: document.getElementById("boardView"),
  clientDialog: document.getElementById("clientDialog"),
  clientDialogTitle: document.getElementById("clientDialogTitle"),
  deleteClientButton: document.getElementById("deleteClientButton"),
  saveClientButton: document.getElementById("saveClientButton"),
  openStatusPicker: document.getElementById("openStatusPicker"),
  activeStatusList: document.getElementById("activeStatusList"),
  statusPicker: document.getElementById("statusPicker"),
  generateMonthsButton: document.getElementById("generateMonthsButton"),
  addMonthButton: document.getElementById("addMonthButton"),
  monthlyTable: document.querySelector("#monthlyTable tbody"),
  addTaskButton: document.getElementById("addTaskButton"),
  tasksList: document.getElementById("tasksList"),
  addDeadlineButton: document.getElementById("addDeadlineButton"),
  deadlinesList: document.getElementById("deadlinesList"),
  newNoteText: document.getElementById("newNoteText"),
  addNoteButton: document.getElementById("addNoteButton"),
  notesList: document.getElementById("notesList"),
  addDocButton: document.getElementById("addDocButton"),
  documentsList: document.getElementById("documentsList"),
  addStatusButton: document.getElementById("addStatusButton"),
  statusManager: document.getElementById("statusManager"),
  addUserButton: document.getElementById("addUserButton"),
  userManager: document.getElementById("userManager"),
  simpleDialog: document.getElementById("simpleDialog"),
  simpleDialogTitle: document.getElementById("simpleDialogTitle"),
  simpleDialogBody: document.getElementById("simpleDialogBody"),
  simpleDialogSave: document.getElementById("simpleDialogSave"),
};

bootstrap();

function bootstrap() {
  bindEvents();
  const userId = sessionStorage.getItem(SESSION_KEY);
  currentUser = state.users.find((user) => user.id === userId) || null;
  if (currentUser) showApp();
  else showLogin();
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    return migrateState(JSON.parse(saved));
  }

  const initial = {
    statuses: defaultStatuses,
    users: defaultUsers,
    clients: [],
  };
  state = initial;
  initial.clients = [defaultClient()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function migrateState(savedState = {}) {
  const migrated = {
    statuses: Array.isArray(savedState.statuses) && savedState.statuses.length ? savedState.statuses : defaultStatuses,
    users: Array.isArray(savedState.users) ? savedState.users : [],
    clients: Array.isArray(savedState.clients) ? savedState.clients : [],
  };

  defaultUsers.forEach((defaultUser) => {
    const existing = migrated.users.find((user) => user.email?.toLowerCase() === defaultUser.email.toLowerCase());
    if (!existing) {
      migrated.users.push({ ...defaultUser });
      return;
    }

    existing.name ||= defaultUser.name;
    existing.password ||= defaultUser.password;
    existing.role ||= defaultUser.role;
  });

  migrated.clients = migrated.clients.map((client) => ({
    id: id(),
    clientName: "",
    fullName: "",
    cpf: "",
    phone: "",
    whatsappDdd: "",
    infoOwner: "",
    internalOwner: migrated.users[0]?.id || "",
    folderPath: "",
    nextAction: "",
    statusIds: [],
    workResponsible: "",
    destination: "",
    workType: "",
    concrete: "",
    state: "",
    startDate: "",
    endDate: "",
    area: "",
    monthly: [],
    tasks: [],
    deadlines: [],
    notes: [],
    documents: [],
    workersNotes: "",
    feeValue: "",
    paymentMethod: "",
    installments: "",
    financeStatus: "Pendente",
    referralCommission: "",
    referrer: "",
    financeNotes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...client,
    monthly: Array.isArray(client.monthly) ? client.monthly : [],
    tasks: Array.isArray(client.tasks) ? client.tasks : [],
    deadlines: Array.isArray(client.deadlines) ? client.deadlines : [],
    notes: Array.isArray(client.notes) ? client.notes : [],
    documents: Array.isArray(client.documents) ? client.documents : [],
    statusIds: Array.isArray(client.statusIds) ? client.statusIds : [],
  }));

  localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  el.loginForm.addEventListener("submit", handleLogin);
  el.repairAccessButton.addEventListener("click", repairAccess);
  el.logoutButton.addEventListener("click", handleLogout);
  el.newClientButton.addEventListener("click", () => openClient(createEmptyClient()));
  el.searchInput.addEventListener("input", renderClients);
  el.statusFilter.addEventListener("change", renderClients);
  el.listModeButton.addEventListener("click", () => setViewMode("list"));
  el.boardModeButton.addEventListener("click", () => setViewMode("board"));
  el.saveClientButton.addEventListener("click", saveActiveClient);
  el.deleteClientButton.addEventListener("click", deleteActiveClient);
  el.openStatusPicker.addEventListener("click", () => {
    el.statusPicker.hidden = !el.statusPicker.hidden;
  });
  el.generateMonthsButton.addEventListener("click", generateMonthsFromWorkDates);
  el.addMonthButton.addEventListener("click", () => {
    activeClient.monthly.push(emptyMonth());
    renderMonthlyTable();
  });
  el.addTaskButton.addEventListener("click", () => {
    activeClient.tasks.push(emptyTask());
    renderTasks();
  });
  el.addDeadlineButton.addEventListener("click", () => {
    activeClient.deadlines.push(emptyDeadline());
    renderDeadlines();
  });
  el.addNoteButton.addEventListener("click", addNote);
  el.addDocButton.addEventListener("click", () => {
    activeClient.documents.push(emptyDocument());
    renderDocuments();
  });
  el.addStatusButton.addEventListener("click", openStatusDialog);
  el.addUserButton.addEventListener("click", openUserDialog);

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchSection(button.dataset.section));
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });
  document.querySelectorAll("[data-field]").forEach((input) => {
    const syncField = () => {
      if (!activeClient) return;
      activeClient[input.dataset.field] = input.value;
    };
    input.addEventListener("input", syncField);
    input.addEventListener("change", syncField);
  });
}

function handleLogin(event) {
  event.preventDefault();
  el.loginStatus.textContent = "Verificando acesso...";
  const email = el.loginEmail.value.trim().toLowerCase();
  const password = el.loginPassword.value;
  state = migrateState(state);
  const user = state.users.find((item) => item.email?.toLowerCase() === email && item.password === password);

  if (!user) {
    el.loginError.hidden = false;
    el.loginStatus.textContent = "";
    return;
  }

  currentUser = user;
  sessionStorage.setItem(SESSION_KEY, user.id);
  el.loginError.hidden = true;
  el.loginStatus.textContent = "Acesso liberado.";
  showApp();
}

function repairAccess() {
  state = migrateState(state);
  const admin = state.users.find((user) => user.email?.toLowerCase() === "admin@reduzsim.com.br");
  if (admin) {
    admin.name = admin.name || "Proprietaria";
    admin.password = "admin123";
    admin.role = "admin";
  }
  saveState();
  el.loginEmail.value = "admin@reduzsim.com.br";
  el.loginPassword.value = "admin123";
  el.loginError.hidden = true;
  el.loginStatus.textContent = "Acesso inicial reparado. Clique em Entrar.";
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;
  showLogin();
}

function showLogin() {
  el.loginView.hidden = false;
  el.appView.hidden = true;
}

function showApp() {
  el.loginView.hidden = true;
  el.appView.hidden = false;
  el.currentUserLabel.textContent = `${currentUser.name} | ${currentUser.role === "admin" ? "Administrador" : "Usuario"}`;
  document.querySelector('[data-section="usersSection"]').style.display = currentUser.role === "admin" ? "" : "none";
  renderAll();
}

function renderAll() {
  renderStatusFilter();
  renderMetrics();
  renderClients();
  renderStatusManager();
  renderUserManager();
  refreshIcons();
}

function renderStatusFilter() {
  const selected = el.statusFilter.value;
  el.statusFilter.innerHTML = `<option value="">Todos os status</option>${state.statuses
    .map((status) => `<option value="${status.id}">${escapeHtml(status.name)}</option>`)
    .join("")}`;
  el.statusFilter.value = selected;
}

function renderMetrics() {
  const openTasks = state.clients.flatMap((client) => client.tasks || []).filter((task) => task.status !== "Concluida").length;
  const deadlines = state.clients.flatMap((client) => client.deadlines || []).length;
  const pendingFinance = state.clients.filter((client) => client.financeStatus && client.financeStatus !== "Pago").length;
  el.metricsGrid.innerHTML = [
    ["Clientes ativos", state.clients.length],
    ["Tarefas abertas", openTasks],
    ["Prazos registrados", deadlines],
    ["Financeiro pendente", pendingFinance],
  ]
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderClients() {
  const clients = filteredClients();
  el.listView.hidden = activeViewMode !== "list";
  el.boardView.hidden = activeViewMode !== "board";

  if (activeViewMode === "list") {
    el.listView.innerHTML = clients.length
      ? clients.map((client) => renderClientCard(client)).join("")
      : `<p class="empty-state">Nenhum cliente encontrado.</p>`;
  } else {
    renderBoard(clients);
  }

  document.querySelectorAll("[data-open-client]").forEach((card) => {
    card.addEventListener("click", () => openClientById(card.dataset.openClient));
  });
  refreshIcons();
}

function filteredClients() {
  const query = normalize(el.searchInput.value);
  const statusId = el.statusFilter.value;
  return state.clients.filter((client) => {
    const haystack = normalize([
      client.clientName,
      client.fullName,
      client.cpf,
      client.phone,
      client.infoOwner,
      client.workResponsible,
      client.folderPath,
    ].join(" "));
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = !statusId || (client.statusIds || []).includes(statusId);
    return matchesQuery && matchesStatus;
  });
}

function renderClientCard(client) {
  const statuses = getClientStatuses(client)
    .slice(0, 5)
    .map((status) => chip(status))
    .join("");
  const nextDue = nearestDate(client.deadlines || []);
  return `
    <button class="client-card" type="button" data-open-client="${client.id}">
      <header>
        <div>
          <h3>${escapeHtml(client.clientName || "Cliente sem nome")}</h3>
          <p>${escapeHtml(client.workType || "Obra sem tipo informado")} ${client.state ? `| ${escapeHtml(client.state)}` : ""}</p>
        </div>
        <span class="chip" style="background:${financeColor(client.financeStatus)}">${escapeHtml(client.financeStatus || "Pendente")}</span>
      </header>
      <div class="chip-list">${statuses || `<span class="chip" style="background:#6b7280">Sem status</span>`}</div>
      <div class="card-meta">
        <span><i data-lucide="user"></i>${escapeHtml(ownerName(client.internalOwner))}</span>
        <span><i data-lucide="calendar"></i>${nextDue ? `Proximo prazo: ${formatDate(nextDue.date)}` : "Sem prazo registrado"}</span>
        <span><i data-lucide="folder"></i>${client.folderPath ? "Pasta registrada" : "Pasta nao informada"}</span>
      </div>
      <p>${escapeHtml(client.nextAction || "Sem proxima acao registrada.")}</p>
    </button>
  `;
}

function renderBoard(clients) {
  el.boardView.innerHTML = state.statuses
    .map((status) => {
      const matches = clients.filter((client) => (client.statusIds || []).includes(status.id));
      return `
        <section class="status-column">
          <header>
            <span>${escapeHtml(status.name)}</span>
            <span class="chip" style="background:${status.color}">${matches.length}</span>
          </header>
          ${matches.map((client) => renderClientCard(client)).join("") || `<p class="empty-state">Sem clientes aqui.</p>`}
        </section>
      `;
    })
    .join("");
}

function setViewMode(mode) {
  activeViewMode = mode;
  el.listModeButton.classList.toggle("active", mode === "list");
  el.boardModeButton.classList.toggle("active", mode === "board");
  renderClients();
}

function openClientById(clientId) {
  const client = state.clients.find((item) => item.id === clientId);
  if (client) openClient(cloneData(client));
}

function openClient(client) {
  activeClient = client;
  el.clientDialogTitle.textContent = client.clientName || "Novo cliente";
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.value = activeClient[input.dataset.field] || "";
  });
  renderUserSelects();
  renderActiveStatuses();
  renderStatusPicker();
  renderMonthlyTable();
  renderTasks();
  renderDeadlines();
  renderNotes();
  renderDocuments();
  switchTab("summaryTab");
  el.clientDialog.showModal();
  refreshIcons();
}

function renderUserSelects() {
  document.querySelectorAll('select[data-field="internalOwner"]').forEach((select) => {
    select.innerHTML = state.users.map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`).join("");
    select.value = activeClient.internalOwner || currentUser.id;
    activeClient.internalOwner = select.value;
  });
}

function renderActiveStatuses() {
  const statuses = getClientStatuses(activeClient);
  el.activeStatusList.innerHTML = statuses.length
    ? statuses
        .map(
          (status) => `
            <span class="chip" style="background:${status.color}">
              ${escapeHtml(status.name)}
              <button type="button" aria-label="Remover status" data-remove-status="${status.id}">x</button>
            </span>
          `
        )
        .join("")
    : `<p class="empty-state">Nenhum status ativo.</p>`;

  document.querySelectorAll("[data-remove-status]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClient.statusIds = activeClient.statusIds.filter((idValue) => idValue !== button.dataset.removeStatus);
      renderActiveStatuses();
      renderStatusPicker();
    });
  });
}

function renderStatusPicker() {
  const active = new Set(activeClient.statusIds || []);
  el.statusPicker.innerHTML = state.statuses
    .filter((status) => !active.has(status.id))
    .map((status) => `<button type="button" class="status-option" data-add-status="${status.id}">${escapeHtml(status.name)}</button>`)
    .join("");

  document.querySelectorAll("[data-add-status]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClient.statusIds = [...new Set([...(activeClient.statusIds || []), button.dataset.addStatus])];
      renderActiveStatuses();
      renderStatusPicker();
    });
  });
}

function renderMonthlyTable() {
  el.monthlyTable.innerHTML = (activeClient.monthly || [])
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(
      (row) => `
        <tr data-month-row="${row.id}">
          <td><input type="month" value="${row.month || ""}" data-month-field="month" /></td>
          ${["receiptPaid", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"]
            .map((field) => `<td><input type="checkbox" ${row[field] ? "checked" : ""} data-month-field="${field}" /></td>`)
            .join("")}
          <td><input type="text" value="${escapeAttr(row.notes || "")}" data-month-field="notes" /></td>
        </tr>
      `
    )
    .join("");

  document.querySelectorAll("[data-month-row]").forEach((tr) => {
    const row = activeClient.monthly.find((item) => item.id === tr.dataset.monthRow);
    tr.querySelectorAll("[data-month-field]").forEach((input) => {
      input.addEventListener("input", () => {
        row[input.dataset.monthField] = input.type === "checkbox" ? input.checked : input.value;
      });
      input.addEventListener("change", () => {
        row[input.dataset.monthField] = input.type === "checkbox" ? input.checked : input.value;
      });
    });
  });
}

function renderTasks() {
  el.tasksList.innerHTML = (activeClient.tasks || []).length
    ? activeClient.tasks
        .map(
          (task) => `
            <div class="list-item" data-task="${task.id}">
              <label>Tarefa<input value="${escapeAttr(task.title || "")}" data-task-field="title" /></label>
              <label>Responsavel<select data-task-field="ownerId">${userOptions(task.ownerId)}</select></label>
              <label>Prazo<input type="date" value="${task.dueDate || ""}" data-task-field="dueDate" /></label>
              <label>Status<select data-task-field="status">${taskStatusOptions(task.status)}</select></label>
              <button class="icon-button" type="button" data-remove-task="${task.id}" aria-label="Remover tarefa"><i data-lucide="trash-2"></i></button>
            </div>
          `
        )
        .join("")
    : `<p class="empty-state">Nenhuma tarefa cadastrada.</p>`;
  bindCollectionFields("task", activeClient.tasks, renderTasks);
}

function renderDeadlines() {
  el.deadlinesList.innerHTML = (activeClient.deadlines || []).length
    ? activeClient.deadlines
        .map(
          (deadline) => `
            <div class="list-item" data-deadline="${deadline.id}">
              <label>Prazo<input value="${escapeAttr(deadline.title || "")}" data-deadline-field="title" /></label>
              <label>Tipo<select data-deadline-field="type">${deadlineTypeOptions(deadline.type)}</select></label>
              <label>Data<input type="date" value="${deadline.date || ""}" data-deadline-field="date" /></label>
              <label>Responsavel<select data-deadline-field="ownerId">${userOptions(deadline.ownerId)}</select></label>
              <button class="icon-button" type="button" data-remove-deadline="${deadline.id}" aria-label="Remover prazo"><i data-lucide="trash-2"></i></button>
            </div>
          `
        )
        .join("")
    : `<p class="empty-state">Nenhum prazo cadastrado.</p>`;
  bindCollectionFields("deadline", activeClient.deadlines, renderDeadlines);
}

function renderNotes() {
  el.notesList.innerHTML = (activeClient.notes || []).length
    ? [...activeClient.notes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((note) => {
          const canEdit = note.userId === currentUser.id && Date.now() - new Date(note.createdAt).getTime() <= NOTE_EDIT_WINDOW_MS;
          return `
            <article class="timeline-item" data-note="${note.id}">
              <header>
                <strong>${escapeHtml(ownerName(note.userId))}</strong>
                <span>${formatDateTime(note.createdAt)}${note.updatedAt ? " | editada" : ""}</span>
              </header>
              ${
                canEdit
                  ? `<textarea data-note-field="text">${escapeHtml(note.text || "")}</textarea>`
                  : `<p>${escapeHtml(note.text || "")}</p>`
              }
              ${canEdit ? `<button class="small-button" type="button" data-save-note="${note.id}"><i data-lucide="save"></i> Salvar edicao</button>` : ""}
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">Nenhuma anotacao registrada.</p>`;

  document.querySelectorAll("[data-save-note]").forEach((button) => {
    button.addEventListener("click", () => {
      const note = activeClient.notes.find((item) => item.id === button.dataset.saveNote);
      const box = document.querySelector(`[data-note="${note.id}"] [data-note-field="text"]`);
      note.text = box.value.trim();
      note.updatedAt = new Date().toISOString();
      renderNotes();
    });
  });
  refreshIcons();
}

function renderDocuments() {
  el.documentsList.innerHTML = (activeClient.documents || []).length
    ? activeClient.documents
        .map(
          (doc) => `
            <div class="list-item doc-item" data-doc="${doc.id}">
              <label>Documento<input value="${escapeAttr(doc.name || "")}" data-doc-field="name" /></label>
              <label>Status<select data-doc-field="status">${documentStatusOptions(doc.status)}</select></label>
              <label>Caminho/link<input value="${escapeAttr(doc.path || "")}" data-doc-field="path" /></label>
              <button class="icon-button" type="button" data-remove-doc="${doc.id}" aria-label="Remover documento"><i data-lucide="trash-2"></i></button>
            </div>
          `
        )
        .join("")
    : `<p class="empty-state">Nenhum documento cadastrado.</p>`;
  bindCollectionFields("doc", activeClient.documents, renderDocuments);
}

function bindCollectionFields(type, collection, rerender) {
  document.querySelectorAll(`[data-${type}]`).forEach((row) => {
    const item = collection.find((entry) => entry.id === row.dataset[type]);
    row.querySelectorAll(`[data-${type}-field]`).forEach((input) => {
      input.addEventListener("input", () => {
        item[input.dataset[`${type}Field`]] = input.value;
      });
      input.addEventListener("change", () => {
        item[input.dataset[`${type}Field`]] = input.value;
      });
    });
  });
  document.querySelectorAll(`[data-remove-${type}]`).forEach((button) => {
    button.addEventListener("click", () => {
      const idValue = button.dataset[`remove${capitalize(type)}`];
      const index = collection.findIndex((item) => item.id === idValue);
      if (index >= 0) collection.splice(index, 1);
      rerender();
    });
  });
  refreshIcons();
}

function addNote() {
  const text = el.newNoteText.value.trim();
  if (!text) return;
  activeClient.notes.unshift({
    id: id(),
    text,
    userId: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  });
  el.newNoteText.value = "";
  renderNotes();
}

function saveActiveClient() {
  if (!activeClient.clientName.trim()) {
    activeClient.clientName = activeClient.fullName || "Cliente sem nome";
  }
  activeClient.updatedAt = new Date().toISOString();
  const index = state.clients.findIndex((client) => client.id === activeClient.id);
  if (index >= 0) state.clients[index] = cloneData(activeClient);
  else state.clients.unshift(cloneData(activeClient));
  saveState();
  el.clientDialog.close();
  renderAll();
}

function deleteActiveClient() {
  if (!activeClient) return;
  const confirmed = confirm(`Excluir o card de ${activeClient.clientName || "cliente"}?`);
  if (!confirmed) return;
  state.clients = state.clients.filter((client) => client.id !== activeClient.id);
  saveState();
  el.clientDialog.close();
  renderAll();
}

function renderStatusManager() {
  el.statusManager.innerHTML = state.statuses
    .map(
      (status) => `
        <div class="manager-item status-row" data-status-manager="${status.id}">
          <label>Nome<input value="${escapeAttr(status.name)}" data-status-manager-field="name" /></label>
          <label>Cor<input class="color-input" type="color" value="${status.color}" data-status-manager-field="color" /></label>
          <button class="danger-button" type="button" data-remove-global-status="${status.id}"><i data-lucide="trash-2"></i> Remover</button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll("[data-status-manager]").forEach((row) => {
    const status = state.statuses.find((item) => item.id === row.dataset.statusManager);
    row.querySelectorAll("[data-status-manager-field]").forEach((input) => {
      input.addEventListener("input", () => {
        status[input.dataset.statusManagerField] = input.value;
        saveState();
        renderStatusFilter();
        renderClients();
      });
    });
  });
  document.querySelectorAll("[data-remove-global-status]").forEach((button) => {
    button.addEventListener("click", () => {
      state.statuses = state.statuses.filter((status) => status.id !== button.dataset.removeGlobalStatus);
      state.clients.forEach((client) => {
        client.statusIds = (client.statusIds || []).filter((statusId) => statusId !== button.dataset.removeGlobalStatus);
      });
      saveState();
      renderAll();
    });
  });
  refreshIcons();
}

function renderUserManager() {
  el.userManager.innerHTML = state.users
    .map(
      (user) => `
        <div class="manager-item" data-user-manager="${user.id}">
          <label>Nome<input value="${escapeAttr(user.name)}" data-user-manager-field="name" /></label>
          <label>E-mail<input value="${escapeAttr(user.email)}" data-user-manager-field="email" /></label>
          <label>Perfil<select data-user-manager-field="role">
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Administrador</option>
            <option value="user" ${user.role === "user" ? "selected" : ""}>Usuario</option>
          </select></label>
          <button class="danger-button" type="button" data-remove-user="${user.id}" ${user.id === currentUser?.id ? "disabled" : ""}><i data-lucide="trash-2"></i> Remover</button>
        </div>
      `
    )
    .join("");

  document.querySelectorAll("[data-user-manager]").forEach((row) => {
    const user = state.users.find((item) => item.id === row.dataset.userManager);
    row.querySelectorAll("[data-user-manager-field]").forEach((input) => {
      input.addEventListener("input", () => {
        user[input.dataset.userManagerField] = input.value;
        saveState();
      });
      input.addEventListener("change", () => {
        user[input.dataset.userManagerField] = input.value;
        saveState();
      });
    });
  });
  document.querySelectorAll("[data-remove-user]").forEach((button) => {
    button.addEventListener("click", () => {
      state.users = state.users.filter((user) => user.id !== button.dataset.removeUser);
      saveState();
      renderUserManager();
    });
  });
  refreshIcons();
}

function openStatusDialog() {
  openSimpleDialog("Criar status", [
    { label: "Nome", name: "name", type: "text", value: "" },
    { label: "Cor", name: "color", type: "color", value: "#009f7f" },
  ], (values) => {
    state.statuses.push({ id: id(), name: values.name || "Novo status", color: values.color || "#009f7f" });
    saveState();
    renderAll();
  });
}

function openUserDialog() {
  if (currentUser.role !== "admin") return;
  openSimpleDialog("Criar usuario", [
    { label: "Nome", name: "name", type: "text", value: "" },
    { label: "E-mail", name: "email", type: "email", value: "" },
    { label: "Senha", name: "password", type: "text", value: "" },
  ], (values) => {
    state.users.push({
      id: id(),
      name: values.name || "Novo usuario",
      email: values.email,
      password: values.password || "123456",
      role: "user",
    });
    saveState();
    renderUserManager();
  });
}

function openSimpleDialog(title, fields, onSave) {
  el.simpleDialogTitle.textContent = title;
  el.simpleDialogBody.innerHTML = fields
    .map(
      (field) => `
        <label>${field.label}
          <input class="${field.type === "color" ? "color-input" : ""}" type="${field.type}" value="${escapeAttr(field.value)}" data-simple-field="${field.name}" />
        </label>
      `
    )
    .join("");
  el.simpleDialogSave.onclick = () => {
    const values = {};
    el.simpleDialogBody.querySelectorAll("[data-simple-field]").forEach((input) => {
      values[input.dataset.simpleField] = input.value.trim();
    });
    onSave(values);
    el.simpleDialog.close();
  };
  el.simpleDialog.showModal();
  refreshIcons();
}

function switchSection(sectionId) {
  document.querySelectorAll(".app-section").forEach((section) => {
    section.hidden = section.id !== sectionId;
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
}

function switchTab(tabId) {
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.id === tabId);
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tabId);
  });
}

function createEmptyClient() {
  return {
    id: id(),
    clientName: "",
    fullName: "",
    cpf: "",
    phone: "",
    whatsappDdd: "",
    infoOwner: "",
    internalOwner: currentUser.id,
    folderPath: "",
    nextAction: "",
    statusIds: [],
    workResponsible: "",
    destination: "",
    workType: "",
    concrete: "",
    state: "",
    startDate: "",
    endDate: "",
    area: "",
    monthly: [],
    tasks: [],
    deadlines: [],
    notes: [],
    documents: [],
    workersNotes: "",
    feeValue: "",
    paymentMethod: "",
    installments: "",
    financeStatus: "Pendente",
    referralCommission: "",
    referrer: "",
    financeNotes: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function generateMonthsFromWorkDates() {
  const start = activeClient.startDate;
  const end = activeClient.endDate;
  if (!start || !end) {
    alert("Informe inicio e fim da obra na aba Cliente e obra.");
    return;
  }
  const months = monthRange(start, end);
  const existing = new Set(activeClient.monthly.map((row) => row.month));
  months.forEach((month) => {
    if (!existing.has(month)) activeClient.monthly.push(emptyMonth(month));
  });
  renderMonthlyTable();
}

function monthRange(startDate, endDate) {
  const start = new Date(`${startDate.slice(0, 7)}-01T00:00:00`);
  const end = new Date(`${endDate.slice(0, 7)}-01T00:00:00`);
  const result = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    result.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return result;
}

function emptyMonth(month = "") {
  return {
    id: id(),
    month,
    receiptPaid: false,
    receiptSigned: false,
    remunerationSent: false,
    guideIssued: false,
    guideSent: false,
    guidePaid: false,
    notes: "",
  };
}

function emptyTask() {
  return { id: id(), title: "", ownerId: currentUser.id, dueDate: "", status: "Pendente" };
}

function emptyDeadline() {
  return { id: id(), title: "", type: "Interno", ownerId: currentUser.id, date: "" };
}

function emptyDocument() {
  return { id: id(), name: "", status: "Pendente", path: "" };
}

function getClientStatuses(client) {
  const active = new Set(client.statusIds || []);
  return state.statuses.filter((status) => active.has(status.id));
}

function chip(status) {
  return `<span class="chip" style="background:${status.color}">${escapeHtml(status.name)}</span>`;
}

function ownerName(userId) {
  return state.users.find((user) => user.id === userId)?.name || "Sem responsavel";
}

function userOptions(selectedId) {
  return state.users.map((user) => `<option value="${user.id}" ${user.id === selectedId ? "selected" : ""}>${escapeHtml(user.name)}</option>`).join("");
}

function taskStatusOptions(selected = "Pendente") {
  return ["Pendente", "Em andamento", "Concluida"]
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function deadlineTypeOptions(selected = "Interno") {
  return ["Guia", "Receita", "Cliente", "Interno", "NF", "Outro"]
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function documentStatusOptions(selected = "Pendente") {
  return ["Pendente", "Recebido", "Aprovado", "Invalido", "Nao possui"]
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function nearestDate(deadlines) {
  return deadlines
    .filter((deadline) => deadline.date)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];
}

function financeColor(status) {
  return {
    Pago: "#15803d",
    Parcial: "#2f80ed",
    Atrasado: "#d14343",
    Pendente: "#c78000",
  }[status] || "#6b7280";
}

function formatDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("pt-BR");
}

function formatDateTime(dateValue) {
  return new Date(dateValue).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, "&#10;");
}

function id() {
  return makeId();
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function refreshIcons() {
  if (window.lucide) window.lucide.createIcons();
}
