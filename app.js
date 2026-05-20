const STORAGE_KEY = "reduzsim_client_flow_v2";
const LEGACY_STORAGE_KEYS = ["reduzsim_client_flow_v1"];
const SESSION_KEY = "reduzsim_current_user_v2";
const FIRESTORE_COLLECTION = "reduzsim_admin";
const FIRESTORE_STATE_DOC = "shared_state";

const firebaseConfig = {
  apiKey: "AIzaSyAwgOrvq2QGUEPObgkAPXyG_KyJ3l-305w",
  authDomain: "reduzsim-2a6f2.firebaseapp.com",
  projectId: "reduzsim-2a6f2",
  storageBucket: "reduzsim-2a6f2.firebasestorage.app",
  messagingSenderId: "350622536875",
  appId: "1:350622536875:web:ed0f9bf3f11b32c894d3ee",
};

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

const workFields = [
  "workTitle",
  "workResponsible",
  "destination",
  "workType",
  "concrete",
  "state",
  "startDate",
  "endDate",
  "area",
  "monthly",
  "tasks",
  "deadlines",
  "documents",
  "workersNotes",
  "workerMessages",
];

const scalarWorkFields = workFields.filter((field) => !["monthly", "tasks", "deadlines", "documents", "workerMessages"].includes(field));

const fixedUserIds = {
  mayssa: "user-mayssa",
  contato: "user-contato",
};

const defaultUsers = [
  {
    id: fixedUserIds.mayssa,
    name: "Mayssa",
    email: "mayssa@reduzsiminss.com.br",
    role: "admin",
  },
  {
    id: fixedUserIds.contato,
    name: "Camilli",
    email: "contato@reduzsiminss.com.br",
    role: "user",
  },
];

const defaultClient = () => {
  const statusByName = Object.fromEntries(state.statuses.map((status) => [status.name, status.id]));
  const client = {
    id: id(),
    clientName: "Cliente exemplo",
    fullName: "Cliente exemplo",
    documentType: "cpf",
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
    activeWorkId: "",
    works: [],
    workTitle: "Obra principal",
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
        receiptSent: true,
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
        receiptSent: false,
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
        createdBy: state.users[0]?.id || "",
        createdAt: new Date().toISOString(),
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
    workerMessages: [
      {
        id: id(),
        text: "João - R$ 2.200,00 - jan/2026\nMaria - R$ 2.000,00 - jan/2026",
        userId: state.users[0]?.id || "",
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    ],
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
  client.works = [createWorkFromClient(client, "Obra principal")];
  client.activeWorkId = client.works[0].id;
  return client;
};

let state;
state = loadState();
let currentUser = null;
let activeClient = null;
let activeViewMode = "list";
let activeTaskCalendarMode = "week";
let activeTaskDate = new Date();
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseStateRef = null;
let unsubscribeCloudState = null;
let cloudSaveTimer = null;
let isApplyingCloudState = false;

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
  workSelect: document.getElementById("workSelect"),
  addWorkButton: document.getElementById("addWorkButton"),
  removeWorkButton: document.getElementById("removeWorkButton"),
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
  newWorkerMessageText: document.getElementById("newWorkerMessageText"),
  addWorkerMessageButton: document.getElementById("addWorkerMessageButton"),
  workerMessagesList: document.getElementById("workerMessagesList"),
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
  if (initializeFirebaseServices()) {
    el.loginStatus.textContent = "Conectando ao Firebase...";
    firebaseAuth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        stopCloudStateListener();
        sessionStorage.removeItem(SESSION_KEY);
        currentUser = null;
        showLogin();
        el.loginStatus.textContent = "";
        return;
      }

      try {
        await loadCloudState();
        currentUser = userForFirebaseUser(firebaseUser);
        if (!currentUser) {
          await firebaseAuth.signOut();
          el.loginError.hidden = false;
          el.loginStatus.textContent = "Este e-mail nÃ£o estÃ¡ autorizado neste sistema.";
          return;
        }
        sessionStorage.setItem(SESSION_KEY, currentUser.id);
        subscribeCloudState();
        showApp();
      } catch (error) {
        console.error(error);
        el.loginError.hidden = false;
        el.loginStatus.textContent = "NÃ£o foi possÃ­vel carregar os dados online.";
      }
    });
    return;
  }

  const userId = sessionStorage.getItem(SESSION_KEY);
  currentUser = state.users.find((user) => user.id === userId) || null;
  if (currentUser) showApp();
  else showLogin();
}

function initializeFirebaseServices() {
  if (!window.firebase?.initializeApp) return false;

  try {
    firebaseApp = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(firebaseConfig);
    firebaseAuth = window.firebase.auth();
    firebaseDb = window.firebase.firestore();
    firebaseStateRef = firebaseDb.collection(FIRESTORE_COLLECTION).doc(FIRESTORE_STATE_DOC);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
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
    documentType: documentTypeForClient(client),
    cpf: "",
    phone: "",
    whatsappDdd: "",
    infoOwner: "",
    internalOwner: migrated.users[0]?.id || "",
    folderPath: "",
    nextAction: "",
    statusIds: [],
    activeWorkId: "",
    works: [],
    workTitle: "",
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
    workerMessages: [],
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
    monthly: Array.isArray(client.monthly) ? client.monthly.map(normalizeMonthRow) : [],
    tasks: Array.isArray(client.tasks) ? client.tasks.map((task) => normalizeClientTask(task, client, migrated.users[0]?.id || "")) : [],
    deadlines: Array.isArray(client.deadlines) ? client.deadlines : [],
    notes: Array.isArray(client.notes) ? client.notes : [],
    history: Array.isArray(client.history) ? client.history.map(normalizeHistoryEntry) : [],
    documents: Array.isArray(client.documents) ? client.documents.map((doc) => ({ ...doc, name: localizeLabel(doc.name), status: localizeLabel(doc.status) })) : [],
    workerMessages: normalizeWorkerMessages(client, migrated.users[0]?.id || ""),
    statusIds: Array.isArray(client.statusIds) ? client.statusIds : [],
  }));

  migrated.clients.forEach((client) => {
    client.works = normalizeClientWorks(client, migrated.users[0]?.id || "");
    client.activeWorkId = client.activeWorkId || client.works[0]?.id || "";
    applyWorkToClient(client, currentClientWork(client));
  });

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
    description: task.description || task.text || task.notes || "",
    ownerId: task.ownerId || "",
    dueDate: task.dueDate || "",
    status: localizeLabel(task.status || "Pendente"),
    visibility: task.visibility === "admin" ? "admin" : "team",
    createdBy: task.createdBy || "",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || null,
  };
}

function normalizeClientTask(task, client = {}, fallbackUserId = "") {
  return {
    id: task.id || id(),
    title: task.title || "",
    ownerId: task.ownerId || client.internalOwner || fallbackUserId,
    dueDate: task.dueDate || "",
    status: localizeLabel(task.status || "Pendente"),
    createdBy: task.createdBy || client.internalOwner || task.ownerId || fallbackUserId,
    createdAt: task.createdAt || client.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || null,
  };
}

function normalizeWorkerMessages(client = {}, fallbackUserId = "") {
  if (Array.isArray(client.workerMessages) && client.workerMessages.length) {
    return client.workerMessages.map((message) => ({
      id: message.id || id(),
      text: message.text || "",
      userId: message.userId || client.internalOwner || fallbackUserId,
      createdAt: message.createdAt || client.createdAt || new Date().toISOString(),
      updatedAt: message.updatedAt || null,
    }));
  }

  const legacyText = String(client.workersNotes || "").trim();
  if (!legacyText) return [];

  return [
    {
      id: id(),
      text: legacyText,
      userId: client.internalOwner || fallbackUserId,
      createdAt: client.createdAt || new Date().toISOString(),
      updatedAt: null,
    },
  ];
}

function normalizeClientWorks(client = {}, fallbackUserId = "") {
  const rawWorks = Array.isArray(client.works) && client.works.length ? client.works : [createWorkFromClient(client, client.workTitle || "Obra principal")];
  return rawWorks.map((work, index) => ({
    id: work.id || id(),
    title: work.title || work.workTitle || (index === 0 ? "Obra principal" : `Obra ${index + 1}`),
    workTitle: work.workTitle || work.title || (index === 0 ? "Obra principal" : `Obra ${index + 1}`),
    workResponsible: work.workResponsible || "",
    destination: localizeLabel(work.destination || ""),
    workType: localizeLabel(work.workType || ""),
    concrete: localizeLabel(work.concrete || ""),
    state: work.state || "",
    startDate: work.startDate || "",
    endDate: work.endDate || "",
    area: formatFieldValue("area", work.area || ""),
    monthly: Array.isArray(work.monthly) ? work.monthly.map(normalizeMonthRow) : [],
    tasks: Array.isArray(work.tasks) ? work.tasks.map((task) => normalizeClientTask(task, client, fallbackUserId)) : [],
    deadlines: Array.isArray(work.deadlines) ? work.deadlines : [],
    documents: Array.isArray(work.documents) ? work.documents.map((doc) => ({ ...doc, name: localizeLabel(doc.name), status: localizeLabel(doc.status) })) : [],
    workersNotes: work.workersNotes || "",
    workerMessages: Array.isArray(work.workerMessages) ? work.workerMessages : normalizeWorkerMessages(work, fallbackUserId),
  }));
}

function createWorkFromClient(client = {}, fallbackTitle = "Obra principal") {
  const work = { id: id() };
  work.title = client.workTitle || fallbackTitle || "Obra principal";
  workFields.forEach((field) => {
    const emptyValue = ["monthly", "tasks", "deadlines", "documents", "workerMessages"].includes(field) ? [] : "";
    work[field] = cloneData(client[field] ?? emptyValue);
  });
  work.workTitle = work.workTitle || work.title;
  return work;
}

function emptyWork(order = 1) {
  const title = `Obra ${order}`;
  return {
    id: id(),
    title,
    workTitle: title,
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
    documents: [],
    workersNotes: "",
    workerMessages: [],
  };
}

function currentClientWork(client = activeClient) {
  if (!client) return null;
  client.works = Array.isArray(client.works) && client.works.length ? client.works : [createWorkFromClient(client, "Obra principal")];
  if (!client.activeWorkId || !client.works.some((work) => work.id === client.activeWorkId)) {
    client.activeWorkId = client.works[0].id;
  }
  return client.works.find((work) => work.id === client.activeWorkId) || client.works[0];
}

function syncCurrentWorkFromClient(client = activeClient) {
  const work = currentClientWork(client);
  if (!work) return;
  scalarWorkFields.forEach((field) => {
    work[field] = client[field] || "";
  });
  work.title = client.workTitle || work.title || "Obra sem título";
  work.workTitle = work.title;
  ["monthly", "tasks", "deadlines", "documents", "workerMessages"].forEach((field) => {
    work[field] = cloneData(Array.isArray(client[field]) ? client[field] : []);
  });
}

function applyWorkToClient(client = activeClient, work = currentClientWork(client)) {
  if (!client || !work) return;
  scalarWorkFields.forEach((field) => {
    client[field] = work[field] || "";
  });
  client.workTitle = work.workTitle || work.title || "Obra sem título";
  ["monthly", "tasks", "deadlines", "documents", "workerMessages"].forEach((field) => {
    client[field] = cloneData(Array.isArray(work[field]) ? work[field] : []);
  });
  client.workersNotes = work.workersNotes || "";
  client.area = formatFieldValue("area", client.area || "");
  normalizeClientSelectValues(client);
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
    identity.includes("contato") ||
    identity.includes("colaboradora") ||
    identity.includes("colaborador")
  ) {
    return fixedUserIds.contato;
  }

  if (
    identity.includes("mayssa") ||
    identity.includes("may") ||
    identity.includes("proprietaria") ||
    identity.includes("admin")
  ) {
    return fixedUserIds.mayssa;
  }

  return user.role === "admin" ? fixedUserIds.mayssa : fixedUserIds.contato;
}

function remapUserReferences(migrated, idMap) {
  if (!Object.keys(idMap).length) return;

  migrated.clients.forEach((client) => {
    client.internalOwner = idMap[client.internalOwner] || client.internalOwner;
    (client.tasks || []).forEach((task) => {
      task.ownerId = idMap[task.ownerId] || task.ownerId;
      task.createdBy = idMap[task.createdBy] || task.createdBy;
    });
    (client.deadlines || []).forEach((deadline) => {
      deadline.ownerId = idMap[deadline.ownerId] || deadline.ownerId;
    });
    (client.notes || []).forEach((note) => {
      note.userId = idMap[note.userId] || note.userId;
    });
    (client.workerMessages || []).forEach((message) => {
      message.userId = idMap[message.userId] || message.userId;
    });
    (client.works || []).forEach((work) => {
      (work.tasks || []).forEach((task) => {
        task.ownerId = idMap[task.ownerId] || task.ownerId;
        task.createdBy = idMap[task.createdBy] || task.createdBy;
      });
      (work.deadlines || []).forEach((deadline) => {
        deadline.ownerId = idMap[deadline.ownerId] || deadline.ownerId;
      });
      (work.workerMessages || []).forEach((message) => {
        message.userId = idMap[message.userId] || message.userId;
      });
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
  scheduleCloudSave();
}

function scheduleCloudSave() {
  if (!firebaseStateRef || !firebaseAuth?.currentUser || isApplyingCloudState) return;
  window.clearTimeout(cloudSaveTimer);
  cloudSaveTimer = window.setTimeout(() => {
    saveCloudStateNow().catch((error) => {
      console.error(error);
      if (el.loginStatus) el.loginStatus.textContent = "NÃ£o foi possÃ­vel sincronizar com o Firebase.";
    });
  }, 350);
}

async function saveCloudStateNow() {
  if (!firebaseStateRef || !firebaseAuth?.currentUser) return;
  await firebaseStateRef.set(
    {
      state: cloneData(state),
      updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: firebaseAuth.currentUser.uid,
      updatedByEmail: firebaseAuth.currentUser.email || "",
    },
    { merge: true }
  );
}

async function loadCloudState() {
  const localState = migrateState(state);
  const snapshot = await firebaseStateRef.get();
  if (snapshot.exists && snapshot.data()?.state) {
    state = migrateState(snapshot.data().state);
    return;
  }

  state = localState;
  await saveCloudStateNow();
}

function subscribeCloudState() {
  if (unsubscribeCloudState || !firebaseStateRef) return;
  unsubscribeCloudState = firebaseStateRef.onSnapshot((snapshot) => {
    if (!snapshot.exists || !snapshot.data()?.state) return;
    const remoteState = migrateState(snapshot.data().state, false);
    if (JSON.stringify(remoteState) === JSON.stringify(state)) return;

    isApplyingCloudState = true;
    state = remoteState;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    currentUser = currentUser ? state.users.find((user) => user.id === currentUser.id) || null : null;
    if (!currentUser && firebaseAuth?.currentUser) {
      currentUser = userForFirebaseUser(firebaseAuth.currentUser);
    }
    if (currentUser) renderAll();
    isApplyingCloudState = false;
  });
}

function stopCloudStateListener() {
  if (!unsubscribeCloudState) return;
  unsubscribeCloudState();
  unsubscribeCloudState = null;
}

function userForFirebaseUser(firebaseUser) {
  const email = firebaseUser?.email?.toLowerCase() || "";
  return state.users.find((user) => user.email?.toLowerCase() === email) || null;
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
  el.workSelect.addEventListener("change", () => switchActiveWork(el.workSelect.value));
  el.addWorkButton.addEventListener("click", addClientWork);
  el.removeWorkButton.addEventListener("click", removeActiveWork);
  el.generateMonthsButton.addEventListener("click", generateMonthsFromWorkDates);
  el.addMonthButton.addEventListener("click", () => {
    activeClient.monthly.push(emptyMonth());
    renderMonthlyTable();
  });
  el.addTaskButton.addEventListener("click", () => {
    openClientTaskDialog();
  });
  el.addDeadlineButton.addEventListener("click", () => {
    openClientDeadlineDialog();
  });
  el.addNoteButton.addEventListener("click", addNote);
  el.addWorkerMessageButton.addEventListener("click", addWorkerMessage);
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
      input.value = formatFieldValue(input.dataset.field, input.value);
      activeClient[input.dataset.field] = input.value;
      if (input.dataset.field === "workTitle") renderWorkSelector();
      if (input.dataset.field === "documentType") {
        const documentInput = document.querySelector('[data-field="cpf"]');
        if (documentInput) {
          documentInput.value = formatFieldValue("cpf", documentInput.value);
          activeClient.cpf = documentInput.value;
        }
      }
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

async function handleLogin(event) {
  event.preventDefault();
  el.loginStatus.textContent = "Verificando acesso...";
  const email = el.loginEmail.value.trim().toLowerCase();
  const password = el.loginPassword.value;

  if (firebaseAuth) {
    try {
      await firebaseAuth.signInWithEmailAndPassword(email, password);
      el.loginError.hidden = true;
      el.loginStatus.textContent = "Acesso liberado.";
    } catch (error) {
      console.error(error);
      el.loginError.hidden = false;
      el.loginStatus.textContent = "Confira se o usuÃ¡rio existe no Firebase e se a senha estÃ¡ correta.";
    }
    return;
  }

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
  el.loginEmail.value = "mayssa@reduzsiminss.com.br";
  el.loginPassword.value = "123456";
  el.loginError.hidden = true;
  el.loginStatus.textContent = firebaseAuth
    ? "Acessos locais reparados. No Firebase, confirme os usuÃ¡rios em Authentication."
    : "Acessos oficiais reparados. Clique em Entrar.";
}

function handleLogout() {
  if (firebaseAuth?.currentUser) {
    firebaseAuth.signOut();
  }
  stopCloudStateListener();
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
        description: task.description || "",
        ownerId: task.ownerId,
        createdBy: task.createdBy || "",
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
      const haystack = normalize([
        item.title,
        item.description,
        item.clientName,
        item.kind,
        item.status,
        ownerName(item.ownerId),
        ownerName(item.createdBy),
        item.source,
        item.visibility,
      ].join(" "));
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
        ${item.description && !compact ? `<p class="task-description">${escapeHtml(item.description)}</p>` : ""}
        <p>${escapeHtml(item.clientName)}</p>
      </div>
      ${item.createdBy ? `<div class="task-detail"><i data-lucide="user-plus"></i>Criada por ${escapeHtml(ownerName(item.createdBy))}</div>` : ""}
      <div class="task-detail"><i data-lucide="user-check"></i>Responsável: ${escapeHtml(ownerName(item.ownerId))}</div>
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
      (client.works || []).map((work) => [work.workTitle, work.workResponsible, work.destination, work.workType, work.state].join(" ")).join(" "),
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
  const openTasks = (client.tasks || []).filter((task) => localizeLabel(task.status) !== "Concluída");
  const deadlines = client.deadlines || [];
  const taskOwners = ownerSummary(openTasks.map((task) => task.ownerId));
  const deadlineOwners = ownerSummary(deadlines.map((deadline) => deadline.ownerId));
  const workTitle = client.workTitle && client.workTitle !== "Obra principal" ? `${client.workTitle} | ` : "";
  return `
    <button class="client-card" type="button" data-open-client="${client.id}">
      <header>
        <div>
          <h3>${escapeHtml(client.clientName || "Cliente sem nome")}</h3>
          <p>${escapeHtml(`${workTitle}${client.workType || "Obra sem tipo informado"}`)} ${client.state ? `| ${escapeHtml(client.state)}` : ""}</p>
        </div>
      </header>
      <div class="chip-list">${statuses || `<span class="chip" style="background:#6b7280">Sem status</span>`}</div>
      <div class="card-alerts">
        <span class="card-alert ${openTasks.length ? "active" : ""}">
          <i data-lucide="list-checks"></i>
          ${openTasks.length ? `${openTasks.length} tarefa(s): ${escapeHtml(taskOwners)}` : "Sem tarefas abertas"}
        </span>
        <span class="card-alert ${deadlines.length ? "active deadline" : ""}">
          <i data-lucide="calendar-clock"></i>
          ${deadlines.length ? `${deadlines.length} prazo(s): ${escapeHtml(deadlineOwners)}` : "Sem prazos"}
        </span>
      </div>
      <div class="card-meta">
        <span><i data-lucide="user"></i>${escapeHtml(ownerName(client.internalOwner))}</span>
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
  activeClient.works = normalizeClientWorks(activeClient, currentUser?.id || "");
  activeClient.activeWorkId = activeClient.activeWorkId || activeClient.works[0]?.id || "";
  applyWorkToClient(activeClient, currentClientWork(activeClient));
  activeClient.documentType = documentTypeForClient(activeClient);
  activeClient.cpf = formatFieldValue("cpf", activeClient.cpf || "");
  activeClient.phone = formatFieldValue("phone", activeClient.phone || "");
  activeClient.area = formatFieldValue("area", activeClient.area || "");
  normalizeClientSelectValues(activeClient);
  el.clientDialogTitle.textContent = client.clientName || "Novo cliente";
  renderUserSelects();
  fillClientFields();
  renderWorkSelector();
  renderActiveStatuses();
  renderStatusPicker();
  renderMonthlyTable();
  renderTasks();
  renderDeadlines();
  renderNotes();
  renderHistory();
  renderDocuments();
  renderWorkerMessages();
  switchTab("summaryTab");
  el.clientDialog.showModal();
  refreshIcons();
}

function fillClientFields() {
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.value = activeClient[input.dataset.field] || "";
  });
}

function renderWorkSelector() {
  if (!activeClient || !el.workSelect) return;
  const currentWork = currentClientWork(activeClient);
  if (currentWork) {
    currentWork.title = activeClient.workTitle || currentWork.title || "Obra sem título";
    currentWork.workTitle = currentWork.title;
  }
  el.workSelect.innerHTML = activeClient.works
    .map((work, index) => `<option value="${work.id}">${escapeHtml(work.workTitle || work.title || `Obra ${index + 1}`)}</option>`)
    .join("");
  el.workSelect.value = activeClient.activeWorkId;
  el.removeWorkButton.hidden = activeClient.works.length <= 1;
}

function switchActiveWork(workId) {
  if (!activeClient || activeClient.activeWorkId === workId) return;
  syncCurrentWorkFromClient(activeClient);
  activeClient.activeWorkId = workId;
  applyWorkToClient(activeClient, currentClientWork(activeClient));
  fillClientFields();
  renderWorkSelector();
  renderMonthlyTable();
  renderTasks();
  renderDeadlines();
  renderDocuments();
  renderWorkerMessages();
}

function addClientWork() {
  if (!activeClient) return;
  syncCurrentWorkFromClient(activeClient);
  const newWork = emptyWork(activeClient.works.length + 1);
  activeClient.works.push(newWork);
  activeClient.activeWorkId = newWork.id;
  applyWorkToClient(activeClient, newWork);
  fillClientFields();
  renderWorkSelector();
  renderMonthlyTable();
  renderTasks();
  renderDeadlines();
  renderDocuments();
  renderWorkerMessages();
}

function removeActiveWork() {
  if (!activeClient || activeClient.works.length <= 1) return;
  const work = currentClientWork(activeClient);
  const workName = work?.workTitle || work?.title || "esta obra";
  if (!confirm(`Remover ${workName}? As tarefas, prazos, documentos e mensagens dessa obra também serão removidos deste card.`)) return;
  activeClient.works = activeClient.works.filter((item) => item.id !== activeClient.activeWorkId);
  activeClient.activeWorkId = activeClient.works[0]?.id || "";
  applyWorkToClient(activeClient, currentClientWork(activeClient));
  fillClientFields();
  renderWorkSelector();
  renderMonthlyTable();
  renderTasks();
  renderDeadlines();
  renderDocuments();
  renderWorkerMessages();
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
  el.statusPicker.innerHTML = `
    <div class="status-editor-list">
      ${state.statuses
        .map(
          (status) => `
            <div class="status-editor-row" data-status-editor="${status.id}">
              <label class="status-toggle">
                <input type="checkbox" ${active.has(status.id) ? "checked" : ""} data-toggle-status="${status.id}" />
                <span>Ativo</span>
              </label>
              <input value="${escapeAttr(status.name)}" data-status-editor-field="name" aria-label="Nome do status" />
              <input class="color-input" type="color" value="${status.color}" data-status-editor-field="color" aria-label="Cor do status" />
              <button class="icon-button" type="button" data-remove-global-status="${status.id}" aria-label="Remover status"><i data-lucide="trash-2"></i></button>
            </div>
          `
        )
        .join("")}
      <div class="status-editor-row new-status-row">
        <span></span>
        <input id="newStatusName" type="text" placeholder="Novo status" />
        <input id="newStatusColor" class="color-input" type="color" value="#009f7f" />
        <button id="createStatusFromCard" class="small-button" type="button"><i data-lucide="plus"></i> Criar</button>
      </div>
    </div>
  `;

  document.querySelectorAll("[data-toggle-status]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        activeClient.statusIds = [...new Set([...(activeClient.statusIds || []), checkbox.dataset.toggleStatus])];
      } else {
        activeClient.statusIds = (activeClient.statusIds || []).filter((idValue) => idValue !== checkbox.dataset.toggleStatus);
      }
      renderActiveStatuses();
    });
  });

  document.querySelectorAll("[data-status-editor]").forEach((row) => {
    const status = state.statuses.find((item) => item.id === row.dataset.statusEditor);
    row.querySelectorAll("[data-status-editor-field]").forEach((input) => {
      input.addEventListener("input", () => {
        status[input.dataset.statusEditorField] = input.value;
        saveState();
        renderStatusFilter();
        renderClients();
        renderActiveStatuses();
      });
    });
  });

  document.querySelectorAll("[data-remove-global-status]").forEach((button) => {
    button.addEventListener("click", () => {
      state.statuses = state.statuses.filter((status) => status.id !== button.dataset.removeGlobalStatus);
      state.clients.forEach((client) => {
        client.statusIds = (client.statusIds || []).filter((statusId) => statusId !== button.dataset.removeGlobalStatus);
      });
      activeClient.statusIds = (activeClient.statusIds || []).filter((statusId) => statusId !== button.dataset.removeGlobalStatus);
      saveState();
      renderStatusFilter();
      renderClients();
      renderActiveStatuses();
      renderStatusPicker();
    });
  });

  document.getElementById("createStatusFromCard")?.addEventListener("click", () => {
    const nameInput = document.getElementById("newStatusName");
    const colorInput = document.getElementById("newStatusColor");
    const name = nameInput.value.trim();
    if (!name) return;
    const status = { id: id(), name, color: colorInput.value || "#009f7f" };
    state.statuses.push(status);
    activeClient.statusIds = [...new Set([...(activeClient.statusIds || []), status.id])];
    saveState();
    renderStatusFilter();
    renderClients();
    renderActiveStatuses();
    renderStatusPicker();
  });
  refreshIcons();
}

function renderMonthlyTable() {
  el.monthlyTable.innerHTML = (activeClient.monthly || [])
    .sort((a, b) => a.month.localeCompare(b.month))
    .map(
      (row) => `
        <tr data-month-row="${row.id}">
          <td><input type="month" value="${row.month || ""}" data-month-field="month" /></td>
          ${["receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"]
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
          (task) => {
            const isDone = localizeLabel(task.status) === "Concluída";
            return `
            <div class="task-message ${isDone ? "done" : ""}" data-task="${task.id}">
              <div class="task-message-body">
                <p class="task-message-title">${escapeHtml(task.title || "Tarefa sem descrição")}</p>
                <div class="task-message-meta">
                  <span>Cadastrada por ${escapeHtml(ownerName(task.createdBy))}</span>
                  <span>Responsável: ${escapeHtml(ownerName(task.ownerId))}</span>
                  <span>${task.dueDate ? `Prazo: ${formatDate(task.dueDate)}` : "Sem prazo"}</span>
                  <span>Status: ${escapeHtml(localizeLabel(task.status || "Pendente"))}</span>
                </div>
              </div>
              <div class="task-message-actions">
                <button class="small-button" type="button" data-edit-task="${task.id}"><i data-lucide="pencil"></i> Editar</button>
                ${isDone ? "" : `<button class="icon-button" type="button" data-remove-task="${task.id}" aria-label="Remover tarefa"><i data-lucide="trash-2"></i></button>`}
              </div>
            </div>
          `;
          }
        )
        .join("")
    : `<p class="empty-state">Nenhuma tarefa cadastrada.</p>`;
  document.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => openClientTaskDialog(button.dataset.editTask));
  });
  document.querySelectorAll("[data-remove-task]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClient.tasks = activeClient.tasks.filter((task) => task.id !== button.dataset.removeTask);
      renderTasks();
    });
  });
  refreshIcons();
}

function renderDeadlines() {
  el.deadlinesList.innerHTML = (activeClient.deadlines || []).length
    ? activeClient.deadlines
        .map(
          (deadline) => `
            <div class="task-message deadline-message" data-deadline="${deadline.id}">
              <div class="task-message-body">
                <p class="task-message-title">${escapeHtml(deadline.title || "Prazo sem descrição")}</p>
                <div class="task-message-meta">
                  <span>Tipo: ${escapeHtml(deadline.type || "Interno")}</span>
                  <span>Responsável: ${escapeHtml(ownerName(deadline.ownerId))}</span>
                  <span>${deadline.date ? `Data: ${formatDate(deadline.date)}` : "Sem data"}</span>
                </div>
              </div>
              <div class="task-message-actions">
                <button class="small-button" type="button" data-edit-deadline="${deadline.id}"><i data-lucide="pencil"></i> Editar</button>
                <button class="icon-button" type="button" data-remove-deadline="${deadline.id}" aria-label="Remover prazo"><i data-lucide="trash-2"></i></button>
              </div>
            </div>
          `
        )
        .join("")
    : `<p class="empty-state">Nenhum prazo cadastrado.</p>`;
  document.querySelectorAll("[data-edit-deadline]").forEach((button) => {
    button.addEventListener("click", () => openClientDeadlineDialog(button.dataset.editDeadline));
  });
  document.querySelectorAll("[data-remove-deadline]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClient.deadlines = activeClient.deadlines.filter((deadline) => deadline.id !== button.dataset.removeDeadline);
      renderDeadlines();
    });
  });
  refreshIcons();
}

function renderNotes() {
  el.notesList.innerHTML = (activeClient.notes || []).length
    ? [...activeClient.notes]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(
          (note) => `
            <article class="note-message" data-note="${note.id}">
              <p class="note-text">${escapeHtml(note.text || "")}</p>
              <textarea class="note-edit-field" data-note-field="text" hidden>${escapeHtml(note.text || "")}</textarea>
              <div class="note-footer">
                <span>${escapeHtml(ownerName(note.userId))} | ${formatDateTime(note.createdAt)}${note.updatedAt ? " | editada" : ""}</span>
                <button type="button" data-edit-note="${note.id}">Editar</button>
                <button type="button" data-save-note="${note.id}" hidden>Salvar</button>
                <button type="button" data-remove-note="${note.id}" aria-label="Remover anotação">×</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">Nenhuma anotação registrada.</p>`;

  document.querySelectorAll("[data-edit-note]").forEach((button) => {
    button.addEventListener("click", () => {
      const wrapper = button.closest("[data-note]");
      wrapper.querySelector(".note-text").hidden = true;
      wrapper.querySelector("[data-note-field]").hidden = false;
      button.hidden = true;
      wrapper.querySelector("[data-save-note]").hidden = false;
    });
  });

  document.querySelectorAll("[data-save-note]").forEach((button) => {
    button.addEventListener("click", () => {
      const note = activeClient.notes.find((item) => item.id === button.dataset.saveNote);
      const box = document.querySelector(`[data-note="${note.id}"] [data-note-field="text"]`);
      note.text = box.value.trim();
      note.updatedAt = new Date().toISOString();
      renderNotes();
    });
  });

  document.querySelectorAll("[data-remove-note]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClient.notes = activeClient.notes.filter((note) => note.id !== button.dataset.removeNote);
      renderNotes();
    });
  });
  refreshIcons();
}

function renderWorkerMessages() {
  const messages = Array.isArray(activeClient.workerMessages) ? activeClient.workerMessages : [];
  el.workerMessagesList.innerHTML = messages.length
    ? [...messages]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(
          (message) => `
            <article class="note-message" data-worker-message="${message.id}">
              <p class="note-text">${escapeHtml(message.text || "")}</p>
              <textarea class="note-edit-field" data-worker-message-field="text" hidden>${escapeHtml(message.text || "")}</textarea>
              <div class="note-footer">
                <span>${escapeHtml(ownerName(message.userId))} | ${formatDateTime(message.createdAt)}${message.updatedAt ? " | editada" : ""}</span>
                <button type="button" data-edit-worker-message="${message.id}">Editar</button>
                <button type="button" data-save-worker-message="${message.id}" hidden>Salvar</button>
                <button type="button" data-remove-worker-message="${message.id}" aria-label="Remover mensagem">×</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">Nenhuma mensagem registrada.</p>`;

  document.querySelectorAll("[data-edit-worker-message]").forEach((button) => {
    button.addEventListener("click", () => {
      const wrapper = button.closest("[data-worker-message]");
      wrapper.querySelector(".note-text").hidden = true;
      wrapper.querySelector("[data-worker-message-field]").hidden = false;
      button.hidden = true;
      wrapper.querySelector("[data-save-worker-message]").hidden = false;
    });
  });

  document.querySelectorAll("[data-save-worker-message]").forEach((button) => {
    button.addEventListener("click", () => {
      const message = activeClient.workerMessages.find((item) => item.id === button.dataset.saveWorkerMessage);
      const box = document.querySelector(`[data-worker-message="${message.id}"] [data-worker-message-field="text"]`);
      message.text = box.value.trim();
      message.updatedAt = new Date().toISOString();
      renderWorkerMessages();
    });
  });

  document.querySelectorAll("[data-remove-worker-message]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClient.workerMessages = activeClient.workerMessages.filter((message) => message.id !== button.dataset.removeWorkerMessage);
      renderWorkerMessages();
    });
  });
  refreshIcons();
}

function renderHistory() {
  const isAdmin = currentUser.role === "admin";
  el.historyAdminControls.hidden = !isAdmin;
  const history = Array.isArray(activeClient.history) ? activeClient.history : [];

  el.historyList.innerHTML = history.length
    ? `<div class="history-timeline">${[...history]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((entry) => {
          const details = Array.isArray(entry.details) && entry.details.length ? entry.details : [entry.title || "Registro do histórico"];
          return `
            <article class="history-timeline-item" data-history="${entry.id}">
              <span class="history-dot"></span>
              <div class="history-content">
                <div class="history-meta">
                  <span>${escapeHtml(ownerName(entry.userId))}</span>
                  <span>${formatDateTime(entry.createdAt)}${entry.updatedAt ? " | editado" : ""}</span>
                  <span>${entry.type === "system" ? "Automático" : "Manual"}</span>
                </div>
                <ul>${details.map((detail) => `<li>${escapeHtml(detail)}</li>`).join("")}</ul>
                ${
                  isAdmin
                    ? `<div class="inline-actions history-actions">
                        <button class="small-button" type="button" data-edit-history="${entry.id}"><i data-lucide="pencil"></i> Editar</button>
                        <button class="danger-button" type="button" data-remove-history="${entry.id}"><i data-lucide="trash-2"></i> Remover</button>
                      </div>`
                    : ""
                }
              </div>
            </article>
          `;
        })
        .join("")}</div>`
    : `<p class="empty-state">Nenhum histórico registrado.</p>`;

  document.querySelectorAll("[data-edit-history]").forEach((button) => {
    button.addEventListener("click", () => {
      if (currentUser.role !== "admin") return;
      openHistoryEditDialog(button.dataset.editHistory);
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

function addWorkerMessage() {
  const text = el.newWorkerMessageText.value.trim();
  if (!text) return;
  activeClient.workerMessages = Array.isArray(activeClient.workerMessages) ? activeClient.workerMessages : [];
  activeClient.workerMessages.unshift({
    id: id(),
    text,
    userId: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  });
  el.newWorkerMessageText.value = "";
  renderWorkerMessages();
}

function addManualHistory() {
  if (currentUser.role !== "admin") return;
  const text = el.newHistoryText.value.trim();
  if (!text) return;
  addHistoryEntry(activeClient, "Registro manual", text.split("\n").map((line) => line.trim()).filter(Boolean), "manual");
  el.newHistoryText.value = "";
  renderHistory();
}

function openHistoryEditDialog(historyId) {
  if (currentUser.role !== "admin") return;
  const entry = activeClient.history.find((item) => item.id === historyId);
  if (!entry) return;
  const details = Array.isArray(entry.details) ? entry.details : [];
  openSimpleDialog("Editar histórico", [
    { label: "Informação do histórico", name: "details", type: "textarea", value: details.join("\n"), rows: 7 },
  ], (values) => {
    const detailsValue = values.details.split("\n").map((line) => line.trim()).filter(Boolean);
    if (!detailsValue.length) {
      alert("Informe pelo menos uma linha do histórico.");
      return false;
    }

    entry.details = detailsValue;
    entry.updatedAt = new Date().toISOString();
    renderHistory();
    return true;
  });
}

function saveActiveClient() {
  syncCurrentWorkFromClient(activeClient);
  applyWorkToClient(activeClient, currentClientWork(activeClient));
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
    documentType: "Tipo de documento",
    cpf: "CPF/CNPJ",
    phone: "Telefone",
    whatsappDdd: "DDD do WhatsApp",
    infoOwner: "Responsável por informações",
    internalOwner: "Responsável interno",
    folderPath: "Pasta no OneDrive",
    nextAction: "Próxima ação",
    workTitle: "Título da obra",
    workResponsible: "Responsável da obra",
    destination: "Destinação",
    workType: "Tipo de obra",
    concrete: "Concreto usinado",
    state: "Estado",
    startDate: "Início da obra",
    endDate: "Fim da obra",
    area: "Área",
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

  collectionChangeSummary(changes, "Obras", previousClient.works, nextClient.works, (item) => item.workTitle || item.title || "obra sem título");
  collectionChangeSummary(changes, "Controle mensal", previousClient.monthly, nextClient.monthly, (item) => item.month || "mês sem competência");
  collectionChangeSummary(changes, "Tarefas", previousClient.tasks, nextClient.tasks, (item) => item.title || "tarefa sem título");
  collectionChangeSummary(changes, "Prazos", previousClient.deadlines, nextClient.deadlines, (item) => item.title || "prazo sem título");
  collectionChangeSummary(changes, "Anotações", previousClient.notes, nextClient.notes, (item) => item.text || "anotação sem texto");
  collectionChangeSummary(changes, "Trabalhadores", previousClient.workerMessages, nextClient.workerMessages, (item) => item.text || "mensagem sem texto");
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
          <label>Senha<input type="text" value="Gerenciada no Firebase" data-user-manager-field="password" disabled /></label>
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

async function changeOwnPassword() {
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

  if (firebaseAuth?.currentUser) {
    try {
      await firebaseAuth.currentUser.updatePassword(password);
      el.accountPassword.value = "";
      el.accountPasswordConfirm.value = "";
      el.accountMessage.textContent = "Senha alterada no Firebase.";
    } catch (error) {
      console.error(error);
      el.accountMessage.textContent = "Nao foi possivel alterar a senha. Saia, entre novamente e tente outra vez.";
    }
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
  alert("Os usuários agora são fixos: Mayssa e Camilli.");
}

function openClientTaskDialog(taskId = null) {
  const task = activeClient.tasks.find((item) => item.id === taskId) || null;
  const draft = task || emptyTask();
  openSimpleDialog(task ? "Editar tarefa" : "Nova tarefa", [
    { label: "Tarefa", name: "title", type: "text", value: draft.title || "" },
    { label: "Responsável", name: "ownerId", type: "select", value: draft.ownerId || currentUser.id, options: state.users.map((user) => ({ value: user.id, label: user.name })) },
    { label: "Prazo", name: "dueDate", type: "date", value: draft.dueDate || "" },
    { label: "Status", name: "status", type: "select", value: draft.status || "Pendente", options: taskStatusValues().map((value) => ({ value, label: value })) },
  ], (values) => {
    if (!values.title) {
      alert("Informe o nome da tarefa.");
      return false;
    }

    const payload = {
      title: values.title,
      description: values.description || "",
      ownerId: values.ownerId || currentUser.id,
      dueDate: values.dueDate,
      status: values.status || "Pendente",
      updatedAt: new Date().toISOString(),
    };

    if (task) {
      Object.assign(task, payload);
    } else {
      activeClient.tasks.push({
        ...draft,
        ...payload,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      });
    }

    renderTasks();
    return true;
  });
}

function openClientDeadlineDialog(deadlineId = null) {
  const deadline = activeClient.deadlines.find((item) => item.id === deadlineId) || null;
  const draft = deadline || emptyDeadline();
  openSimpleDialog(deadline ? "Editar prazo" : "Novo prazo", [
    { label: "Prazo", name: "title", type: "text", value: draft.title || "" },
    { label: "Tipo", name: "type", type: "select", value: draft.type || "Interno", options: deadlineTypeValues().map((value) => ({ value, label: value })) },
    { label: "Data", name: "date", type: "date", value: draft.date || "" },
    { label: "Responsável", name: "ownerId", type: "select", value: draft.ownerId || currentUser.id, options: state.users.map((user) => ({ value: user.id, label: user.name })) },
  ], (values) => {
    if (!values.title) {
      alert("Informe o nome do prazo.");
      return false;
    }

    const payload = {
      title: values.title,
      type: values.type || "Interno",
      date: values.date,
      ownerId: values.ownerId || currentUser.id,
    };

    if (deadline) {
      Object.assign(deadline, payload);
    } else {
      activeClient.deadlines.push({
        ...draft,
        ...payload,
      });
    }

    renderDeadlines();
    return true;
  });
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
    { label: "Texto", name: "description", type: "textarea", rows: 5, value: task?.description || "" },
    { label: "Criada por", name: "createdByLabel", type: "readonly", value: ownerName(task?.createdBy || currentUser.id) },
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
  if (field.type === "textarea") {
    return `<textarea rows="${field.rows || 5}" data-simple-field="${field.name}">${escapeHtml(field.value)}</textarea>`;
  }

  if (field.type === "readonly") {
    return `<input type="text" value="${escapeAttr(field.value)}" data-simple-field="${field.name}" disabled />`;
  }

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
  const client = {
    id: id(),
    clientName: "",
    fullName: "",
    documentType: "cpf",
    cpf: "",
    phone: "",
    whatsappDdd: "",
    infoOwner: "",
    internalOwner: currentUser.id,
    folderPath: "",
    nextAction: "",
    statusIds: [],
    activeWorkId: "",
    works: [],
    workTitle: "Obra principal",
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
    workerMessages: [],
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
  client.works = [createWorkFromClient(client, "Obra principal")];
  client.activeWorkId = client.works[0].id;
  return client;
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
    receiptSent: false,
    receiptSigned: false,
    remunerationSent: false,
    guideIssued: false,
    guideSent: false,
    guidePaid: false,
    notes: "",
  };
}

function normalizeMonthRow(row = {}) {
  return {
    id: row.id || id(),
    month: row.month || "",
    receiptSent: Boolean(row.receiptSent),
    receiptSigned: Boolean(row.receiptSigned),
    remunerationSent: Boolean(row.remunerationSent),
    guideIssued: Boolean(row.guideIssued),
    guideSent: Boolean(row.guideSent),
    guidePaid: Boolean(row.guidePaid),
    notes: row.notes || "",
  };
}

function emptyTask() {
  return {
    id: id(),
    title: "",
    ownerId: currentUser.id,
    dueDate: "",
    status: "Pendente",
    createdBy: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  };
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

function ownerSummary(userIds = []) {
  const names = [...new Set(userIds.filter(Boolean).map((userId) => ownerName(userId)))];
  if (!names.length) return "sem responsável";
  if (names.length <= 2) return names.join(", ");
  return `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
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
  return deadlineTypeValues()
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function deadlineTypeValues() {
  return ["Guia", "Receita", "Cliente", "Interno", "NF", "Outro"];
}

function documentStatusOptions(selected = "Pendente") {
  return ["Pendente", "Recebido", "Aprovado", "Inválido", "Não possui"]
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function formatFieldValue(field, value) {
  if (field === "cpf") return formatDocumentNumber(value, activeClient?.documentType || "cpf");
  if (field === "phone") return formatPhoneNumber(value);
  if (field === "area") return formatAreaValue(value);
  return value;
}

function documentTypeForClient(client = {}) {
  if (client.documentType === "cnpj" || client.documentType === "cpf") return client.documentType;
  return onlyDigits(client.cpf).length > 11 ? "cnpj" : "cpf";
}

function formatDocumentNumber(value, type = "cpf") {
  const digits = onlyDigits(value).slice(0, type === "cnpj" ? 14 : 11);
  if (type === "cnpj") {
    return digits
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})(\d)/, "$1-$2");
}

function formatPhoneNumber(value) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d{0,4})(\d{0,4}).*/, (_, ddd, start, end) => {
      return `(${ddd}) ${start}${end ? `-${end}` : ""}`;
    });
  }

  return digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, (_, ddd, start, end) => {
    return `(${ddd}) ${start}${end ? `-${end}` : ""}`;
  });
}

function formatAreaValue(value) {
  const digits = onlyDigits(value);
  if (!digits) return "";

  const padded = digits.padStart(3, "0");
  const integer = padded.slice(0, -2).replace(/^0+(?=\d)/, "");
  const decimal = padded.slice(-2);
  return `${integer},${decimal} m²`;
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizeClientSelectValues(client) {
  const destinationAliases = {
    residencial: "Residencial unifamiliar",
  };
  const workTypeAliases = {
    construcao: "Alvenaria",
    construção: "Alvenaria",
  };
  client.destination = normalizeSelectValue(destinationAliases[normalize(client.destination)] || client.destination, [
    "Residencial unifamiliar",
    "Residencial multifamiliar",
    "Comercial salas e lojas",
    "Galpão industrial",
    "Casa popular",
    "Conjunto habitacional popular",
    "Edifício de garagens",
  ]);
  client.workType = normalizeSelectValue(workTypeAliases[normalize(client.workType)] || client.workType, ["Alvenaria", "Madeira ou mista"]);
  client.concrete = normalizeSelectValue(client.concrete, ["Sim", "Não"]);
  client.state = normalizeSelectValue(String(client.state || "").toUpperCase(), brazilianStates());
}

function normalizeSelectValue(value, options) {
  if (!value) return "";
  const match = options.find((option) => normalize(option) === normalize(value));
  return match || "";
}

function brazilianStates() {
  return ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];
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
