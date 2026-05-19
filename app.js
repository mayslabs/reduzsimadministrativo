const STORAGE_KEY = "reduzsim_client_flow_v2";
const LEGACY_STORAGE_KEYS = ["reduzsim_client_flow_v1"];
const SESSION_KEY = "reduzsim_current_user_v2";
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
  ["Procuração e-CAC pendente", "#c78000"],
  ["Documentos da obra pendentes", "#2f80ed"],
  ["Aguardando engenheiro", "#7c3aed"],
  ["Dados dos trabalhadores", "#455a64"],
  ["Recibos em elaboração", "#007f68"],
  ["Recibos para assinatura", "#d14343"],
  ["CNO pendente", "#9a6b00"],
  ["eSocial em andamento", "#2563eb"],
  ["Remuneração mensal enviada", "#0f766e"],
  ["Guia emitida", "#0891b2"],
  ["Guia enviada ao cliente", "#0284c7"],
  ["Aguardando pagamento da guia", "#d14343"],
  ["Requerimento Receita", "#7c3aed"],
  ["Aguardando decisão Receita", "#9333ea"],
  ["CND emitida", "#15803d"],
  ["NF pendente", "#f97316"],
  ["Pendência do cliente", "#b91c1c"],
  ["Finalizado", "#4d4d4d"],
].map(([name, color]) => ({ id: id(), name, color }));

const labelReplacements = {
  "Procuracao e-CAC pendente": "Procuração e-CAC pendente",
  "Recibos em elaboracao": "Recibos em elaboração",
  "Remuneracao mensal enviada": "Remuneração mensal enviada",
  "Aguardando decisao Receita": "Aguardando decisão Receita",
  "Pendencia do cliente": "Pendência do cliente",
  "Concluida": "Concluída",
  "Invalido": "Inválido",
  "Nao possui": "Não possui",
  "Proprietaria": "Proprietária",
  "Alvara": "Alvará",
};

const fixedUserIds = {
  mayssa: "user-mayssa",
  camilli: "user-camilli",
};

const defaultUsers = [
  {
    id: fixedUserIds.mayssa,
    name: "Mayssa",
    email: "mayssa@reduzsim.com.br",
    password: "123456",
    role: "admin",
  },
  {
    id: fixedUserIds.camilli,
    name: "Camilli",
    email: "camilli@reduzsim.com.br",
    password: "123456",
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
    nextAction: "Conferir procuração e validar documentos iniciais.",
    statusIds: [
      statusByName["Procuração e-CAC pendente"],
      statusByName["Documentos da obra pendentes"],
      statusByName["Aguardando pagamento da guia"],
    ].filter(Boolean),
    workResponsible: "Engenheiro responsável",
    destination: "Residencial",
    workType: "Construção",
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
    history: [
      {
        id: id(),
        title: "Card criado",
        details: ["Registro inicial do cliente exemplo."],
        userId: state.users[0]?.id || "",
        type: "system",
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    ],
    documents: [
      { id: id(), name: "Alvará", status: "Pendente", path: "" },
      { id: id(), name: "Habite-se", status: "Não possui", path: "" },
    ],
    workersNotes: "João - R$ 2.200,00 - jan/2026\nMaria - R$ 2.000,00 - jan/2026",
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
let activeTaskCalendarMode = "week";
let activeTaskDate = new Date();

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
  addInternalTaskButton: document.getElementById("addInternalTaskButton"),
  taskOverview: document.getElementById("taskOverview"),
  previousTaskPeriodButton: document.getElementById("previousTaskPeriodButton"),
  nextTaskPeriodButton: document.getElementById("nextTaskPeriodButton"),
  todayTaskButton: document.getElementById("todayTaskButton"),
  taskPeriodLabel: document.getElementById("taskPeriodLabel"),
  taskWeekModeButton: document.getElementById("taskWeekModeButton"),
  taskMonthModeButton: document.getElementById("taskMonthModeButton"),
  taskSearchInput: document.getElementById("taskSearchInput"),
  taskOwnerFilter: document.getElementById("taskOwnerFilter"),
  taskStatusFilter: document.getElementById("taskStatusFilter"),
  taskCenterList: document.getElementById("taskCenterList"),
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
  historyAdminControls: document.getElementById("historyAdminControls"),
  newHistoryText: document.getElementById("newHistoryText"),
  addHistoryButton: document.getElementById("addHistoryButton"),
  historyList: document.getElementById("historyList"),
  addDocButton: document.getElementById("addDocButton"),
  documentsList: document.getElementById("documentsList"),
  addStatusButton: document.getElementById("addStatusButton"),
  statusManager: document.getElementById("statusManager"),
  addUserButton: document.getElementById("addUserButton"),
  userManager: document.getElementById("userManager"),
  accountName: document.getElementById("accountName"),
  accountEmail: document.getElementById("accountEmail"),
  accountRole: document.getElementById("accountRole"),
  accountPassword: document.getElementById("accountPassword"),
  accountPasswordConfirm: document.getElementById("accountPasswordConfirm"),
  saveAccountPasswordButton: document.getElementById("saveAccountPasswordButton"),
  accountMessage: document.getElementById("accountMessage"),
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
  const saved = readStoredState();
  if (saved) {
    return migrateState(saved);
  }

  const initial = {
    statuses: defaultStatuses,
    users: defaultUsers,
    clients: [],
    internalTasks: [],
  };
  state = initial;
  initial.clients = [defaultClient()];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
  return initial;
}

function readStoredState() {
  const current = localStorage.getItem(STORAGE_KEY);
  if (current) return JSON.parse(current);

  for (const key of LEGACY_STORAGE_KEYS) {
    const legacy = localStorage.getItem(key);
    if (legacy) return JSON.parse(legacy);
  }

  return null;
}

function migrateState(savedState = {}, persist = true) {
  const migrated = {
    statuses: Array.isArray(savedState.statuses) && savedState.statuses.length ? savedState.statuses : defaultStatuses,
    users: Array.isArray(savedState.users) ? savedState.users : [],
    clients: Array.isArray(savedState.clients) ? savedState.clients : [],
    internalTasks: Array.isArray(savedState.internalTasks) ? savedState.internalTasks.map(normalizeInternalTask) : [],
  };
  migrated.statuses = migrated.statuses.map((status) => ({
    ...status,
    name: localizeLabel(status.name),
  }));

  const userCleanup = normalizeUsersForMigration(migrated.users);
  migrated.users = userCleanup.users;

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
    history: [],
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
    tasks: Array.isArray(client.tasks) ? client.tasks.map((task) => ({ ...task, status: localizeLabel(task.status) })) : [],
    deadlines: Array.isArray(client.deadlines) ? client.deadlines : [],
    notes: Array.isArray(client.notes) ? client.notes : [],
    history: Array.isArray(client.history) ? client.history.map(normalizeHistoryEntry) : [],
    documents: Array.isArray(client.documents) ? client.documents.map((doc) => ({ ...doc, name: localizeLabel(doc.name), status: localizeLabel(doc.status) })) : [],
    statusIds: Array.isArray(client.statusIds) ? client.statusIds : [],
  }));

  remapUserReferences(migrated, userCleanup.idMap);

  if (persist) localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
  return migrated;
}

function localizeLabel(value) {
  return labelReplacements[value] || value;
}

function normalizeHistoryEntry(entry) {
  return {
    id: entry.id || id(),
    title: entry.title || "Registro do histórico",
    details: Array.isArray(entry.details) ? entry.details : [entry.text || entry.detail || ""].filter(Boolean),
    userId: entry.userId || "",
    type: entry.type || "manual",
    createdAt: entry.createdAt || new Date().toISOString(),
    updatedAt: entry.updatedAt || null,
  };
}

function normalizeInternalTask(task) {
  return {
    id: task.id || id(),
    title: task.title || "",
    ownerId: task.ownerId || "",
    dueDate: task.dueDate || "",
    status: localizeLabel(task.status || "Pendente"),
    visibility: task.visibility === "admin" ? "admin" : "team",
    createdBy: task.createdBy || "",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || null,
  };
}

function normalizeUsersForMigration(users) {
  const idMap = {};
  (users || []).forEach((user) => {
    if (!user?.id) return;
    idMap[user.id] = targetUserIdForMigration(user);
  });

  return {
    users: defaultUsers.map((user) => ({ ...user })),
    idMap,
  };
}

function targetUserIdForMigration(user) {
  const identity = normalize([user.name, user.email, user.role].join(" "));
  if (
    identity.includes("camilli") ||
    identity.includes("camila") ||
    identity.includes("colaboradora") ||
    identity.includes("colaborador")
  ) {
    return fixedUserIds.camilli;
  }

  if (
    identity.includes("mayssa") ||
    identity.includes("may") ||
    identity.includes("proprietaria") ||
    identity.includes("admin")
  ) {
    return fixedUserIds.mayssa;
  }

  return user.role === "admin" ? fixedUserIds.mayssa : fixedUserIds.camilli;
}

function remapUserReferences(migrated, idMap) {
  if (!Object.keys(idMap).length) return;

  migrated.clients.forEach((client) => {
    client.internalOwner = idMap[client.internalOwner] || client.internalOwner;
    (client.tasks || []).forEach((task) => {
      task.ownerId = idMap[task.ownerId] || task.ownerId;
    });
    (client.deadlines || []).forEach((deadline) => {
      deadline.ownerId = idMap[deadline.ownerId] || deadline.ownerId;
    });
    (client.notes || []).forEach((note) => {
      note.userId = idMap[note.userId] || note.userId;
    });
    (client.history || []).forEach((entry) => {
      entry.userId = idMap[entry.userId] || entry.userId;
    });
  });

  (migrated.internalTasks || []).forEach((task) => {
    task.ownerId = idMap[task.ownerId] || task.ownerId;
    task.createdBy = idMap[task.createdBy] || task.createdBy;
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function bindEvents() {
  window.addEventListener("storage", handleStorageSync);
  el.loginForm.addEventListener("submit", handleLogin);
  el.repairAccessButton.addEventListener("click", repairAccess);
  el.logoutButton.addEventListener("click", handleLogout);
  el.newClientButton.addEventListener("click", () => openClient(createEmptyClient()));
  el.addInternalTaskButton.addEventListener("click", openInternalTaskDialog);
  el.previousTaskPeriodButton.addEventListener("click", () => moveTaskPeriod(-1));
  el.nextTaskPeriodButton.addEventListener("click", () => moveTaskPeriod(1));
  el.todayTaskButton.addEventListener("click", () => {
    activeTaskDate = new Date();
    renderTaskCenter();
  });
  el.taskWeekModeButton.addEventListener("click", () => setTaskCalendarMode("week"));
  el.taskMonthModeButton.addEventListener("click", () => setTaskCalendarMode("month"));
  el.searchInput.addEventListener("input", renderClients);
  el.statusFilter.addEventListener("change", renderClients);
  el.taskSearchInput.addEventListener("input", renderTaskCenter);
  el.taskOwnerFilter.addEventListener("change", renderTaskCenter);
  el.taskStatusFilter.addEventListener("change", renderTaskCenter);
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
  el.addHistoryButton.addEventListener("click", addManualHistory);
  el.addDocButton.addEventListener("click", () => {
    activeClient.documents.push(emptyDocument());
    renderDocuments();
  });
  el.addStatusButton.addEventListener("click", openStatusDialog);
  el.addUserButton.addEventListener("click", openUserDialog);
  el.saveAccountPasswordButton.addEventListener("click", changeOwnPassword);

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

function handleStorageSync(event) {
  if (event.key !== STORAGE_KEY || !event.newValue) return;
  state = migrateState(JSON.parse(event.newValue), false);
  if (currentUser) {
    currentUser = state.users.find((user) => user.id === currentUser.id) || null;
    if (!currentUser) {
      handleLogout();
      return;
    }
    renderAll();
  }
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
  state.users = defaultUsers.map((user) => ({ ...user }));
  saveState();
  el.loginEmail.value = "mayssa@reduzsim.com.br";
  el.loginPassword.value = "123456";
  el.loginError.hidden = true;
  el.loginStatus.textContent = "Acessos oficiais reparados. Clique em Entrar.";
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  currentUser = null;
  showLogin();
}

function showLogin() {
  el.loginView.hidden = false;
  el.appView.hidden = true;
  el.loginView.style.display = "grid";
  el.appView.style.display = "none";
}

function showApp() {
  el.loginView.hidden = true;
  el.appView.hidden = false;
  el.loginView.style.display = "none";
  el.appView.style.display = "grid";
  updateCurrentUserDisplay();
  configureNavigationForRole();
  renderAll();
}

function updateCurrentUserDisplay() {
  el.currentUserLabel.textContent = `${currentUser.name} | ${currentUser.role === "admin" ? "Administrador" : "Usuário"}`;
}

function configureNavigationForRole() {
  const isAdmin = currentUser.role === "admin";
  document.querySelector('[data-section="usersSection"]').style.display = isAdmin ? "" : "none";
  document.querySelector('[data-section="accountSection"]').style.display = isAdmin ? "none" : "";
  el.addUserButton.style.display = "none";

  const activeSection = document.querySelector(".nav-item.active")?.dataset.section;
  if ((!isAdmin && activeSection === "usersSection") || (isAdmin && activeSection === "accountSection")) {
    switchSection("clientsSection");
  }
}

function renderAll() {
  renderStatusFilter();
  renderMetrics();
  renderClients();
  renderTaskCenter();
  renderStatusManager();
  renderUserManager();
  renderAccount();
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
  const openTasks = taskCenterItems().filter((item) => item.kind !== "Prazo" && item.urgency !== "done").length;
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

function renderTaskCenter() {
  renderTaskOwnerFilter();
  const items = taskCenterItems();
  renderTaskOverview(items);
  const filtered = filterTaskCenterItems(items);
  renderTaskPeriodControls();

  renderTaskCalendar(filtered);
  bindTaskCenterActions();
  refreshIcons();
}

function renderTaskPeriodControls() {
  el.taskWeekModeButton.classList.toggle("active", activeTaskCalendarMode === "week");
  el.taskMonthModeButton.classList.toggle("active", activeTaskCalendarMode === "month");

  if (activeTaskCalendarMode === "week") {
    const days = weekDays(activeTaskDate);
    el.taskPeriodLabel.textContent = `${formatShortDate(days[0])} a ${formatShortDate(days[6])}`;
    return;
  }

  el.taskPeriodLabel.textContent = activeTaskDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

function renderTaskCalendar(items) {
  const datedItems = items.filter((item) => item.date);
  const noDateItems = items.filter((item) => !item.date);
  const calendarMarkup = activeTaskCalendarMode === "week" ? renderTaskWeekBoard(datedItems) : renderTaskMonthBoard(datedItems);

  el.taskCenterList.innerHTML = `
    ${calendarMarkup}
    ${renderNoDateTasks(noDateItems)}
  `;
}

function renderTaskWeekBoard(items) {
  const today = localDateKey();
  return `
    <div class="task-week-board">
      ${weekDays(activeTaskDate)
        .map((day) => {
          const key = localDateKey(day);
          const dayItems = items.filter((item) => item.date === key);
          return `
            <section class="task-day-column ${key === today ? "today" : ""}">
              <header>
                <span>${weekdayLabel(day)}</span>
                <strong>${formatShortDate(day)}</strong>
                <small>${dayItems.length}</small>
              </header>
              <div class="task-day-items">
                ${dayItems.map((item) => renderTaskCalendarCard(item)).join("") || `<p class="empty-state">Sem tarefas.</p>`}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderTaskMonthBoard(items) {
  const today = localDateKey();
  const days = monthCalendarDays(activeTaskDate);
  return `
    <div class="month-weekdays">
      ${["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => `<span>${day}</span>`).join("")}
    </div>
    <div class="task-month-board">
      ${days
        .map((day) => {
          const key = localDateKey(day);
          const inMonth = day.getMonth() === activeTaskDate.getMonth();
          const dayItems = items.filter((item) => item.date === key);
          return `
            <section class="task-month-day ${inMonth ? "" : "outside"} ${key === today ? "today" : ""}">
              <header>
                <strong>${day.getDate()}</strong>
                <span>${dayItems.length}</span>
              </header>
              <div class="task-month-items">
                ${dayItems.slice(0, 4).map((item) => renderTaskCalendarCard(item, true)).join("") || ""}
                ${dayItems.length > 4 ? `<small>+${dayItems.length - 4} tarefa(s)</small>` : ""}
              </div>
            </section>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderNoDateTasks(items) {
  if (!items.length) return "";

  return `
    <section class="no-date-panel">
      <header>
        <strong>Sem prazo</strong>
        <span>${items.length}</span>
      </header>
      <div class="no-date-grid">
        ${items.map((item) => renderTaskCalendarCard(item)).join("")}
      </div>
    </section>
  `;
}

function bindTaskCenterActions() {
  document.querySelectorAll("[data-open-task-client]").forEach((button) => {
    button.addEventListener("click", () => openClientById(button.dataset.openTaskClient));
  });

  document.querySelectorAll("[data-center-task-status]").forEach((select) => {
    select.addEventListener("change", () => {
      if (select.dataset.taskSource === "internal") {
        const task = state.internalTasks.find((item) => item.id === select.dataset.taskId);
        if (!task) return;
        task.status = select.value;
        task.updatedAt = new Date().toISOString();
        saveState();
        renderMetrics();
        renderTaskCenter();
        return;
      }

      const client = state.clients.find((item) => item.id === select.dataset.clientId);
      const task = client?.tasks?.find((item) => item.id === select.dataset.taskId);
      if (!task) return;
      const oldStatus = localizeLabel(task.status || "Pendente");
      if (oldStatus === select.value) return;
      task.status = select.value;
      client.updatedAt = new Date().toISOString();
      addHistoryEntry(client, "Status de tarefa alterado", [
        `${task.title || "Tarefa sem título"}: ${oldStatus} -> ${select.value}.`,
      ]);
      saveState();
      renderMetrics();
      renderTaskCenter();
    });
  });

  document.querySelectorAll("[data-edit-internal-task]").forEach((button) => {
    button.addEventListener("click", () => openInternalTaskDialog(button.dataset.editInternalTask));
  });

  document.querySelectorAll("[data-remove-internal-task]").forEach((button) => {
    button.addEventListener("click", () => {
      state.internalTasks = state.internalTasks.filter((task) => task.id !== button.dataset.removeInternalTask);
      saveState();
      renderMetrics();
      renderTaskCenter();
    });
  });
}

function renderTaskOwnerFilter() {
  const selected = el.taskOwnerFilter.value;
  el.taskOwnerFilter.innerHTML = `<option value="">Todos os responsáveis</option>${state.users
    .map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`)
    .join("")}`;
  el.taskOwnerFilter.value = selected;
}

function renderTaskOverview(items) {
  const openItems = items.filter((item) => item.urgency !== "done");
  const stats = [
    ["Atrasadas", openItems.filter((item) => item.urgency === "overdue").length, "overdue"],
    ["Hoje", openItems.filter((item) => item.urgency === "today").length, "today"],
    ["Próximas", openItems.filter((item) => item.urgency === "upcoming").length, "upcoming"],
    ["Sem prazo", openItems.filter((item) => item.urgency === "no-date").length, "no-date"],
  ];

  el.taskOverview.innerHTML = stats
    .map(
      ([label, value, urgency]) => `
        <article class="task-stat ${urgency}">
          <span>${label}</span>
          <strong>${value}</strong>
        </article>
      `
    )
    .join("");
}

function taskCenterItems() {
  const clientItems = state.clients.flatMap((client) => {
    const tasks = (client.tasks || []).map((task) => {
      const item = {
        id: task.id,
        source: "Administrativo",
        kind: "Tarefa",
        title: task.title || "Tarefa sem título",
        ownerId: task.ownerId,
        date: task.dueDate || "",
        status: localizeLabel(task.status || "Pendente"),
        clientId: client.id,
        clientName: client.clientName || "Cliente sem nome",
      };
      item.urgency = taskUrgency(item);
      return item;
    });

    const deadlines = (client.deadlines || []).map((deadline) => {
      const item = {
        id: deadline.id,
        source: "Administrativo",
        kind: "Prazo",
        title: deadline.title || "Prazo sem título",
        ownerId: deadline.ownerId,
        date: deadline.date || "",
        status: deadline.type || "Prazo",
        clientId: client.id,
        clientName: client.clientName || "Cliente sem nome",
      };
      item.urgency = taskUrgency(item);
      return item;
    });

    return [...tasks, ...deadlines];
  });

  const internalItems = (state.internalTasks || [])
    .filter((task) => task.visibility !== "admin" || currentUser.role === "admin")
    .map((task) => {
      const item = {
        id: task.id,
        source: "Interno",
        kind: "Tarefa interna",
        title: task.title || "Tarefa interna sem título",
        ownerId: task.ownerId,
        date: task.dueDate || "",
        status: localizeLabel(task.status || "Pendente"),
        visibility: task.visibility || "team",
        internalTaskId: task.id,
        clientName: task.visibility === "admin" ? "Somente admin" : "Equipe interna",
      };
      item.urgency = taskUrgency(item);
      return item;
    });

  return [...clientItems, ...internalItems];
}

function filterTaskCenterItems(items) {
  const query = normalize(el.taskSearchInput.value);
  const ownerId = el.taskOwnerFilter.value;
  const status = el.taskStatusFilter.value;

  return items
    .filter((item) => {
      const haystack = normalize([item.title, item.clientName, item.kind, item.status, ownerName(item.ownerId), item.source, item.visibility].join(" "));
      const matchesQuery = !query || haystack.includes(query);
      const matchesOwner = !ownerId || item.ownerId === ownerId;
      const matchesStatus =
        !status ||
        item.urgency === status ||
        (status === "open" && item.urgency !== "done") ||
        (status === "done" && item.urgency === "done");
      return matchesQuery && matchesOwner && matchesStatus;
    })
    .sort((a, b) => {
      const order = { overdue: 0, today: 1, upcoming: 2, "no-date": 3, done: 4 };
      const orderDiff = order[a.urgency] - order[b.urgency];
      if (orderDiff) return orderDiff;
      if (!a.date && !b.date) return a.clientName.localeCompare(b.clientName);
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.localeCompare(b.date);
    });
}

function renderTaskCalendarCard(item, compact = false) {
  const statusControl =
    item.kind !== "Prazo"
      ? `<select class="task-status-select" data-center-task-status="${item.id}" data-task-source="${item.internalTaskId ? "internal" : "client"}" data-client-id="${item.clientId || ""}" data-task-id="${item.id}">${taskStatusOptions(item.status)}</select>`
      : `<span class="task-type-pill">${escapeHtml(item.status)}</span>`;
  const sourceClass = item.visibility === "admin" ? " admin-only" : "";
  const actionControl = item.internalTaskId
    ? `<div class="inline-actions task-row-actions">
        <button class="small-button" type="button" data-edit-internal-task="${item.internalTaskId}"><i data-lucide="pencil"></i> Editar</button>
        <button class="icon-button" type="button" data-remove-internal-task="${item.internalTaskId}" aria-label="Remover tarefa interna"><i data-lucide="trash-2"></i></button>
      </div>`
    : `<button class="small-button" type="button" data-open-task-client="${item.clientId}"><i data-lucide="external-link"></i> Abrir card</button>`;

  return `
    <article class="task-calendar-card ${item.urgency} ${compact ? "compact" : ""}">
      <div class="task-main">
        <div class="task-badges">
          <span class="task-kind">${item.kind}</span>
          <span class="task-source${sourceClass}">${item.visibility === "admin" ? "Somente admin" : escapeHtml(item.source)}</span>
          <span class="urgency-pill">${urgencyLabel(item.urgency)}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.clientName)}</p>
      </div>
      <div class="task-detail"><i data-lucide="user"></i>${escapeHtml(ownerName(item.ownerId))}</div>
      ${compact ? "" : `<div class="task-detail"><i data-lucide="calendar"></i>${item.date ? formatDate(item.date) : "Sem prazo"}</div>`}
      ${compact ? "" : `<div class="task-detail">${statusControl}</div>`}
      ${actionControl}
    </article>
  `;
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
        <span><i data-lucide="calendar"></i>${nextDue ? `Próximo prazo: ${formatDate(nextDue.date)}` : "Sem prazo registrado"}</span>
        <span><i data-lucide="folder"></i>${client.folderPath ? "Pasta registrada" : "Pasta não informada"}</span>
      </div>
      <p>${escapeHtml(client.nextAction || "Sem próxima ação registrada.")}</p>
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

function setTaskCalendarMode(mode) {
  activeTaskCalendarMode = mode;
  renderTaskCenter();
}

function moveTaskPeriod(direction) {
  const nextDate = new Date(activeTaskDate);
  if (activeTaskCalendarMode === "week") {
    nextDate.setDate(nextDate.getDate() + direction * 7);
  } else {
    nextDate.setDate(1);
    nextDate.setMonth(nextDate.getMonth() + direction);
  }
  activeTaskDate = nextDate;
  renderTaskCenter();
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
  renderHistory();
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
              <label>Responsável<select data-task-field="ownerId">${userOptions(task.ownerId)}</select></label>
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
              <label>Responsável<select data-deadline-field="ownerId">${userOptions(deadline.ownerId)}</select></label>
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
              ${canEdit ? `<button class="small-button" type="button" data-save-note="${note.id}"><i data-lucide="save"></i> Salvar edição</button>` : ""}
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">Nenhuma anotação registrada.</p>`;

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

function renderHistory() {
  const isAdmin = currentUser.role === "admin";
  el.historyAdminControls.hidden = !isAdmin;
  const history = Array.isArray(activeClient.history) ? activeClient.history : [];

  el.historyList.innerHTML = history.length
    ? [...history]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((entry) => {
          const details = Array.isArray(entry.details) ? entry.details : [];
          return `
            <article class="timeline-item history-item" data-history="${entry.id}">
              <header>
                <div>
                  ${
                    isAdmin
                      ? `<input class="history-title-input" value="${escapeAttr(entry.title || "")}" data-history-title="${entry.id}" />`
                      : `<strong>${escapeHtml(entry.title || "Registro do histórico")}</strong>`
                  }
                  <span>${escapeHtml(ownerName(entry.userId))} | ${entry.type === "system" ? "Automático" : "Manual"}</span>
                </div>
                <span>${formatDateTime(entry.createdAt)}${entry.updatedAt ? " | editado" : ""}</span>
              </header>
              ${
                isAdmin
                  ? `<textarea data-history-details="${entry.id}" rows="4">${escapeHtml(details.join("\n"))}</textarea>
                    <div class="inline-actions history-actions">
                      <button class="small-button" type="button" data-save-history="${entry.id}"><i data-lucide="save"></i> Salvar edição</button>
                      <button class="danger-button" type="button" data-remove-history="${entry.id}"><i data-lucide="trash-2"></i> Remover</button>
                    </div>`
                  : `<ul>${details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>`
              }
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state">Nenhum histórico registrado.</p>`;

  document.querySelectorAll("[data-save-history]").forEach((button) => {
    button.addEventListener("click", () => {
      if (currentUser.role !== "admin") return;
      const entry = activeClient.history.find((item) => item.id === button.dataset.saveHistory);
      if (!entry) return;
      const titleInput = document.querySelector(`[data-history-title="${entry.id}"]`);
      const detailsInput = document.querySelector(`[data-history-details="${entry.id}"]`);
      entry.title = titleInput.value.trim() || "Registro do histórico";
      entry.details = detailsInput.value.split("\n").map((line) => line.trim()).filter(Boolean);
      entry.updatedAt = new Date().toISOString();
      renderHistory();
    });
  });

  document.querySelectorAll("[data-remove-history]").forEach((button) => {
    button.addEventListener("click", () => {
      if (currentUser.role !== "admin") return;
      activeClient.history = activeClient.history.filter((entry) => entry.id !== button.dataset.removeHistory);
      renderHistory();
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

function addManualHistory() {
  if (currentUser.role !== "admin") return;
  const text = el.newHistoryText.value.trim();
  if (!text) return;
  addHistoryEntry(activeClient, "Registro manual", text.split("\n").map((line) => line.trim()).filter(Boolean), "manual");
  el.newHistoryText.value = "";
  renderHistory();
}

function saveActiveClient() {
  if (!activeClient.clientName.trim()) {
    activeClient.clientName = activeClient.fullName || "Cliente sem nome";
  }
  const index = state.clients.findIndex((client) => client.id === activeClient.id);
  const previousClient = index >= 0 ? state.clients[index] : null;
  const changes = previousClient ? summarizeClientChanges(previousClient, activeClient) : [];
  activeClient.updatedAt = new Date().toISOString();

  if (previousClient && changes.length) {
    addHistoryEntry(activeClient, "Card atualizado", changes, "system");
  }

  if (index >= 0) {
    state.clients[index] = cloneData(activeClient);
  } else {
    addHistoryEntry(activeClient, "Card criado", ["Novo card incluído no administrativo."], "system");
    state.clients.unshift(cloneData(activeClient));
  }
  saveState();
  el.clientDialog.close();
  renderAll();
}

function addHistoryEntry(client, title, details, type = "system") {
  client.history = Array.isArray(client.history) ? client.history : [];
  client.history.unshift({
    id: id(),
    title,
    details: Array.isArray(details) ? details : [details],
    userId: currentUser?.id || "",
    type,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  });
}

function summarizeClientChanges(previousClient, nextClient) {
  const changes = [];
  const fieldLabels = {
    clientName: "Nome do cliente",
    fullName: "Nome completo",
    cpf: "CPF",
    phone: "Telefone",
    whatsappDdd: "DDD do WhatsApp",
    infoOwner: "Responsável por informações",
    internalOwner: "Responsável interno",
    folderPath: "Pasta no OneDrive",
    nextAction: "Próxima ação",
    workResponsible: "Responsável da obra",
    destination: "Destinação",
    workType: "Tipo de obra",
    concrete: "Concreto usinado",
    state: "Estado",
    startDate: "Início da obra",
    endDate: "Fim da obra",
    area: "Área",
    workersNotes: "Informações dos trabalhadores",
    feeValue: "Honorários",
    paymentMethod: "Forma de pagamento",
    installments: "Parcelas",
    financeStatus: "Status financeiro",
    referralCommission: "Comissão de indicação",
    referrer: "Quem indicou",
    financeNotes: "Observações financeiras",
  };

  Object.entries(fieldLabels).forEach(([field, label]) => {
    const before = historyFieldValue(previousClient[field], field);
    const after = historyFieldValue(nextClient[field], field);
    if (before !== after) changes.push(`${label}: ${before} -> ${after}.`);
  });

  const previousStatuses = statusNames(previousClient.statusIds);
  const nextStatuses = statusNames(nextClient.statusIds);
  if (previousStatuses !== nextStatuses) changes.push(`Status do processo: ${previousStatuses} -> ${nextStatuses}.`);

  collectionChangeSummary(changes, "Controle mensal", previousClient.monthly, nextClient.monthly, (item) => item.month || "mês sem competência");
  collectionChangeSummary(changes, "Tarefas", previousClient.tasks, nextClient.tasks, (item) => item.title || "tarefa sem título");
  collectionChangeSummary(changes, "Prazos", previousClient.deadlines, nextClient.deadlines, (item) => item.title || "prazo sem título");
  collectionChangeSummary(changes, "Anotações", previousClient.notes, nextClient.notes, (item) => item.text || "anotação sem texto");
  collectionChangeSummary(changes, "Documentos", previousClient.documents, nextClient.documents, (item) => item.name || "documento sem nome");

  const maxVisibleChanges = 12;
  if (changes.length > maxVisibleChanges) {
    const hiddenCount = changes.length - maxVisibleChanges;
    return [...changes.slice(0, maxVisibleChanges), `Mais ${hiddenCount} alteração(ões) registrada(s) neste salvamento.`];
  }

  return changes;
}

function historyFieldValue(value, field) {
  if (field === "internalOwner") return ownerName(value);
  if (field === "startDate" || field === "endDate") return value ? formatDate(value) : "vazio";
  if (value === undefined || value === null || value === "") return "vazio";
  return truncateHistoryValue(String(value));
}

function statusNames(statusIds = []) {
  const names = state.statuses
    .filter((status) => statusIds.includes(status.id))
    .map((status) => status.name);
  return names.length ? names.join(", ") : "sem status";
}

function collectionChangeSummary(changes, label, previousItems = [], nextItems = [], getLabel) {
  const previous = Array.isArray(previousItems) ? previousItems : [];
  const next = Array.isArray(nextItems) ? nextItems : [];
  const previousById = new Map(previous.map((item) => [item.id, item]));
  const nextById = new Map(next.map((item) => [item.id, item]));
  const added = next.filter((item) => !previousById.has(item.id));
  const removed = previous.filter((item) => !nextById.has(item.id));
  const changed = next.filter((item) => previousById.has(item.id) && JSON.stringify(previousById.get(item.id)) !== JSON.stringify(item));

  if (added.length) changes.push(`${label}: ${added.length} item(ns) adicionado(s) (${shortItemList(added, getLabel)}).`);
  if (removed.length) changes.push(`${label}: ${removed.length} item(ns) removido(s) (${shortItemList(removed, getLabel)}).`);
  if (changed.length) changes.push(`${label}: ${changed.length} item(ns) alterado(s) (${shortItemList(changed, getLabel)}).`);
}

function shortItemList(items, getLabel) {
  return items.slice(0, 3).map((item) => truncateHistoryValue(getLabel(item), 36)).join(", ") + (items.length > 3 ? "..." : "");
}

function truncateHistoryValue(value, maxLength = 80) {
  const clean = String(value).replace(/\s+/g, " ").trim();
  if (!clean) return "vazio";
  return clean.length > maxLength ? `${clean.slice(0, maxLength - 3)}...` : clean;
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
  if (currentUser.role !== "admin") {
    el.userManager.innerHTML = "";
    return;
  }

  el.userManager.innerHTML = state.users
    .map(
      (user) => `
        <div class="manager-item user-row" data-user-manager="${user.id}">
          <label>Nome<input value="${escapeAttr(user.name)}" data-user-manager-field="name" disabled /></label>
          <label>E-mail<input value="${escapeAttr(user.email)}" data-user-manager-field="email" disabled /></label>
          <label>Perfil<select data-user-manager-field="role" disabled>
            <option value="admin" ${user.role === "admin" ? "selected" : ""}>Administrador</option>
            <option value="user" ${user.role === "user" ? "selected" : ""}>Usuário</option>
          </select></label>
          <label>Senha<input type="text" value="${escapeAttr(user.password)}" data-user-manager-field="password" disabled /></label>
          <div class="inline-actions">
            <span class="locked-user-note">Usuário fixo</span>
          </div>
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
        syncCurrentUser(user);
      });
      input.addEventListener("change", () => {
        user[input.dataset.userManagerField] = input.value;
        saveState();
        syncCurrentUser(user);
      });
    });
  });
  refreshIcons();
}

function syncCurrentUser(user) {
  if (user.id !== currentUser.id) return;
  currentUser = user;
  updateCurrentUserDisplay();
  configureNavigationForRole();
  renderAccount();
}

function renderAccount() {
  if (!currentUser) return;

  el.accountName.value = currentUser.name || "";
  el.accountEmail.value = currentUser.email || "";
  el.accountRole.value = currentUser.role === "admin" ? "Administrador" : "Usuário";
}

function changeOwnPassword() {
  const password = el.accountPassword.value.trim();
  const confirmation = el.accountPasswordConfirm.value.trim();
  el.accountMessage.textContent = "";

  if (password.length < 4) {
    el.accountMessage.textContent = "A senha precisa ter pelo menos 4 caracteres.";
    return;
  }

  if (password !== confirmation) {
    el.accountMessage.textContent = "As senhas não conferem.";
    return;
  }

  const user = state.users.find((item) => item.id === currentUser.id);
  if (!user) return;

  user.password = password;
  currentUser = user;
  el.accountPassword.value = "";
  el.accountPasswordConfirm.value = "";
  el.accountMessage.textContent = "Senha alterada.";
  saveState();
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
  alert("Os usuários agora são fixos: mayssa@reduzsim.com.br e camilli@reduzsim.com.br.");
}

function openInternalTaskDialog(taskId = null) {
  const task = state.internalTasks.find((item) => item.id === taskId) || null;
  const visibilityOptions = currentUser.role === "admin"
    ? [
        { value: "team", label: "Equipe" },
        { value: "admin", label: "Somente admin" },
      ]
    : [{ value: "team", label: "Equipe" }];

  openSimpleDialog(task ? "Editar tarefa interna" : "Nova tarefa interna", [
    { label: "Tarefa", name: "title", type: "text", value: task?.title || "" },
    { label: "Responsável", name: "ownerId", type: "select", value: task?.ownerId || currentUser.id, options: state.users.map((user) => ({ value: user.id, label: user.name })) },
    { label: "Prazo", name: "dueDate", type: "date", value: task?.dueDate || "" },
    { label: "Status", name: "status", type: "select", value: task?.status || "Pendente", options: taskStatusValues().map((value) => ({ value, label: value })) },
    { label: "Visibilidade", name: "visibility", type: "select", value: task?.visibility || "team", options: visibilityOptions },
  ], (values) => {
    if (!values.title) {
      alert("Informe o nome da tarefa.");
      return false;
    }

    const payload = {
      title: values.title,
      ownerId: values.ownerId || currentUser.id,
      dueDate: values.dueDate,
      status: values.status || "Pendente",
      visibility: currentUser.role === "admin" ? values.visibility || "team" : "team",
      updatedAt: new Date().toISOString(),
    };

    if (task) {
      Object.assign(task, payload);
    } else {
      state.internalTasks.unshift({
        id: id(),
        ...payload,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      });
    }

    saveState();
    renderMetrics();
    renderTaskCenter();
    return true;
  });
}

function openSimpleDialog(title, fields, onSave) {
  el.simpleDialogTitle.textContent = title;
  el.simpleDialogBody.innerHTML = fields
    .map(
      (field) => `
        <label>${field.label}
          ${simpleFieldControl(field)}
        </label>
      `
    )
    .join("");
  el.simpleDialogSave.onclick = () => {
    const values = {};
    el.simpleDialogBody.querySelectorAll("[data-simple-field]").forEach((input) => {
      values[input.dataset.simpleField] = input.value.trim();
    });
    const shouldClose = onSave(values);
    if (shouldClose !== false) el.simpleDialog.close();
  };
  el.simpleDialog.showModal();
  refreshIcons();
}

function simpleFieldControl(field) {
  if (field.type === "select") {
    return `<select data-simple-field="${field.name}">${(field.options || [])
      .map((option) => `<option value="${escapeAttr(option.value)}" ${option.value === field.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("")}</select>`;
  }

  return `<input class="${field.type === "color" ? "color-input" : ""}" type="${field.type}" value="${escapeAttr(field.value)}" data-simple-field="${field.name}" />`;
}

function switchSection(sectionId) {
  if (sectionId === "usersSection" && currentUser.role !== "admin") return;
  if (sectionId === "accountSection" && currentUser.role === "admin") return;

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
    history: [],
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
    alert("Informe início e fim da obra na aba Cliente e obra.");
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
  return state.users.find((user) => user.id === userId)?.name || "Sem responsável";
}

function userOptions(selectedId) {
  return state.users.map((user) => `<option value="${user.id}" ${user.id === selectedId ? "selected" : ""}>${escapeHtml(user.name)}</option>`).join("");
}

function taskStatusOptions(selected = "Pendente") {
  return taskStatusValues()
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function taskStatusValues() {
  return ["Pendente", "Em andamento", "Concluída"];
}

function deadlineTypeOptions(selected = "Interno") {
  return ["Guia", "Receita", "Cliente", "Interno", "NF", "Outro"]
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function documentStatusOptions(selected = "Pendente") {
  return ["Pendente", "Recebido", "Aprovado", "Inválido", "Não possui"]
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function taskUrgency(item) {
  if (item.kind === "Tarefa" && localizeLabel(item.status) === "Concluída") return "done";
  if (!item.date) return "no-date";
  const today = localDateKey();
  if (item.date < today) return "overdue";
  if (item.date === today) return "today";
  return "upcoming";
}

function urgencyLabel(urgency) {
  return {
    overdue: "Atrasada",
    today: "Hoje",
    upcoming: "Próxima",
    "no-date": "Sem prazo",
    done: "Concluída",
  }[urgency] || "Aberta";
}

function weekDays(date) {
  const start = startOfWeek(date);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

function startOfWeek(date) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function monthCalendarDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const start = startOfWeek(first);
  const end = addDays(startOfWeek(last), 6);
  const days = [];
  for (let cursor = new Date(start); cursor <= end; cursor = addDays(cursor, 1)) {
    days.push(new Date(cursor));
  }
  return days;
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  next.setHours(0, 0, 0, 0);
  return next;
}

function weekdayLabel(date) {
  return date.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function formatShortDate(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
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
