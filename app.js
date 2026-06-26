const STORAGE_KEY = "reduzsim_client_flow_v2";
const LEGACY_STORAGE_KEYS = ["reduzsim_client_flow_v1"];
const SESSION_KEY = "reduzsim_current_user_v2";
const GUIDANCE_COLLAPSE_KEY = "reduzsim_collapsed_guidance_v1";
const FIRESTORE_COLLECTION = "reduzsim_admin";
const FIRESTORE_STATE_DOC = "shared_state";
const APP_VERSION = currentAppVersion();

const firebaseConfig = {
  apiKey: "AIzaSyAwgOrvq2QGUEPObgkAPXyG_KyJ3l-305w",
  authDomain: "reduzsim-2a6f2.firebaseapp.com",
  projectId: "reduzsim-2a6f2",
  storageBucket: "reduzsim-2a6f2.firebasestorage.app",
  messagingSenderId: "350622536875",
  appId: "1:350622536875:web:ed0f9bf3f11b32c894d3ee",
};

const DEFAULT_GOAL_SETTINGS = {
  floor: "R$ 15.000,00",
  target: "R$ 20.000,00",
  stretch: "R$ 25.000,00",
};

const BILL_YEAR = "2026";
const DEFAULT_BILL_CATEGORIES = ["Sistema", "Serviço", "Operacional", "Fixo", "Marketing", "Imposto", "Fornecedor", "Pessoal", "Outros"];
const BILL_STATUS_OPTIONS = ["A pagar", "Pago"];
const CLIENTS_PER_PAGE = 20;

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
  "contractClosedDate",
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
    workTitle: "Obra principal",
    workResponsible: "Engenheiro responsável",
    destination: "Residencial",
    workType: "Construção",
    concrete: "Sim",
    state: "TO",
    contractClosedDate: "2026-01-10",
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
    inssOriginalValue: "",
    inssReducedValue: "",
    paymentMethod: "Pix",
    installments: "3",
    financeStatus: "Em andamento",
    clientOrigin: "Indicação",
    hasReferralCommission: "Sim",
    referralCommission: "R$ 450,00",
    referrer: "Indicador exemplo",
    commissionPaid: "Não",
    financeNotes: "",
    financeMessages: [
      {
        id: id(),
        text: "Primeira parcela paga.",
        userId: state.users[0]?.id || "",
        createdAt: new Date().toISOString(),
        updatedAt: null,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return client;
};

let state;
state = loadState();
let currentUser = null;
let activeClient = null;
let activeViewMode = "compact";
let activeClientQuickFilter = "active";
let activeClientPage = 1;
let activeTaskCalendarMode = "day";
let activeTaskDate = new Date();
let activeDataDrilldown = null;
let activeGoalsYear = "2026";
let activeGoalsMonth = "2026-06";
let activeBillsYear = BILL_YEAR;
let activeBillsMonth = String(new Date().getMonth() + 1).padStart(2, "0");
let activeBillsStatusFilter = "";
let collapsedGuidanceIds = new Set(loadCollapsedGuidanceIds());
let updatesImportantOnly = false;
let taskMineOnly = false;
let advancedClientFiltersOpen = false;
const expandedUpdateIds = new Set();
const collapsedUpdateDays = new Set();
const expandedTaskCardIds = new Set();
const expandedCompletedTaskGroups = new Set();
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
  systemVersionLabel: document.getElementById("systemVersionLabel"),
  logoutButton: document.getElementById("logoutButton"),
  newClientButton: document.getElementById("newClientButton"),
  newRegularizationButton: document.getElementById("newRegularizationButton"),
  metricsGrid: document.getElementById("metricsGrid"),
  attentionPanel: document.getElementById("attentionPanel"),
  quickInternalTaskButton: document.getElementById("quickInternalTaskButton"),
  addInternalTaskButton: document.getElementById("addInternalTaskButton"),
  addMeetingButton: document.getElementById("addMeetingButton"),
  taskOverview: document.getElementById("taskOverview"),
  previousTaskPeriodButton: document.getElementById("previousTaskPeriodButton"),
  nextTaskPeriodButton: document.getElementById("nextTaskPeriodButton"),
  todayTaskButton: document.getElementById("todayTaskButton"),
  taskPeriodLabel: document.getElementById("taskPeriodLabel"),
  taskDayModeButton: document.getElementById("taskDayModeButton"),
  taskWeekModeButton: document.getElementById("taskWeekModeButton"),
  taskMonthModeButton: document.getElementById("taskMonthModeButton"),
  taskSearchInput: document.getElementById("taskSearchInput"),
  taskOwnerFilter: document.getElementById("taskOwnerFilter"),
  taskClientFilter: document.getElementById("taskClientFilter"),
  taskStatusFilter: document.getElementById("taskStatusFilter"),
  taskMineFilterButton: document.getElementById("taskMineFilterButton"),
  taskCenterList: document.getElementById("taskCenterList"),
  tasksTodayBadge: document.getElementById("tasksTodayBadge"),
  tasksNewBadge: document.getElementById("tasksNewBadge"),
  updatesUnreadBadge: document.getElementById("updatesUnreadBadge"),
  updatesSummary: document.getElementById("updatesSummary"),
  markAllUpdatesReadButton: document.getElementById("markAllUpdatesReadButton"),
  updatesSearchInput: document.getElementById("updatesSearchInput"),
  updatesReadFilter: document.getElementById("updatesReadFilter"),
  updatesPeriodFilter: document.getElementById("updatesPeriodFilter"),
  updatesUserFilter: document.getElementById("updatesUserFilter"),
  updatesTypeFilter: document.getElementById("updatesTypeFilter"),
  updatesImportantFilterButton: document.getElementById("updatesImportantFilterButton"),
  updatesList: document.getElementById("updatesList"),
  updatesAside: document.getElementById("updatesAside"),
  addGuidanceButton: document.getElementById("addGuidanceButton"),
  guidanceQuestionInput: document.getElementById("guidanceQuestionInput"),
  searchGuidanceButton: document.getElementById("searchGuidanceButton"),
  guidanceAnswer: document.getElementById("guidanceAnswer"),
  guidancePendingPanel: document.getElementById("guidancePendingPanel"),
  guidanceSearchInput: document.getElementById("guidanceSearchInput"),
  guidanceStageFilter: document.getElementById("guidanceStageFilter"),
  guidanceStatusFilter: document.getElementById("guidanceStatusFilter"),
  guidanceLibrary: document.getElementById("guidanceLibrary"),
  dataPeriodFilter: document.getElementById("dataPeriodFilter"),
  dataWorkStatusFilter: document.getElementById("dataWorkStatusFilter"),
  dataStateFilter: document.getElementById("dataStateFilter"),
  dataDestinationFilter: document.getElementById("dataDestinationFilter"),
  dataDocumentFilter: document.getElementById("dataDocumentFilter"),
  dataOriginFilter: document.getElementById("dataOriginFilter"),
  exportDataButton: document.getElementById("exportDataButton"),
  dataSummary: document.getElementById("dataSummary"),
  dataQualityPanel: document.getElementById("dataQualityPanel"),
  dataPanels: document.getElementById("dataPanels"),
  dataTicketPanels: document.getElementById("dataTicketPanels"),
  dataReportFooter: document.getElementById("dataReportFooter"),
  dataDrilldown: document.getElementById("dataDrilldown"),
  goalsYearSelect: document.getElementById("goalsYearSelect"),
  goalsMonthSelect: document.getElementById("goalsMonthSelect"),
  goalsPrevMonthButton: document.getElementById("goalsPrevMonthButton"),
  goalsNextMonthButton: document.getElementById("goalsNextMonthButton"),
  editGoalsButton: document.getElementById("editGoalsButton"),
  goalsSummary: document.getElementById("goalsSummary"),
  goalsMonthlyGrid: document.getElementById("goalsMonthlyGrid"),
  goalsPerformancePanel: document.getElementById("goalsPerformancePanel"),
  goalsContractsTitle: document.getElementById("goalsContractsTitle"),
  goalsContractsList: document.getElementById("goalsContractsList"),
  goalsMissingData: document.getElementById("goalsMissingData"),
  billsYearSelect: document.getElementById("billsYearSelect"),
  billsMonthSelect: document.getElementById("billsMonthSelect"),
  exportBillsButton: document.getElementById("exportBillsButton"),
  copyPreviousBillsButton: document.getElementById("copyPreviousBillsButton"),
  manageBillCategoriesButton: document.getElementById("manageBillCategoriesButton"),
  addBillButton: document.getElementById("addBillButton"),
  billsSummary: document.getElementById("billsSummary"),
  billsAlert: document.getElementById("billsAlert"),
  billsSearchInput: document.getElementById("billsSearchInput"),
  billsTableBody: document.getElementById("billsTableBody"),
  billsCategoryChart: document.getElementById("billsCategoryChart"),
  searchInput: document.getElementById("searchInput"),
  regularizationSearchInput: document.getElementById("regularizationSearchInput"),
  regularizationList: document.getElementById("regularizationList"),
  statusFilter: document.getElementById("statusFilter"),
  ownerFilter: document.getElementById("ownerFilter"),
  stateFilter: document.getElementById("stateFilter"),
  clientSort: document.getElementById("clientSort"),
  moreFiltersButton: document.getElementById("moreFiltersButton"),
  advancedClientFilters: document.getElementById("advancedClientFilters"),
  workStateFilter: document.getElementById("workStateFilter"),
  taskAlertFilter: document.getElementById("taskAlertFilter"),
  deadlineAlertFilter: document.getElementById("deadlineAlertFilter"),
  financeFilter: document.getElementById("financeFilter"),
  monthlyPendingFilter: document.getElementById("monthlyPendingFilter"),
  nextActionFilter: document.getElementById("nextActionFilter"),
  listModeButton: document.getElementById("listModeButton"),
  compactModeButton: document.getElementById("compactModeButton"),
  listView: document.getElementById("listView"),
  compactView: document.getElementById("compactView"),
  clientPagination: document.getElementById("clientPagination"),
  clientDialog: document.getElementById("clientDialog"),
  clientDialogTitle: document.getElementById("clientDialogTitle"),
  deleteClientButton: document.getElementById("deleteClientButton"),
  saveClientButton: document.getElementById("saveClientButton"),
  openStatusPicker: document.getElementById("openStatusPicker"),
  activeStatusList: document.getElementById("activeStatusList"),
  inssReductionSummary: document.getElementById("inssReductionSummary"),
  inssReductionResults: document.getElementById("inssReductionResults"),
  operationalChecklist: document.getElementById("operationalChecklist"),
  statusPicker: document.getElementById("statusPicker"),
  generateMonthsButton: document.getElementById("generateMonthsButton"),
  addMonthButton: document.getElementById("addMonthButton"),
  monthlyProgressList: document.getElementById("monthlyProgressList"),
  monthlyTable: document.querySelector("#monthlyTable tbody"),
  addTaskButton: document.getElementById("addTaskButton"),
  tasksList: document.getElementById("tasksList"),
  addDeadlineButton: document.getElementById("addDeadlineButton"),
  deadlinesList: document.getElementById("deadlinesList"),
  addDocumentButton: document.getElementById("addDocumentButton"),
  documentsList: document.getElementById("documentsList"),
  newNoteText: document.getElementById("newNoteText"),
  addNoteButton: document.getElementById("addNoteButton"),
  notesList: document.getElementById("notesList"),
  historyAdminControls: document.getElementById("historyAdminControls"),
  newHistoryText: document.getElementById("newHistoryText"),
  addHistoryButton: document.getElementById("addHistoryButton"),
  historyList: document.getElementById("historyList"),
  newWorkerMessageText: document.getElementById("newWorkerMessageText"),
  addWorkerMessageButton: document.getElementById("addWorkerMessageButton"),
  workerMessagesList: document.getElementById("workerMessagesList"),
  newFinanceMessageText: document.getElementById("newFinanceMessageText"),
  addFinanceMessageButton: document.getElementById("addFinanceMessageButton"),
  financeMessagesList: document.getElementById("financeMessagesList"),
  referrerField: document.getElementById("referrerField"),
  hasReferralCommissionField: document.getElementById("hasReferralCommissionField"),
  referralCommissionValueField: document.getElementById("referralCommissionValueField"),
  commissionPaidField: document.getElementById("commissionPaidField"),
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
  simpleDialogSubtitle: document.getElementById("simpleDialogSubtitle"),
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
    regularizationClients: [],
    guidanceItems: [],
    guidanceQuestions: [],
    internalTasks: [],
    meetings: [],
    activities: [],
    goals: normalizeGoalSettings(),
    companyBills: [],
    companyBillCategories: DEFAULT_BILL_CATEGORIES,
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
    regularizationClients: Array.isArray(savedState.regularizationClients)
      ? savedState.regularizationClients.map(normalizeRegularizationClient)
      : [],
    guidanceItems: Array.isArray(savedState.guidanceItems) ? savedState.guidanceItems.map(normalizeGuidanceItem) : [],
    guidanceQuestions: Array.isArray(savedState.guidanceQuestions) ? savedState.guidanceQuestions.map(normalizeGuidanceQuestion) : [],
    internalTasks: Array.isArray(savedState.internalTasks) ? savedState.internalTasks.map(normalizeInternalTask) : [],
    meetings: Array.isArray(savedState.meetings) ? savedState.meetings.map(normalizeMeeting) : [],
    activities: Array.isArray(savedState.activities) ? savedState.activities.map(normalizeActivity) : [],
    goals: normalizeGoalSettings(savedState.goals),
    companyBills: Array.isArray(savedState.companyBills) ? savedState.companyBills.map(normalizeCompanyBill) : [],
  };
  migrated.companyBillCategories = normalizeBillCategories(savedState.companyBillCategories, migrated.companyBills);
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
    workTitle: "",
    workResponsible: "",
    destination: "",
    workType: "",
    concrete: "",
    state: "",
    contractClosedDate: "",
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
    inssOriginalValue: "",
    inssReducedValue: "",
    paymentMethod: "",
    installments: "",
    financeStatus: "Em andamento",
    clientOrigin: "",
    hasReferralCommission: "",
    referralCommission: "",
    referrer: "",
    commissionPaid: "",
    financeNotes: "",
    financeMessages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...client,
    feeValue: formatCurrencyValue(client.feeValue || ""),
    inssOriginalValue: formatCurrencyValue(client.inssOriginalValue || ""),
    inssReducedValue: formatCurrencyValue(client.inssReducedValue || ""),
    paymentMethod: normalizeSelectValue(client.paymentMethod, financePaymentMethods()),
    installments: normalizeInstallmentsValue(client.installments),
    financeStatus: normalizeFinanceStatus(client.financeStatus),
    clientOrigin: normalizeClientOrigin(client),
    hasReferralCommission: normalizeReferralCommissionChoice(client),
    referralCommission: formatCurrencyValue(client.referralCommission || ""),
    commissionPaid: normalizeSelectValue(client.commissionPaid, ["Sim", "Não"]),
    monthly: Array.isArray(client.monthly) ? client.monthly.map(normalizeMonthRow) : [],
    tasks: Array.isArray(client.tasks) ? client.tasks.map((task) => normalizeClientTask(task, client, migrated.users[0]?.id || "")) : [],
    deadlines: Array.isArray(client.deadlines) ? client.deadlines : [],
    notes: Array.isArray(client.notes) ? client.notes : [],
    history: Array.isArray(client.history) ? client.history.map(normalizeHistoryEntry) : [],
    documents: Array.isArray(client.documents) ? client.documents.map((doc) => ({ ...doc, name: localizeLabel(doc.name), status: localizeLabel(doc.status) })) : [],
    workerMessages: normalizeWorkerMessages(client, migrated.users[0]?.id || ""),
    financeMessages: normalizeFinanceMessages(client, migrated.users[0]?.id || ""),
    statusIds: Array.isArray(client.statusIds) ? client.statusIds : [],
  }));

  migrated.clients = migrated.clients.flatMap((client) => splitClientWorksIntoCards(client, migrated.users[0]?.id || ""));

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

function normalizeActivity(activity = {}) {
  return {
    id: activity.id || id(),
    type: activity.type || "client",
    title: activity.title || "Atualização registrada",
    detail: activity.detail || "",
    actorId: activity.actorId || "",
    ownerId: activity.ownerId || "",
    clientId: activity.clientId || "",
    clientSource: activity.clientSource || activity.sourceType || "inss",
    clientName: activity.clientName || "",
    internalTaskId: activity.internalTaskId || "",
    visibility: activity.visibility === "admin" ? "admin" : "team",
    readBy: Array.isArray(activity.readBy) ? activity.readBy : [],
    createdAt: activity.createdAt || new Date().toISOString(),
  };
}

function normalizeInternalTask(task) {
  return {
    id: task.id || id(),
    title: task.title || "",
    description: task.description || task.text || task.notes || "",
    followUpNotes: task.followUpNotes || "",
    ownerId: task.ownerId || "",
    dueDate: task.dueDate || "",
    status: localizeLabel(task.status || "Pendente"),
    priority: normalizeTaskPriority(task.priority),
    visibility: task.visibility === "admin" ? "admin" : "team",
    createdBy: task.createdBy || "",
    createdAt: task.createdAt || new Date().toISOString(),
    updatedAt: task.updatedAt || null,
  };
}

function normalizeMeeting(meeting) {
  return {
    id: meeting.id || id(),
    title: meeting.title || meeting.name || "",
    description: meeting.description || meeting.notes || "",
    clientId: meeting.clientId || "",
    clientSource: meeting.clientSource || "inss",
    participants: meeting.participants || "",
    location: meeting.location || "",
    ownerId: meeting.ownerId || "",
    date: meeting.date || meeting.meetingDate || "",
    time: meeting.time || "",
    createdBy: meeting.createdBy || "",
    createdAt: meeting.createdAt || new Date().toISOString(),
    updatedAt: meeting.updatedAt || null,
  };
}

function normalizeCompanyBill(bill = {}) {
  const dueDate = bill.dueDate || "";
  const dueYear = dueDate.slice(0, 4);
  const dueMonth = dueDate.slice(5, 7);
  const year = String(bill.year || dueYear || BILL_YEAR);
  const month = String(bill.month || dueMonth || "01").padStart(2, "0");
  return {
    id: bill.id || id(),
    year: year === BILL_YEAR ? BILL_YEAR : year,
    month: month >= "01" && month <= "12" ? month : "01",
    description: bill.description || bill.title || bill.name || "",
    category: normalizeBillCategory(bill.category),
    amount: formatFlexibleCurrencyValue(bill.amount || bill.value || ""),
    dueDate,
    status: normalizeSelectValue(bill.status, BILL_STATUS_OPTIONS) || "A pagar",
    paidAt: bill.paidAt || "",
    recurring: bill.recurring === true || bill.recurring === "Sim",
    notes: bill.notes || bill.observation || "",
    createdAt: bill.createdAt || new Date().toISOString(),
    updatedAt: bill.updatedAt || bill.createdAt || new Date().toISOString(),
  };
}

function normalizeBillCategory(value) {
  const category = localizeLabel(String(value || "").trim());
  return category || "Outros";
}

function normalizeBillCategories(categories = [], bills = []) {
  const source = [
    ...DEFAULT_BILL_CATEGORIES,
    ...(Array.isArray(categories) ? categories : []),
    ...(Array.isArray(bills) ? bills.map((bill) => bill.category) : []),
  ];
  const seen = new Set();
  return source
    .map(normalizeBillCategory)
    .filter((category) => {
      const key = normalize(category);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function billCategories() {
  state.companyBillCategories = normalizeBillCategories(state.companyBillCategories, state.companyBills);
  return state.companyBillCategories;
}

function normalizeGoalSettings(goals = {}) {
  return {
    floor: formatFlexibleCurrencyValue(goals.floor || DEFAULT_GOAL_SETTINGS.floor),
    target: formatFlexibleCurrencyValue(goals.target || DEFAULT_GOAL_SETTINGS.target),
    stretch: formatFlexibleCurrencyValue(goals.stretch || DEFAULT_GOAL_SETTINGS.stretch),
  };
}

function normalizeRegularizationClient(process = {}) {
  return {
    id: process.id || id(),
    clientName: process.clientName || process.name || "",
    propertyType: normalizeSelectValue(process.propertyType, destinationValues()) || process.propertyType || "",
    clientOrigin: process.clientOrigin || process.origin || "",
    cityState: normalizeSelectValue(String(process.cityState || "").toUpperCase(), brazilianStates()) || process.cityState || "",
    address: process.address || "",
    registryNumber: process.registryNumber || process.registration || "",
    status: process.status || "Em análise",
    contractClosedDate: process.contractClosedDate || "",
    feeValue: formatFlexibleCurrencyValue(process.feeValue || ""),
    nextAction: process.nextAction || "",
    notes: process.notes || "",
    tasks: Array.isArray(process.tasks) ? process.tasks.map((task) => normalizeClientTask(task, process, currentUser?.id || "")) : [],
    createdAt: process.createdAt || new Date().toISOString(),
    updatedAt: process.updatedAt || process.createdAt || new Date().toISOString(),
  };
}

function normalizeGuidanceItem(item = {}) {
  return {
    id: item.id || id(),
    title: item.title || "",
    stage: item.stage || "",
    status: normalizeGuidanceStatus(item.status),
    situation: item.situation || "",
    conduct: item.conduct || "",
    whenCallMayssa: item.whenCallMayssa || "",
    notUseWhen: item.notUseWhen || "",
    examples: item.examples || item.questionExamples || "",
    keywords: item.keywords || "",
    important: item.important === true || item.important === "Sim",
    usageCount: Number(item.usageCount || 0),
    mismatchCount: Number(item.mismatchCount || 0),
    archivedAt: item.archivedAt || "",
    versions: Array.isArray(item.versions) ? item.versions.map(normalizeGuidanceVersion) : [],
    createdBy: item.createdBy || "",
    createdAt: item.createdAt || new Date().toISOString(),
    updatedBy: item.updatedBy || item.createdBy || "",
    updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
  };
}

function normalizeGuidanceVersion(version = {}) {
  return {
    title: version.title || "",
    stage: version.stage || "",
    status: normalizeGuidanceStatus(version.status),
    situation: version.situation || "",
    conduct: version.conduct || "",
    whenCallMayssa: version.whenCallMayssa || "",
    notUseWhen: version.notUseWhen || "",
    examples: version.examples || "",
    keywords: version.keywords || "",
    important: Boolean(version.important),
    savedAt: version.savedAt || version.updatedAt || new Date().toISOString(),
    savedBy: version.savedBy || "",
  };
}

function normalizeGuidanceStatus(status) {
  const selected = normalizeSelectValue(status, guidanceStatusValues());
  return selected || "Publicada";
}

function normalizeGuidanceQuestion(question = {}) {
  return {
    id: question.id || id(),
    question: question.question || "",
    stage: question.stage || "",
    clientName: question.clientName || "",
    askedBy: question.askedBy || "",
    status: question.status || "Pendente",
    guidanceId: question.guidanceId || "",
    rejectedGuidanceId: question.rejectedGuidanceId || "",
    rejectionCount: Number(question.rejectionCount || 0),
    createdAt: question.createdAt || new Date().toISOString(),
    updatedAt: question.updatedAt || question.createdAt || new Date().toISOString(),
  };
}

function normalizeFinanceMessages(client = {}, fallbackUserId = "") {
  const messages = Array.isArray(client.financeMessages) ? client.financeMessages : [];
  const normalized = messages.map((message) => ({
    id: message.id || id(),
    text: message.text || "",
    userId: message.userId || client.internalOwner || fallbackUserId,
    createdAt: message.createdAt || client.createdAt || new Date().toISOString(),
    updatedAt: message.updatedAt || null,
  }));

  const legacyText = String(client.financeNotes || "").trim();
  if (legacyText && !normalized.some((message) => message.text === legacyText)) {
    normalized.push({
      id: id(),
      text: legacyText,
      userId: client.internalOwner || fallbackUserId,
      createdAt: client.createdAt || new Date().toISOString(),
      updatedAt: null,
    });
  }

  return normalized;
}

function normalizeClientTask(task, client = {}, fallbackUserId = "") {
  return {
    id: task.id || id(),
    title: task.title || "",
    description: task.description || task.text || task.notes || "",
    followUpNotes: task.followUpNotes || "",
    ownerId: task.ownerId || client.internalOwner || fallbackUserId,
    dueDate: task.dueDate || "",
    status: localizeLabel(task.status || "Pendente"),
    priority: normalizeTaskPriority(task.priority),
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
    contractClosedDate: work.contractClosedDate || client.contractClosedDate || "",
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

function splitClientWorksIntoCards(client = {}, fallbackUserId = "") {
  const works = normalizeClientWorks(client, fallbackUserId);
  return works.map((work, index) => {
    const card = cloneData(client);
    card.id = index === 0 ? client.id : work.id || id();
    delete card.works;
    delete card.activeWorkId;
    workFields.forEach((field) => {
      card[field] = cloneData(work[field] ?? card[field] ?? "");
    });
    card.workTitle = work.workTitle || work.title || card.workTitle || (index === 0 ? "Obra principal" : `Obra ${index + 1}`);
    card.area = formatFieldValue("area", card.area || "");
    normalizeClientSelectValues(card);
    return card;
  });
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
    (client.financeMessages || []).forEach((message) => {
      message.userId = idMap[message.userId] || message.userId;
    });
    (client.history || []).forEach((entry) => {
      entry.userId = idMap[entry.userId] || entry.userId;
    });
  });

  (migrated.regularizationClients || []).forEach((process) => {
    (process.tasks || []).forEach((task) => {
      task.ownerId = idMap[task.ownerId] || task.ownerId;
      task.createdBy = idMap[task.createdBy] || task.createdBy;
    });
  });

  (migrated.internalTasks || []).forEach((task) => {
    task.ownerId = idMap[task.ownerId] || task.ownerId;
    task.createdBy = idMap[task.createdBy] || task.createdBy;
  });
  (migrated.meetings || []).forEach((meeting) => {
    meeting.ownerId = idMap[meeting.ownerId] || meeting.ownerId;
    meeting.createdBy = idMap[meeting.createdBy] || meeting.createdBy;
  });
  (migrated.activities || []).forEach((activity) => {
    activity.actorId = idMap[activity.actorId] || activity.actorId;
    activity.ownerId = idMap[activity.ownerId] || activity.ownerId;
    activity.readBy = (activity.readBy || []).map((userId) => idMap[userId] || userId);
  });
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  scheduleCloudSave();
}

function recordActivity(type, title, detail = "", options = {}) {
  if (!currentUser) return;
  state.activities = Array.isArray(state.activities) ? state.activities : [];
  state.activities.unshift({
    id: id(),
    type,
    title,
    detail,
    actorId: currentUser.id,
    ownerId: options.ownerId || "",
    clientId: options.clientId || "",
    clientSource: options.clientSource || "inss",
    clientName: options.clientName || "",
    internalTaskId: options.internalTaskId || "",
    visibility: options.visibility === "admin" ? "admin" : "team",
    readBy: [currentUser.id],
    createdAt: new Date().toISOString(),
  });
  state.activities = state.activities.slice(0, 500);
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
  el.newRegularizationButton.addEventListener("click", () => openRegularizationDialog());
  el.quickInternalTaskButton?.addEventListener("click", openQuickInternalTaskDialog);
  el.addInternalTaskButton.addEventListener("click", openInternalTaskDialog);
  el.addMeetingButton.addEventListener("click", () => openMeetingDialog());
  el.previousTaskPeriodButton.addEventListener("click", () => moveTaskPeriod(-1));
  el.nextTaskPeriodButton.addEventListener("click", () => moveTaskPeriod(1));
  el.todayTaskButton.addEventListener("click", () => {
    activeTaskDate = new Date();
    renderTaskCenter();
  });
  el.taskDayModeButton.addEventListener("click", () => setTaskCalendarMode("day"));
  el.taskWeekModeButton.addEventListener("click", () => setTaskCalendarMode("week"));
  el.taskMonthModeButton.addEventListener("click", () => setTaskCalendarMode("month"));
  el.searchInput.addEventListener("input", resetClientPageAndRender);
  el.regularizationSearchInput.addEventListener("input", renderRegularizationClients);
  el.statusFilter.addEventListener("change", resetClientPageAndRender);
  el.clientSort.addEventListener("change", resetClientPageAndRender);
  el.taskSearchInput.addEventListener("input", renderTaskCenter);
  el.taskOwnerFilter.addEventListener("change", renderTaskCenter);
  el.taskClientFilter.addEventListener("change", renderTaskCenter);
  el.taskStatusFilter.addEventListener("change", renderTaskCenter);
  el.taskMineFilterButton.addEventListener("click", () => {
    taskMineOnly = !taskMineOnly;
    renderTaskCenter();
  });
  el.updatesSearchInput.addEventListener("input", renderUpdates);
  el.updatesReadFilter.addEventListener("change", renderUpdates);
  el.updatesPeriodFilter.addEventListener("change", renderUpdates);
  el.updatesUserFilter.addEventListener("change", renderUpdates);
  el.updatesTypeFilter.addEventListener("change", renderUpdates);
  el.updatesImportantFilterButton.addEventListener("click", () => {
    updatesImportantOnly = !updatesImportantOnly;
    renderUpdates();
  });
  el.markAllUpdatesReadButton.addEventListener("click", markAllActivitiesRead);
  el.addGuidanceButton.addEventListener("click", () => openGuidanceDialog());
  el.searchGuidanceButton.addEventListener("click", answerGuidanceQuestion);
  el.guidanceQuestionInput.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    answerGuidanceQuestion();
  });
  el.guidanceSearchInput.addEventListener("input", renderGuidance);
  el.guidanceStageFilter.addEventListener("change", renderGuidance);
  el.guidanceStatusFilter.addEventListener("change", renderGuidance);
  [el.dataPeriodFilter, el.dataWorkStatusFilter, el.dataStateFilter, el.dataDestinationFilter, el.dataDocumentFilter, el.dataOriginFilter].forEach((input) => {
    input.addEventListener("change", () => {
      activeDataDrilldown = null;
      renderDataDashboard();
    });
  });
  el.exportDataButton.addEventListener("click", exportDataDashboardCsv);
  el.goalsYearSelect.addEventListener("change", () => {
    activeGoalsYear = el.goalsYearSelect.value || "2026";
    const current = currentMonthKey();
    activeGoalsMonth = current.startsWith(activeGoalsYear) ? current : `${activeGoalsYear}-01`;
    renderGoalsDashboard();
  });
  el.goalsMonthSelect.addEventListener("change", () => {
    activeGoalsMonth = el.goalsMonthSelect.value || activeGoalsMonth;
    renderGoalsDashboard();
  });
  el.goalsPrevMonthButton.addEventListener("click", () => shiftGoalMonth(-1));
  el.goalsNextMonthButton.addEventListener("click", () => shiftGoalMonth(1));
  el.editGoalsButton.addEventListener("click", openGoalsDialog);
  el.billsYearSelect.addEventListener("change", () => {
    activeBillsYear = BILL_YEAR;
    el.billsYearSelect.value = BILL_YEAR;
    renderBillsDashboard();
  });
  el.billsMonthSelect.addEventListener("change", () => {
    activeBillsMonth = el.billsMonthSelect.value || activeBillsMonth;
    renderBillsDashboard();
  });
  el.billsSearchInput.addEventListener("input", renderBillsDashboard);
  el.exportBillsButton.addEventListener("click", exportBillsCsv);
  el.copyPreviousBillsButton.addEventListener("click", copyPreviousMonthBills);
  el.manageBillCategoriesButton?.addEventListener("click", openBillCategoriesDialog);
  el.addBillButton.addEventListener("click", () => openBillDialog());
  document.querySelectorAll("[data-bill-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeBillsStatusFilter = button.dataset.billFilter || "";
      renderBillsDashboard();
    });
  });
  el.listModeButton.addEventListener("click", () => setViewMode("list"));
  el.compactModeButton.addEventListener("click", () => setViewMode("compact"));
  document.querySelectorAll("[data-client-quick-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClientQuickFilter = button.dataset.clientQuickFilter || "active";
      resetClientPageAndRender();
    });
  });
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
    openClientTaskDialog();
  });
  el.addDeadlineButton.addEventListener("click", () => {
    openClientDeadlineDialog();
  });
  el.addNoteButton.addEventListener("click", addNote);
  el.addWorkerMessageButton.addEventListener("click", addWorkerMessage);
  el.addFinanceMessageButton.addEventListener("click", addFinanceMessage);
  el.addHistoryButton.addEventListener("click", addManualHistory);
  el.addStatusButton.addEventListener("click", openStatusDialog);
  el.addUserButton.addEventListener("click", openUserDialog);
  el.saveAccountPasswordButton.addEventListener("click", changeOwnPassword);
  document.querySelectorAll("[data-destination-option]").forEach((input) => {
    input.addEventListener("change", syncDestinationOptions);
  });

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchSection(button.dataset.section));
  });
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });
  document.querySelectorAll("[data-field]").forEach((input) => {
    const syncField = () => {
      if (!activeClient) return;
      if (input.dataset.field === "cpf") syncDocumentTypeFromNumber(input.value);
      input.value = formatFieldValue(input.dataset.field, input.value);
      activeClient[input.dataset.field] = input.value;
      if (input.dataset.field === "clientName") {
        el.clientDialogTitle.textContent = input.value || "Novo cliente";
      }
      if (input.dataset.field === "documentType") {
        const documentInput = document.querySelector('[data-field="cpf"]');
        if (documentInput) {
          documentInput.value = formatFieldValue("cpf", documentInput.value);
          activeClient.cpf = documentInput.value;
        }
      }
      if (input.dataset.field === "clientOrigin" || input.dataset.field === "hasReferralCommission") syncReferralCommissionFields();
      if (["feeValue", "inssOriginalValue", "inssReducedValue"].includes(input.dataset.field)) renderInssReduction();
    };
    input.addEventListener("input", syncField);
    input.addEventListener("change", syncField);
  });
}

function syncDocumentTypeFromNumber(value) {
  if (onlyDigits(value).length <= 11 || activeClient.documentType === "cnpj") return;
  activeClient.documentType = "cnpj";
  const documentTypeInput = document.querySelector('[data-field="documentType"]');
  if (documentTypeInput) documentTypeInput.value = "cnpj";
}

function syncReferralCommissionFields() {
  if (
    !activeClient ||
    !el.referrerField ||
    !el.hasReferralCommissionField ||
    !el.referralCommissionValueField ||
    !el.commissionPaidField
  ) return;
  const isReferral = activeClient.clientOrigin === "Indicação";
  const hasCommission = isReferral && activeClient.hasReferralCommission === "Sim";
  el.referrerField.hidden = !isReferral;
  el.hasReferralCommissionField.hidden = !isReferral;
  el.referralCommissionValueField.hidden = !hasCommission;
  el.commissionPaidField.hidden = !hasCommission;
  if (isReferral && hasCommission) return;
  if (!isReferral) {
    activeClient.referrer = "";
    activeClient.hasReferralCommission = "";
    const referrerInput = document.querySelector('[data-field="referrer"]');
    const commissionChoiceInput = document.querySelector('[data-field="hasReferralCommission"]');
    if (referrerInput) referrerInput.value = "";
    if (commissionChoiceInput) commissionChoiceInput.value = "";
  }
  activeClient.referralCommission = "";
  activeClient.commissionPaid = "";
  const commissionValueInput = document.querySelector('[data-field="referralCommission"]');
  const commissionPaidInput = document.querySelector('[data-field="commissionPaid"]');
  if (commissionValueInput) commissionValueInput.value = "";
  if (commissionPaidInput) commissionPaidInput.value = "";
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
  if (el.systemVersionLabel) el.systemVersionLabel.textContent = `Versão ${APP_VERSION}`;
}

function currentAppVersion() {
  try {
    const script = document.currentScript || document.querySelector('script[src*="app.js"]');
    const version = new URL(script?.src || "", window.location.href).searchParams.get("v");
    return version ? `v${String(version).replace(/^v/i, "")}` : "local";
  } catch {
    return "local";
  }
}

function configureNavigationForRole() {
  const isAdmin = currentUser.role === "admin";
  const statusNavItem = document.querySelector('[data-section="statusSection"]');
  const billsNavItem = document.querySelector('[data-section="billsSection"]');
  if (statusNavItem) statusNavItem.style.display = isAdmin ? "" : "none";
  if (billsNavItem) billsNavItem.style.display = isAdmin ? "" : "none";
  document.querySelector('[data-section="usersSection"]').style.display = isAdmin ? "" : "none";
  document.querySelector('[data-section="accountSection"]').style.display = isAdmin ? "none" : "";
  el.addUserButton.style.display = "none";
  el.addGuidanceButton.style.display = isAdmin ? "" : "none";
  el.editGoalsButton.style.display = isAdmin ? "" : "none";

  const activeSection = document.querySelector(".nav-item.active")?.dataset.section;
  if ((!isAdmin && ["usersSection", "statusSection", "billsSection"].includes(activeSection)) || (isAdmin && activeSection === "accountSection")) {
    switchSection("clientsSection");
  }
}

function renderAll() {
  renderStatusFilter();
  renderMetrics();
  renderClients();
  renderRegularizationClients();
  renderTaskCenter();
  renderTaskNavSignals();
  renderUpdates();
  renderGuidance();
  renderDataDashboard();
  renderGoalsDashboard();
  renderBillsDashboard();
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

function renderClientFilterOptions() {
  const selectedOwner = el.ownerFilter.value;
  const selectedState = el.stateFilter.value;
  el.ownerFilter.innerHTML = `<option value="">Todos os responsáveis</option>${state.users
    .map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`)
    .join("")}<option value="missing">Sem responsável</option>`;
  el.ownerFilter.value = selectedOwner;
  el.stateFilter.innerHTML = `<option value="">Todos os estados</option>${brazilianStates()
    .map((stateValue) => `<option value="${stateValue}">${stateValue}</option>`)
    .join("")}<option value="missing">Sem estado</option>`;
  el.stateFilter.value = selectedState;
}

function renderMetrics() {
  const openTasks = taskCenterItems().filter((item) => item.kind.includes("Tarefa") && item.urgency !== "done").length;
  const deadlines = state.clients.flatMap((client) => client.deadlines || []).length;
  const finishedClients = state.clients.filter(isClientFinished).length;
  el.metricsGrid.innerHTML = [
    ["Clientes ativos", state.clients.length - finishedClients],
    ["Tarefas abertas", openTasks],
    ["Prazos registrados", deadlines],
    ["Clientes finalizados", finishedClients],
  ]
    .map(([label, value]) => `<article class="metric"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");
}

function renderAttentionPanel() {
  if (!el.attentionPanel) return;
  const items = state.clients
    .filter((client) => !isClientFinished(client))
    .map((client) => ({ client, reasons: clientAttentionReasons(client), score: clientUrgencyScore(client) }))
    .filter((item) => item.reasons.length)
    .sort((a, b) => b.score - a.score || clientCreatedTime(b.client) - clientCreatedTime(a.client))
    .slice(0, 8);

  el.attentionPanel.innerHTML = `
    <div class="attention-heading">
      <div>
        <p class="eyebrow">Atenção de hoje</p>
        <h2>Prioridades do INSS de obras</h2>
      </div>
      <span>${items.length ? `${items.length} cliente(s)` : "Tudo certo"}</span>
    </div>
    <div class="attention-list">
      ${
        items.length
          ? items
              .map(
                ({ client, reasons }) => `
                  <button class="attention-item" type="button" data-open-client="${client.id}">
                    <strong>${escapeHtml(client.clientName || "Cliente sem nome")}</strong>
                    <span>${reasons.slice(0, 3).map((reason) => `<mark class="${reason.tone}">${escapeHtml(reason.label)}</mark>`).join("")}</span>
                  </button>
                `
              )
              .join("")
          : `<p class="empty-state compact">Nenhuma urgência automática encontrada.</p>`
      }
    </div>
  `;
  refreshIcons();
}

function legacyRenderDataDashboard() {
  const data = inssDataSummary();
  el.dataSummary.innerHTML = [
    ["Metragem total", formatAreaTotal(data.totalArea)],
    ["Economia bruta total", calculatedCurrency(data.grossEconomyTotal)],
    ["Contratos fechados", data.totalWorks],
    ["Honorários totais", calculatedCurrency(data.totalFees)],
  ]
    .map(([label, value]) => `<article class="data-total"><span>${label}</span><strong>${value}</strong></article>`)
    .join("");

  el.dataPanels.innerHTML = [
    dataPanel("Contratos fechados por mês", data.monthlyWorks, (row) => `${row.count} contrato(s)`),
    dataPanel("Obras por estado", data.byState, (row) => `${row.count} obra(s)`),
    dataPanel("Obras por destinação", data.byDestination, (row) => `${row.count} obra(s)`),
    dataPanel("PF ou PJ", data.byDocumentType, (row) => `${row.count} cliente(s)`),
    dataPanel("Origem dos clientes", data.byOrigin, (row) => `${row.count} cliente(s)`),
  ].join("");
  refreshIcons();
}

function legacyInssDataSummary() {
  const summary = {
    totalArea: 0,
    grossEconomyTotal: 0,
    totalWorks: state.clients.length,
    totalFees: 0,
    monthlyWorks: new Map(),
    byState: new Map(),
    byDestination: new Map(),
    byDocumentType: new Map(),
    byOrigin: new Map(),
  };

  state.clients.forEach((client) => {
    summary.totalArea += areaAmount(client.area);
    summary.totalFees += currencyAmount(client.feeValue) || 0;

    const original = currencyAmount(client.inssOriginalValue);
    const reduced = currencyAmount(client.inssReducedValue);
    if (original !== null && reduced !== null) summary.grossEconomyTotal += original - reduced;

    incrementDataMap(summary.monthlyWorks, contractClosedMonthLabel(client));
    incrementDataMap(summary.byState, client.state || "Sem estado");
    const destinations = destinationList(client.destination);
    (destinations.length ? destinations : ["Sem destinação"]).forEach((destination) => incrementDataMap(summary.byDestination, destination));
    incrementDataMap(summary.byDocumentType, documentTypeForClient(client) === "cnpj" ? "PJ" : "PF");
    incrementDataMap(summary.byOrigin, client.clientOrigin || "Sem origem");
  });

  return {
    ...summary,
    monthlyWorks: mapToSortedRows(summary.monthlyWorks, "date"),
    byState: mapToSortedRows(summary.byState),
    byDestination: mapToSortedRows(summary.byDestination),
    byDocumentType: mapToSortedRows(summary.byDocumentType),
    byOrigin: mapToSortedRows(summary.byOrigin),
  };
}

function legacyDataPanel(title, rows, valueFormatter) {
  return `
    <article class="data-panel">
      <h3>${escapeHtml(title)}</h3>
      <div class="data-list">
        ${
          rows.length
            ? rows.map((row) => dataRow(row.label, valueFormatter(row), row.percent)).join("")
            : `<p class="empty-state compact">Nenhum dado cadastrado.</p>`
        }
      </div>
    </article>
  `;
}

function legacyDataRow(label, value, percent) {
  return `
    <div class="data-row">
      <div>
        <strong>${escapeHtml(label)}</strong>
        <span>${escapeHtml(value)}</span>
      </div>
      <div class="data-bar" aria-hidden="true"><span style="width:${percent}%"></span></div>
    </div>
  `;
}

function legacyIncrementDataMap(map, key) {
  const label = key || "Não informado";
  map.set(label, (map.get(label) || 0) + 1);
}

function legacyMapToSortedRows(map, mode = "count") {
  const values = [...map.entries()].map(([label, count]) => ({ label, count }));
  const max = Math.max(...values.map((row) => row.count), 1);
  return values
    .map((row) => ({ ...row, percent: Math.max(8, Math.round((row.count / max) * 100)) }))
    .sort((a, b) => {
      const aMissing = normalize(a.label).startsWith("sem ");
      const bMissing = normalize(b.label).startsWith("sem ");
      if (aMissing !== bMissing) return Number(aMissing) - Number(bMissing);
      return mode === "date" ? a.label.localeCompare(b.label, "pt-BR") : b.count - a.count || a.label.localeCompare(b.label, "pt-BR");
    });
}

function monthLabel(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  if (Number.isNaN(date.getTime())) return "Sem data";
  return date.toLocaleDateString("pt-BR", { month: "2-digit", year: "numeric" });
}

function contractClosedMonthLabel(client = {}) {
  return client.contractClosedDate ? monthLabel(client.contractClosedDate) : "Sem fechamento informado";
}

function areaAmount(value) {
  const digits = onlyDigits(value);
  return digits ? Number(digits) / 100 : 0;
}

function formatAreaTotal(value) {
  return `${value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²`;
}

function renderDataDashboard() {
  if (!el.dataSummary || !el.dataPanels) return;
  try {
    renderDataFilterOptions();
    const data = inssDataSummary();
    el.dataSummary.innerHTML = renderDataSummary(data);
    el.dataQualityPanel.innerHTML = renderDataQualityPanel(data.quality);
    el.dataPanels.innerHTML = [
      reportMonthlyContractsPanel(data),
      reportMonthlyFeesPanel(data),
      reportHorizontalPanel("Localização", "Obras por estado", data.byState, "byState", data.totalWorks, { badge: "Top 6 estados", icon: "map-pin" }),
      reportDonutPanel("Comercial", "Origem dos clientes", data.byOrigin, "byOrigin", data.totalWorks, { icon: "users" }),
      reportHorizontalPanel("Perfil da obra", "Obras por destinação", data.byDestination, "byDestination", data.totalWorks, { badge: "Este ano", icon: "network" }),
      reportDonutPanel("Perfil do cliente", "PF ou PJ", data.byDocumentType, "byDocumentType", data.documentTypeTotal, { icon: "contact" }),
    ].join("");
    if (el.dataTicketPanels) el.dataTicketPanels.innerHTML = renderDataTicketPanels(data);
    if (el.dataReportFooter) el.dataReportFooter.innerHTML = renderDataReportFooter();
    renderDataDrilldown();
    bindDataDashboardActions();
    refreshIcons();
  } catch (error) {
    console.error(error);
    el.dataSummary.innerHTML = `<p class="empty-state compact">Não foi possível carregar os relatórios. Atualize a página e tente novamente.</p>`;
    if (el.dataQualityPanel) el.dataQualityPanel.innerHTML = "";
    if (el.dataPanels) el.dataPanels.innerHTML = "";
    if (el.dataTicketPanels) el.dataTicketPanels.innerHTML = "";
    if (el.dataReportFooter) el.dataReportFooter.innerHTML = "";
  }
}

function ensureDataTicketPanels() {
  if (el.dataTicketPanels) return el.dataTicketPanels;
  const existing = document.getElementById("dataTicketPanels");
  if (existing) {
    el.dataTicketPanels = existing;
    return existing;
  }
  if (!el.dataPanels) return null;
  const container = document.createElement("div");
  container.id = "dataTicketPanels";
  container.className = "data-ticket-panels";
  el.dataPanels.insertAdjacentElement("beforebegin", container);
  el.dataTicketPanels = container;
  return container;
}

function renderDataFilterOptions() {
  const records = dataAllRecords();
  renderDataPeriodOptions(records);
  setDataSelectOptions(el.dataStateFilter, "Todos os estados", sortedDataRecordValues(records, (record) => record.state || "Sem estado"));
  setDataSelectOptions(el.dataDestinationFilter, "Todas as destinações", sortedDataRecordValues(records, (record) => {
    const destinations = destinationList(record.destination);
    return destinations.length ? destinations : ["Sem destinação"];
  }));
  setDataSelectOptions(el.dataOriginFilter, "Todas as origens", sortedDataRecordValues(records, (record) => record.clientOrigin || "Sem origem"));
}

function renderDataPeriodOptions(records = dataAllRecords()) {
  const selected = el.dataPeriodFilter.value;
  const monthKeys = new Set(dataReportMonths().map((month) => month.key));
  records.forEach((record) => {
    const monthKey = dataMonthKey(record.contractClosedDate);
    if (monthKey) monthKeys.add(monthKey);
  });
  const monthOptions = [...monthKeys].sort((a, b) => b.localeCompare(a));
  el.dataPeriodFilter.innerHTML = `
    <option value="">Todo período</option>
    <option value="month">Este mês</option>
    <option value="year">Este ano</option>
    <option value="last12">Últimos 12 meses</option>
    ${monthOptions.map((monthKey) => `<option value="month:${escapeAttr(monthKey)}">${escapeHtml(dataMonthOptionLabel(monthKey))}</option>`).join("")}
  `;
  el.dataPeriodFilter.value = [...["", "month", "year", "last12"], ...monthOptions.map((monthKey) => `month:${monthKey}`)].includes(selected) ? selected : "";
}

function setDataSelectOptions(select, allLabel, values) {
  const selected = select.value;
  const options = [...new Set(values)].filter(Boolean);
  select.innerHTML = `<option value="">${escapeHtml(allLabel)}</option>${options
    .map((value) => `<option value="${escapeAttr(value)}">${escapeHtml(value)}</option>`)
    .join("")}`;
  select.value = options.includes(selected) ? selected : "";
}

function sortedDataValues(getValues) {
  return state.clients
    .flatMap((client) => {
      const value = getValues(client);
      return Array.isArray(value) ? value : [value];
    })
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function sortedDataRecordValues(records, getValues) {
  return records
    .flatMap((record) => {
      const value = getValues(record);
      return Array.isArray(value) ? value : [value];
    })
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function renderDataSummary(data) {
  const totals = [
    { label: "Metragem total", value: formatAreaTotal(data.totalArea), hint: "Somente obras filtradas", tone: "area", icon: "ruler" },
    { label: "Economia bruta", value: calculatedCurrency(data.grossEconomyTotal), hint: "INSS sem redução menos INSS com redução", tone: "economy", icon: "circle-dollar-sign" },
    { label: "Contratos fechados", value: data.withContractDate, hint: `${data.totalWorks - data.withContractDate} sem data de fechamento`, tone: "works", icon: "file-check-2" },
    { label: "Honorários totais", value: calculatedCurrency(data.totalFees), hint: "Soma dos honorários preenchidos", tone: "fees", icon: "user-round" },
    { label: "Ticket médio", value: calculatedCurrency(data.ticketAverage), hint: "Honorários por contrato fechado", tone: "ticket", icon: "crosshair" },
  ];
  return totals.map(renderDataTotal).join("");
}

function renderDataTotal(item) {
  return `
    <article class="data-total report-metric tone-${item.tone}">
      <span class="report-metric-icon"><i data-lucide="${escapeAttr(item.icon)}"></i></span>
      <div>
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(String(item.value))}</strong>
        <small>${escapeHtml(item.hint)}</small>
      </div>
    </article>
  `;
}

function renderDataQualityPanel(items) {
  return `
    <section class="data-quality-card">
      <header class="data-quality-heading">
        <i data-lucide="shield-check"></i>
        <h3>Conferência dos dados</h3>
      </header>
      <div class="data-quality-list">
        ${items.map(renderDataQualityItem).join("")}
      </div>
    </section>
  `;
}

function renderDataQualityItem(item) {
  const meta = dataQualityMeta(item.key);
  return `
    <button class="data-quality-item ${item.count ? "needs-attention" : ""} tone-${meta.tone}" type="button" data-data-quality="${item.key}">
      <span class="data-quality-icon"><i data-lucide="${escapeAttr(meta.icon)}"></i></span>
      <span>${escapeHtml(item.label)}</span>
      <strong>${item.count}</strong>
      <small>Ver detalhes</small>
    </button>
  `;
}

function dataQualityMeta(key) {
  return (
    {
      contract: { icon: "triangle-alert", tone: "danger" },
      area: { icon: "ruler", tone: "warning" },
      economy: { icon: "circle-dollar-sign", tone: "purple" },
      fees: { icon: "user-round", tone: "blue" },
      state: { icon: "map-pin", tone: "green" },
      origin: { icon: "building-2", tone: "neutral" },
    }[key] || { icon: "info", tone: "neutral" }
  );
}

function bindDataDashboardActions() {
  el.dataPanels.querySelectorAll("[data-data-group]").forEach((button) => {
    button.addEventListener("click", () => {
      activeDataDrilldown = { type: "group", group: button.dataset.dataGroup, label: button.dataset.dataLabel };
      renderDataDashboard();
    });
  });
  el.dataQualityPanel.querySelectorAll("[data-data-quality]").forEach((button) => {
    button.addEventListener("click", () => {
      activeDataDrilldown = { type: "quality", key: button.dataset.dataQuality };
      renderDataDashboard();
    });
  });
  el.dataDrilldown.querySelectorAll("[data-open-data-client]").forEach((button) => {
    button.addEventListener("click", () => openClientById(button.dataset.openDataClient));
  });
  el.dataDrilldown.querySelectorAll("[data-open-data-regularization]").forEach((button) => {
    button.addEventListener("click", () => openRegularizationDialog(button.dataset.openDataRegularization));
  });
}

function inssDataSummary() {
  const records = filteredDataRecords();
  const documentRecords = records.filter((record) => record.includeDocumentType);
  const summary = {
    totalArea: 0,
    grossEconomyTotal: 0,
    totalWorks: records.length,
    finishedWorks: records.filter((record) => record.finished).length,
    withContractDate: records.filter((record) => Boolean(record.contractClosedDate)).length,
    totalFees: 0,
    ticketFeeTotal: 0,
    ticketContractCount: 0,
    documentTypeTotal: documentRecords.length,
    monthlyWorks: new Map(),
    monthlyContracts: new Map(),
    monthlyFees: new Map(),
    byState: new Map(),
    byDestination: new Map(),
    byDocumentType: new Map(),
    byOrigin: new Map(),
    ticketByOrigin: new Map(),
    ticketByDestination: new Map(),
  };

  records.forEach((record) => {
    summary.totalArea += areaAmount(record.area);
    const feeAmount = currencyAmount(record.feeValue);
    summary.totalFees += feeAmount || 0;

    const grossEconomy = clientGrossEconomy(record);
    if (grossEconomy !== null) summary.grossEconomyTotal += grossEconomy;

    incrementDataMap(summary.monthlyWorks, contractClosedMonthLabel(record), record.id);
    if (record.contractClosedDate) {
      const monthKey = dataMonthKey(record.contractClosedDate);
      incrementMonthlyCountMap(summary.monthlyContracts, monthKey, record.id);
      if (feeAmount !== null) incrementMonthlyAmountMap(summary.monthlyFees, monthKey, feeAmount, record.id);
    }
    incrementDataMap(summary.byState, record.state || "Sem estado", record.id);
    const destinations = destinationList(record.destination);
    (destinations.length ? destinations : ["Sem destinação"]).forEach((destination) => incrementDataMap(summary.byDestination, destination, record.id));
    if (record.includeDocumentType) incrementDataMap(summary.byDocumentType, documentTypeForClient(record) === "cnpj" ? "PJ" : "PF", record.id);
    incrementDataMap(summary.byOrigin, record.clientOrigin || "Sem origem", record.id);

    if (record.contractClosedDate && feeAmount !== null) {
      summary.ticketFeeTotal += feeAmount;
      summary.ticketContractCount += 1;
      incrementTicketAverageMap(summary.ticketByOrigin, record.clientOrigin || "Sem origem", feeAmount, record.id);
      (destinations.length ? destinations : ["Sem destinação"]).forEach((destination) => {
        incrementTicketAverageMap(summary.ticketByDestination, destination, feeAmount, record.id);
      });
    }
  });

  return {
    ...summary,
    quality: dataQualityItems(records),
    monthlyWorks: mapToSortedRows(summary.monthlyWorks, "date"),
    monthlyContracts: mapToMonthlyRows(summary.monthlyContracts, "count"),
    monthlyFees: mapToMonthlyRows(summary.monthlyFees, "amount"),
    byState: mapToSortedRows(summary.byState),
    byDestination: mapToSortedRows(summary.byDestination),
    byDocumentType: mapToSortedRows(summary.byDocumentType),
    byOrigin: mapToSortedRows(summary.byOrigin),
    ticketAverage: summary.ticketContractCount ? summary.ticketFeeTotal / summary.ticketContractCount : null,
    ticketByOrigin: mapToAverageRows(summary.ticketByOrigin),
    ticketByDestination: mapToAverageRows(summary.ticketByDestination),
  };
}

function dataAllRecords() {
  const inssRecords = (Array.isArray(state.clients) ? state.clients : []).map((client) => ({
    ...client,
    sourceType: "client",
    sourceLabel: "INSS de obras",
    destination: client.destination || "",
    state: client.state || "",
    includeDocumentType: true,
    finished: isClientFinished(client),
  }));

  const regularizationRecords = (Array.isArray(state.regularizationClients) ? state.regularizationClients : []).map((process) => ({
    ...process,
    sourceType: "regularization",
    sourceLabel: "Regularização de imóvel",
    destination: process.propertyType || "",
    state: regularizationStateLabel(process),
    area: "",
    inssOriginalValue: "",
    inssReducedValue: "",
    includeDocumentType: false,
    finished: normalize(process.status) === "finalizado",
  }));

  return [...inssRecords, ...regularizationRecords];
}

function filteredDataRecords() {
  const period = el.dataPeriodFilter.value;
  const workStatus = el.dataWorkStatusFilter.value;
  const stateFilter = el.dataStateFilter.value;
  const destinationFilter = el.dataDestinationFilter.value;
  const documentFilter = el.dataDocumentFilter.value;
  const originFilter = el.dataOriginFilter.value;

  return dataAllRecords().filter((record) => {
    const destinations = destinationList(record.destination);
    const destinationLabels = destinations.length ? destinations : ["Sem destinação"];
    const documentLabel = record.includeDocumentType ? (documentTypeForClient(record) === "cnpj" ? "PJ" : "PF") : "";
    const originLabel = record.clientOrigin || "Sem origem";
    const stateLabel = record.state || "Sem estado";
    const finished = record.finished;

    return (
      matchesDataPeriod(record, period) &&
      (!workStatus || (workStatus === "finished" ? finished : !finished)) &&
      (!stateFilter || stateLabel === stateFilter) &&
      (!destinationFilter || destinationLabels.includes(destinationFilter)) &&
      (!documentFilter || documentLabel === documentFilter) &&
      (!originFilter || originLabel === originFilter)
    );
  });
}

function filteredDataClients() {
  return filteredDataRecords();
}

function regularizationStateLabel(process = {}) {
  const normalizedState = normalizeSelectValue(String(process.cityState || "").toUpperCase(), brazilianStates());
  if (normalizedState) return normalizedState;
  const value = String(process.cityState || "");
  const match = value.match(/\b(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)\b/i);
  return match ? match[1].toUpperCase() : "";
}

function matchesDataPeriod(client, period) {
  if (!period) return true;
  if (String(period).startsWith("month:")) return dataMonthKey(client.contractClosedDate) === String(period).slice(6);
  const date = new Date(client.contractClosedDate || "");
  if (Number.isNaN(date.getTime())) return false;
  const now = new Date();
  if (period === "month") return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  if (period === "year") return date.getFullYear() === now.getFullYear();
  if (period === "last12") {
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return date >= start;
  }
  return true;
}

function dataQualityItems(clients) {
  return [
    { key: "contract", label: "Sem fechamento", hint: "Afeta contratos por mês", count: dataQualityClients("contract", clients).length },
    { key: "area", label: "Sem área", hint: "Afeta a metragem total", count: dataQualityClients("area", clients).length },
    { key: "economy", label: "Sem economia", hint: "Afeta a economia bruta", count: dataQualityClients("economy", clients).length },
    { key: "fees", label: "Sem honorários", hint: "Afeta os honorários totais", count: dataQualityClients("fees", clients).length },
    { key: "state", label: "Sem estado", hint: "Afeta obras por estado", count: dataQualityClients("state", clients).length },
    { key: "origin", label: "Sem origem", hint: "Afeta origem dos clientes", count: dataQualityClients("origin", clients).length },
  ];
}

function dataQualityClients(key, clients = filteredDataClients()) {
  return clients.filter((client) => {
    if (key === "contract") return !client.contractClosedDate;
    if (key === "area") return client.sourceType === "client" && !areaAmount(client.area);
    if (key === "economy") return client.sourceType === "client" && (currencyAmount(client.inssOriginalValue) === null || currencyAmount(client.inssReducedValue) === null);
    if (key === "fees") return currencyAmount(client.feeValue) === null;
    if (key === "state") return !client.state;
    if (key === "origin") return !client.clientOrigin;
    return false;
  });
}

function reportMonthlyContractsPanel(data) {
  const rows = data.monthlyContracts;
  return `
    <article class="data-panel report-panel report-panel-wide">
      <header class="report-panel-header">
        <div>
          <p class="eyebrow"><i data-lucide="chart-column"></i> Volume</p>
          <h3>Contratos fechados por mês</h3>
        </div>
        <span>Este ano</span>
      </header>
      <div class="report-month-chart">
        ${rows.map((row) => reportMonthBar(row)).join("")}
      </div>
    </article>
  `;
}

function reportMonthBar(row) {
  return `
    <button class="report-month-bar" type="button" data-data-group="monthlyWorks" data-data-label="${escapeAttr(row.label)}" style="--bar-height:${row.percent}%">
      <span>${row.count ? row.count : ""}</span>
      <i aria-hidden="true"></i>
      <small>${escapeHtml(row.shortLabel)}</small>
    </button>
  `;
}

function reportMonthlyFeesPanel(data) {
  const total = data.monthlyFees.reduce((sum, row) => sum + row.total, 0);
  return `
    <article class="data-panel report-panel report-panel-wide">
      <header class="report-panel-header">
        <div>
          <p class="eyebrow"><i data-lucide="circle-dollar-sign"></i> Financeiro</p>
          <h3>Honorários fechados por mês</h3>
        </div>
        <span>Total ${dataReportYear()} · ${escapeHtml(formatCompactCurrency(total))}</span>
      </header>
      ${reportLineChart(data.monthlyFees)}
    </article>
  `;
}

function reportLineChart(rows) {
  const width = 560;
  const height = 210;
  const pad = { top: 18, right: 18, bottom: 34, left: 44 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const max = Math.max(...rows.map((row) => row.total), 1);
  const points = rows.map((row, index) => {
    const x = pad.left + (rows.length === 1 ? 0 : (index / (rows.length - 1)) * plotWidth);
    const y = pad.top + plotHeight - (row.total / max) * plotHeight;
    return { ...row, x, y };
  });
  const path = points.map((point, index) => `${index ? "L" : "M"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((ratio) => {
    const value = max * ratio;
    const y = pad.top + plotHeight - ratio * plotHeight;
    return { value, y };
  });

  return `
    <div class="report-line-chart">
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Honorários fechados por mês">
        ${ticks
          .map(
            (tick) => `
              <line x1="${pad.left}" x2="${width - pad.right}" y1="${tick.y.toFixed(1)}" y2="${tick.y.toFixed(1)}"></line>
              <text x="6" y="${(tick.y + 4).toFixed(1)}">${escapeHtml(formatCompactCurrency(tick.value))}</text>
            `
          )
          .join("")}
        <path d="${path}"></path>
        ${points.map((point) => `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="4"></circle>`).join("")}
        ${points
          .map((point) => `<text class="month-label" x="${point.x.toFixed(1)}" y="${height - 8}">${escapeHtml(point.shortLabel)}</text>`)
          .join("")}
      </svg>
    </div>
  `;
}

function reportHorizontalPanel(groupLabel, title, rows, group, total, options = {}) {
  const visibleRows = rows.slice(0, 6);
  return `
    <article class="data-panel report-panel">
      <header class="report-panel-header">
        <div>
          <p class="eyebrow"><i data-lucide="${escapeAttr(options.icon || "bar-chart-3")}"></i> ${escapeHtml(groupLabel)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <span>${escapeHtml(options.badge || "Este ano")}</span>
      </header>
      <div class="report-horizontal-list">
        ${
          visibleRows.length
            ? visibleRows.map((row, index) => reportHorizontalRow(row, group, total, index)).join("")
            : `<p class="empty-state compact">Nenhum dado cadastrado.</p>`
        }
      </div>
    </article>
  `;
}

function reportHorizontalRow(row, group, total, index) {
  return `
    <button class="report-horizontal-row" type="button" data-data-group="${escapeAttr(group)}" data-data-label="${escapeAttr(row.label)}" style="--row-color:${escapeAttr(reportChartColor(index))}">
      <span>${escapeHtml(row.label)}</span>
      <i aria-hidden="true"><b style="width:${row.percent}%"></b></i>
      <strong>${escapeHtml(reportCountShare(row.count, total))}</strong>
    </button>
  `;
}

function reportDonutPanel(groupLabel, title, rows, group, total, options = {}) {
  const visibleRows = rows.slice(0, 6);
  const chartTotal = visibleRows.reduce((sum, row) => sum + row.count, 0);
  return `
    <article class="data-panel report-panel">
      <header class="report-panel-header">
        <div>
          <p class="eyebrow"><i data-lucide="${escapeAttr(options.icon || "pie-chart")}"></i> ${escapeHtml(groupLabel)}</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <span>Este ano</span>
      </header>
      <div class="report-donut-layout">
        <div class="report-donut" style="--report-donut:${escapeAttr(reportConicGradient(visibleRows))}">
          <div class="report-donut-center">
            <span>Total</span>
            <strong>${total}</strong>
          </div>
        </div>
        <div class="report-legend">
          ${
            visibleRows.length
              ? visibleRows.map((row, index) => reportLegendRow(row, group, chartTotal || total, index)).join("")
              : `<p class="empty-state compact">Nenhum dado cadastrado.</p>`
          }
        </div>
      </div>
    </article>
  `;
}

function reportLegendRow(row, group, total, index) {
  return `
    <button class="report-legend-row" type="button" data-data-group="${escapeAttr(group)}" data-data-label="${escapeAttr(row.label)}">
      <i style="background:${escapeAttr(reportChartColor(index))}" aria-hidden="true"></i>
      <span>${escapeHtml(row.label)}</span>
      <strong>${escapeHtml(reportCountShare(row.count, total))}</strong>
    </button>
  `;
}

function renderDataTicketPanels(data) {
  return `
    <section class="data-ticket-section">
      <div class="data-ticket-heading">
        <div>
          <h3>Ticket médio</h3>
          <span>Indicadores de honorários calculados com contratos que possuem data de fechamento e valor preenchido.</span>
        </div>
      </div>
      <div class="data-ticket-grid">
        <article class="data-ticket-card ticket-highlight">
          <span class="report-metric-icon"><i data-lucide="circle-dollar-sign"></i></span>
          <h3>Ticket médio de honorários</h3>
          <strong>${escapeHtml(calculatedCurrency(data.ticketAverage))}</strong>
          <span>Honorários / contratos fechados</span>
        </article>
        ${dataAveragePanel("Ticket médio por origem", data.ticketByOrigin, "users")}
        ${dataAveragePanel("Ticket médio por destinação", data.ticketByDestination, "network")}
      </div>
    </section>
  `;
}

function dataAveragePanel(title, rows, icon) {
  return `
    <article class="data-ticket-card">
      <header class="ticket-average-heading">
        <h3><i data-lucide="${escapeAttr(icon)}"></i> ${escapeHtml(title)}</h3>
        <span>Este ano</span>
      </header>
      <div class="ticket-average-list">
        ${
          rows.length
            ? rows.slice(0, 6).map((row, index) => dataAverageRow(row, index)).join("")
            : `<p class="empty-state compact">Nenhum contrato com honorários para calcular.</p>`
        }
      </div>
    </article>
  `;
}

function dataAverageRow(row, index = 0) {
  return `
    <div class="ticket-average-row" style="--row-color:${escapeAttr(reportChartColor(index))}">
      <span>${escapeHtml(row.label)}</span>
      <i aria-hidden="true"><b style="width:${row.percent}%"></b></i>
      <strong>${escapeHtml(calculatedCurrency(row.average))}</strong>
    </div>
  `;
}

function renderDataReportFooter() {
  return `
    <span><i data-lucide="info"></i> Os dados são atualizados automaticamente com base nas informações cadastradas no sistema.</span>
    <span>Última atualização: ${escapeHtml(formatDateTime(new Date().toISOString()))}</span>
  `;
}

function renderDataDrilldown() {
  if (!activeDataDrilldown) {
    el.dataDrilldown.innerHTML = "";
    return;
  }
  const clients = dataClientsForDrilldown(activeDataDrilldown);
  const title = dataDrilldownTitle(activeDataDrilldown);
  el.dataDrilldown.innerHTML = `
    <section class="data-drilldown-card">
      <header>
        <div>
          <p class="eyebrow">Clientes do indicador</p>
          <h3>${escapeHtml(title)}</h3>
        </div>
        <span>${clients.length} card(s)</span>
      </header>
      <div class="data-client-list">
        ${
          clients.length
            ? clients.map(renderDataClientRow).join("")
            : `<p class="empty-state compact">Nenhum card encontrado para esse recorte.</p>`
        }
      </div>
    </section>
  `;
}

function dataClientsForDrilldown(drilldown) {
  const clients = filteredDataClients();
  if (drilldown.type === "quality") return dataQualityClients(drilldown.key, clients);
  return clients.filter((client) => dataClientMatchesGroup(client, drilldown.group, drilldown.label));
}

function dataClientMatchesGroup(client, group, label) {
  if (group === "monthlyWorks") return contractClosedMonthLabel(client) === label;
  if (group === "byState") return (client.state || "Sem estado") === label;
  if (group === "byDestination") {
    const destinations = destinationList(client.destination);
    return (destinations.length ? destinations : ["Sem destinação"]).includes(label);
  }
  if (group === "byDocumentType") return client.includeDocumentType && (documentTypeForClient(client) === "cnpj" ? "PJ" : "PF") === label;
  if (group === "byOrigin") return (client.clientOrigin || "Sem origem") === label;
  return false;
}

function dataDrilldownTitle(drilldown) {
  if (drilldown.type === "quality") {
    return dataQualityItems(filteredDataClients()).find((item) => item.key === drilldown.key)?.label || "Conferência dos dados";
  }
  return `${dataGroupTitle(drilldown.group)}: ${drilldown.label}`;
}

function dataGroupTitle(group) {
  return {
    monthlyWorks: "Contratos fechados por mês",
    byState: "Obras por estado",
    byDestination: "Obras por destinação",
    byDocumentType: "PF ou PJ",
    byOrigin: "Origem dos clientes",
  }[group] || "Dados";
}

function renderDataClientRow(client) {
  const grossEconomy = clientGrossEconomy(client);
  const workLine = [destinationLabel(client), client.state || "Sem estado", client.area || client.sourceLabel || "Sem área"].filter(Boolean).join(" | ");
  return `
    <article class="data-client-row">
      <div>
        <strong>${escapeHtml(client.clientName || "Cliente sem nome")}</strong>
        <small>${escapeHtml(workLine)}</small>
      </div>
      <span>${escapeHtml(grossEconomy === null ? "Economia não informada" : calculatedCurrency(grossEconomy))}</span>
      ${
        client.sourceType === "regularization"
          ? `<button class="small-button" type="button" data-open-data-regularization="${client.id}"><i data-lucide="external-link"></i> Abrir processo</button>`
          : `<button class="small-button" type="button" data-open-data-client="${client.id}"><i data-lucide="external-link"></i> Abrir card</button>`
      }
    </article>
  `;
}

function clientGrossEconomy(client) {
  const original = currencyAmount(client.inssOriginalValue);
  const reduced = currencyAmount(client.inssReducedValue);
  if (original === null || reduced === null) return null;
  return original - reduced;
}

function incrementDataMap(map, key, clientId) {
  const label = key || "Não informado";
  const current = map.get(label) || { count: 0, clientIds: new Set() };
  current.count += 1;
  if (clientId) current.clientIds.add(clientId);
  map.set(label, current);
}

function incrementTicketAverageMap(map, key, amount, clientId) {
  const label = key || "Não informado";
  const current = map.get(label) || { total: 0, count: 0, clientIds: new Set() };
  current.total += amount;
  current.count += 1;
  if (clientId) current.clientIds.add(clientId);
  map.set(label, current);
}

function incrementMonthlyCountMap(map, monthKey, clientId) {
  if (!monthKey) return;
  const current = map.get(monthKey) || { count: 0, total: 0, clientIds: new Set() };
  current.count += 1;
  if (clientId) current.clientIds.add(clientId);
  map.set(monthKey, current);
}

function incrementMonthlyAmountMap(map, monthKey, amount, clientId) {
  if (!monthKey) return;
  const current = map.get(monthKey) || { count: 0, total: 0, clientIds: new Set() };
  current.total += amount;
  current.count += 1;
  if (clientId) current.clientIds.add(clientId);
  map.set(monthKey, current);
}

function mapToSortedRows(map, mode = "count") {
  const values = [...map.entries()].map(([label, data]) => ({
    label,
    count: data.count,
    clientIds: [...data.clientIds],
  }));
  const max = Math.max(...values.map((row) => row.count), 1);
  return values
    .map((row) => ({ ...row, percent: Math.max(8, Math.round((row.count / max) * 100)) }))
    .sort((a, b) => (mode === "date" ? a.label.localeCompare(b.label, "pt-BR") : b.count - a.count || a.label.localeCompare(b.label, "pt-BR")));
}

function mapToAverageRows(map) {
  const values = [...map.entries()].map(([label, data]) => ({
    label,
    total: data.total,
    count: data.count,
    average: data.count ? data.total / data.count : null,
    clientIds: [...data.clientIds],
  }));
  const max = Math.max(...values.map((row) => row.average || 0), 1);
  return values
    .map((row) => ({ ...row, percent: Math.max(8, Math.round(((row.average || 0) / max) * 100)) }))
    .sort((a, b) => (b.average || 0) - (a.average || 0) || a.label.localeCompare(b.label, "pt-BR"));
}

function mapToMonthlyRows(map, mode = "count") {
  const rows = dataReportMonths().map((month) => {
    const data = map.get(month.key) || { count: 0, total: 0, clientIds: new Set() };
    const value = mode === "amount" ? data.total : data.count;
    return {
      ...month,
      count: data.count || 0,
      total: data.total || 0,
      value,
      clientIds: data.clientIds instanceof Set ? [...data.clientIds] : [],
    };
  });
  const max = Math.max(...rows.map((row) => row.value), 1);
  return rows.map((row) => ({ ...row, percent: row.value ? Math.max(6, Math.round((row.value / max) * 100)) : 0 }));
}

function dataMonthKey(dateValue) {
  const value = String(dateValue || "");
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dataReportYear() {
  return String(new Date().getFullYear());
}

function dataReportMonths(year = dataReportYear()) {
  const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return monthNames.map((shortLabel, index) => {
    const month = String(index + 1).padStart(2, "0");
    return {
      key: `${year}-${month}`,
      label: `${month}/${year}`,
      shortLabel,
    };
  });
}

function dataMonthOptionLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-");
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const index = Number(month) - 1;
  if (!year || index < 0 || index > 11) return monthKey;
  return `${monthNames[index]}/${year}`;
}

function reportChartColor(index) {
  return ["#009f7f", "#ff6fa8", "#7c3aed", "#f59e0b", "#2f80ed", "#94a3b8"][index % 6];
}

function reportConicGradient(rows) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (!total) return "#eef2f7 0% 100%";
  let start = 0;
  return rows
    .map((row, index) => {
      const end = start + (row.count / total) * 100;
      const stop = `${reportChartColor(index)} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
      start = end;
      return stop;
    })
    .join(", ");
}

function reportCountShare(count, total) {
  const share = total ? (count / total) * 100 : 0;
  return `${count} (${share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%)`;
}

function formatCompactCurrency(value) {
  const amount = Number(value) || 0;
  const abs = Math.abs(amount);
  if (abs >= 1000000) return `R$ ${(amount / 1000000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (abs >= 1000) return `R$ ${(amount / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })} mil`;
  return amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function exportDataDashboardCsv() {
  const clients = filteredDataClients();
  const rows = [
    [
      "Cliente",
      "Título da obra",
      "Fechamento do contrato",
      "Estado",
      "Destinação",
      "PF/PJ",
      "Área",
      "INSS sem redução",
      "INSS com redução",
      "Economia bruta",
      "Honorários",
      "Origem",
      "Status",
      "Criado em",
    ],
    ...clients.map((client) => [
      client.clientName || "",
      client.workTitle || "",
      client.contractClosedDate ? formatDate(client.contractClosedDate) : "",
      client.state || "",
      client.destination || "",
      client.includeDocumentType ? (documentTypeForClient(client) === "cnpj" ? "PJ" : "PF") : "",
      client.area || "",
      client.inssOriginalValue || "",
      client.inssReducedValue || "",
      clientGrossEconomy(client) === null ? "" : calculatedCurrency(clientGrossEconomy(client)),
      client.feeValue || "",
      client.clientOrigin || "",
      client.sourceType === "regularization" ? client.status || "" : getClientStatuses(client).map((status) => status.name).join(" | "),
      formatDateTime(client.createdAt || client.updatedAt),
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const date = localDateKey();
  link.href = URL.createObjectURL(blob);
  link.download = `dados-inss-obras-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function renderBillsDashboard() {
  if (!el.billsSummary || currentUser?.role !== "admin") return;
  state.companyBills = Array.isArray(state.companyBills) ? state.companyBills.map(normalizeCompanyBill) : [];
  state.companyBillCategories = normalizeBillCategories(state.companyBillCategories, state.companyBills);
  activeBillsYear = BILL_YEAR;
  if (!activeBillsMonth || activeBillsMonth < "01" || activeBillsMonth > "12") activeBillsMonth = String(new Date().getMonth() + 1).padStart(2, "0");
  el.billsYearSelect.value = BILL_YEAR;
  el.billsMonthSelect.value = activeBillsMonth;

  const monthBills = currentMonthBills();
  const summary = companyBillsSummary(monthBills);
  const filtered = filteredCompanyBills(monthBills);

  renderBillsSummary(summary);
  renderBillsAlert(summary);
  renderBillsFilters();
  renderBillsTable(filtered);
  renderBillsCategoryChart(summary);
  bindBillDashboardActions();
  refreshIcons();
}

function currentMonthBills() {
  return state.companyBills
    .filter((bill) => bill.year === activeBillsYear && bill.month === activeBillsMonth)
    .sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || "") || a.description.localeCompare(b.description, "pt-BR"));
}

function filteredCompanyBills(bills) {
  const query = normalize(el.billsSearchInput.value);
  return bills.filter((bill) => {
    const status = billEffectiveStatus(bill);
    const statusKey = billStatusKey(status);
    if (activeBillsStatusFilter && statusKey !== activeBillsStatusFilter) return false;
    if (!query) return true;
    return normalize([bill.description, bill.category, bill.notes, bill.amount, status].join(" ")).includes(query);
  });
}

function companyBillsSummary(bills) {
  const summary = {
    total: 0,
    paid: 0,
    pending: 0,
    overdue: 0,
    paidCount: 0,
    pendingCount: 0,
    overdueCount: 0,
    categoryTotals: new Map(),
    count: bills.length,
  };

  bills.forEach((bill) => {
    const amount = currencyAmount(bill.amount) || 0;
    const status = billEffectiveStatus(bill);
    summary.total += amount;
    if (status === "Pago") {
      summary.paid += amount;
      summary.paidCount += 1;
    } else if (status === "Vencida") {
      summary.overdue += amount;
      summary.overdueCount += 1;
    } else {
      summary.pending += amount;
      summary.pendingCount += 1;
    }
    const current = summary.categoryTotals.get(bill.category) || 0;
    summary.categoryTotals.set(bill.category, current + amount);
  });

  return summary;
}

function renderBillsSummary(summary) {
  const paidPercent = summary.total ? `${Math.round((summary.paid / summary.total) * 100)}% do mês quitado` : "Nenhum pagamento registrado";
  const cards = [
    { label: "Total do mês", value: calculatedCurrency(summary.total), hint: `${summary.count} conta(s) cadastrada(s)`, tone: "total", icon: "circle-dollar-sign" },
    { label: "Pago", value: calculatedCurrency(summary.paid), hint: paidPercent, tone: "paid", icon: "check-circle-2" },
    { label: "A pagar", value: calculatedCurrency(summary.pending), hint: `${summary.pendingCount} conta(s) pendente(s)`, tone: "pending", icon: "clock-3" },
    { label: "Vencidas", value: calculatedCurrency(summary.overdue), hint: `${summary.overdueCount} conta(s) exige(m) ação`, tone: "overdue", icon: "circle-alert" },
  ];
  el.billsSummary.innerHTML = cards
    .map(
      (card) => `
        <article class="bill-summary-card tone-${card.tone}">
          <span class="bill-summary-icon"><i data-lucide="${card.icon}"></i></span>
          <div>
            <span>${escapeHtml(card.label)}</span>
            <strong>${escapeHtml(card.value)}</strong>
            <small>${escapeHtml(card.hint)}</small>
          </div>
        </article>
      `
    )
    .join("");
}

function renderBillsAlert(summary) {
  if (!summary.overdueCount) {
    el.billsAlert.hidden = true;
    el.billsAlert.innerHTML = "";
    return;
  }
  el.billsAlert.hidden = false;
  el.billsAlert.innerHTML = `
    <div>
      <i data-lucide="circle-alert"></i>
      <strong>Atenção:</strong>
      <span>há ${summary.overdueCount} conta(s) vencida(s) no valor de ${escapeHtml(calculatedCurrency(summary.overdue))}. Regularize ou registre uma observação.</span>
    </div>
    <button class="link-action" type="button" data-show-overdue-bills>Ver conta vencida <i data-lucide="chevron-right"></i></button>
  `;
}

function renderBillsFilters() {
  document.querySelectorAll("[data-bill-filter]").forEach((button) => {
    button.classList.toggle("active", (button.dataset.billFilter || "") === activeBillsStatusFilter);
  });
}

function renderBillsTable(bills) {
  el.billsTableBody.innerHTML = bills.length
    ? bills.map(renderBillRow).join("")
    : `<tr><td colspan="7" class="empty-table-cell">Nenhuma conta encontrada para este mês.</td></tr>`;
}

function renderBillRow(bill) {
  const status = billEffectiveStatus(bill);
  const isPaid = status === "Pago";
  const notes = bill.notes ? `<small>${escapeHtml(bill.notes)}</small>` : "";
  return `
    <tr class="bill-row ${billStatusKey(status)}">
      <td><strong>${escapeHtml(bill.description || "Conta sem nome")}</strong>${notes}</td>
      <td>${escapeHtml(bill.category || "Outros")}</td>
      <td>${bill.dueDate ? escapeHtml(formatDate(bill.dueDate)) : "Sem vencimento"}</td>
      <td><strong>${escapeHtml(bill.amount || calculatedCurrency(0))}</strong></td>
      <td><span class="bill-status-pill ${billStatusKey(status)}">${escapeHtml(status)}</span></td>
      <td><span class="bill-recurring-pill ${bill.recurring ? "yes" : "no"}">${bill.recurring ? "Sim" : "Não"}</span></td>
      <td>
        <div class="bill-row-actions">
          <button class="icon-button" type="button" data-edit-bill="${bill.id}" aria-label="Editar conta"><i data-lucide="pencil"></i></button>
          <button class="icon-button" type="button" data-toggle-bill-paid="${bill.id}" aria-label="${isPaid ? "Marcar como a pagar" : "Marcar como paga"}"><i data-lucide="${isPaid ? "rotate-ccw" : "check-circle-2"}"></i></button>
          <button class="icon-button danger-icon" type="button" data-delete-bill="${bill.id}" aria-label="Remover conta"><i data-lucide="trash-2"></i></button>
        </div>
      </td>
    </tr>
  `;
}

function renderBillsCategoryChart(summary) {
  const rows = [...summary.categoryTotals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => b.amount - a.amount);
  if (!rows.length) {
    el.billsCategoryChart.innerHTML = `<p class="empty-state compact">Sem valores cadastrados neste mês.</p>`;
    return;
  }

  const colors = billCategoryColors();
  let cursor = 0;
  const stops = rows.map((row, index) => {
    const start = cursor;
    const size = (row.amount / summary.total) * 100;
    cursor += size;
    return `${colors[index % colors.length]} ${start}% ${cursor}%`;
  });

  el.billsCategoryChart.innerHTML = `
    <div class="bill-donut-wrap">
      <div class="bill-donut" style="--bill-chart:${stops.join(", ")}">
        <span>Total gasto<strong>${escapeHtml(calculatedCurrency(summary.total))}</strong></span>
      </div>
      <div class="bill-category-list">
        ${rows.map((row, index) => renderBillCategoryRow(row, summary.total, colors[index % colors.length])).join("")}
        <div class="bill-category-total"><span>Total</span><strong>${escapeHtml(calculatedCurrency(summary.total))}</strong><span>100%</span></div>
      </div>
    </div>
  `;
}

function renderBillCategoryRow(row, total, color) {
  const percent = total ? (row.amount / total) * 100 : 0;
  return `
    <div class="bill-category-row">
      <span class="bill-category-dot" style="background:${color}"></span>
      <span>${escapeHtml(row.category)}</span>
      <strong>${escapeHtml(calculatedCurrency(row.amount))}</strong>
      <small>${percent.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</small>
    </div>
  `;
}

function bindBillDashboardActions() {
  el.billsTableBody.querySelectorAll("[data-edit-bill]").forEach((button) => {
    button.addEventListener("click", () => openBillDialog(button.dataset.editBill));
  });
  el.billsTableBody.querySelectorAll("[data-toggle-bill-paid]").forEach((button) => {
    button.addEventListener("click", () => toggleBillPaid(button.dataset.toggleBillPaid));
  });
  el.billsTableBody.querySelectorAll("[data-delete-bill]").forEach((button) => {
    button.addEventListener("click", () => deleteBill(button.dataset.deleteBill));
  });
  el.billsAlert.querySelectorAll("[data-show-overdue-bills]").forEach((button) => {
    button.addEventListener("click", () => {
      activeBillsStatusFilter = "overdue";
      renderBillsDashboard();
    });
  });
}

function openBillDialog(billId) {
  if (currentUser?.role !== "admin") return;
  const existing = state.companyBills.find((bill) => bill.id === billId);
  const categories = billCategories();
  const current = normalizeCompanyBill(
    existing || {
      year: activeBillsYear,
      month: activeBillsMonth,
      dueDate: `${activeBillsYear}-${activeBillsMonth}-01`,
      status: "A pagar",
      recurring: true,
    }
  );

  openSimpleDialog(existing ? "Editar conta" : "Adicionar conta", [
    { label: "Conta", name: "description", type: "text", value: current.description },
    { label: "Categoria", name: "category", type: "select", value: current.category, options: categories.map((value) => ({ value, label: value })) },
    { label: "Valor", name: "amount", type: "money", value: current.amount },
    { label: "Vencimento", name: "dueDate", type: "date", value: current.dueDate },
    { label: "Status", name: "status", type: "select", value: current.status, options: BILL_STATUS_OPTIONS.map((value) => ({ value, label: value })) },
    { label: "Data de pagamento", name: "paidAt", type: "date", value: current.paidAt },
    { label: "Recorrente", name: "recurring", type: "select", value: current.recurring ? "Sim" : "Não", options: [{ value: "Sim", label: "Sim" }, { value: "Não", label: "Não" }] },
    { label: "Observação", name: "notes", type: "textarea", rows: 3, value: current.notes },
  ], (values) => {
    const description = values.description.trim();
    const amount = formatFlexibleCurrencyValue(values.amount);
    const dueDate = values.dueDate || "";
    if (!description) {
      alert("Informe o nome da conta.");
      return false;
    }
    if (!amount) {
      alert("Informe o valor da conta.");
      return false;
    }
    if (!dueDate || !dueDate.startsWith(`${BILL_YEAR}-`)) {
      alert("Informe um vencimento dentro de 2026.");
      return false;
    }

    const status = normalizeSelectValue(values.status, BILL_STATUS_OPTIONS) || "A pagar";
    const payload = normalizeCompanyBill({
      ...current,
      description,
      category: normalizeBillCategory(values.category),
      amount,
      dueDate,
      year: BILL_YEAR,
      month: dueDate.slice(5, 7),
      status,
      paidAt: status === "Pago" ? values.paidAt || localDateKey() : "",
      recurring: values.recurring === "Sim",
      notes: values.notes,
      updatedAt: new Date().toISOString(),
    });

    if (existing) {
      Object.assign(existing, payload);
      recordActivity("finance", `Atualizou conta interna: ${payload.description}.`, `${payload.amount} | ${billEffectiveStatus(payload)}`, { visibility: "admin" });
    } else {
      state.companyBills.unshift(payload);
      recordActivity("finance", `Criou conta interna: ${payload.description}.`, `${payload.amount} | ${billEffectiveStatus(payload)}`, { visibility: "admin" });
    }
    activeBillsMonth = payload.month;
    saveState();
    renderBillsDashboard();
    renderUpdates();
    return true;
  }, {
    className: "bill-form-dialog",
    subtitle: "Registre despesas, vencimentos e recorrência mensal.",
    saveLabel: "Salvar",
    saveIcon: "save",
  });
}

function openBillCategoriesDialog() {
  if (currentUser?.role !== "admin") return;
  const currentCategories = billCategories();
  openSimpleDialog("Categorias", [
    {
      label: "Categorias de contas",
      name: "categories",
      type: "textarea",
      rows: 9,
      value: currentCategories.join("\n"),
      placeholder: "Uma categoria por linha",
      span: 2,
    },
  ], (values) => {
    const nextCategories = normalizeBillCategories(String(values.categories || "").split(/\n+/), state.companyBills);
    if (!nextCategories.length) {
      alert("Informe pelo menos uma categoria.");
      return false;
    }
    state.companyBillCategories = nextCategories;
    saveState();
    renderBillsDashboard();
    return true;
  }, {
    className: "bill-form-dialog bill-categories-dialog",
    subtitle: "Edite uma categoria por linha. Categorias já usadas em contas continuam preservadas.",
    saveLabel: "Salvar categorias",
    saveIcon: "save",
  });
}

function toggleBillPaid(billId) {
  const bill = state.companyBills.find((item) => item.id === billId);
  if (!bill || currentUser?.role !== "admin") return;
  const nextPaid = bill.status !== "Pago";
  bill.status = nextPaid ? "Pago" : "A pagar";
  bill.paidAt = nextPaid ? localDateKey() : "";
  bill.updatedAt = new Date().toISOString();
  recordActivity("finance", `${nextPaid ? "Marcou como paga" : "Reabriu"} conta interna: ${bill.description}.`, bill.amount, { visibility: "admin" });
  saveState();
  renderBillsDashboard();
  renderUpdates();
}

function deleteBill(billId) {
  const bill = state.companyBills.find((item) => item.id === billId);
  if (!bill || currentUser?.role !== "admin") return;
  if (!confirm(`Remover a conta "${bill.description}"?`)) return;
  state.companyBills = state.companyBills.filter((item) => item.id !== billId);
  recordActivity("finance", `Removeu conta interna: ${bill.description}.`, bill.amount, { visibility: "admin" });
  saveState();
  renderBillsDashboard();
  renderUpdates();
}

function copyPreviousMonthBills() {
  if (currentUser?.role !== "admin") return;
  const previous = previousBillMonth();
  if (!previous) {
    alert("Janeiro de 2026 não tem mês anterior dentro deste controle.");
    return;
  }

  const sourceBills = state.companyBills.filter((bill) => bill.year === previous.year && bill.month === previous.month);
  if (!sourceBills.length) {
    alert("Não há contas no mês anterior para copiar.");
    return;
  }

  const currentBills = currentMonthBills();
  if (currentBills.length && !confirm("Este mês já tem contas cadastradas. Deseja copiar mesmo assim?")) return;

  const existingKeys = new Set(currentBills.map((bill) => billDuplicateKey(bill)));
  const copies = sourceBills
    .map((bill) => {
      const dueDate = shiftBillDueDate(bill.dueDate, activeBillsYear, activeBillsMonth);
      return normalizeCompanyBill({
        ...bill,
        id: id(),
        year: activeBillsYear,
        month: activeBillsMonth,
        dueDate,
        status: "A pagar",
        paidAt: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    })
    .filter((bill) => !existingKeys.has(billDuplicateKey(bill)));

  if (!copies.length) {
    alert("As contas do mês anterior já parecem estar copiadas para este mês.");
    return;
  }

  state.companyBills.unshift(...copies);
  recordActivity("finance", `Copiou contas internas para ${monthName(activeBillsMonth)}/${activeBillsYear}.`, `${copies.length} conta(s) copiadas.`, { visibility: "admin" });
  saveState();
  renderBillsDashboard();
  renderUpdates();
}

function exportBillsCsv() {
  const bills = filteredCompanyBills(currentMonthBills());
  const rows = [
    ["Conta", "Categoria", "Vencimento", "Valor", "Status", "Recorrente", "Data de pagamento", "Observação"],
    ...bills.map((bill) => [
      bill.description,
      bill.category,
      bill.dueDate ? formatDate(bill.dueDate) : "",
      bill.amount,
      billEffectiveStatus(bill),
      bill.recurring ? "Sim" : "Não",
      bill.paidAt ? formatDate(bill.paidAt) : "",
      bill.notes,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `contas-${activeBillsYear}-${activeBillsMonth}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

function billEffectiveStatus(bill) {
  if (bill.status === "Pago") return "Pago";
  if (bill.dueDate && bill.dueDate < localDateKey()) return "Vencida";
  return "A pagar";
}

function billStatusKey(status) {
  return {
    Pago: "paid",
    "A pagar": "pending",
    Vencida: "overdue",
  }[status] || "pending";
}

function previousBillMonth() {
  const monthNumber = Number(activeBillsMonth);
  if (monthNumber <= 1) return null;
  return { year: activeBillsYear, month: String(monthNumber - 1).padStart(2, "0") };
}

function shiftBillDueDate(dueDate, year, month) {
  const originalDay = Number((dueDate || "").slice(8, 10)) || 1;
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const day = Math.min(originalDay, lastDay);
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

function billDuplicateKey(bill) {
  const dueDay = (bill.dueDate || "").slice(8, 10);
  return normalize([bill.description, bill.category, bill.amount, dueDay].join("|"));
}

function monthName(month) {
  return {
    "01": "Janeiro",
    "02": "Fevereiro",
    "03": "Março",
    "04": "Abril",
    "05": "Maio",
    "06": "Junho",
    "07": "Julho",
    "08": "Agosto",
    "09": "Setembro",
    "10": "Outubro",
    "11": "Novembro",
    "12": "Dezembro",
  }[month] || month;
}

function billCategoryColors() {
  return ["#009f7f", "#5aa9e6", "#f2994a", "#f26b6b", "#8b5cf6", "#c78000", "#64748b", "#14b8a6", "#a3a3a3"];
}

function renderGoalsDashboard() {
  if (!el.goalsSummary) return;
  state.goals = normalizeGoalSettings(state.goals);
  activeGoalsYear = activeGoalsYear || "2026";

  const data = companyGoalsData(activeGoalsYear);
  const settings = goalNumericSettings();
  if (!activeGoalsMonth || !activeGoalsMonth.startsWith(activeGoalsYear)) {
    const current = currentMonthKey();
    activeGoalsMonth = current.startsWith(activeGoalsYear) ? current : `${activeGoalsYear}-01`;
  }
  if (!data.months.some((month) => month.key === activeGoalsMonth)) {
    activeGoalsMonth = data.months[0]?.key || `${activeGoalsYear}-01`;
  }

  const annualTarget = settings.target * 12;
  const annualStretch = settings.stretch * 12;
  const month = data.months.find((item) => item.key === activeGoalsMonth) || data.months[0];

  syncGoalSelectors(data);
  el.goalsSummary.innerHTML = renderGoalsOverview(data, month, settings);
  el.goalsMonthlyGrid.innerHTML = renderGoalsAnnualPanel(data, settings, annualTarget, annualStretch);
  if (el.goalsPerformancePanel) el.goalsPerformancePanel.innerHTML = renderGoalsMonthlyPerformance(data, settings);
  renderGoalContracts(data);
  renderGoalMissingData(data.missingRegularization);
  bindGoalActions();
  refreshIcons();
}

function syncGoalSelectors(data) {
  el.goalsYearSelect.value = activeGoalsYear;
  el.goalsMonthSelect.innerHTML = data.months
    .map((month) => `<option value="${month.key}">${escapeHtml(month.label)}</option>`)
    .join("");
  el.goalsMonthSelect.value = activeGoalsMonth;
}

function shiftGoalMonth(direction) {
  const data = companyGoalsData(activeGoalsYear);
  const currentIndex = data.months.findIndex((month) => month.key === activeGoalsMonth);
  const nextIndex = Math.min(data.months.length - 1, Math.max(0, currentIndex + direction));
  activeGoalsMonth = data.months[nextIndex]?.key || activeGoalsMonth;
  renderGoalsDashboard();
}

function goalPercent(total, target) {
  if (!target) return 0;
  return Math.max(0, (Number(total) || 0) / target * 100);
}

function goalPercentLabel(total, target) {
  return calculatedPercent(goalPercent(total, target));
}

function goalsYearProgress(year) {
  const numericYear = Number(year);
  const now = new Date();
  const currentYear = now.getFullYear();
  const elapsedMonths = numericYear < currentYear ? 12 : numericYear > currentYear ? 0 : now.getMonth() + 1;
  return {
    elapsedMonths,
    percent: Math.round((elapsedMonths / 12) * 100),
  };
}

function renderGoalsOverview(data, month, settings) {
  const monthTotal = month?.total || 0;
  const monthContracts = month?.contracts || [];
  const targetPercent = Math.min(100, Math.round(goalPercent(monthTotal, settings.target)));
  const remainingTarget = Math.max(settings.target - monthTotal, 0);
  const monthTicket = monthContracts.length ? monthTotal / monthContracts.length : 0;
  const feedback = remainingTarget
    ? `Faltam ${calculatedCurrency(remainingTarget)} para atingir a meta mensal.`
    : "Excelente! A meta mensal foi atingida.";

  return `
    <section class="goals-overview-card">
      <div class="goal-month-hero">
        <p class="goals-card-kicker">Meta mensal</p>
        <div class="goal-hero-content">
          <div class="goal-ring" style="--goal-ring:${targetPercent}%">
            <div class="goal-ring-content">
              <strong>${targetPercent}%</strong>
              <span>da meta</span>
            </div>
          </div>
          <div class="goal-main-value">
            <strong>${escapeHtml(calculatedCurrency(monthTotal))}</strong>
            <span>de ${escapeHtml(calculatedCurrency(settings.target))}</span>
            <p><i data-lucide="check-circle-2"></i>${escapeHtml(feedback)}</p>
          </div>
        </div>
      </div>
      <div class="goal-overview-side">
        <div class="goal-overview-metrics">
          ${renderGoalMetric("wallet", "Receita recebida no mês", calculatedCurrency(monthTotal), "")}
          ${renderGoalMetric("flag", "Falta para a meta", calculatedCurrency(remainingTarget), remainingTarget ? "" : "Meta batida")}
          ${renderGoalMetric("users", "Clientes pagos no mês", monthContracts.length, "Contratos pagos")}
          ${renderGoalMetric("banknote", "Ticket médio", calculatedCurrency(monthTicket), "Por contrato")}
        </div>
        <div class="goal-threshold-grid">
          ${renderGoalThresholdCard("Piso mensal", settings.floor, monthTotal, "floor")}
          ${renderGoalThresholdCard("Meta mensal", settings.target, monthTotal, "target")}
          ${renderGoalThresholdCard("Supermeta mensal", settings.stretch, monthTotal, "stretch")}
        </div>
      </div>
    </section>
  `;
}

function renderGoalMetric(icon, label, value, hint) {
  return `
    <article class="goal-overview-metric">
      <i data-lucide="${icon}"></i>
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(String(value))}</strong>
      ${hint ? `<small>${escapeHtml(hint)}</small>` : ""}
    </article>
  `;
}

function renderGoalThresholdCard(label, amount, total, tone) {
  const percent = Math.min(100, Math.round(goalPercent(total, amount)));
  return `
    <article class="goal-threshold-card ${tone}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(calculatedCurrency(amount))}</strong>
      <small>${escapeHtml(goalPercentLabel(total, amount))} alcançado</small>
      <div class="goal-mini-track"><i style="width:${percent}%"></i></div>
    </article>
  `;
}

function renderGoalsAnnualPanel(data, settings, annualTarget, annualStretch) {
  const annualFloor = settings.floor * 12;
  const targetProgress = Math.min(100, Math.round(goalPercent(data.total, annualStretch)));
  const yearProgress = goalsYearProgress(activeGoalsYear);
  return `
    <section class="goal-annual-panel">
      <div class="goal-annual-main">
        <p class="goals-card-kicker"><i data-lucide="target"></i> Meta anual</p>
        <div class="goal-annual-total">
          <strong>${escapeHtml(calculatedCurrency(data.total))}</strong>
          <span>de ${escapeHtml(calculatedCurrency(annualTarget))}</span>
        </div>
        <div class="goal-annual-track">
          <span style="width:${targetProgress}%"></span>
          <i class="floor" style="left:${Math.min(100, Math.round(goalPercent(annualFloor, annualStretch)))}%"></i>
          <i class="target" style="left:${Math.min(100, Math.round(goalPercent(annualTarget, annualStretch)))}%"></i>
          <i class="stretch" style="left:100%"></i>
        </div>
        <div class="goal-annual-labels">
          <span>Piso anual<br><strong>${escapeHtml(calculatedCurrency(annualFloor))}</strong></span>
          <span>Meta anual<br><strong>${escapeHtml(calculatedCurrency(annualTarget))}</strong></span>
          <span>Supermeta anual<br><strong>${escapeHtml(calculatedCurrency(annualStretch))}</strong></span>
        </div>
      </div>
      <div class="goal-year-progress">
        <strong>${yearProgress.percent}% do ano concluído</strong>
        <span>${yearProgress.elapsedMonths} de 12 meses</span>
      </div>
      <div class="goal-annual-thresholds">
        ${renderGoalThresholdCard("Piso anual", annualFloor, data.total, "floor")}
        ${renderGoalThresholdCard("Meta anual", annualTarget, data.total, "target")}
        ${renderGoalThresholdCard("Supermeta anual", annualStretch, data.total, "stretch")}
      </div>
    </section>
  `;
}

function renderGoalsMonthlyPerformance(data, settings) {
  const maxTotal = Math.max(settings.stretch, ...data.months.map((month) => month.total), 1);
  return `
    <section class="goal-performance-panel">
      <div class="mini-heading">
        <h3>Desempenho mensal - ${escapeHtml(activeGoalsYear)}</h3>
        <span>Meta mensal: ${escapeHtml(calculatedCurrency(settings.target))}</span>
      </div>
      <div class="goal-month-bars">
        ${data.months
          .map((month) => {
            const height = Math.max(6, Math.round((month.total / maxTotal) * 100));
            return `
              <button class="goal-month-bar-button ${month.key === activeGoalsMonth ? "active" : ""}" type="button" data-goal-month="${month.key}">
                <strong>${escapeHtml(formatCompactCurrency(month.total))}</strong>
                <span class="goal-month-bar" style="--bar-height:${height}%"><i></i></span>
                <small>${escapeHtml(month.label.slice(0, 3))}</small>
              </button>
            `;
          })
          .join("")}
      </div>
      <p class="goal-panel-hint"><i data-lucide="info"></i> Clique em um mês para visualizar os contratos correspondentes.</p>
    </section>
  `;
}

function renderGoalContracts(data) {
  const month = data.months.find((item) => item.key === activeGoalsMonth) || data.months[0];
  if (!month) return;
  el.goalsContractsTitle.textContent = `Contratos pagos em ${month.label}`;
  el.goalsContractsList.innerHTML = month.contracts.length
    ? [
        ...month.contracts.map(
          (contract) => `
            <article class="goal-contract-row">
              <div>
                <strong>${escapeHtml(contract.clientName || "Cliente sem nome")}</strong>
                <span>${escapeHtml(contract.source)} | ${formatDate(contract.contractClosedDate)}</span>
              </div>
              <div>
                <span>${escapeHtml([contract.origin, contract.financeStatus].filter(Boolean).join(" | ") || "Sem detalhe")}</span>
                <strong>${escapeHtml(calculatedCurrency(contract.amount))}</strong>
              </div>
              ${
                contract.sourceType === "client"
                  ? `<button class="small-button" type="button" data-open-goal-client="${contract.id}"><i data-lucide="external-link"></i> Abrir</button>`
                  : `<button class="small-button" type="button" data-edit-regularization="${contract.id}"><i data-lucide="pencil"></i> Editar</button>`
              }
            </article>
          `
        ),
        `<footer class="goal-contract-total"><span>Total realizado em ${escapeHtml(month.label)}</span><strong>${escapeHtml(calculatedCurrency(month.total))}</strong></footer>`,
      ].join("")
    : `<p class="empty-state compact">Nenhum contrato fechado neste mês.</p>`;
}

function renderGoalMissingData(items) {
  if (!el.goalsMissingData) return;
  el.goalsMissingData.hidden = !items.length;
  el.goalsMissingData.innerHTML = items.length
    ? `
      <section class="goals-missing-card">
        <strong>Dados pendentes para a meta</strong>
        <div class="goals-missing-items">
          ${items
            .map(
              (process) => `
                <article class="goal-contract-row missing">
                  <div>
                    <strong>${escapeHtml(process.clientName || "Cliente sem nome")}</strong>
                    <span>${escapeHtml(goalMissingRegularizationLabel(process))}</span>
                  </div>
                  <button class="small-button" type="button" data-edit-regularization="${process.id}"><i data-lucide="pencil"></i> Preencher</button>
                </article>
              `
            )
            .join("")}
        </div>
      </section>
    `
    : "";
}

function bindGoalActions() {
  document.querySelectorAll("[data-goal-month]").forEach((button) => {
    button.onclick = () => {
      activeGoalsMonth = button.dataset.goalMonth;
      renderGoalsDashboard();
    };
  });
  document.querySelectorAll("[data-open-goal-client]").forEach((button) => {
    button.onclick = () => openClientById(button.dataset.openGoalClient);
  });
  document.querySelectorAll("#goalsSection [data-edit-regularization]").forEach((button) => {
    button.onclick = () => openRegularizationDialog(button.dataset.editRegularization);
  });
}

function openGoalsDialog() {
  if (currentUser.role !== "admin") return;
  state.goals = normalizeGoalSettings(state.goals);
  openSimpleDialog("Editar metas", [
    { label: "Piso mensal", name: "floor", type: "text", value: state.goals.floor },
    { label: "Meta mensal", name: "target", type: "text", value: state.goals.target },
    { label: "Supermeta mensal", name: "stretch", type: "text", value: state.goals.stretch },
  ], (values) => {
    const next = normalizeGoalSettings(values);
    if (currencyAmount(next.floor) <= 0 || currencyAmount(next.target) <= 0 || currencyAmount(next.stretch) <= 0) {
      alert("Informe valores maiores que zero para as metas.");
      return false;
    }
    if (currencyAmount(next.floor) > currencyAmount(next.target) || currencyAmount(next.target) > currencyAmount(next.stretch)) {
      alert("Use a ordem Piso menor que Meta menor que Supermeta.");
      return false;
    }
    state.goals = next;
    saveState();
    renderGoalsDashboard();
  });
}

function companyGoalsData(year) {
  const contracts = goalContracts().filter((contract) => contract.contractClosedDate?.startsWith(`${year}-`));
  const months = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index + 1).padStart(2, "0")}`;
    const monthContracts = contracts.filter((contract) => contract.contractClosedDate?.startsWith(key));
    return {
      key,
      label: goalMonthName(key),
      contracts: monthContracts,
      total: monthContracts.reduce((sum, contract) => sum + contract.amount, 0),
    };
  });
  return {
    contracts,
    months,
    total: contracts.reduce((sum, contract) => sum + contract.amount, 0),
    missingRegularization: state.regularizationClients.filter((process) => !process.contractClosedDate || currencyAmount(process.feeValue) === null),
  };
}

function goalContracts() {
  const clientContracts = state.clients
    .map((client) => ({
      id: client.id,
      source: "INSS de obras",
      sourceType: "client",
      clientName: client.clientName,
      contractClosedDate: client.contractClosedDate,
      amount: currencyAmount(client.feeValue),
      origin: client.clientOrigin,
      ownerId: client.internalOwner,
      financeStatus: client.financeStatus,
    }))
    .filter((contract) => contract.contractClosedDate && contract.amount !== null);

  const regularizationContracts = state.regularizationClients
    .map((process) => ({
      id: process.id,
      source: "Regularização",
      sourceType: "regularization",
      clientName: process.clientName,
      contractClosedDate: process.contractClosedDate,
      amount: currencyAmount(process.feeValue),
      origin: process.clientOrigin,
      ownerId: "",
      financeStatus: process.status,
    }))
    .filter((contract) => contract.contractClosedDate && contract.amount !== null);

  return [...clientContracts, ...regularizationContracts].sort((a, b) => a.contractClosedDate.localeCompare(b.contractClosedDate));
}

function goalNumericSettings() {
  state.goals = normalizeGoalSettings(state.goals);
  return {
    floor: currencyAmount(state.goals.floor) || 15000,
    target: currencyAmount(state.goals.target) || 20000,
    stretch: currencyAmount(state.goals.stretch) || 25000,
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
  if (total >= settings.target) return `Meta batida | faltam ${calculatedCurrency(settings.stretch - total)} para a supermeta`;
  if (total >= settings.floor) return `Piso batido | faltam ${calculatedCurrency(settings.target - total)} para a meta`;
  return `Faltam ${calculatedCurrency(settings.floor - total)} para o piso`;
}

function goalLevelLabel(total, target, stretch) {
  if (total >= stretch) return "Supermeta anual batida";
  if (total >= target) return "Meta anual batida";
  return "Em andamento";
}

function goalMonthName(monthKey) {
  const parts = String(monthKey || "").split("-");
  const month = parts.length > 1 ? parts[1] : parts[0];
  return monthName(String(month || "").padStart(2, "0"));
}

function goalMissingRegularizationLabel(process = {}) {
  const missing = [];
  if (!process.contractClosedDate) missing.push("mês de fechamento");
  if (currencyAmount(process.feeValue) === null) missing.push("valor dos honorários");
  return `Falta ${missing.join(" e ")}`;
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function renderTaskCenter() {
  renderTaskOwnerFilter();
  renderTaskClientFilter();
  renderTaskQuickFilters();
  const items = taskCenterItems();
  const filtered = filterTaskCenterItems(items);
  renderTaskOverview(filtered);
  renderTaskPeriodControls();

  renderTaskCalendar(filtered);
  bindTaskCenterActions();
  renderTaskNavSignals();
  refreshIcons();
}

function renderTaskNavSignals() {
  if (!currentUser || !el.tasksTodayBadge || !el.tasksNewBadge) return;
  const todayItems = taskCenterItems().filter(
    (item) => item.urgency === "today" && taskSignalOwner(item.ownerId) && (item.kind.includes("Tarefa") || item.kind === "Prazo")
  );
  const newTaskActivities = unreadNewTaskActivities();

  setTaskNavBadge(el.tasksTodayBadge, todayItems.length, `${todayItems.length} tarefa(s) ou prazo(s) para hoje`);
  setTaskNavBadge(el.tasksNewBadge, newTaskActivities.length, `${newTaskActivities.length} nova(s) tarefa(s)`);
}

function setTaskNavBadge(badge, count, title) {
  badge.hidden = !count;
  badge.textContent = count > 99 ? "99+" : String(count);
  badge.title = title;
}

function taskSignalOwner(ownerId) {
  return ownerId === fixedUserIds.mayssa || ownerId === fixedUserIds.contato;
}

function unreadNewTaskActivities() {
  return visibleActivitiesForCurrentUser().filter((activity) => !activityIsRead(activity) && isNewTaskActivity(activity));
}

function isNewTaskActivity(activity) {
  return activity.type === "task" && normalize(activity.title).startsWith("criou tarefa");
}

function renderUpdates() {
  if (!currentUser || !el.updatesList) return;
  renderUpdatesUserFilter();
  renderUpdatesImportantFilter();
  const visibleActivities = visibleActivitiesForCurrentUser();
  const unreadCount = visibleActivities.filter((activity) => !activityIsRead(activity)).length;
  el.updatesUnreadBadge.hidden = !unreadCount;
  el.updatesUnreadBadge.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
  renderUpdatesSummary(visibleActivities);

  const query = normalize(el.updatesSearchInput.value);
  const readFilter = el.updatesReadFilter.value;
  const periodFilter = el.updatesPeriodFilter.value;
  const actorId = el.updatesUserFilter.value;
  const type = el.updatesTypeFilter.value;
  const activities = visibleActivities
    .filter((activity) => {
      const displayType = activityDisplayType(activity);
      const haystack = normalize([
        activity.title,
        activity.detail,
        activity.clientName,
        ownerName(activity.actorId),
        ownerName(activity.ownerId),
        activityTypeLabel(displayType),
      ].join(" "));
      return (
        (!query || haystack.includes(query)) &&
        (!readFilter || !activityIsRead(activity)) &&
        matchesActivityPeriod(activity, periodFilter) &&
        (!actorId || activity.actorId === actorId) &&
        (!type || displayType === type) &&
        (!updatesImportantOnly || priorityActivityTypes().includes(displayType))
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  el.updatesList.innerHTML = activities.length
    ? groupedActivitiesByDay(activities)
        .map(([day, dayActivities]) => updateDayGroup(day, dayActivities))
        .join("")
    : `<p class="empty-state">Nenhuma atualização encontrada.</p>`;
  renderUpdatesAside(visibleActivities, activities);

  document.querySelectorAll("[data-open-update-client]").forEach((button) => {
    button.addEventListener("click", () => {
      markActivityRead(button.dataset.activityId, false);
      openLinkedClientRecord(button.dataset.openUpdateClient, button.dataset.clientSource || "inss");
      renderUpdates();
    });
  });
  document.querySelectorAll("[data-mark-activity-read]").forEach((button) => {
    button.addEventListener("click", () => markActivityRead(button.dataset.markActivityRead));
  });
  document.querySelectorAll("[data-toggle-update-details]").forEach((button) => {
    button.addEventListener("click", () => {
      const activityId = button.dataset.toggleUpdateDetails;
      if (expandedUpdateIds.has(activityId)) expandedUpdateIds.delete(activityId);
      else expandedUpdateIds.add(activityId);
      renderUpdates();
    });
  });
  document.querySelectorAll("[data-toggle-update-day]").forEach((button) => {
    button.addEventListener("click", () => {
      const day = button.dataset.toggleUpdateDay;
      if (collapsedUpdateDays.has(day)) collapsedUpdateDays.delete(day);
      else collapsedUpdateDays.add(day);
      renderUpdates();
    });
  });
  document.querySelectorAll("[data-show-important-updates]").forEach((button) => {
    button.addEventListener("click", () => {
      updatesImportantOnly = true;
      renderUpdates();
    });
  });
  refreshIcons();
}

function renderUpdatesSummary(activities) {
  if (!el.updatesSummary) return;
  const stats = [
    { label: "Não lidas", value: activities.filter((activity) => !activityIsRead(activity)).length, type: "unread", icon: "mail" },
    { label: "Hoje", value: activities.filter((activity) => matchesActivityPeriod(activity, "today")).length, type: "today", icon: "calendar-days" },
    {
      label: "Tarefas e prazos",
      value: activities.filter((activity) => ["task", "deadline"].includes(activityDisplayType(activity))).length,
      type: "task",
      icon: "clock-3",
    },
    { label: "Mensal", value: activities.filter((activity) => activityDisplayType(activity) === "monthly").length, type: "monthly", icon: "bar-chart-3" },
  ];

  el.updatesSummary.innerHTML = stats
    .map(
      (stat) => `
        <article class="updates-summary-card ${stat.type}">
          <span class="updates-summary-icon"><i data-lucide="${stat.icon}"></i></span>
          <div>
            <span>${stat.label}</span>
            <strong>${stat.value}</strong>
          </div>
        </article>
      `
    )
    .join("");
}

function renderUpdatesAside(allActivities, filteredActivities) {
  if (!el.updatesAside) return;
  const todayActivities = allActivities.filter((activity) => matchesActivityPeriod(activity, "today"));
  const todayCountLabel = `${todayActivities.length} ${todayActivities.length === 1 ? "atualização" : "atualizações"}`;
  const todayRows = [
    {
      label: "Anotações",
      hint: "Registros feitos hoje",
      icon: "message-square",
      type: "note",
      value: todayActivities.filter((activity) => activityDisplayType(activity) === "note").length,
    },
    {
      label: "Tarefas e prazos",
      hint: "Pendências movimentadas",
      icon: "calendar-check",
      type: "task",
      value: todayActivities.filter((activity) => ["task", "deadline"].includes(activityDisplayType(activity))).length,
    },
    {
      label: "Mensal",
      hint: "Acompanhamentos mensais",
      icon: "calendar-days",
      type: "monthly",
      value: todayActivities.filter((activity) => activityDisplayType(activity) === "monthly").length,
    },
  ];
  const importantActivities = allActivities
    .filter((activity) => priorityActivityTypes().includes(activityDisplayType(activity)))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  el.updatesAside.innerHTML = `
    <section class="updates-side-card">
      <header>
        <div>
          <p>Resumo do dia</p>
          <h3>Hoje</h3>
        </div>
        <span>${todayCountLabel}</span>
      </header>
      <div class="updates-side-list">
        ${todayRows.map(renderUpdatesSideRow).join("")}
      </div>
    </section>
    <section class="updates-side-card">
      <header>
        <div>
          <p>Prioridade</p>
          <h3>Importantes</h3>
        </div>
        <i data-lucide="star"></i>
      </header>
      <div class="updates-important-list">
        ${
          importantActivities.length
            ? importantActivities.map(renderUpdatesImportantItem).join("")
            : `<p class="updates-side-empty">Nenhuma atualização importante no momento.</p>`
        }
      </div>
      <p class="updates-important-criteria">Critério: anotações, tarefas, prazos e acompanhamento mensal.</p>
      <button class="updates-aside-link" type="button" data-show-important-updates>
        Ver todas as importantes
      </button>
    </section>
    <p class="updates-aside-note">Exibindo ${filteredActivities.length} de ${allActivities.length} atualizações visíveis.</p>
  `;
}

function renderUpdatesSideRow(row) {
  return `
    <div class="updates-side-row update-type-${row.type}">
      <span class="updates-side-icon"><i data-lucide="${row.icon}"></i></span>
      <div>
        <span>${escapeHtml(row.label)}</span>
        <small>${escapeHtml(row.hint)}</small>
      </div>
      <strong>${row.value}</strong>
    </div>
  `;
}

function renderUpdatesImportantItem(activity) {
  const displayType = activityDisplayType(activity);
  const title = activity.clientName || activity.title || "Atualização";
  const meta = `${activityTypeLabel(displayType)} • ${activityActorLabel(activity, displayType)} • ${activityTimeLabel(activity.createdAt)}`;
  const content = `
    <span class="updates-important-dot" aria-hidden="true"></span>
    <span>
      <strong>${escapeHtml(title)}</strong>
      <small>${escapeHtml(meta)}</small>
    </span>
  `;
  if (activity.clientId) {
    return `
      <button class="updates-important-item update-type-${displayType}" type="button" data-open-update-client="${escapeAttr(activity.clientId)}" data-client-source="${escapeAttr(activity.clientSource || "inss")}" data-activity-id="${escapeAttr(activity.id)}">
        ${content}
      </button>
    `;
  }
  return `<div class="updates-important-item update-type-${displayType}">${content}</div>`;
}

function renderUpdatesUserFilter() {
  const selected = el.updatesUserFilter.value;
  el.updatesUserFilter.innerHTML = `<option value="">Todos os usuários</option>${state.users
    .map((user) => `<option value="${user.id}">${escapeHtml(user.name)}</option>`)
    .join("")}`;
  el.updatesUserFilter.value = selected;
}

function renderUpdatesImportantFilter() {
  if (!el.updatesImportantFilterButton) return;
  el.updatesImportantFilterButton.classList.toggle("active", updatesImportantOnly);
  el.updatesImportantFilterButton.setAttribute("aria-pressed", String(updatesImportantOnly));
}

function visibleActivitiesForCurrentUser() {
  return (state.activities || []).filter((activity) => activity.visibility !== "admin" || currentUser.role === "admin");
}

function activityIsRead(activity) {
  return (activity.readBy || []).includes(currentUser.id);
}

function markActivityRead(activityId, shouldRender = true) {
  const activity = state.activities.find((item) => item.id === activityId);
  if (!activity || activityIsRead(activity)) return;
  activity.readBy = [...new Set([...(activity.readBy || []), currentUser.id])];
  saveState();
  if (!shouldRender) return;
  renderTaskNavSignals();
  renderUpdates();
}

function markAllActivitiesRead() {
  visibleActivitiesForCurrentUser().forEach((activity) => {
    activity.readBy = [...new Set([...(activity.readBy || []), currentUser.id])];
  });
  saveState();
  renderTaskNavSignals();
  renderUpdates();
}

function guidanceStages() {
  return ["Cliente", "Documentos", "Mensal", "Guia", "CND", "Receita", "Financeiro", "Engenharia", "Regularização", "Outro"];
}

function guidanceStatusValues() {
  return ["Publicada", "Rascunho", "Arquivada"];
}

function renderGuidance() {
  if (!currentUser || !el.guidanceLibrary) return;
  renderGuidanceStageFilter();
  renderGuidanceStatusFilter();
  renderGuidancePendingPanel();
  renderGuidanceLibrary();
}

function renderGuidanceStageFilter() {
  const selected = el.guidanceStageFilter.value;
  el.guidanceStageFilter.innerHTML = `<option value="">Todas as etapas</option>${guidanceStages()
    .map((stage) => `<option value="${escapeAttr(stage)}">${escapeHtml(stage)}</option>`)
    .join("")}`;
  el.guidanceStageFilter.value = selected;
}

function renderGuidanceStatusFilter() {
  const selected = el.guidanceStatusFilter.value;
  el.guidanceStatusFilter.hidden = currentUser.role !== "admin";
  el.guidanceStatusFilter.parentElement?.classList.toggle("has-status-filter", currentUser.role === "admin");
  el.guidanceStatusFilter.innerHTML = `<option value="">Ativas</option>${guidanceStatusValues()
    .map((status) => `<option value="${escapeAttr(status)}">${escapeHtml(status)}</option>`)
    .join("")}`;
  el.guidanceStatusFilter.value = ["", ...guidanceStatusValues()].includes(selected) ? selected : "";
}

function renderGuidancePendingPanel() {
  const pending = guidancePendingQuestions();
  const allPending = (state.guidanceQuestions || []).filter((question) => question.status === "Pendente");
  const mismatchPending = allPending.filter((question) => question.rejectedGuidanceId).length;
  const topGuidance = mostUsedGuidanceItem();
  const topRejectedGuidance = mostRejectedGuidanceItem();
  if (!pending.length) {
    el.guidancePendingPanel.innerHTML =
      currentUser.role === "admin"
        ? `
          <div class="guidance-insights">
            ${guidanceInsight("Pendentes", allPending.length)}
            ${guidanceInsight("Não era isso", mismatchPending)}
            ${guidanceInsight("Mais consultada", topGuidance ? `${topGuidance.title} (${topGuidance.usageCount})` : "Sem consultas")}
            ${guidanceInsight("Mais rejeitada", topRejectedGuidance ? `${topRejectedGuidance.title} (${topRejectedGuidance.mismatchCount})` : "Sem rejeições")}
          </div>
          <p class="empty-state compact">Nenhuma dúvida pendente de orientação.</p>
        `
        : "";
    return;
  }

  el.guidancePendingPanel.innerHTML = `
    ${
      currentUser.role === "admin"
        ? `<div class="guidance-insights">
            ${guidanceInsight("Pendentes", allPending.length)}
            ${guidanceInsight("Não era isso", mismatchPending)}
            ${guidanceInsight("Mais consultada", topGuidance ? `${topGuidance.title} (${topGuidance.usageCount})` : "Sem consultas")}
            ${guidanceInsight("Mais rejeitada", topRejectedGuidance ? `${topRejectedGuidance.title} (${topRejectedGuidance.mismatchCount})` : "Sem rejeições")}
          </div>`
        : ""
    }
    <div class="guidance-panel-heading">
      <div>
        <p class="eyebrow">Pendentes de orientação</p>
        <h3>${pending.length} dúvida${pending.length > 1 ? "s" : ""} para transformar em conduta</h3>
      </div>
    </div>
    <div class="guidance-pending-list">
      ${pending.map(renderPendingGuidanceQuestion).join("")}
    </div>
  `;

  document.querySelectorAll("[data-create-guidance-from-question]").forEach((button) => {
    bindGuidanceButton(button, () => openGuidanceDialog(null, button.dataset.createGuidanceFromQuestion));
  });
  document.querySelectorAll("[data-dismiss-guidance-question]").forEach((button) => {
    bindGuidanceButton(button, () => dismissGuidanceQuestion(button.dataset.dismissGuidanceQuestion));
  });
  document.querySelectorAll("[data-attach-guidance-question]").forEach((button) => {
    bindGuidanceButton(button, () => openAttachGuidanceQuestionDialog(button.dataset.attachGuidanceQuestion));
  });
  refreshIcons();
}

function guidanceInsight(label, value) {
  return `<article class="guidance-insight"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
}

function mostUsedGuidanceItem() {
  return [...(state.guidanceItems || [])]
    .filter((item) => item.usageCount > 0)
    .sort((a, b) => b.usageCount - a.usageCount)[0];
}

function mostRejectedGuidanceItem() {
  return [...(state.guidanceItems || [])]
    .filter((item) => item.mismatchCount > 0)
    .sort((a, b) => b.mismatchCount - a.mismatchCount)[0];
}

function renderPendingGuidanceQuestion(question) {
  const canManage = currentUser.role === "admin";
  const rejectedGuidance = question.rejectedGuidanceId ? state.guidanceItems.find((item) => item.id === question.rejectedGuidanceId) : null;
  return `
    <article class="guidance-pending-item">
      <div>
        <div class="guidance-meta">
          <span>${escapeHtml(question.stage || "Sem etapa")}</span>
          <span>${escapeHtml(ownerName(question.askedBy))}</span>
          <span>${formatDateTime(question.createdAt)}</span>
        </div>
        <h4>${escapeHtml(question.question)}</h4>
        ${question.clientName ? `<p>Cliente: ${escapeHtml(question.clientName)}</p>` : ""}
        ${rejectedGuidance ? `<p>Não encontrou resposta em: ${escapeHtml(rejectedGuidance.title)}</p>` : ""}
      </div>
      ${
        canManage
          ? `<div class="inline-actions">
              <button class="small-button" type="button" data-create-guidance-from-question="${question.id}"><i data-lucide="plus"></i> Criar orientação</button>
              <button class="small-button" type="button" data-attach-guidance-question="${question.id}"><i data-lucide="link"></i> Adicionar a existente</button>
              <button class="small-button" type="button" data-dismiss-guidance-question="${question.id}"><i data-lucide="check"></i> Resolver sem orientação</button>
            </div>`
          : `<span class="guidance-status">Pendente</span>`
      }
    </article>
  `;
}

function renderGuidanceLibrary() {
  const query = normalize(el.guidanceSearchInput.value);
  const stage = el.guidanceStageFilter.value;
  const statusFilter = currentUser.role === "admin" ? el.guidanceStatusFilter.value : "Publicada";
  const baseForLibrary = guidanceLibraryBaseItems(statusFilter);
  const rankedMatches = query ? guidanceMatches(query, baseForLibrary).filter((match) => match.score >= 8) : [];
  const scoreByGuidanceId = new Map(rankedMatches.map((match) => [match.item.id, match.score]));
  const baseItems = query
    ? rankedMatches.map((match) => match.item)
    : baseForLibrary;
  const items = baseItems
    .filter((item) => !stage || item.stage === stage)
    .sort((a, b) =>
      query
        ? (scoreByGuidanceId.get(b.id) || 0) - (scoreByGuidanceId.get(a.id) || 0)
        : Number(Boolean(b.important)) - Number(Boolean(a.important)) || new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
    );

  el.guidanceLibrary.innerHTML = items.length
    ? items.map(renderGuidanceCard).join("")
    : `<p class="empty-state">Nenhuma orientação cadastrada.</p>`;

  bindGuidanceActions(el.guidanceLibrary);
  refreshIcons();
}

function guidanceLibraryBaseItems(statusFilter = "") {
  const items = currentUser.role === "admin" ? state.guidanceItems : state.guidanceItems.filter((item) => item.status === "Publicada");
  if (currentUser.role !== "admin") return items;
  if (statusFilter) return items.filter((item) => item.status === statusFilter);
  return items.filter((item) => item.status !== "Arquivada");
}

function loadCollapsedGuidanceIds() {
  try {
    const storedIds = JSON.parse(localStorage.getItem(GUIDANCE_COLLAPSE_KEY) || "[]");
    return Array.isArray(storedIds) ? storedIds.filter(Boolean) : [];
  } catch {
    return [];
  }
}

function saveCollapsedGuidanceIds() {
  localStorage.setItem(GUIDANCE_COLLAPSE_KEY, JSON.stringify([...collapsedGuidanceIds]));
}

function toggleGuidanceCollapse(guidanceId) {
  if (!guidanceId) return;
  if (collapsedGuidanceIds.has(guidanceId)) {
    collapsedGuidanceIds.delete(guidanceId);
  } else {
    collapsedGuidanceIds.add(guidanceId);
  }
  saveCollapsedGuidanceIds();
  renderGuidanceLibrary();
}

function renderGuidanceCard(item, options = {}) {
  const canManage = currentUser.role === "admin";
  const collapsible = options.collapsible !== false;
  const collapsed = collapsible && collapsedGuidanceIds.has(item.id);
  const headerActions = [
    collapsible
      ? `<button class="small-button guidance-collapse-button" type="button" data-toggle-guidance="${item.id}"><i data-lucide="${collapsed ? "chevron-down" : "chevron-up"}"></i> ${collapsed ? "Expandir" : "Minimizar"}</button>`
      : "",
    canManage && !collapsed
      ? `<button class="small-button" type="button" data-edit-guidance="${item.id}"><i data-lucide="pencil"></i> Editar</button>`
      : "",
    canManage && !collapsed
      ? item.status === "Arquivada"
        ? `<button class="small-button" type="button" data-restore-guidance="${item.id}"><i data-lucide="rotate-ccw"></i> Restaurar</button>`
        : `<button class="small-button" type="button" data-archive-guidance="${item.id}"><i data-lucide="archive"></i> Arquivar</button>`
      : "",
  ].filter(Boolean).join("");

  return `
    <article class="guidance-card ${item.important ? "important" : ""} ${collapsed ? "collapsed" : ""} status-${normalize(item.status)}">
      <header>
        <div>
          ${
            collapsed
              ? ""
              : `<div class="guidance-meta">
                  <span>${escapeHtml(item.stage || "Sem etapa")}</span>
                  <span class="guidance-status-chip status-${normalize(item.status)}">${escapeHtml(item.status)}</span>
                  ${item.important ? `<span>Importante</span>` : ""}
                </div>`
          }
          <h3>${escapeHtml(item.title || "Orientação sem título")}</h3>
        </div>
        ${headerActions ? `<div class="inline-actions guidance-card-actions">${headerActions}</div>` : ""}
      </header>
      <div class="guidance-card-body">
        <section>
          <strong>Situação</strong>
          <p>${escapeHtml(item.situation || "Não informado.")}</p>
        </section>
        <section>
          <strong>Conduta</strong>
          <p>${escapeHtml(item.conduct || "Não informado.")}</p>
        </section>
        <section>
          <strong>Quando chamar Mayssa</strong>
          <p>${escapeHtml(item.whenCallMayssa || "Não informado.")}</p>
        </section>
        <section>
          <strong>Não usar quando</strong>
          <p>${escapeHtml(item.notUseWhen || "Não informado.")}</p>
        </section>
      </div>
      ${item.examples ? `<p class="guidance-keywords"><strong>Exemplos:</strong> ${escapeHtml(item.examples)}</p>` : ""}
      ${item.keywords ? `<p class="guidance-keywords"><strong>Termos:</strong> ${escapeHtml(item.keywords)}</p>` : ""}
      <footer class="guidance-card-footer">
        <span>${item.usageCount || 0} consulta(s)</span>
        <span>${item.mismatchCount || 0} rejeição(ões)</span>
        <span>${(item.versions || []).length} versão(ões)</span>
      </footer>
    </article>
  `;
}

function answerGuidanceQuestion() {
  const question = el.guidanceQuestionInput.value.trim();
  if (!question) {
    el.guidanceAnswer.innerHTML = `<p class="empty-state compact">Digite uma dúvida para buscar nas orientações.</p>`;
    return;
  }

  const matches = guidanceMatches(question);
  const candidates = matches.filter((match) => match.score >= 10).slice(0, 3);
  el.guidanceAnswer.dataset.currentQuestion = question;
  if (!candidates.length) {
    el.guidanceAnswer.innerHTML = guidanceNoAnswerTemplate();
    bindGuidanceNoAnswerButton(question);
    refreshIcons();
    return;
  }
  registerGuidanceUsage(candidates[0].item.id);

  el.guidanceAnswer.innerHTML = `
    <div class="guidance-results">
      ${candidates.map((match, index) => renderGuidanceMatch(match, index)).join("")}
    </div>
  `;
  bindGuidanceActions(el.guidanceAnswer);
  refreshIcons();
}

function registerGuidanceUsage(guidanceId) {
  const guidance = state.guidanceItems.find((item) => item.id === guidanceId);
  if (!guidance) return;
  guidance.usageCount = (guidance.usageCount || 0) + 1;
  guidance.updatedAt = guidance.updatedAt || new Date().toISOString();
  saveState();
}

function renderGuidanceMatch(match, index) {
  const item = match.item;
  const confidenceClass = guidanceConfidenceClass(match.score);
  return `
    <article class="guidance-answer-card ${index === 0 ? "best" : ""} ${confidenceClass}">
      <div class="guidance-answer-top">
        <span>${index === 0 ? "Melhor orientação encontrada" : "Orientação parecida"}</span>
        <strong>${guidanceConfidenceLabel(match.score)}</strong>
      </div>
      ${confidenceClass === "confidence-low" ? `<p class="guidance-match-note">Correspondência baixa. Confira com cuidado; se não for isso, registre como pendência.</p>` : ""}
      ${renderGuidanceCard(item, { collapsible: false })}
      <div class="guidance-result-actions">
        <button class="small-button" type="button" data-register-guidance-mismatch="${item.id}"><i data-lucide="message-circle-question"></i> Não era isso</button>
      </div>
    </article>
  `;
}

function guidanceNoAnswerTemplate() {
  return `
    <article class="guidance-no-answer">
      <h3>Nenhuma orientação segura encontrada.</h3>
      <p>Registre essa dúvida como pendente para a Mayssa transformar em orientação depois.</p>
      <div class="guidance-mini-form">
        <select id="pendingGuidanceStage">
          <option value="">Etapa, se souber</option>
          ${guidanceStages().map((stage) => `<option value="${escapeAttr(stage)}">${escapeHtml(stage)}</option>`).join("")}
        </select>
        <input id="pendingGuidanceClient" type="text" placeholder="Cliente relacionado, se houver" />
        <button id="savePendingGuidanceButton" class="primary-button" type="button"><i data-lucide="send"></i> Registrar pendência</button>
      </div>
    </article>
  `;
}

function bindGuidanceNoAnswerButton(question) {
  const button = document.getElementById("savePendingGuidanceButton");
  if (!button) return;
  bindGuidanceButton(button, () => savePendingGuidanceQuestion(question));
}

function bindGuidanceActions(scope = document) {
  scope.querySelectorAll("[data-toggle-guidance]").forEach((button) => {
    bindGuidanceButton(button, () => toggleGuidanceCollapse(button.dataset.toggleGuidance));
  });
  scope.querySelectorAll("[data-edit-guidance]").forEach((button) => {
    bindGuidanceButton(button, () => openGuidanceDialog(button.dataset.editGuidance));
  });
  scope.querySelectorAll("[data-delete-guidance]").forEach((button) => {
    bindGuidanceButton(button, () => archiveGuidanceItem(button.dataset.deleteGuidance));
  });
  scope.querySelectorAll("[data-archive-guidance]").forEach((button) => {
    bindGuidanceButton(button, () => archiveGuidanceItem(button.dataset.archiveGuidance));
  });
  scope.querySelectorAll("[data-restore-guidance]").forEach((button) => {
    bindGuidanceButton(button, () => restoreGuidanceItem(button.dataset.restoreGuidance));
  });
  scope.querySelectorAll("[data-create-guidance-from-question]").forEach((button) => {
    bindGuidanceButton(button, () => openGuidanceDialog(null, button.dataset.createGuidanceFromQuestion));
  });
  scope.querySelectorAll("[data-dismiss-guidance-question]").forEach((button) => {
    bindGuidanceButton(button, () => dismissGuidanceQuestion(button.dataset.dismissGuidanceQuestion));
  });
  scope.querySelectorAll("[data-attach-guidance-question]").forEach((button) => {
    bindGuidanceButton(button, () => openAttachGuidanceQuestionDialog(button.dataset.attachGuidanceQuestion));
  });
  scope.querySelectorAll("[data-register-guidance-mismatch]").forEach((button) => {
    bindGuidanceButton(button, () => registerGuidanceMismatch(button.dataset.registerGuidanceMismatch));
  });
}

function bindGuidanceButton(button, handler) {
  if (button.dataset.guidanceBound === "true") return;
  button.dataset.guidanceBound = "true";
  button.addEventListener("click", handler);
}

function guidanceMatches(question, items = guidancePublishedItems()) {
  const queryTokens = guidanceTokens(question);
  return items
    .map((item) => ({ item, score: guidanceMatchScore(queryTokens, item) }))
    .filter((match) => match.score > 0)
    .sort((a, b) => b.score - a.score);
}

function guidancePublishedItems() {
  return state.guidanceItems.filter((item) => item.status === "Publicada");
}

function guidanceMatchScore(queryTokens, item) {
  const titleTokens = guidanceTokens(item.title);
  const keywordTokens = guidanceTokens(item.keywords);
  const exampleTokens = guidanceTokens(item.examples);
  const bodyTokens = guidanceTokens([item.stage, item.situation, item.conduct, item.whenCallMayssa, item.notUseWhen].join(" "));
  const allTokens = new Set([...titleTokens, ...keywordTokens, ...bodyTokens]);
  return queryTokens.reduce((score, token) => {
    if (exampleTokens.includes(token)) return score + 16;
    if (keywordTokens.includes(token)) return score + 14;
    if (titleTokens.includes(token)) return score + 10;
    if (allTokens.has(token)) return score + 5;
    if (guidanceTokenHasPartialMatch(token, exampleTokens)) return score + 10;
    if (guidanceTokenHasPartialMatch(token, keywordTokens)) return score + 8;
    if (guidanceTokenHasPartialMatch(token, titleTokens)) return score + 6;
    if (guidanceTokenHasPartialMatch(token, bodyTokens)) return score + 3;
    return score;
  }, 0);
}

function guidanceTokenHasPartialMatch(token, tokens) {
  if (token.length < 4) return false;
  return tokens.some((candidate) => candidate.length >= 4 && (candidate.startsWith(token) || token.startsWith(candidate)));
}

function guidanceTokens(value) {
  const ignored = new Set(["para", "como", "quando", "cliente", "fazer", "qual", "que", "com", "uma", "por", "dos", "das", "tem", "devo", "deve", "nao", "sim", "isso", "essa", "esse", "estou", "esta"]);
  return normalize(value)
    .split(/[^a-z0-9]+/i)
    .map(canonicalGuidanceToken)
    .filter((token) => token.length > 2 && !ignored.has(token));
}

function canonicalGuidanceToken(token) {
  const aliases = {
    atrasou: "atraso",
    atrasada: "atraso",
    atrasado: "atraso",
    atrasados: "atraso",
    cac: "ecac",
    certidao: "cnd",
    certidoes: "cnd",
    cnds: "cnd",
    documentacao: "documento",
    documentos: "documento",
    darf: "guia",
    darfs: "guia",
    emitiu: "emitir",
    emitida: "emitir",
    emitido: "emitir",
    emitir: "emitir",
    emissao: "emitir",
    expirada: "vencimento",
    expirado: "vencimento",
    expirou: "vencimento",
    guia: "guia",
    guias: "guia",
    pagamento: "pagamento",
    pagamentos: "pagamento",
    pagar: "pagamento",
    pagou: "pagamento",
    paga: "pagamento",
    pago: "pagamento",
    quitar: "pagamento",
    quitou: "pagamento",
    reemissao: "emitir",
    reemitir: "emitir",
    reemitiu: "emitir",
    vencendo: "vencimento",
    vencer: "vencimento",
    venceu: "vencimento",
    vencida: "vencimento",
    vencidas: "vencimento",
    vencido: "vencimento",
    vencidos: "vencimento",
    vencimento: "vencimento",
    vencimentos: "vencimento",
  };
  const clean = aliases[token] || token;
  if (clean.endsWith("s") && clean.length > 4) return clean.slice(0, -1);
  return clean;
}

function guidanceConfidenceLabel(score) {
  if (score >= 55) return "Correspondência alta";
  if (score >= 28) return "Correspondência média";
  return "Correspondência baixa";
}

function guidanceConfidenceClass(score) {
  if (score >= 55) return "confidence-high";
  if (score >= 28) return "confidence-medium";
  return "confidence-low";
}

function savePendingGuidanceQuestion(question, options = {}) {
  const now = new Date().toISOString();
  const stage = options.stage ?? document.getElementById("pendingGuidanceStage")?.value ?? "";
  const clientName = options.clientName ?? document.getElementById("pendingGuidanceClient")?.value.trim() ?? "";
  const rejectedGuidanceId = options.rejectedGuidanceId || "";
  const existing = state.guidanceQuestions.find(
    (item) => item.status === "Pendente" && item.askedBy === currentUser.id && normalize(item.question) === normalize(question)
  );
  if (existing) {
    existing.stage = stage || existing.stage;
    existing.clientName = clientName || existing.clientName;
    existing.rejectedGuidanceId = rejectedGuidanceId || existing.rejectedGuidanceId;
    existing.rejectionCount = (existing.rejectionCount || 0) + (rejectedGuidanceId ? 1 : 0);
    existing.updatedAt = now;
    saveState();
    el.guidanceAnswer.innerHTML = `<article class="guidance-saved"><i data-lucide="check-circle"></i><strong>Dúvida pendente atualizada para Mayssa.</strong></article>`;
    renderGuidance();
    renderUpdates();
    refreshIcons();
    return;
  }
  const newQuestion = normalizeGuidanceQuestion({
    id: id(),
    question,
    stage,
    clientName,
    askedBy: currentUser.id,
    status: "Pendente",
    rejectedGuidanceId,
    rejectionCount: rejectedGuidanceId ? 1 : 0,
    createdAt: now,
    updatedAt: now,
  });
  state.guidanceQuestions.unshift(newQuestion);
  recordActivity("guidance", `Registrou dúvida pendente: ${truncateHistoryValue(question, 80)}.`, newQuestion.stage || "", { visibility: "admin" });
  saveState();
  el.guidanceAnswer.innerHTML = `<article class="guidance-saved"><i data-lucide="check-circle"></i><strong>Dúvida registrada para Mayssa.</strong></article>`;
  renderGuidance();
  renderUpdates();
}

function registerGuidanceMismatch(guidanceId) {
  const question = el.guidanceAnswer.dataset.currentQuestion || el.guidanceQuestionInput.value.trim();
  if (!question) return;
  const guidance = state.guidanceItems.find((item) => item.id === guidanceId);
  if (guidance) {
    guidance.mismatchCount = (guidance.mismatchCount || 0) + 1;
    saveState();
  }
  savePendingGuidanceQuestion(question, {
    stage: guidance?.stage || "",
    rejectedGuidanceId: guidanceId,
  });
}

function guidancePendingQuestions() {
  const pending = (state.guidanceQuestions || []).filter((question) => question.status === "Pendente");
  return currentUser.role === "admin" ? pending : pending.filter((question) => question.askedBy === currentUser.id);
}

function openGuidanceDialog(guidanceId = null, questionId = null) {
  if (currentUser.role !== "admin") return;
  const guidance = state.guidanceItems.find((item) => item.id === guidanceId);
  const question = state.guidanceQuestions.find((item) => item.id === questionId);
  const draft = normalizeGuidanceItem(guidance || {
    title: question ? truncateHistoryValue(question.question, 70) : "",
    stage: question?.stage || "",
    situation: question?.question || "",
  });
  openSimpleDialog(guidance ? "Editar orientação" : "Nova orientação", [
    { label: "Título", name: "title", type: "text", value: draft.title },
    { label: "Etapa", name: "stage", type: "select", value: draft.stage, options: guidanceStages().map((stage) => ({ value: stage, label: stage })) },
    { label: "Status da orientação", name: "status", type: "select", value: draft.status, options: guidanceStatusValues().map((status) => ({ value: status, label: status })) },
    { label: "Situação", name: "situation", type: "textarea", rows: 3, value: draft.situation },
    { label: "Conduta", name: "conduct", type: "textarea", rows: 4, value: draft.conduct },
    { label: "Quando chamar Mayssa", name: "whenCallMayssa", type: "textarea", rows: 3, value: draft.whenCallMayssa },
    { label: "Não usar quando", name: "notUseWhen", type: "textarea", rows: 3, value: draft.notUseWhen },
    { label: "Exemplos de perguntas", name: "examples", type: "textarea", rows: 3, value: draft.examples },
    { label: "Palavras-chave e termos relacionados", name: "keywords", type: "textarea", rows: 2, value: draft.keywords },
    { label: "Importante", name: "important", type: "select", value: draft.important ? "Sim" : "Não", options: ["Não", "Sim"].map((value) => ({ value, label: value })) },
  ], (values) => {
    if (!values.title || !values.conduct) {
      alert("Informe pelo menos o título e a conduta.");
      return false;
    }
    const now = new Date().toISOString();
    const payload = normalizeGuidanceItem({
      ...draft,
      ...values,
      important: values.important === "Sim",
      updatedAt: now,
      updatedBy: currentUser.id,
      createdAt: draft.createdAt || now,
      createdBy: draft.createdBy || currentUser.id,
    });
    if (guidance) {
      Object.assign(guidance, payload, {
        versions: [guidanceVersionSnapshot(guidance, now), ...(guidance.versions || [])].slice(0, 20),
      });
      recordActivity("guidance", `Atualizou orientação: ${payload.title}.`, payload.stage);
    } else {
      state.guidanceItems.unshift({ ...payload, createdAt: now, updatedAt: now, createdBy: currentUser.id, updatedBy: currentUser.id, versions: [] });
      recordActivity("guidance", `Criou orientação: ${payload.title}.`, payload.stage);
    }
    if (question) {
      question.status = "Virou orientação";
      question.guidanceId = payload.id;
      question.updatedAt = now;
    }
    saveState();
    renderGuidance();
    renderUpdates();
  });
}

function guidanceVersionSnapshot(guidance, savedAt = new Date().toISOString()) {
  return normalizeGuidanceVersion({
    title: guidance.title,
    stage: guidance.stage,
    status: guidance.status,
    situation: guidance.situation,
    conduct: guidance.conduct,
    whenCallMayssa: guidance.whenCallMayssa,
    notUseWhen: guidance.notUseWhen,
    examples: guidance.examples,
    keywords: guidance.keywords,
    important: guidance.important,
    savedAt,
    savedBy: guidance.updatedBy || guidance.createdBy || currentUser?.id || "",
  });
}

function archiveGuidanceItem(guidanceId) {
  if (currentUser.role !== "admin") return;
  const guidance = state.guidanceItems.find((item) => item.id === guidanceId);
  if (!guidance || guidance.status === "Arquivada") return;
  if (!confirm(`Arquivar a orientação "${guidance.title}"? Ela sai das buscas, mas continua guardada.`)) return;
  const now = new Date().toISOString();
  guidance.versions = [guidanceVersionSnapshot(guidance, now), ...(guidance.versions || [])].slice(0, 20);
  guidance.status = "Arquivada";
  guidance.archivedAt = now;
  guidance.updatedAt = now;
  guidance.updatedBy = currentUser.id;
  recordActivity("guidance", `Arquivou orientação: ${guidance.title}.`, guidance.stage);
  saveState();
  renderGuidance();
  renderUpdates();
}

function restoreGuidanceItem(guidanceId) {
  if (currentUser.role !== "admin") return;
  const guidance = state.guidanceItems.find((item) => item.id === guidanceId);
  if (!guidance || guidance.status !== "Arquivada") return;
  const now = new Date().toISOString();
  guidance.versions = [guidanceVersionSnapshot(guidance, now), ...(guidance.versions || [])].slice(0, 20);
  guidance.status = "Publicada";
  guidance.archivedAt = "";
  guidance.updatedAt = now;
  guidance.updatedBy = currentUser.id;
  recordActivity("guidance", `Restaurou orientação: ${guidance.title}.`, guidance.stage);
  saveState();
  renderGuidance();
  renderUpdates();
}

function deleteGuidanceItem(guidanceId) {
  archiveGuidanceItem(guidanceId);
}

function openAttachGuidanceQuestionDialog(questionId) {
  if (currentUser.role !== "admin") return;
  const question = state.guidanceQuestions.find((item) => item.id === questionId);
  if (!question) return;
  const options = guidanceLibraryBaseItems("")
    .filter((item) => item.status !== "Arquivada")
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
    .map((item) => ({ value: item.id, label: `${item.title || "Orientação sem título"} (${item.stage || "Sem etapa"})` }));
  if (!options.length) {
    alert("Cadastre uma orientação antes de vincular essa dúvida.");
    return;
  }

  openSimpleDialog("Adicionar dúvida a orientação", [
    { label: "Dúvida", name: "question", type: "readonly", value: question.question },
    { label: "Orientação existente", name: "guidanceId", type: "select", value: question.rejectedGuidanceId || options[0].value, options },
  ], (values) => {
    const guidance = state.guidanceItems.find((item) => item.id === values.guidanceId);
    if (!guidance) return false;
    const now = new Date().toISOString();
    guidance.versions = [guidanceVersionSnapshot(guidance, now), ...(guidance.versions || [])].slice(0, 20);
    guidance.examples = appendGuidanceExample(guidance.examples, question.question);
    guidance.updatedAt = now;
    guidance.updatedBy = currentUser.id;
    question.status = "Adicionada à orientação";
    question.guidanceId = guidance.id;
    question.updatedAt = now;
    recordActivity("guidance", `Adicionou dúvida à orientação: ${guidance.title}.`, guidance.stage);
    saveState();
    renderGuidance();
    renderUpdates();
  });
}

function appendGuidanceExample(existingExamples, newExample) {
  const list = String(existingExamples || "")
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (!list.some((item) => normalize(item) === normalize(newExample))) list.push(newExample.trim());
  return list.join("\n");
}

function dismissGuidanceQuestion(questionId) {
  if (currentUser.role !== "admin") return;
  const question = state.guidanceQuestions.find((item) => item.id === questionId);
  if (!question) return;
  question.status = "Resolvida";
  question.updatedAt = new Date().toISOString();
  saveState();
  renderGuidance();
}

function activityTypeLabel(type) {
  return {
    client: "Cliente",
    note: "Anotação",
    status: "Status",
    task: "Tarefa",
    meeting: "Reunião",
    deadline: "Prazo",
    monthly: "Mensal",
    guidance: "Orientação",
    finance: "Financeiro",
    history: "Histórico",
  }[type] || "Atualização";
}

function activityIcon(type) {
  return {
    client: "contact",
    note: "message-square",
    status: "tag",
    task: "list-checks",
    meeting: "users-round",
    deadline: "calendar-clock",
    monthly: "calendar-check",
    guidance: "book-open-check",
    finance: "banknote",
    history: "file-clock",
  }[type] || "bell";
}

function renderTaskPeriodControls() {
  el.taskDayModeButton.classList.toggle("active", activeTaskCalendarMode === "day");
  el.taskWeekModeButton.classList.toggle("active", activeTaskCalendarMode === "week");
  el.taskMonthModeButton.classList.toggle("active", activeTaskCalendarMode === "month");

  if (activeTaskCalendarMode === "day") {
    el.taskPeriodLabel.textContent = `Meu dia - ${formatShortDate(activeTaskDate)}`;
    return;
  }

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
  if (activeTaskCalendarMode === "day") {
    el.taskCenterList.innerHTML = renderTaskDayBoard(items);
    return;
  }

  if (activeTaskCalendarMode === "month") {
    el.taskCenterList.innerHTML = renderTaskListBoard(items);
    return;
  }

  const overdueItems = items.filter((item) => item.urgency === "overdue");
  const waitingItems = items.filter((item) => item.urgency === "waiting");
  const datedItems = items.filter((item) => item.date && !["overdue", "waiting"].includes(item.urgency));
  const noDateItems = items.filter((item) => !item.date);
  const calendarMarkup = renderTaskWeekBoard(datedItems);

  el.taskCenterList.innerHTML = `
    ${renderOverdueTasks(overdueItems)}
    ${renderWaitingTasks(waitingItems)}
    ${calendarMarkup}
    ${renderNoDateTasks(noDateItems)}
  `;
}

function renderTaskDayBoard(items) {
  const selectedDay = localDateKey(activeTaskDate);
  const openItems = items.filter((item) => item.urgency !== "done");
  const todayItems = openItems.filter((item) => item.date === selectedDay);
  const overdueItems = openItems.filter((item) => item.urgency === "overdue");
  const waitingItems = openItems.filter((item) => isWaitingReturnItem(item, selectedDay));
  const upcomingItems = openItems
    .filter((item) => item.date && item.date > selectedDay && !isWaitingReturnItem(item, selectedDay))
    .slice(0, 8);
  const noDateItems = openItems.filter((item) => item.urgency === "no-date").slice(0, 4);
  const nextActions = [...upcomingItems, ...noDateItems].sort(taskItemSorter).slice(0, 8);
  const dayTitle = selectedDay === localDateKey() ? "Prioridades de hoje" : "Prioridades do dia";

  return `
    <div class="task-dashboard-board">
      <div class="task-dashboard-main">
        ${renderTaskTablePanel(dayTitle, todayItems, "today", "circle-dot", { limit: 6, empty: "Sem prioridades para hoje." })}
        ${renderTaskTablePanel("Próximas ações", nextActions, "upcoming", "list-checks", { limit: 6, empty: "Nenhuma próxima ação filtrada." })}
      </div>
      <aside class="task-dashboard-side">
        ${renderTaskSidePanel("Aguardando retorno", waitingItems, "waiting", "hourglass", { limit: 4 })}
        ${renderTaskSidePanel("Atrasadas", overdueItems, "overdue", "triangle-alert", { limit: 4 })}
      </aside>
    </div>
  `;
}

function renderTaskListBoard(items) {
  const openItems = items.filter((item) => item.urgency !== "done");
  const doneItems = items.filter((item) => item.urgency === "done").slice(0, 8);
  return `
    <div class="task-list-board">
      ${renderTaskTablePanel("Tarefas em lista", openItems, "list", "list", { limit: 80, empty: "Nenhuma tarefa encontrada." })}
      ${doneItems.length ? renderTaskTablePanel("Concluídas recentes", doneItems, "done", "check-circle-2", { limit: 8 }) : ""}
    </div>
  `;
}

function renderTaskTablePanel(title, items, key, icon, options = {}) {
  const limit = options.limit || 6;
  const visibleItems = [...items].sort(taskItemSorter).slice(0, limit);
  const hiddenCount = Math.max(0, items.length - visibleItems.length);
  return `
    <section class="task-work-panel ${key}">
      <header>
        <span><i data-lucide="${icon}"></i>${escapeHtml(title)}</span>
        <strong>${items.length}</strong>
      </header>
      <div class="task-table-list">
        ${visibleItems.length ? visibleItems.map(renderTaskTableRow).join("") : `<p class="empty-state compact">${escapeHtml(options.empty || "Sem tarefas.")}</p>`}
      </div>
      ${hiddenCount ? `<button class="task-panel-link" type="button" data-task-status-jump="${escapeAttr(key)}">Ver todas (${items.length})</button>` : ""}
    </section>
  `;
}

function renderTaskSidePanel(title, items, key, icon, options = {}) {
  const limit = options.limit || 4;
  const visibleItems = [...items].sort(taskItemSorter).slice(0, limit);
  return `
    <section class="task-side-panel ${key}">
      <header>
        <span><i data-lucide="${icon}"></i>${escapeHtml(title)}</span>
        <strong>${items.length}</strong>
      </header>
      <div class="task-side-list">
        ${visibleItems.length ? visibleItems.map(renderTaskSideRow).join("") : `<p class="empty-state compact">Sem tarefas.</p>`}
      </div>
      ${items.length > limit ? `<button class="task-panel-link" type="button" data-task-status-jump="${escapeAttr(key)}">Ver todas (${items.length})</button>` : ""}
    </section>
  `;
}

function renderTaskTableRow(item) {
  const key = taskItemKey(item);
  const expanded = expandedTaskCardIds.has(key);
  const statusLabel = localizeLabel(item.status || (item.kind.includes("Tarefa") ? "Pendente" : item.kind));
  const priority = normalizeTaskPriority(item.priority);
  return `
    <article class="task-table-row ${taskTypeClass(item)} ${taskOwnerClass(item.ownerId)} ${item.urgency} priority-${normalize(priority)} status-${taskStatusClass(statusLabel)} ${expanded ? "expanded" : ""}" data-toggle-task-card="${escapeAttr(key)}">
      <span class="task-check-ring" aria-hidden="true"></span>
      <div class="task-row-title">
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(taskItemContext(item))}</small>
      </div>
      <div class="task-row-owner">
        ${taskOwnerAvatar(item.ownerId)}
        <span>${escapeHtml(ownerName(item.ownerId))}</span>
      </div>
      <div class="task-row-date"><i data-lucide="calendar"></i>${escapeHtml(taskDateText(item))}</div>
      <div class="task-row-chips">
        <span class="priority-pill">${escapeHtml(priority)}</span>
        <span class="task-status-pill">${escapeHtml(statusLabel)}</span>
      </div>
      <div class="task-row-control">${taskPrimaryAction(item)}</div>
      <div class="task-row-expanded" ${expanded ? "" : "hidden"}>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        ${item.followUpNotes ? `<p><strong>Acompanhamento:</strong> ${escapeHtml(item.followUpNotes)}</p>` : ""}
        <div class="task-row-expanded-actions">
          ${taskStatusControl(item, statusLabel)}
          ${taskSecondaryActions(item)}
        </div>
      </div>
    </article>
  `;
}

function renderTaskSideRow(item) {
  const key = taskItemKey(item);
  const expanded = expandedTaskCardIds.has(key);
  const statusLabel = localizeLabel(item.status || (item.kind.includes("Tarefa") ? "Pendente" : item.kind));
  return `
    <article class="task-side-row ${taskTypeClass(item)} ${taskOwnerClass(item.ownerId)} ${item.urgency} ${expanded ? "expanded" : ""}" data-toggle-task-card="${escapeAttr(key)}">
      <div>
        <strong>${escapeHtml(item.title)}</strong>
        <small>${escapeHtml(taskItemContext(item))}</small>
      </div>
      <div class="task-side-meta">
        ${taskOwnerAvatar(item.ownerId)}
        <span>${escapeHtml(ownerName(item.ownerId))}</span>
        <span><i data-lucide="calendar"></i>${escapeHtml(taskDateText(item))}</span>
      </div>
      <div class="task-side-actions">
        ${taskStatusControl(item, statusLabel)}
        ${taskPrimaryAction(item)}
      </div>
      <div class="task-side-details" ${expanded ? "" : "hidden"}>
        ${item.description ? `<p>${escapeHtml(item.description)}</p>` : ""}
        ${item.followUpNotes ? `<p><strong>Acompanhamento:</strong> ${escapeHtml(item.followUpNotes)}</p>` : ""}
        ${taskSecondaryActions(item)}
      </div>
    </article>
  `;
}

function taskItemContext(item) {
  if (item.internalMeetingId) return item.clientName && item.clientName !== "Reunião" ? item.clientName : "Agenda";
  if (item.internalTaskId) return item.visibility === "admin" ? "Somente admin" : "Equipe interna";
  return item.clientName || "Cliente não informado";
}

function taskOwnerAvatar(userId) {
  return `<span class="task-owner-avatar">${escapeHtml(userInitials(ownerName(userId)))}</span>`;
}

function taskDateText(item) {
  if (!item.date) return "Sem prazo";
  const today = localDateKey();
  const tomorrow = localDateKey(new Date(Date.now() + 86400000));
  const base = item.date === today ? "Hoje" : item.date === tomorrow ? "Amanhã" : formatDate(item.date);
  const timeMatch = String(item.description || "").match(/Horário:\s*([0-9]{2}:[0-9]{2})/);
  return timeMatch ? `${base}, ${timeMatch[1]}` : base;
}

function taskPrimaryAction(item) {
  if (item.internalTaskId) return `<button class="icon-button" type="button" data-edit-internal-task="${escapeAttr(item.internalTaskId)}" aria-label="Editar tarefa"><i data-lucide="pencil"></i></button>`;
  if (item.internalMeetingId) return `<button class="icon-button" type="button" data-edit-meeting="${escapeAttr(item.internalMeetingId)}" aria-label="Editar reunião"><i data-lucide="pencil"></i></button>`;
  if (item.clientId) return `<button class="small-button" type="button" data-open-task-client="${escapeAttr(item.clientId)}" data-client-source="${escapeAttr(item.clientSource || "inss")}"><i data-lucide="external-link"></i> Abrir</button>`;
  return "";
}

function taskSecondaryActions(item) {
  if (item.internalTaskId) {
    return `<button class="icon-button danger-icon" type="button" data-remove-internal-task="${escapeAttr(item.internalTaskId)}" aria-label="Remover tarefa"><i data-lucide="trash-2"></i></button>`;
  }
  if (item.internalMeetingId) {
    return `<button class="icon-button danger-icon" type="button" data-remove-meeting="${escapeAttr(item.internalMeetingId)}" aria-label="Remover reunião"><i data-lucide="trash-2"></i></button>`;
  }
  if (item.clientId) return `<button class="small-button" type="button" data-open-task-client="${escapeAttr(item.clientId)}" data-client-source="${escapeAttr(item.clientSource || "inss")}"><i data-lucide="external-link"></i> Abrir card</button>`;
  return "";
}

function taskStatusControl(item, statusLabel) {
  if (!item.kind.includes("Tarefa")) return `<span class="task-type-pill">${escapeHtml(statusLabel)}</span>`;
  return `<select class="task-status-select" data-center-task-status="${escapeAttr(item.id)}" data-task-source="${item.internalTaskId ? "internal" : "client"}" data-client-id="${escapeAttr(item.clientId || "")}" data-client-source="${escapeAttr(item.clientSource || "inss")}" data-task-id="${escapeAttr(item.id)}">${taskStatusOptions(statusLabel)}</select>`;
}

function isWaitingReturnItem(item, referenceDay = localDateKey()) {
  const status = localizeLabel(item.status || "");
  const waiting = ["Aguardando cliente", "Aguardando terceiro"].includes(status) || item.urgency === "waiting";
  if (!waiting || item.urgency === "done") return false;
  return Boolean(item.date && item.date < referenceDay);
}

function renderOverdueTasks(items) {
  if (!items.length) return "";
  return `
    <section class="overdue-panel">
      <header>
        <span><i data-lucide="alert-triangle"></i>Atrasadas</span>
        <strong>${items.length}</strong>
      </header>
      <div class="overdue-grid">
        ${renderTaskGroupItems(items, "overdue-fixed", { showDate: true })}
      </div>
    </section>
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
          const openCount = dayItems.filter((item) => item.urgency !== "done").length;
          const doneCount = dayItems.filter((item) => item.urgency === "done").length;
          return `
            <section class="task-day-column ${key === today ? "today" : ""}">
              <header>
                <span>${weekdayLabel(day)}</span>
                <strong>${formatShortDate(day)}</strong>
                <small>${openCount} abertas · ${doneCount} concluídas</small>
              </header>
              <div class="task-day-items">
                ${renderTaskGroupItems(dayItems, key, { showDate: false }) || `<p class="empty-state compact">Sem tarefas.</p>`}
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
          const openDayItems = dayItems.filter((item) => item.urgency !== "done").sort(taskItemSorter);
          const doneCount = dayItems.length - openDayItems.length;
          return `
            <section class="task-month-day ${inMonth ? "" : "outside"} ${key === today ? "today" : ""}">
              <header>
                <strong>${day.getDate()}</strong>
                <span>${openDayItems.length}</span>
              </header>
              <div class="task-month-items">
                ${openDayItems.slice(0, 4).map((item) => renderTaskCalendarCard(item, true)).join("") || ""}
                ${openDayItems.length > 4 ? `<small>+${openDayItems.length - 4} tarefa(s)</small>` : ""}
                ${doneCount ? `<small>${doneCount} concluída${doneCount > 1 ? "s" : ""}</small>` : ""}
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
        ${renderTaskGroupItems(items, "no-date", { showDate: true })}
      </div>
    </section>
  `;
}

function renderTaskGroupItems(items, groupKey, options = {}) {
  if (!items.length) return "";
  const ordered = [...items].sort(taskItemSorter);
  const openItems = ordered.filter((item) => item.urgency !== "done");
  const doneItems = ordered.filter((item) => item.urgency === "done");
  return `
    ${openItems.map((item) => renderTaskCalendarCard(item, false, options)).join("")}
    ${renderCompletedTaskGroup(groupKey, doneItems, options)}
  `;
}

function renderCompletedTaskGroup(groupKey, items, options = {}) {
  if (!items.length) return "";
  const key = `done-${groupKey}`;
  const expanded = expandedCompletedTaskGroups.has(key);
  return `
    <div class="completed-task-group ${expanded ? "expanded" : ""}">
      <button class="completed-toggle" type="button" data-toggle-completed-group="${escapeAttr(key)}" aria-expanded="${expanded}">
        <i data-lucide="${expanded ? "chevron-up" : "chevron-down"}"></i>
        ${items.length} concluída${items.length > 1 ? "s" : ""}
      </button>
      <div class="completed-items" ${expanded ? "" : "hidden"}>
        ${items.map((item) => renderTaskCalendarCard(item, false, options)).join("")}
      </div>
    </div>
  `;
}

function bindTaskCenterActions() {
  document.querySelectorAll("[data-toggle-task-card]").forEach((card) => {
    card.addEventListener("click", (event) => {
      if (event.target.closest("button, select, input, textarea, a")) return;
      const key = card.dataset.toggleTaskCard;
      if (expandedTaskCardIds.has(key)) expandedTaskCardIds.delete(key);
      else expandedTaskCardIds.add(key);
      renderTaskCenter();
    });
  });

  document.querySelectorAll("[data-toggle-completed-group]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.toggleCompletedGroup;
      if (expandedCompletedTaskGroups.has(key)) expandedCompletedTaskGroups.delete(key);
      else expandedCompletedTaskGroups.add(key);
      renderTaskCenter();
    });
  });

  document.querySelectorAll("[data-task-status-jump]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.taskStatusJump;
      activeTaskCalendarMode = "month";
      if (key === "overdue" || key === "waiting") el.taskStatusFilter.value = key;
      else el.taskStatusFilter.value = "";
      renderTaskCenter();
    });
  });

  document.querySelectorAll("[data-open-task-client]").forEach((button) => {
    button.addEventListener("click", () => openLinkedClientRecord(button.dataset.openTaskClient, button.dataset.clientSource || "inss"));
  });

  document.querySelectorAll("[data-center-task-status]").forEach((select) => {
    select.addEventListener("change", () => {
      if (select.dataset.taskSource === "internal") {
        const task = state.internalTasks.find((item) => item.id === select.dataset.taskId);
        if (!task) return;
        task.status = select.value;
        task.updatedAt = new Date().toISOString();
        recordActivity("task", `Alterou tarefa interna: ${task.title || "Tarefa sem título"}.`, `Status: ${select.value}.`, {
          internalTaskId: task.id,
          ownerId: task.ownerId,
          visibility: task.visibility,
        });
        saveState();
        renderMetrics();
        renderTaskCenter();
        renderUpdates();
        return;
      }

      const linked = findLinkedClientRecord(select.dataset.clientId, select.dataset.clientSource || "inss");
      const client = linked?.record;
      const task = client?.tasks?.find((item) => item.id === select.dataset.taskId);
      if (!task) return;
      const oldStatus = localizeLabel(task.status || "Pendente");
      if (oldStatus === select.value) return;
      task.status = select.value;
      client.updatedAt = new Date().toISOString();
      addHistoryEntry(client, "Status de tarefa alterado", [
        `${task.title || "Tarefa sem título"}: ${oldStatus} -> ${select.value}.`,
      ]);
      recordActivity("task", `Alterou tarefa em ${client.clientName || "cliente"}.`, `${task.title || "Tarefa sem título"}: ${oldStatus} -> ${select.value}.`, {
        clientId: client.id,
        clientSource: linked.source,
        clientName: client.clientName,
        ownerId: task.ownerId,
      });
      saveState();
      renderMetrics();
      renderTaskCenter();
      renderUpdates();
    });
  });

  document.querySelectorAll("[data-edit-internal-task]").forEach((button) => {
    button.addEventListener("click", () => openInternalTaskDialog(button.dataset.editInternalTask));
  });

  document.querySelectorAll("[data-remove-internal-task]").forEach((button) => {
    button.addEventListener("click", () => {
      const task = state.internalTasks.find((item) => item.id === button.dataset.removeInternalTask);
      state.internalTasks = state.internalTasks.filter((item) => item.id !== button.dataset.removeInternalTask);
      if (task) {
        recordActivity("task", `Removeu tarefa interna: ${task.title || "Tarefa sem título"}.`, "", {
          internalTaskId: task.id,
          ownerId: task.ownerId,
          visibility: task.visibility,
        });
      }
      saveState();
      renderMetrics();
      renderTaskCenter();
      renderUpdates();
    });
  });

  document.querySelectorAll("[data-edit-meeting]").forEach((button) => {
    button.addEventListener("click", () => openMeetingDialog(button.dataset.editMeeting));
  });

  document.querySelectorAll("[data-remove-meeting]").forEach((button) => {
    button.addEventListener("click", () => {
      const meeting = state.meetings.find((item) => item.id === button.dataset.removeMeeting);
      state.meetings = state.meetings.filter((item) => item.id !== button.dataset.removeMeeting);
      if (meeting) recordActivity("meeting", `Removeu reunião: ${meeting.title || "Reunião sem título"}.`, "", { ownerId: meeting.ownerId });
      saveState();
      renderTaskCenter();
      renderUpdates();
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

function renderTaskClientFilter() {
  if (!el.taskClientFilter) return;
  const selected = el.taskClientFilter.value;
  el.taskClientFilter.innerHTML = `<option value="">Todos os clientes</option><option value="internal">Equipe interna</option>${linkedClientRecords()
    .map((record) => `<option value="${escapeAttr(record.value)}">${escapeHtml(record.label)}</option>`)
    .join("")}`;
  el.taskClientFilter.value = selected;
}

function linkedClientRecords() {
  const inss = (state.clients || []).map((client) => ({
    id: client.id,
    source: "inss",
    value: linkedClientValue("inss", client.id),
    label: `${client.clientName || "Cliente sem nome"} | INSS de obras`,
    clientName: client.clientName || "Cliente sem nome",
    record: client,
  }));
  const regularizations = (state.regularizationClients || []).map((process) => ({
    id: process.id,
    source: "regularization",
    value: linkedClientValue("regularization", process.id),
    label: `${process.clientName || "Cliente sem nome"} | Regularização de imóvel`,
    clientName: process.clientName || "Cliente sem nome",
    record: process,
  }));
  return [...inss, ...regularizations].sort((a, b) => a.clientName.localeCompare(b.clientName));
}

function linkedClientValue(source, clientId) {
  return `${source || "inss"}:${clientId || ""}`;
}

function parseLinkedClientValue(value = "") {
  const [source, ...idParts] = String(value).split(":");
  if (source === "regularization") return { source, id: idParts.join(":") };
  if (source === "inss") return { source, id: idParts.join(":") };
  return { source: "inss", id: value };
}

function findLinkedClientRecord(valueOrId = "", source = "") {
  const parsed = source ? { source, id: valueOrId } : parseLinkedClientValue(valueOrId);
  if (parsed.source === "regularization") {
    const record = state.regularizationClients.find((process) => process.id === parsed.id);
    return record ? { source: "regularization", id: record.id, clientName: record.clientName || "Cliente sem nome", record } : null;
  }
  const record = state.clients.find((client) => client.id === parsed.id);
  return record ? { source: "inss", id: record.id, clientName: record.clientName || "Cliente sem nome", record } : null;
}

function linkedClientOptions() {
  return [
    { value: "", label: "Sem cliente vinculado" },
    ...linkedClientRecords().map((record) => ({ value: record.value, label: record.label })),
  ];
}

function openLinkedClientRecord(clientId, source = "inss") {
  if (source === "regularization") {
    openRegularizationDialog(clientId);
    return;
  }
  openClientById(clientId);
}

function renderTaskOverview(items) {
  const openItems = items.filter((item) => item.urgency !== "done");
  const stats = [
    { label: "Atrasadas", value: openItems.filter((item) => item.urgency === "overdue").length, key: "overdue", icon: "triangle-alert", hint: "tarefas" },
    { label: "Hoje", value: openItems.filter((item) => item.date === localDateKey()).length, key: "today", icon: "calendar-days", hint: "tarefas" },
    { label: "Aguardando retorno", value: openItems.filter((item) => isWaitingReturnItem(item)).length, key: "waiting", icon: "hourglass", hint: "tarefas" },
    { label: "Sem prazo", value: openItems.filter((item) => item.urgency === "no-date").length, key: "no-date", icon: "clock-3", hint: "tarefas" },
  ];

  el.taskOverview.innerHTML = stats
    .map(
      (stat) => `
        <article class="task-stat ${stat.key}">
          <span class="task-stat-icon"><i data-lucide="${stat.icon}"></i></span>
          <div>
            <span>${stat.label}</span>
            <strong>${stat.value}</strong>
            <small>${stat.hint}</small>
          </div>
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
        followUpNotes: task.followUpNotes || "",
        ownerId: task.ownerId,
        createdBy: task.createdBy || "",
        date: task.dueDate || "",
        status: localizeLabel(task.status || "Pendente"),
        priority: normalizeTaskPriority(task.priority),
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
        priority: "Importante",
        clientId: client.id,
        clientName: client.clientName || "Cliente sem nome",
      };
      item.urgency = taskUrgency(item);
      return item;
    });

    return [...tasks, ...deadlines];
  });

  const regularizationItems = (state.regularizationClients || []).flatMap((process) => {
    return (process.tasks || []).map((task) => {
      const item = {
        id: task.id,
        source: "Regularização",
        clientSource: "regularization",
        kind: "Tarefa",
        title: task.title || "Tarefa sem título",
        description: task.description || "",
        followUpNotes: task.followUpNotes || "",
        ownerId: task.ownerId,
        createdBy: task.createdBy || "",
        date: task.dueDate || "",
        status: localizeLabel(task.status || "Pendente"),
        priority: normalizeTaskPriority(task.priority),
        clientId: process.id,
        clientName: process.clientName || "Cliente sem nome",
      };
      item.urgency = taskUrgency(item);
      return item;
    });
  });

  const internalItems = (state.internalTasks || [])
    .filter((task) => task.visibility !== "admin" || currentUser.role === "admin")
    .map((task) => {
      const item = {
        id: task.id,
        source: "Interno",
        kind: "Tarefa interna",
        title: task.title || "Tarefa interna sem título",
        description: task.description || "",
        followUpNotes: task.followUpNotes || "",
        ownerId: task.ownerId,
        createdBy: task.createdBy || "",
        date: task.dueDate || "",
        status: localizeLabel(task.status || "Pendente"),
        priority: normalizeTaskPriority(task.priority),
        visibility: task.visibility || "team",
        internalTaskId: task.id,
        clientName: task.visibility === "admin" ? "Somente admin" : "Equipe interna",
      };
      item.urgency = taskUrgency(item);
      return item;
    });

  const meetingItems = (state.meetings || []).map((meeting) => {
    const linkedClient = meeting.clientId ? findLinkedClientRecord(meeting.clientId, meeting.clientSource || "inss") : null;
    const item = {
      id: meeting.id,
      source: "Agenda",
      kind: "Reunião",
      title: meeting.title || "Reunião sem título",
      description: [
        meeting.time ? `Horário: ${meeting.time}` : "",
        meeting.participants ? `Participantes: ${meeting.participants}` : "",
        meeting.location ? `Local/link: ${meeting.location}` : "",
        meeting.description || "",
      ].filter(Boolean).join("\n"),
      ownerId: meeting.ownerId,
      createdBy: meeting.createdBy || "",
      date: meeting.date || "",
      status: "Reunião",
      priority: "Normal",
      internalMeetingId: meeting.id,
      clientId: meeting.clientId || "",
      clientSource: meeting.clientSource || "inss",
      clientName: linkedClient?.clientName || "Reunião",
    };
    item.urgency = taskUrgency(item);
    return item;
  });

  return [...clientItems, ...regularizationItems, ...internalItems, ...meetingItems];
}

function filterTaskCenterItems(items) {
  const query = normalize(el.taskSearchInput.value);
  const ownerId = el.taskOwnerFilter.value;
  const clientFilter = el.taskClientFilter?.value || "";
  const status = el.taskStatusFilter.value;

  return items
    .filter((item) => {
      const haystack = normalize([
        item.title,
        item.description,
        item.followUpNotes,
        item.clientName,
        item.kind,
        item.status,
        ownerName(item.ownerId),
        ownerName(item.createdBy),
        item.source,
        item.visibility,
      ].join(" "));
      const matchesQuery = !query || haystack.includes(query);
      const matchesOwner = (!ownerId || item.ownerId === ownerId) && (!taskMineOnly || item.ownerId === currentUser.id);
      const matchesClient =
        !clientFilter ||
        linkedClientValue(item.clientSource || "inss", item.clientId) === clientFilter ||
        item.clientId === clientFilter ||
        (clientFilter === "internal" && !item.clientId);
      const statusLabel = localizeLabel(item.status || "");
      const matchesStatus =
        !status ||
        item.urgency === status ||
        statusLabel === status ||
        (status === "open" && item.urgency !== "done") ||
        (status === "done" && item.urgency === "done");
      return matchesQuery && matchesOwner && matchesClient && matchesStatus;
    })
    .sort(taskItemSorter);
}

function taskPriorityRank(priority) {
  return { Urgente: 0, Importante: 1, Normal: 2 }[normalizeTaskPriority(priority)] ?? 2;
}

function taskItemSorter(a, b) {
  const order = { overdue: 0, waiting: 1, today: 2, upcoming: 3, "no-date": 4, done: 5 };
  const orderDiff = order[a.urgency] - order[b.urgency];
  if (orderDiff) return orderDiff;
  const priorityDiff = taskPriorityRank(a.priority) - taskPriorityRank(b.priority);
  if (priorityDiff) return priorityDiff;
  if (!a.date && !b.date) return a.clientName.localeCompare(b.clientName);
  if (!a.date) return 1;
  if (!b.date) return -1;
  const dateDiff = a.date.localeCompare(b.date);
  if (dateDiff) return dateDiff;
  return (a.title || "").localeCompare(b.title || "");
}

function renderTaskCalendarCard(item, compact = false, options = {}) {
  const ownerClass = taskOwnerClass(item.ownerId);
  const key = taskItemKey(item);
  const expanded = expandedTaskCardIds.has(key) && !compact;
  const showDate = options.showDate === true;
  const statusLabel = localizeLabel(item.status || (item.kind.includes("Tarefa") ? "Pendente" : item.kind));
  const statusControl = item.kind.includes("Tarefa")
    ? `<select class="task-status-select" data-center-task-status="${item.id}" data-task-source="${item.internalTaskId ? "internal" : "client"}" data-client-id="${item.clientId || ""}" data-client-source="${item.clientSource || "inss"}" data-task-id="${item.id}">${taskStatusOptions(statusLabel)}</select>`
    : `<span class="task-type-pill">${escapeHtml(statusLabel)}</span>`;
  const sourceClass = item.visibility === "admin" ? " admin-only" : "";
  const priority = normalizeTaskPriority(item.priority);
  const actionControl = item.internalTaskId
    ? `<div class="inline-actions task-row-actions">
        <button class="icon-button" type="button" data-edit-internal-task="${item.internalTaskId}" title="Editar tarefa" aria-label="Editar tarefa"><i data-lucide="pencil"></i></button>
        <button class="icon-button" type="button" data-remove-internal-task="${item.internalTaskId}" title="Remover tarefa" aria-label="Remover tarefa interna"><i data-lucide="trash-2"></i></button>
      </div>`
    : item.internalMeetingId
      ? `<div class="inline-actions task-row-actions">
          <button class="icon-button" type="button" data-edit-meeting="${item.internalMeetingId}" title="Editar reunião" aria-label="Editar reunião"><i data-lucide="pencil"></i></button>
          <button class="icon-button" type="button" data-remove-meeting="${item.internalMeetingId}" title="Remover reunião" aria-label="Remover reunião"><i data-lucide="trash-2"></i></button>
        </div>`
    : `<button class="icon-button" type="button" data-open-task-client="${item.clientId}" data-client-source="${item.clientSource || "inss"}" title="Abrir card do cliente" aria-label="Abrir card do cliente"><i data-lucide="external-link"></i></button>`;

  return `
    <article class="task-calendar-card ${taskTypeClass(item)} priority-${normalize(priority)} status-${taskStatusClass(statusLabel)} ${item.urgency} ${ownerClass} ${compact ? "compact" : ""} ${expanded ? "expanded" : ""}" data-toggle-task-card="${escapeAttr(key)}">
      <div class="task-main">
        <div class="task-badges">
          <span class="task-kind">${item.kind}</span>
          <span class="task-source${sourceClass}">${item.visibility === "admin" ? "Somente admin" : escapeHtml(item.source)}</span>
          <span class="priority-pill">${escapeHtml(priority)}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.clientName)}</p>
      </div>
      <div class="task-card-summary">
        <span class="task-owner-chip"><i data-lucide="user-check"></i>${escapeHtml(ownerName(item.ownerId))}</span>
        <span class="task-status-pill">${escapeHtml(statusLabel)}</span>
        <span class="urgency-pill">${urgencyLabel(item.urgency)}</span>
        ${showDate && item.date ? `<span class="task-date-chip"><i data-lucide="calendar"></i>${formatDate(item.date)}</span>` : ""}
      </div>
      ${
        compact
          ? ""
          : `<div class="task-card-details" ${expanded ? "" : "hidden"}>
              ${item.description ? `<p class="task-description">${escapeHtml(item.description)}</p>` : ""}
              ${item.followUpNotes ? `<p class="task-follow-up"><strong>Anotação:</strong> ${escapeHtml(item.followUpNotes)}</p>` : ""}
              ${item.createdBy ? `<div class="task-detail"><i data-lucide="user-plus"></i>Criada por ${escapeHtml(ownerName(item.createdBy))}</div>` : ""}
              <div class="task-detail"><i data-lucide="calendar"></i>${item.date ? formatDate(item.date) : "Sem prazo"}</div>
              <div class="task-detail">${statusControl}</div>
              ${actionControl}
            </div>`
      }
    </article>
  `;
}

function taskItemKey(item = {}) {
  if (item.internalTaskId) return `internal-task:${item.internalTaskId}`;
  if (item.internalMeetingId) return `meeting:${item.internalMeetingId}`;
  return `client:${item.clientSource || "inss"}:${item.clientId || "none"}:${item.kind}:${item.id}`;
}

function taskTypeClass(item = {}) {
  if (item.visibility === "admin") return "task-type-admin";
  if (item.internalTaskId) return "task-type-internal";
  if (item.internalMeetingId) return "task-type-meeting";
  if (item.kind === "Prazo") return "task-type-deadline";
  return "task-type-client";
}

function taskStatusClass(status) {
  return normalize(status || "pendente").replace(/[^a-z0-9]+/g, "-");
}

function taskOwnerClass(userId) {
  if (userId === fixedUserIds.mayssa) return "owner-mayssa";
  if (userId === fixedUserIds.contato) return "owner-camilli";
  return "owner-other";
}

function destinationLabel(client = {}) {
  return client.destination || "Obra sem destinação informada";
}

function renderClients() {
  const clients = filteredClients();
  const pageCount = Math.max(1, Math.ceil(clients.length / CLIENTS_PER_PAGE));
  if (activeClientPage > pageCount) activeClientPage = pageCount;
  if (activeClientPage < 1) activeClientPage = 1;
  const startIndex = (activeClientPage - 1) * CLIENTS_PER_PAGE;
  const visibleClients = clients.slice(startIndex, startIndex + CLIENTS_PER_PAGE);

  el.listView.hidden = activeViewMode !== "list";
  el.compactView.hidden = activeViewMode !== "compact";

  if (activeViewMode === "list") {
    el.listView.innerHTML = visibleClients.length
      ? visibleClients.map((client) => renderClientCard(client)).join("")
      : `<p class="empty-state">Nenhum cliente encontrado.</p>`;
  } else {
    renderCompactClients(visibleClients);
  }

  renderClientQuickFilters();
  renderClientPagination(clients.length, startIndex, visibleClients.length, pageCount);
  document.querySelectorAll("[data-open-client]").forEach((card) => {
    card.addEventListener("click", () => openClientById(card.dataset.openClient));
  });
  refreshIcons();
}

function resetClientPageAndRender() {
  activeClientPage = 1;
  renderClients();
}

function renderClientQuickFilters() {
  document.querySelectorAll("[data-client-quick-filter]").forEach((button) => {
    const isActive = (button.dataset.clientQuickFilter || "active") === activeClientQuickFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function renderClientPagination(total, startIndex, visibleCount, pageCount) {
  if (!el.clientPagination) return;
  if (!total) {
    el.clientPagination.innerHTML = "";
    return;
  }
  const first = startIndex + 1;
  const last = startIndex + visibleCount;
  const pages = clientPaginationPages(pageCount);
  el.clientPagination.innerHTML = `
    <span>Mostrando ${first}-${last} de ${total} cliente${total === 1 ? "" : "s"}</span>
    ${
      pageCount > 1
        ? `<div class="client-page-controls">
            <button class="icon-button" type="button" data-client-page="${activeClientPage - 1}" ${activeClientPage === 1 ? "disabled" : ""} aria-label="Página anterior"><i data-lucide="chevron-left"></i></button>
            ${pages
              .map((page) =>
                page === "gap"
                  ? `<span class="client-page-gap">...</span>`
                  : `<button class="client-page-button ${page === activeClientPage ? "active" : ""}" type="button" data-client-page="${page}">${page}</button>`
              )
              .join("")}
            <button class="icon-button" type="button" data-client-page="${activeClientPage + 1}" ${activeClientPage === pageCount ? "disabled" : ""} aria-label="Próxima página"><i data-lucide="chevron-right"></i></button>
          </div>`
        : ""
    }
  `;
  el.clientPagination.querySelectorAll("[data-client-page]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextPage = Number(button.dataset.clientPage);
      if (!Number.isFinite(nextPage) || nextPage < 1 || nextPage > pageCount || nextPage === activeClientPage) return;
      activeClientPage = nextPage;
      renderClients();
    });
  });
}

function clientPaginationPages(pageCount) {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1);
  const pages = new Set([1, pageCount, activeClientPage - 1, activeClientPage, activeClientPage + 1]);
  const ordered = [...pages].filter((page) => page >= 1 && page <= pageCount).sort((a, b) => a - b);
  return ordered.flatMap((page, index) => {
    const previous = ordered[index - 1];
    return previous && page - previous > 1 ? ["gap", page] : [page];
  });
}

function groupedActivitiesByDay(activities) {
  return activities.reduce((groups, activity) => {
    const key = activityDayKey(activity.createdAt);
    const existing = groups.find(([day]) => day === key);
    if (existing) existing[1].push(activity);
    else groups.push([key, [activity]]);
    return groups;
  }, []);
}

function updateDayGroup(day, activities) {
  const collapsed = collapsedUpdateDays.has(day);
  return `
    <section class="update-day-group ${collapsed ? "collapsed" : ""}">
      <div class="update-day-heading">
        <button class="update-day-toggle" type="button" data-toggle-update-day="${escapeAttr(day)}" aria-expanded="${!collapsed}">
          <i data-lucide="${collapsed ? "chevron-right" : "chevron-down"}"></i>
          <span>${escapeHtml(activityDayLabel(day))}</span>
        </button>
        <span>${activities.length} atualização${activities.length > 1 ? "ões" : ""}</span>
      </div>
      <div class="update-day-timeline" ${collapsed ? "hidden" : ""}>
        ${activities.map(updateTimelineItem).join("")}
      </div>
    </section>
  `;
}

function updateTimelineItem(activity) {
  const unread = !activityIsRead(activity);
  const displayType = activityDisplayType(activity);
  const priorityClass = priorityActivityTypes().includes(displayType) ? "update-priority" : "";
  const expanded = expandedUpdateIds.has(activity.id);
  const detailHtml = renderUpdateDetail(activity);
  const hasDetails = activityDetailLines(activity).length > 0;
  return `
    <article class="update-item ${unread ? "unread" : ""} ${expanded ? "expanded" : ""} ${priorityClass} update-type-${displayType}" data-activity="${activity.id}">
      <div class="update-time">
        <strong>${activityTimeLabel(activity.createdAt)}</strong>
        ${unread ? `<span>Nova</span>` : ""}
      </div>
      <div class="update-icon"><i data-lucide="${activityIcon(displayType)}"></i></div>
      <div class="update-content">
        <div class="update-meta">
          <span class="update-type-pill">${escapeHtml(activityTypeLabel(displayType))}</span>
          <span><i data-lucide="user-round"></i>${escapeHtml(activityActorLabel(activity, displayType))}</span>
          ${activityResponsibleLabel(activity, displayType) ? `<span class="update-responsible"><i data-lucide="user-check"></i>${escapeHtml(activityResponsibleLabel(activity, displayType))}</span>` : ""}
        </div>
        <h3>${escapeHtml(activity.title)}</h3>
        ${detailHtml}
      </div>
      <div class="inline-actions update-actions">
        ${activity.clientId ? `<button class="small-button" type="button" data-open-update-client="${activity.clientId}" data-client-source="${activity.clientSource || "inss"}" data-activity-id="${activity.id}"><i data-lucide="external-link"></i> Abrir card</button>` : ""}
        ${
          hasDetails
            ? `<button class="small-button" type="button" data-toggle-update-details="${activity.id}" aria-expanded="${expanded}"><i data-lucide="${expanded ? "chevron-up" : "chevron-down"}"></i> ${expanded ? "Recolher" : "Ver detalhes"}</button>`
            : ""
        }
        ${
          unread
            ? `<button class="small-button" type="button" data-mark-activity-read="${activity.id}"><i data-lucide="check"></i> Marcar lida</button>`
            : ""
        }
      </div>
    </article>
  `;
}

function renderUpdateDetail(activity) {
  const lines = activityDetailLines(activity);
  if (!lines.length) return "";
  if (lines.length === 1 && !isChangeLine(lines[0])) {
    return `<p class="update-detail-line">${escapeHtml(formatActivityDetailLine(lines[0]))}</p>`;
  }
  return `
    <ul class="update-change-list">
      ${lines.map((line) => `<li>${formatChangeLineHtml(line)}</li>`).join("")}
    </ul>
  `;
}

function activityDetailLines(activity = {}) {
  const raw = String(activity.detail || "").trim();
  if (!raw) return [];
  const withLineBreaks = raw
    .replace(/\r\n/g, "\n")
    .replace(/\.\s+([A-ZÁÉÍÓÚÂÊÔÃÕÇ][^:.\n]{1,90}:)/g, ".\n$1");
  return withLineBreaks
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatActivityDetailLine(line) {
  return line.replace(/\s+->\s+/g, " → ");
}

function isChangeLine(line) {
  return /:\s+.+\s+(?:->|→)\s+.+/u.test(line);
}

function formatChangeLineHtml(line) {
  const formatted = formatActivityDetailLine(line);
  const match = formatted.match(/^([^:]{1,90}):\s*(.+?)\s+→\s+(.+?)(\.)?$/u);
  if (!match) return escapeHtml(formatted);
  return `<span class="update-change-field">${escapeHtml(match[1])}</span><span class="update-change-before">${escapeHtml(match[2])}</span><i data-lucide="arrow-right"></i><span class="update-change-after">${escapeHtml(match[3])}</span>`;
}

function activityDisplayType(activity = {}) {
  const text = normalize([activity.title, activity.detail].join(" "));
  if (activity.type === "monthly" || text.includes("controle mensal") || text.includes("acompanhamento mensal")) return "monthly";
  return activity.type || "client";
}

function activityActorLabel(activity, displayType = activityDisplayType(activity)) {
  const actor = ownerName(activity.actorId);
  if (["task", "deadline", "meeting"].includes(displayType)) {
    const title = normalize(activity.title);
    if (title.startsWith("criou")) return `Criada por ${actor}`;
    if (title.startsWith("atualizou") || title.startsWith("alterou")) return `Alterada por ${actor}`;
    if (title.startsWith("removeu")) return `Removida por ${actor}`;
  }
  return `Por ${actor}`;
}

function activityResponsibleLabel(activity, displayType = activityDisplayType(activity)) {
  if (!["task", "deadline", "meeting"].includes(displayType)) return "";
  const ownerId = activity.ownerId || activityOwnerFromCurrentState(activity, displayType);
  return ownerId ? `Responsável: ${ownerName(ownerId)}` : "";
}

function activityOwnerFromCurrentState(activity, displayType) {
  if (activity.internalTaskId && displayType === "task") {
    return state.internalTasks.find((task) => task.id === activity.internalTaskId)?.ownerId || "";
  }
  return "";
}

function priorityActivityTypes() {
  return ["note", "task", "deadline", "monthly"];
}

function matchesActivityPeriod(activity, periodFilter) {
  if (!periodFilter) return true;
  const date = new Date(activity.createdAt);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  if (periodFilter === "today") return activityDayKey(date) === activityDayKey(today);
  if (periodFilter === "week") {
    const start = new Date(today);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - 6);
    return date >= start;
  }
  return true;
}

function activityDayKey(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "Sem data";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function activityDayLabel(dayKey) {
  if (dayKey === "Sem data") return dayKey;
  const today = activityDayKey(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = activityDayKey(yesterday);
  if (dayKey === today) return "Hoje";
  if (dayKey === yesterdayKey) return "Ontem";
  return formatDate(dayKey);
}

function activityTimeLabel(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "--:--";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function regularizationStatusOptions() {
  return ["Em análise", "Documentos pendentes", "Em andamento", "Aguardando cliente", "Finalizado"];
}

function renderRegularizationClients() {
  const processes = filteredRegularizationClients();
  el.regularizationList.innerHTML = processes.length
    ? processes.map(renderRegularizationCard).join("")
    : `<p class="empty-state">Nenhum processo de regularização cadastrado.</p>`;

  document.querySelectorAll("[data-edit-regularization]").forEach((button) => {
    button.addEventListener("click", () => openRegularizationDialog(button.dataset.editRegularization));
  });
  document.querySelectorAll("[data-delete-regularization]").forEach((button) => {
    button.addEventListener("click", () => deleteRegularizationProcess(button.dataset.deleteRegularization));
  });
  refreshIcons();
}

function filteredRegularizationClients() {
  const query = normalize(el.regularizationSearchInput.value);
  return [...state.regularizationClients]
    .filter((process) => {
      const haystack = normalize([
        process.clientName,
        process.propertyType,
        process.clientOrigin,
        process.cityState,
        process.address,
        process.status,
        process.nextAction,
        process.notes,
      ].join(" "));
      return !query || haystack.includes(query);
    })
    .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
}

function renderRegularizationCard(process) {
  const isFinished = normalize(process.status) === "finalizado";
  const details = [process.propertyType, process.cityState].filter(Boolean).join(" | ");
  return `
    <article class="regularization-card ${isFinished ? "finished" : ""}">
      <header>
        <div>
          <h3>${escapeHtml(process.clientName || "Cliente sem nome")}</h3>
          <p>${escapeHtml(details || "Imóvel sem detalhe informado")}</p>
        </div>
        <span class="regularization-status">${escapeHtml(process.status || "Em análise")}</span>
      </header>
      <div class="card-meta">
        <span><i data-lucide="map-pin"></i>${escapeHtml(process.address || "Endereço não informado")}</span>
        <span><i data-lucide="tag"></i>${escapeHtml(process.clientOrigin || "Origem não informada")}</span>
        <span><i data-lucide="calendar-check"></i>${escapeHtml(process.contractClosedDate ? `Fechado em ${formatDate(process.contractClosedDate)}` : "Sem fechamento")}</span>
        <span><i data-lucide="circle-dollar-sign"></i>${escapeHtml(process.feeValue || "Honorários não informados")}</span>
      </div>
      <p>${escapeHtml(process.nextAction || "Sem próxima ação registrada.")}</p>
      ${process.notes ? `<p class="regularization-note">${escapeHtml(process.notes)}</p>` : ""}
      <footer class="regularization-actions">
        <small>Atualizado em ${formatDateTime(process.updatedAt || process.createdAt)}</small>
        <span class="inline-actions">
          <button class="small-button" type="button" data-edit-regularization="${process.id}"><i data-lucide="pencil"></i> Editar</button>
          <button class="icon-button danger-icon" type="button" data-delete-regularization="${process.id}" aria-label="Remover processo"><i data-lucide="trash-2"></i></button>
        </span>
      </footer>
    </article>
  `;
}

function openRegularizationDialog(processId = null) {
  const process = state.regularizationClients.find((item) => item.id === processId);
  const current = normalizeRegularizationClient(process || {});
  openSimpleDialog(process ? "Editar regularização" : "Novo processo de regularização", [
    { label: "Nome do cliente", name: "clientName", type: "text", value: current.clientName },
    {
      label: "Tipo de imóvel",
      name: "propertyType",
      type: "select",
      value: current.propertyType,
      options: [{ value: "", label: "Selecionar" }, ...destinationValues().map((destination) => ({ value: destination, label: destination }))],
    },
    {
      label: "Origem",
      name: "clientOrigin",
      type: "select",
      value: current.clientOrigin,
      options: [{ value: "", label: "Selecionar" }, ...clientOriginValues().map((origin) => ({ value: origin, label: origin }))],
    },
    {
      label: "Estado",
      name: "cityState",
      type: "select",
      value: current.cityState,
      options: [{ value: "", label: "Selecionar" }, ...brazilianStates().map((stateValue) => ({ value: stateValue, label: stateValue }))],
    },
    { label: "Endereço", name: "address", type: "text", value: current.address },
    { label: "Fechamento do contrato", name: "contractClosedDate", type: "date", value: current.contractClosedDate },
    { label: "Valor dos honorários", name: "feeValue", type: "money", value: current.feeValue },
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
      propertyType: normalizeSelectValue(values.propertyType, destinationValues()) || "",
      cityState: normalizeSelectValue(values.cityState, brazilianStates()) || "",
      feeValue: formatCurrencyValue(values.feeValue || ""),
      updatedAt: now,
      createdAt: current.createdAt || now,
    });
    if (process) {
      Object.assign(process, payload);
      recordActivity("client", `Atualizou regularização: ${payload.clientName}.`, payload.status);
    } else {
      state.regularizationClients.unshift({ ...payload, id: id(), createdAt: now, updatedAt: now });
      recordActivity("client", `Criou regularização: ${payload.clientName}.`, payload.status);
    }
    saveState();
    renderRegularizationClients();
    renderDataDashboard();
    renderGoalsDashboard();
    renderUpdates();
  });
}

function deleteRegularizationProcess(processId) {
  const process = state.regularizationClients.find((item) => item.id === processId);
  if (!process) return;
  const confirmed = confirm(`Excluir o processo de regularização de ${process.clientName || "cliente"}?`);
  if (!confirmed) return;
  state.regularizationClients = state.regularizationClients.filter((item) => item.id !== processId);
  recordActivity("client", `Removeu regularização: ${process.clientName || "Cliente sem nome"}.`, "");
  saveState();
  renderRegularizationClients();
  renderDataDashboard();
  renderGoalsDashboard();
  renderUpdates();
}

function openClientTasks(client = {}) {
  return (client.tasks || []).filter((task) => localizeLabel(task.status) !== "Concluída");
}

function isPastDate(dateValue) {
  return Boolean(dateValue) && dateValue < localDateKey();
}

function isTodayDate(dateValue) {
  return Boolean(dateValue) && dateValue === localDateKey();
}

function isUpcomingDate(dateValue, days = 7) {
  if (!dateValue) return false;
  const today = localDateKey();
  const limit = localDateKey(addDays(new Date(), days));
  return dateValue > today && dateValue <= limit;
}

function clientDeadlineSummary(client = {}) {
  const all = client.deadlines || [];
  return {
    all,
    overdue: all.filter((deadline) => isPastDate(deadline.date)),
    today: all.filter((deadline) => isTodayDate(deadline.date)),
    upcoming: all.filter((deadline) => isUpcomingDate(deadline.date)),
  };
}

function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function currentMonthRow(client = {}) {
  const key = currentMonthKey();
  return (client.monthly || []).find((row) => row.month === key) || null;
}

function monthlyStatusProgress(row = null) {
  const fields = ["receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"];
  if (!row) return { done: false, doneCount: 0, total: fields.length, missing: fields };
  const missing = fields.filter((field) => !row[field]);
  return { done: missing.length === 0, doneCount: fields.length - missing.length, total: fields.length, missing };
}

function clientHasCurrentMonthInPeriod(client = {}) {
  const month = currentMonthKey();
  const start = client.startDate ? client.startDate.slice(0, 7) : "";
  const end = client.endDate ? client.endDate.slice(0, 7) : "";
  if (start && end) return month >= start && month <= end;
  return Boolean((client.monthly || []).length && !isClientFinished(client));
}

function isCurrentMonthPending(client = {}) {
  if (isClientFinished(client)) return false;
  const row = currentMonthRow(client);
  if (row) return !monthlyStatusProgress(row).done;
  return clientHasCurrentMonthInPeriod(client);
}

function currentMonthStatusLabel(client = {}) {
  const row = currentMonthRow(client);
  if (!row) return clientHasCurrentMonthInPeriod(client) ? "Mês atual sem controle" : "Mensal sem alerta";
  const progress = monthlyStatusProgress(row);
  return progress.done ? "Mês atual em dia" : `Mês atual ${progress.doneCount}/${progress.total}`;
}

function clientHasStatusName(client = {}, patterns = []) {
  const names = getClientStatuses(client).map((status) => normalize(status.name));
  return patterns.some((pattern) => names.some((name) => name.includes(normalize(pattern))));
}

function guideAwaitingPayment(client = {}) {
  const row = currentMonthRow(client);
  return clientHasStatusName(client, ["Aguardando pagamento da guia"]) || Boolean(row && (row.guideIssued || row.guideSent) && !row.guidePaid);
}

function clientDataGaps(client = {}) {
  const gaps = [];
  if (!client.internalOwner) gaps.push("responsável");
  if (!client.state) gaps.push("estado");
  if (!client.area) gaps.push("área");
  if (!client.startDate) gaps.push("início");
  if (!client.endDate) gaps.push("fim");
  if (!client.feeValue) gaps.push("honorários");
  if (!client.inssOriginalValue) gaps.push("INSS sem redução");
  if (!client.inssReducedValue) gaps.push("INSS com redução");
  return gaps;
}

function clientAttentionReasons(client = {}) {
  const reasons = [];
  const tasks = openClientTasks(client);
  const overdueTasks = tasks.filter((task) => isPastDate(task.dueDate));
  const deadlines = clientDeadlineSummary(client);
  if (overdueTasks.length) reasons.push({ label: `${overdueTasks.length} tarefa(s) atrasada(s)`, tone: "critical" });
  if (deadlines.today.length) reasons.push({ label: `${deadlines.today.length} prazo(s) hoje`, tone: "critical" });
  if (guideAwaitingPayment(client)) reasons.push({ label: "Guia aguardando pagamento", tone: "warning" });
  if (clientHasStatusName(client, ["Pendência do cliente", "Aguardando cliente"])) reasons.push({ label: "Pendência do cliente", tone: "warning" });
  if (!String(client.nextAction || "").trim()) reasons.push({ label: "Sem próxima ação", tone: "info" });
  if (!client.internalOwner) reasons.push({ label: "Sem responsável", tone: "warning" });
  if (isCurrentMonthPending(client)) reasons.push({ label: "Mês atual pendente", tone: "warning" });
  return reasons;
}

function clientUrgencyScore(client = {}) {
  if (isClientFinished(client)) return -100;
  const tasks = openClientTasks(client);
  const deadlines = clientDeadlineSummary(client);
  let score = 0;
  score += tasks.filter((task) => isPastDate(task.dueDate)).length * 100;
  score += deadlines.today.length * 90;
  score += deadlines.overdue.length * 80;
  score += deadlines.upcoming.length * 45;
  if (guideAwaitingPayment(client)) score += 55;
  if (clientHasStatusName(client, ["Pendência do cliente", "Aguardando cliente"])) score += 45;
  if (isCurrentMonthPending(client)) score += 35;
  if (!client.internalOwner) score += 30;
  if (!String(client.nextAction || "").trim()) score += 18;
  score += Math.min(clientDataGaps(client).length * 4, 20);
  return score;
}

function nextDeadlineLabel(client = {}) {
  const dated = (client.deadlines || [])
    .filter((deadline) => deadline.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!dated.length) return "";
  const next = dated.find((deadline) => deadline.date >= localDateKey()) || dated[0];
  return `${next.title || "Prazo"}: ${formatShortDate(next.date)}`;
}

function filteredClients() {
  const query = normalize(el.searchInput.value);
  const statusId = el.statusFilter.value;
  const clients = state.clients.filter((client) => {
    const haystack = normalize([
      client.clientName,
      client.fullName,
      client.cpf,
      client.phone,
      client.destination,
      client.workType,
      client.infoOwner,
      client.workResponsible,
      client.folderPath,
    ].join(" "));
    const matchesQuery = !query || haystack.includes(query);
    const matchesStatus = !statusId || (client.statusIds || []).includes(statusId);
    return matchesQuery && matchesStatus && clientMatchesQuickFilter(client);
  });
  return sortClients(clients, el.clientSort.value);
}

function clientMatchesQuickFilter(client) {
  if (activeClientQuickFilter === "finished") return isClientFinished(client);
  if (activeClientQuickFilter === "tasks") return clientOpenTasks(client).length > 0;
  if (activeClientQuickFilter === "deadlines") return (client.deadlines || []).length > 0;
  if (activeClientQuickFilter === "no-status") return !getClientStatuses(client).length;
  return !isClientFinished(client);
}

function sortClients(clients, sortMode) {
  if (sortMode === "recent") {
    return clients.sort((a, b) => clientCreatedTime(b) - clientCreatedTime(a));
  }
  if (sortMode === "active") {
    return clients.sort((a, b) => Number(isClientFinished(a)) - Number(isClientFinished(b)) || clientCreatedTime(b) - clientCreatedTime(a));
  }
  if (sortMode === "finished") {
    return clients.sort((a, b) => Number(isClientFinished(b)) - Number(isClientFinished(a)) || clientCreatedTime(b) - clientCreatedTime(a));
  }
  return clients;
}

function clientCreatedTime(client) {
  return new Date(client.createdAt || client.updatedAt || 0).getTime();
}

function clientOpenTasks(client = {}) {
  return (client.tasks || []).filter((task) => localizeLabel(task.status) !== "Concluída");
}

function renderClientCard(client) {
  const clientStatuses = getClientStatuses(client);
  const statuses = clientStatuses
    .slice(0, 5)
    .map((status) => chip(status))
    .join("");
  const completionClass = isClientFinished(client) ? "finished" : "active-work";
  const openTasks = (client.tasks || []).filter((task) => localizeLabel(task.status) !== "Concluída");
  const deadlines = client.deadlines || [];
  const taskOwners = ownerSummary(openTasks.map((task) => task.ownerId));
  const deadlineOwners = ownerSummary(deadlines.map((deadline) => deadline.ownerId));
  const workTitle = client.workTitle && client.workTitle !== "Obra principal" ? `${client.workTitle} | ` : "";
  const workSubtitle = `${workTitle}${destinationLabel(client)}`;
  const workDetails = [client.state, client.area].filter(Boolean).join(" | ");
  return `
    <button class="client-card ${completionClass}" type="button" data-open-client="${client.id}">
      <header>
        <div>
          <h3>${escapeHtml(client.clientName || "Cliente sem nome")}</h3>
          <p>${escapeHtml(workSubtitle)} ${workDetails ? `| ${escapeHtml(workDetails)}` : ""}</p>
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
      <p>${escapeHtml(client.nextAction || "Sem próxima ação registrada.")}</p>
    </button>
  `;
}

function renderCompactClients(clients) {
  el.compactView.innerHTML = clients.length
    ? `
      <div class="compact-client-table">
        <div class="compact-client-head">
          <span>Cliente</span>
          <span>UF</span>
          <span>Área</span>
          <span>Status</span>
          <span>Tarefas</span>
          <span>Prazos</span>
          <span>Próxima ação</span>
          <span></span>
        </div>
        ${clients.map((client) => renderCompactClientRow(client)).join("")}
      </div>
    `
    : `<p class="empty-state">Nenhum cliente encontrado.</p>`;
}

function renderCompactClientRow(client) {
  const statuses = getClientStatuses(client);
  const openTasks = clientOpenTasks(client);
  const deadlines = client.deadlines || [];
  const workTitle = client.workTitle && client.workTitle !== "Obra principal" ? `${client.workTitle} | ` : "";
  const workLine = [workTitle ? workTitle.slice(0, -3) : "", destinationLabel(client)].filter(Boolean).join(" | ");
  const nextAction = String(client.nextAction || "").trim();
  const taskOwners = ownerSummary(openTasks.map((task) => task.ownerId));
  const deadlineOwners = ownerSummary(deadlines.map((deadline) => deadline.ownerId));
  return `
    <button class="compact-client-row ${isClientFinished(client) ? "finished" : "active-work"}" type="button" data-open-client="${client.id}">
      <span class="compact-client-main">
        <strong>${escapeHtml(client.clientName || "Cliente sem nome")}</strong>
        <small>${escapeHtml(workLine)}</small>
      </span>
      <span class="compact-client-state">${escapeHtml(client.state || "--")}</span>
      <span class="compact-client-area">${escapeHtml(client.area || "--")}</span>
      <span class="compact-client-status">${compactStatusChips(statuses)}</span>
      <span class="compact-client-count ${openTasks.length ? "attention" : ""}">
        <i data-lucide="list-checks"></i>
        <strong>${openTasks.length}</strong>
        <small>${openTasks.length ? escapeHtml(taskOwners) : "Sem tarefa"}</small>
      </span>
      <span class="compact-client-count ${deadlines.length ? "deadline" : ""}">
        <i data-lucide="calendar-clock"></i>
        <strong>${deadlines.length}</strong>
        <small>${deadlines.length ? escapeHtml(deadlineOwners) : "Sem prazo"}</small>
      </span>
      <span class="compact-client-next">${escapeHtml(nextAction || "Sem próxima ação")}</span>
      <span class="compact-open-pill">Abrir</span>
    </button>
  `;
}

function compactStatusChips(statuses) {
  if (!statuses.length) return `<span class="chip neutral">Sem status</span>`;
  const visible = statuses.slice(0, 2).map((status) => chip(status)).join("");
  const remaining = statuses.length - 2;
  return `${visible}${remaining > 0 ? `<span class="chip neutral compact-overflow">+${remaining}</span>` : ""}`;
}

function bindClientQuickActions() {
  document.querySelectorAll("[data-quick-client-action]").forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation();
      handleClientQuickAction(button.dataset.clientId, button.dataset.quickClientAction);
    };
  });
}

function handleClientQuickAction(clientId, action) {
  const client = state.clients.find((item) => item.id === clientId);
  if (!client) return;
  if (action === "task") {
    openClient(cloneData(client));
    switchTab("tasksTab");
    openClientTaskDialog();
    return;
  }
  if (action === "deadline") {
    openClient(cloneData(client));
    switchTab("deadlinesTab");
    openClientDeadlineDialog();
    return;
  }
  if (action === "note") {
    openClient(cloneData(client));
    switchTab("notesTab");
    window.setTimeout(() => el.newNoteText?.focus(), 80);
    return;
  }
  if (action === "waiting") {
    const status = ensureStatusByName("Pendência do cliente", "#b91c1c");
    client.statusIds = [...new Set([...(client.statusIds || []), status.id])];
    client.updatedAt = new Date().toISOString();
    recordActivity("status", `Marcou pendência do cliente em ${client.clientName || "cliente"}.`, status.name, {
      clientId: client.id,
      clientName: client.clientName,
    });
    saveState();
    renderAll();
    return;
  }
  if (action === "whatsapp") {
    let digits = onlyDigits(client.phone);
    const ddd = onlyDigits(client.whatsappDdd);
    if (digits.length <= 9 && ddd) digits = `${ddd}${digits}`;
    if (!digits) {
      alert("Este cliente ainda não tem telefone cadastrado.");
      return;
    }
    window.open(`https://wa.me/55${digits}`, "_blank", "noopener");
    return;
  }
  if (action === "folder") {
    if (!client.folderPath) {
      alert("Este cliente ainda não tem pasta cadastrada.");
      return;
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(client.folderPath).then(
        () => alert("Caminho da pasta copiado."),
        () => prompt("Copie o caminho da pasta:", client.folderPath)
      );
      return;
    }
    prompt("Copie o caminho da pasta:", client.folderPath);
  }
}

function ensureStatusByName(name, color = "#009f7f") {
  const existing = state.statuses.find((status) => normalize(status.name) === normalize(name));
  if (existing) return existing;
  const status = { id: id(), name, color };
  state.statuses.push(status);
  return status;
}

function setViewMode(mode) {
  activeViewMode = mode;
  el.listModeButton.classList.toggle("active", mode === "list");
  el.compactModeButton.classList.toggle("active", mode === "compact");
  renderClients();
}

function setTaskCalendarMode(mode) {
  activeTaskCalendarMode = mode;
  renderTaskCenter();
}

function moveTaskPeriod(direction) {
  const nextDate = new Date(activeTaskDate);
  if (activeTaskCalendarMode === "day") {
    nextDate.setDate(nextDate.getDate() + direction);
  } else if (activeTaskCalendarMode === "week") {
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
  activeClient.documentType = documentTypeForClient(activeClient);
  activeClient.cpf = formatFieldValue("cpf", activeClient.cpf || "");
  activeClient.phone = formatFieldValue("phone", activeClient.phone || "");
  activeClient.area = formatFieldValue("area", activeClient.area || "");
  normalizeClientSelectValues(activeClient);
  el.clientDialogTitle.textContent = client.clientName || "Novo cliente";
  renderUserSelects();
  fillClientFields();
  renderDestinationOptions();
  renderActiveStatuses();
  renderStatusPicker();
  renderMonthlyTable();
  renderTasks();
  renderDeadlines();
  renderNotes();
  renderHistory();
  renderWorkerMessages();
  renderFinanceMessages();
  syncReferralCommissionFields();
  renderInssReduction();
  switchTab("summaryTab");
  el.clientDialog.showModal();
  refreshIcons();
}

function fillClientFields() {
  document.querySelectorAll("[data-field]").forEach((input) => {
    input.value = activeClient[input.dataset.field] || "";
  });
}

function renderDestinationOptions() {
  const selected = new Set(destinationList(activeClient.destination));
  document.querySelectorAll("[data-destination-option]").forEach((input) => {
    input.checked = selected.has(input.value);
  });
}

function syncDestinationOptions() {
  if (!activeClient) return;
  activeClient.destination = Array.from(document.querySelectorAll("[data-destination-option]:checked"))
    .map((input) => input.value)
    .join(" + ");
}

function renderInssReduction() {
  if (!activeClient || !el.inssReductionSummary || !el.inssReductionResults) return;
  const values = inssReductionValues(activeClient);
  el.inssReductionSummary.innerHTML = [
    reductionValue("INSS sem redução", values.original, "original"),
    reductionValue("INSS com redução", values.reduced, "reduced"),
    reductionValue("Economia bruta", values.grossEconomy, "gross"),
    reductionValue("Economia líquida estimada", values.netEconomy, "net"),
    reductionValue("Redução", values.reductionPercent, "percent"),
  ].join("");
  el.inssReductionResults.innerHTML = [
    reductionValue("Economia bruta", values.grossEconomy, "gross"),
    reductionValue("Total com honorários", values.totalWithFees, "total"),
    reductionValue("Economia líquida estimada", values.netEconomy, "net"),
    reductionValue("Percentual de redução", values.reductionPercent, "percent"),
  ].join("");
}

function reductionValue(label, value, modifier = "") {
  return `
    <article class="reduction-value ${modifier}">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </article>
  `;
}

function inssReductionValues(client) {
  const original = currencyAmount(client.inssOriginalValue);
  const reduced = currencyAmount(client.inssReducedValue);
  const fee = currencyAmount(client.feeValue);
  const hasValues = original !== null && reduced !== null;
  const grossEconomy = hasValues ? original - reduced : null;
  const totalWithFees = reduced !== null && fee !== null ? reduced + fee : null;
  const netEconomy = original !== null && totalWithFees !== null ? original - totalWithFees : null;
  const reductionPercent = hasValues && original ? (grossEconomy / original) * 100 : null;

  return {
    original: calculatedCurrency(original),
    reduced: calculatedCurrency(reduced),
    grossEconomy: calculatedCurrency(grossEconomy),
    totalWithFees: calculatedCurrency(totalWithFees),
    netEconomy: calculatedCurrency(netEconomy),
    reductionPercent: calculatedPercent(reductionPercent),
  };
}

function renderOperationalChecklist() {
  if (!activeClient || !el.operationalChecklist) return;
  const items = operationalChecklistItems(activeClient);
  el.operationalChecklist.innerHTML = items
    .map(
      (item) => `
        <article class="checklist-item ${item.done ? "done" : "pending"}">
          <i data-lucide="${item.done ? "check" : "circle"}"></i>
          <div>
            <strong>${escapeHtml(item.label)}</strong>
            <span>${escapeHtml(item.hint)}</span>
          </div>
        </article>
      `
    )
    .join("");
  refreshIcons();
}

function operationalChecklistItems(client = {}) {
  const monthlyRow = currentMonthRow(client);
  const monthly = monthlyStatusProgress(monthlyRow);
  return [
    {
      label: "Contrato",
      done: Boolean(client.contractClosedDate || clientHasStatusName(client, ["Contrato pago"])),
      hint: client.contractClosedDate ? `Fechado em ${formatDate(client.contractClosedDate)}` : "Sem fechamento informado",
    },
    {
      label: "Procuração",
      done: documentIsReady(client, ["procuração", "e-cac"]) || !clientHasStatusName(client, ["Procuração e-CAC pendente"]),
      hint: clientHasStatusName(client, ["Procuração e-CAC pendente"]) ? "Pendente no status" : "Sem pendência marcada",
    },
    {
      label: "Docs da obra",
      done: documentIsReady(client, ["alvará", "habite", "obra"]) || !clientHasStatusName(client, ["Documentos da obra pendentes"]),
      hint: clientHasStatusName(client, ["Documentos da obra pendentes"]) ? "Documentos pendentes" : "Sem pendência marcada",
    },
    {
      label: "CNO",
      done: documentIsReady(client, ["cno"]) || !clientHasStatusName(client, ["CNO pendente"]),
      hint: clientHasStatusName(client, ["CNO pendente"]) ? "CNO pendente" : "Sem pendência marcada",
    },
    {
      label: "Trabalhadores",
      done: Boolean(client.workersNotes || (client.workerMessages || []).length),
      hint: client.workersNotes || (client.workerMessages || []).length ? "Informações registradas" : "Sem registro",
    },
    {
      label: "Recibos",
      done: Boolean(monthlyRow && monthlyRow.receiptSent && monthlyRow.receiptSigned),
      hint: monthlyRow ? "Competência atual conferida" : "Sem mês atual",
    },
    {
      label: "eSocial",
      done: Boolean(monthlyRow && monthlyRow.remunerationSent),
      hint: monthlyRow?.remunerationSent ? "Remuneração enviada" : "Remuneração pendente",
    },
    {
      label: "Guia",
      done: Boolean(monthlyRow && monthlyRow.guideIssued && monthlyRow.guideSent && monthlyRow.guidePaid),
      hint: monthlyRow ? `${monthly.doneCount}/${monthly.total} etapas do mês` : "Sem competência atual",
    },
    {
      label: "Receita",
      done: clientHasStatusName(client, ["CND emitida"]) || clientHasStatusName(client, ["Aguardando decisão Receita"]),
      hint: clientHasStatusName(client, ["CND emitida"]) ? "CND emitida" : "Acompanhar requerimento",
    },
    {
      label: "CND",
      done: clientHasStatusName(client, ["CND emitida"]),
      hint: clientHasStatusName(client, ["CND emitida"]) ? "Emitida" : "Não emitida",
    },
    {
      label: "NF",
      done: !clientHasStatusName(client, ["NF pendente"]),
      hint: clientHasStatusName(client, ["NF pendente"]) ? "NF pendente" : "Sem pendência marcada",
    },
  ];
}

function documentIsReady(client = {}, keywords = []) {
  return (client.documents || []).some((doc) => {
    const name = normalize(doc.name);
    const matches = keywords.some((keyword) => name.includes(normalize(keyword)));
    const status = normalize(doc.status);
    return matches && ["recebido", "aprovado", "nao possui"].some((ready) => status.includes(ready));
  });
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

function renderMonthlyProgressList() {
  if (!el.monthlyProgressList || !activeClient) return;
  const rows = [...(activeClient.monthly || [])].sort((a, b) => a.month.localeCompare(b.month));
  const current = currentMonthKey();
  el.monthlyProgressList.innerHTML = rows.length
    ? rows
        .map((row) => {
          const progress = monthlyStatusProgress(row);
          return `
            <article class="monthly-progress-card ${row.month === current ? "current" : ""} ${progress.done ? "done" : "pending"}">
              <strong>${escapeHtml(row.month || "Sem competência")}</strong>
              <span>${progress.doneCount}/${progress.total} etapas</span>
              <div class="monthly-progress-bar"><span style="width:${Math.round((progress.doneCount / progress.total) * 100)}%"></span></div>
              <small>${escapeHtml(monthlyMissingLabel(progress.missing))}</small>
            </article>
          `;
        })
        .join("")
    : `<p class="empty-state compact">Nenhuma competência mensal cadastrada.</p>`;
}

function monthlyMissingLabel(missing = []) {
  if (!missing.length) return "Tudo concluído";
  const labels = {
    receiptSent: "recibo enviado",
    receiptSigned: "recibo assinado",
    remunerationSent: "remuneração",
    guideIssued: "guia emitida",
    guideSent: "guia enviada",
    guidePaid: "guia paga",
  };
  return `Pendente: ${missing.slice(0, 3).map((field) => labels[field]).join(", ")}${missing.length > 3 ? "..." : ""}`;
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
                ${task.description ? `<p class="task-message-description">${escapeHtml(task.description)}</p>` : ""}
                ${task.followUpNotes ? `<p class="task-message-description"><strong>Anotação:</strong> ${escapeHtml(task.followUpNotes)}</p>` : ""}
                <div class="task-message-meta">
                  <span>Cadastrada por ${escapeHtml(ownerName(task.createdBy))}</span>
                  <span>Responsável: ${escapeHtml(ownerName(task.ownerId))}</span>
                  <span>${task.dueDate ? `Prazo: ${formatDate(task.dueDate)}` : "Sem prazo"}</span>
                  <span>Prioridade: ${escapeHtml(normalizeTaskPriority(task.priority))}</span>
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

function renderFinanceMessages() {
  const messages = Array.isArray(activeClient.financeMessages) ? activeClient.financeMessages : [];
  el.financeMessagesList.innerHTML = messages.length
    ? [...messages]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(
          (message) => `
            <article class="note-message" data-finance-message="${message.id}">
              <p class="note-text">${escapeHtml(message.text || "")}</p>
              <textarea class="note-edit-field" data-finance-message-field="text" hidden>${escapeHtml(message.text || "")}</textarea>
              <div class="note-footer">
                <span>${escapeHtml(ownerName(message.userId))} | ${formatDateTime(message.createdAt)}${message.updatedAt ? " | editada" : ""}</span>
                <button type="button" data-edit-finance-message="${message.id}">Editar</button>
                <button type="button" data-save-finance-message="${message.id}" hidden>Salvar</button>
                <button type="button" data-remove-finance-message="${message.id}" aria-label="Remover observação financeira">×</button>
              </div>
            </article>
          `
        )
        .join("")
    : `<p class="empty-state">Nenhuma observação financeira registrada.</p>`;

  document.querySelectorAll("[data-edit-finance-message]").forEach((button) => {
    button.addEventListener("click", () => {
      const wrapper = button.closest("[data-finance-message]");
      wrapper.querySelector(".note-text").hidden = true;
      wrapper.querySelector("[data-finance-message-field]").hidden = false;
      button.hidden = true;
      wrapper.querySelector("[data-save-finance-message]").hidden = false;
    });
  });

  document.querySelectorAll("[data-save-finance-message]").forEach((button) => {
    button.addEventListener("click", () => {
      const message = activeClient.financeMessages.find((item) => item.id === button.dataset.saveFinanceMessage);
      const box = document.querySelector(`[data-finance-message="${message.id}"] [data-finance-message-field="text"]`);
      message.text = box.value.trim();
      message.updatedAt = new Date().toISOString();
      renderFinanceMessages();
    });
  });

  document.querySelectorAll("[data-remove-finance-message]").forEach((button) => {
    button.addEventListener("click", () => {
      activeClient.financeMessages = activeClient.financeMessages.filter((message) => message.id !== button.dataset.removeFinanceMessage);
      renderFinanceMessages();
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
  activeClient.documents = Array.isArray(activeClient.documents) ? activeClient.documents : [];
  el.documentsList.innerHTML = activeClient.documents.length
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
    : `
      <div class="document-empty-state">
        <p class="empty-state">Nenhum documento cadastrado.</p>
        <button id="addDefaultDocumentsButton" class="secondary-button" type="button"><i data-lucide="list-plus"></i> Adicionar checklist padrão</button>
      </div>
    `;
  bindCollectionFields("doc", activeClient.documents, renderDocuments);
  document.getElementById("addDefaultDocumentsButton")?.addEventListener("click", () => {
    addDefaultDocuments();
    renderDocuments();
    renderOperationalChecklist();
  });
}

function addDefaultDocuments() {
  const existing = new Set((activeClient.documents || []).map((doc) => normalize(doc.name)));
  defaultDocumentNames().forEach((name) => {
    if (!existing.has(normalize(name))) {
      activeClient.documents.push({ id: id(), name, status: "Pendente", path: "" });
    }
  });
}

function defaultDocumentNames() {
  return [
    "Procuração e-CAC",
    "Documentos do cliente",
    "Alvará",
    "Habite-se",
    "CNO",
    "Matrícula",
    "Documentos da obra",
    "Comprovante de pagamento da guia",
    "CND",
    "Nota fiscal",
  ];
}

function bindCollectionFields(type, collection, rerender) {
  document.querySelectorAll(`[data-${type}]`).forEach((row) => {
    const item = collection.find((entry) => entry.id === row.dataset[type]);
    row.querySelectorAll(`[data-${type}-field]`).forEach((input) => {
      input.addEventListener("input", () => {
        item[input.dataset[`${type}Field`]] = input.value;
        if (type === "doc") renderOperationalChecklist();
      });
      input.addEventListener("change", () => {
        item[input.dataset[`${type}Field`]] = input.value;
        if (type === "doc") renderOperationalChecklist();
      });
    });
  });
  document.querySelectorAll(`[data-remove-${type}]`).forEach((button) => {
    button.addEventListener("click", () => {
      const idValue = button.dataset[`remove${capitalize(type)}`];
      const index = collection.findIndex((item) => item.id === idValue);
      if (index >= 0) collection.splice(index, 1);
      rerender();
      if (type === "doc") renderOperationalChecklist();
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

function addFinanceMessage() {
  const text = el.newFinanceMessageText.value.trim();
  if (!text) return;
  activeClient.financeMessages = Array.isArray(activeClient.financeMessages) ? activeClient.financeMessages : [];
  activeClient.financeMessages.unshift({
    id: id(),
    text,
    userId: currentUser.id,
    createdAt: new Date().toISOString(),
    updatedAt: null,
  });
  el.newFinanceMessageText.value = "";
  renderFinanceMessages();
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
  if (!activeClient.clientName.trim()) {
    activeClient.clientName = activeClient.fullName || "Cliente sem nome";
  }
  const index = state.clients.findIndex((client) => client.id === activeClient.id);
  const previousClient = index >= 0 ? state.clients[index] : null;
  const changes = previousClient ? summarizeClientChanges(previousClient, activeClient) : [];
  activeClient.updatedAt = new Date().toISOString();

  if (previousClient && changes.length) {
    addHistoryEntry(activeClient, "Card atualizado", changes, "system");
    recordClientChangeActivities(previousClient, activeClient, changes);
  }

  if (index >= 0) {
    state.clients[index] = cloneData(activeClient);
  } else {
    addHistoryEntry(activeClient, "Card criado", ["Novo card incluído no administrativo."], "system");
    recordActivity("client", `Criou o cliente ${activeClient.clientName}.`, "Novo card incluído no fluxo de clientes ativos.", {
      clientId: activeClient.id,
      clientName: activeClient.clientName,
    });
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

function recordClientChangeActivities(previousClient, nextClient, changes) {
  const context = { clientId: nextClient.id, clientName: nextClient.clientName || "Cliente sem nome" };
  const addedNotes = addedCollectionItems(previousClient.notes, nextClient.notes);
  const addedTasks = addedCollectionItems(previousClient.tasks, nextClient.tasks);
  const changedTasks = changedCollectionItems(previousClient.tasks, nextClient.tasks);
  const addedDeadlines = addedCollectionItems(previousClient.deadlines, nextClient.deadlines);
  const changedDeadlines = changedCollectionItems(previousClient.deadlines, nextClient.deadlines);
  const addedMonthly = addedCollectionItems(previousClient.monthly, nextClient.monthly);
  const changedMonthly = changedCollectionItems(previousClient.monthly, nextClient.monthly);
  const addedHistory = addedCollectionItems(previousClient.history, nextClient.history).filter((entry) => entry.type === "manual");
  const addedFinanceMessages = addedCollectionItems(previousClient.financeMessages, nextClient.financeMessages);
  const previousStatuses = new Set(previousClient.statusIds || []);
  const nextStatuses = new Set(nextClient.statusIds || []);

  addedNotes.forEach((note) => {
    recordActivity("note", `Adicionou anotação em ${context.clientName}.`, truncateHistoryValue(note.text || "Anotação sem texto", 120), context);
  });
  addedTasks.forEach((task) => {
    recordActivity("task", `Criou tarefa em ${context.clientName}.`, task.title || "Tarefa sem título", { ...context, ownerId: task.ownerId });
  });
  changedTasks.forEach((task) => {
    recordActivity("task", `Atualizou tarefa em ${context.clientName}.`, task.title || "Tarefa sem título", { ...context, ownerId: task.ownerId });
  });
  addedDeadlines.forEach((deadline) => {
    recordActivity("deadline", `Criou prazo em ${context.clientName}.`, `${deadline.title || "Prazo sem título"}${deadline.date ? ` | ${formatDate(deadline.date)}` : ""}`, { ...context, ownerId: deadline.ownerId });
  });
  changedDeadlines.forEach((deadline) => {
    recordActivity("deadline", `Atualizou prazo em ${context.clientName}.`, `${deadline.title || "Prazo sem título"}${deadline.date ? ` | ${formatDate(deadline.date)}` : ""}`, { ...context, ownerId: deadline.ownerId });
  });
  addedMonthly.forEach((row) => {
    recordActivity("monthly", `Criou controle mensal em ${context.clientName}.`, monthlyActivityDetail(row), context);
  });
  const previousMonthlyById = new Map((previousClient.monthly || []).map((row) => [row.id, row]));
  changedMonthly.forEach((row) => {
    recordActivity("monthly", `Atualizou mensal em ${context.clientName}.`, monthlyActivityDetail(row, previousMonthlyById.get(row.id)), context);
  });
  addedHistory.forEach((entry) => {
    recordActivity("history", `Registrou histórico em ${context.clientName}.`, truncateHistoryValue((entry.details || []).join(" "), 120), context);
  });
  addedFinanceMessages.forEach((message) => {
    recordActivity("finance", `Adicionou observação financeira em ${context.clientName}.`, truncateHistoryValue(message.text || "Observação sem texto", 120), context);
  });
  [...nextStatuses].filter((statusId) => !previousStatuses.has(statusId)).forEach((statusId) => {
    recordActivity("status", `Adicionou status em ${context.clientName}.`, statusName(statusId), context);
  });
  [...previousStatuses].filter((statusId) => !nextStatuses.has(statusId)).forEach((statusId) => {
    recordActivity("status", `Removeu status em ${context.clientName}.`, statusName(statusId), context);
  });

  const hasSpecificActivity =
    addedNotes.length ||
    addedTasks.length ||
    changedTasks.length ||
    addedDeadlines.length ||
    changedDeadlines.length ||
    addedMonthly.length ||
    changedMonthly.length ||
    addedHistory.length ||
    addedFinanceMessages.length ||
    !sameIds(previousClient.statusIds, nextClient.statusIds);
  if (!hasSpecificActivity && changes.length) {
    const type = changes.some((change) => /Honor|INSS|redução|pagamento|financeiro|Comiss/i.test(change)) ? "finance" : "client";
    recordActivity(type, `Atualizou ${context.clientName}.`, changes.slice(0, 5).join("\n"), context);
  }
}

function addedCollectionItems(previousItems = [], nextItems = []) {
  const previousIds = new Set((previousItems || []).map((item) => item.id));
  return (nextItems || []).filter((item) => !previousIds.has(item.id));
}

function changedCollectionItems(previousItems = [], nextItems = []) {
  const previousById = new Map((previousItems || []).map((item) => [item.id, item]));
  return (nextItems || []).filter((item) => previousById.has(item.id) && JSON.stringify(previousById.get(item.id)) !== JSON.stringify(item));
}

function sameIds(first = [], second = []) {
  return [...(first || [])].sort().join("|") === [...(second || [])].sort().join("|");
}

function statusName(statusId) {
  return state.statuses.find((status) => status.id === statusId)?.name || "Status";
}

function monthlyFieldLabels() {
  return {
    month: "Competência",
    receiptSent: "Recibo enviado",
    receiptSigned: "Recibo assinado",
    remunerationSent: "Remuneração enviada",
    guideIssued: "Guia emitida",
    guideSent: "Guia enviada",
    guidePaid: "Guia paga",
    notes: "Obs.",
  };
}

function monthlyActivityDetail(row = {}, previousRow = null) {
  const labels = monthlyFieldLabels();
  const monthLabel = row.month ? `Competência ${row.month}` : "Competência sem data";
  if (!previousRow) {
    const marked = ["receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"]
      .filter((field) => row[field])
      .map((field) => labels[field]);
    return [monthLabel, marked.length ? `Marcado: ${marked.join(", ")}.` : "Nenhuma coluna marcada."].join("\n");
  }

  const fields = ["month", "receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid", "notes"];
  const changes = fields
    .filter((field) => monthlyFieldValue(previousRow[field], field) !== monthlyFieldValue(row[field], field))
    .map((field) => `${labels[field]}: ${monthlyFieldValue(previousRow[field], field)} → ${monthlyFieldValue(row[field], field)}.`);
  return changes.length ? [monthLabel, ...changes].join("\n") : monthLabel;
}

function monthlyFieldValue(value, field) {
  if (["receiptSent", "receiptSigned", "remunerationSent", "guideIssued", "guideSent", "guidePaid"].includes(field)) {
    return value ? "marcado" : "desmarcado";
  }
  if (field === "month") return value || "sem competência";
  return value ? truncateHistoryValue(value, 80) : "vazio";
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
    contractClosedDate: "Fechamento do contrato",
    startDate: "Início da obra",
    endDate: "Fim da obra",
    area: "Área",
    feeValue: "Honorários",
    inssOriginalValue: "INSS sem redução",
    inssReducedValue: "INSS com redução",
    paymentMethod: "Forma de pagamento",
    installments: "Parcelas",
    financeStatus: "Status financeiro",
    clientOrigin: "Origem",
    hasReferralCommission: "Comissão de indicação",
    referralCommission: "Comissão de indicação",
    referrer: "Quem indicou",
    commissionPaid: "Comissão paga",
    financeNotes: "Observações financeiras",
  };

  Object.entries(fieldLabels).forEach(([field, label]) => {
    const before = historyFieldValue(previousClient[field], field);
    const after = historyFieldValue(nextClient[field], field);
    if (before !== after) changes.push(`${label}: ${before} → ${after}.`);
  });

  const previousStatuses = statusNames(previousClient.statusIds);
  const nextStatuses = statusNames(nextClient.statusIds);
  if (previousStatuses !== nextStatuses) changes.push(`Status do processo: ${previousStatuses} → ${nextStatuses}.`);

  collectionChangeSummary(changes, "Controle mensal", previousClient.monthly, nextClient.monthly, (item) => item.month || "mês sem competência");
  collectionChangeSummary(changes, "Tarefas", previousClient.tasks, nextClient.tasks, (item) => item.title || "tarefa sem título");
  collectionChangeSummary(changes, "Prazos", previousClient.deadlines, nextClient.deadlines, (item) => item.title || "prazo sem título");
  collectionChangeSummary(changes, "Anotações", previousClient.notes, nextClient.notes, (item) => item.text || "anotação sem texto");
  collectionChangeSummary(changes, "Trabalhadores", previousClient.workerMessages, nextClient.workerMessages, (item) => item.text || "mensagem sem texto");
  collectionChangeSummary(changes, "Observações financeiras", previousClient.financeMessages, nextClient.financeMessages, (item) => item.text || "observação financeira sem texto");
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
  if (field === "contractClosedDate" || field === "startDate" || field === "endDate") return value ? formatDate(value) : "vazio";
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
  recordActivity("client", `Removeu o cliente ${activeClient.clientName || "Cliente sem nome"}.`, "", {
    clientName: activeClient.clientName || "Cliente sem nome",
  });
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

function legacyRenderUserManager() {
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

function renderUserManager() {
  if (currentUser.role !== "admin") {
    el.userManager.innerHTML = "";
    return;
  }

  const adminCount = state.users.filter((user) => user.role === "admin").length;
  el.userManager.innerHTML = `
    <article class="user-access-notice">
      <i data-lucide="shield-check"></i>
      <div>
        <strong>Controle de acesso</strong>
        <p>Os acessos oficiais são Mayssa e Camilli. As senhas ficam no Firebase e podem ser redefinidas por e-mail, sem aparecer dentro do sistema.</p>
      </div>
      <span>${adminCount} administradora(s)</span>
    </article>
    <div class="user-access-grid">
      ${state.users.map(renderUserAccessCard).join("")}
    </div>
  `;

  el.userManager.querySelectorAll("[data-reset-user-password]").forEach((button) => {
    button.addEventListener("click", () => sendUserPasswordReset(button.dataset.resetUserPassword));
  });
  refreshIcons();
}

function renderUserAccessCard(user) {
  const stats = userAccessStats(user.id);
  const roleLabel = user.role === "admin" ? "Administradora" : "Usuária";
  const roleIcon = user.role === "admin" ? "crown" : "user-check";
  const lastAction = lastUserActivity(user.id);

  return `
    <article class="user-access-card">
      <header>
        <div class="user-avatar">${escapeHtml(userInitials(user.name || user.email))}</div>
        <div class="user-identity">
          <h3>${escapeHtml(user.name || "Usuário sem nome")}</h3>
          <p>${escapeHtml(user.email || "E-mail não informado")}</p>
        </div>
        <div class="user-badges">
          <span class="user-role-badge ${user.role === "admin" ? "admin" : "user"}"><i data-lucide="${roleIcon}"></i>${roleLabel}</span>
          <span class="user-status-badge">Ativo</span>
        </div>
      </header>

      <div class="user-stat-grid">
        <div>
          <span>Tarefas abertas</span>
          <strong>${stats.openTasks}</strong>
        </div>
        <div>
          <span>Prazos</span>
          <strong>${stats.deadlines}</strong>
        </div>
        <div>
          <span>Para hoje</span>
          <strong>${stats.todayItems}</strong>
        </div>
      </div>

      <div class="user-access-meta">
        <span><i data-lucide="history"></i>${escapeHtml(lastAction)}</span>
        <span><i data-lucide="key-round"></i>Senha pelo Firebase</span>
        <span><i data-lucide="lock"></i>Usuário fixo</span>
      </div>

      <div class="user-access-actions">
        <button class="small-button" type="button" data-reset-user-password="${escapeAttr(user.email || "")}">
          <i data-lucide="mail"></i> Enviar redefinição de senha
        </button>
      </div>
    </article>
  `;
}

function renderWaitingTasks(items) {
  if (!items.length) return "";
  return renderTaskFocusPanel("Aguardando retorno", items, "waiting", "hourglass");
}

function userAccessStats(userId) {
  const items = taskCenterItems().filter((item) => item.ownerId === userId);
  return {
    openTasks: items.filter((item) => item.kind.includes("Tarefa") && item.urgency !== "done").length,
    deadlines: items.filter((item) => item.kind === "Prazo").length,
    todayItems: items.filter((item) => item.urgency === "today").length,
  };
}

function lastUserActivity(userId) {
  const activity = (state.activities || []).find((item) => item.actorId === userId);
  return activity?.createdAt ? `Última ação: ${formatDateTime(activity.createdAt)}` : "Última ação: sem registro";
}

function userInitials(value = "") {
  const parts = String(value).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "US";
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

async function sendUserPasswordReset(email) {
  if (!email) return;
  if (!firebaseAuth?.sendPasswordResetEmail) {
    alert("A redefinição de senha depende do Firebase ativo.");
    return;
  }
  const confirmed = confirm(`Enviar e-mail de redefinição de senha para ${email}?`);
  if (!confirmed) return;

  try {
    await firebaseAuth.sendPasswordResetEmail(email);
    alert("E-mail de redefinição enviado.");
  } catch (error) {
    console.error(error);
    alert("Não foi possível enviar a redefinição. Confira o usuário no Firebase Authentication.");
  }
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
  const userOptions = state.users.map((user) => ({ value: user.id, label: user.name }));
  openSimpleDialog(task ? "Editar tarefa" : "Nova tarefa", [
    { label: "1. Informações principais", type: "section" },
    { label: "Tarefa", name: "title", type: "text", value: draft.title || "", placeholder: "Ex.: Revisar contrato de prestação de serviço", span: 2 },
    { label: "Descrição", name: "description", type: "textarea", rows: 4, value: draft.description || "", placeholder: "Descreva o objetivo, contexto e detalhes da tarefa...", maxLength: 1000, span: 2 },
    { label: "2. Acompanhamento", type: "section" },
    { label: "Anotações de acompanhamento", name: "followUpNotes", type: "textarea", rows: 3, value: draft.followUpNotes || "", placeholder: "Registre observações, atualizações ou próximos passos...", maxLength: 1000, span: 2 },
    { label: "3. Responsáveis e prazo", type: "section" },
    { label: "Criada por", name: "createdByLabel", type: "readonly", value: ownerName(draft.createdBy || currentUser.id) },
    { label: "Responsável", name: "ownerId", type: "select", value: draft.ownerId || currentUser.id, options: userOptions },
    { label: "Prazo", name: "dueDate", type: "date", value: draft.dueDate || "" },
    { label: "Prioridade", name: "priority", type: "select", value: normalizeTaskPriority(draft.priority), options: taskPriorityValues().map((value) => ({ value, label: value })) },
    { label: "Status", name: "status", type: "select", value: draft.status || "Pendente", options: taskStatusValues().map((value) => ({ value, label: value })) },
  ], (values) => {
    if (!values.title) {
      alert("Informe o nome da tarefa.");
      return false;
    }

    const now = new Date().toISOString();
    const payload = {
      title: values.title,
      description: values.description || "",
      followUpNotes: values.followUpNotes || "",
      ownerId: values.ownerId || currentUser.id,
      dueDate: values.dueDate,
      priority: normalizeTaskPriority(values.priority),
      status: values.status || "Pendente",
      updatedAt: now,
    };

    if (task) {
      Object.assign(task, payload);
    } else {
      activeClient.tasks.push({
        ...draft,
        ...payload,
        createdBy: currentUser.id,
        createdAt: now,
      });
    }

    renderTasks();
    return true;
  }, {
    className: "task-form-dialog",
    subtitle: "Organize demandas do cliente e acompanhe prazos.",
    saveLabel: "Salvar tarefa",
    saveIcon: "save",
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

function openQuickInternalTaskDialog() {
  const visibilityOptions = currentUser.role === "admin"
    ? [
        { value: "team", label: "Equipe" },
        { value: "admin", label: "Somente admin" },
      ]
    : [{ value: "team", label: "Equipe" }];

  openSimpleDialog("Tarefa rápida", [
    { label: "Tarefa", name: "title", type: "text", value: "" },
    { label: "Responsável", name: "ownerId", type: "select", value: currentUser.id, options: state.users.map((user) => ({ value: user.id, label: user.name })) },
    { label: "Prazo", name: "dueDate", type: "date", value: localDateKey() },
    { label: "Prioridade", name: "priority", type: "select", value: "Normal", options: taskPriorityValues().map((value) => ({ value, label: value })) },
    { label: "Visibilidade", name: "visibility", type: "select", value: "team", options: visibilityOptions },
  ], (values) => {
    if (!values.title) {
      alert("Informe o nome da tarefa.");
      return false;
    }

    const now = new Date().toISOString();
    const newTask = {
      id: id(),
      title: values.title,
      description: "",
      ownerId: values.ownerId || currentUser.id,
      dueDate: values.dueDate,
      priority: normalizeTaskPriority(values.priority),
      status: "Pendente",
      visibility: currentUser.role === "admin" ? values.visibility || "team" : "team",
      createdBy: currentUser.id,
      createdAt: now,
      updatedAt: now,
    };
    state.internalTasks.unshift(newTask);
    recordActivity("task", `Criou tarefa interna: ${newTask.title}.`, "", {
      internalTaskId: newTask.id,
      ownerId: newTask.ownerId,
      visibility: newTask.visibility,
    });
    saveState();
    renderMetrics();
    renderClients();
    renderTaskCenter();
    renderUpdates();
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
  const clientOptions = linkedClientOptions();
  const userOptions = state.users.map((user) => ({ value: user.id, label: user.name }));

  openSimpleDialog(task ? "Editar tarefa interna" : "Nova tarefa", [
    { label: "1. Informações principais", type: "section" },
    ...(task ? [] : [{ label: "Cliente vinculado", name: "clientId", type: "select", value: "", options: clientOptions }]),
    { label: "Tarefa", name: "title", type: "text", value: task?.title || "", placeholder: "Ex.: Revisar contrato de prestação de serviço" },
    { label: "Descrição", name: "description", type: "textarea", rows: 4, value: task?.description || "", placeholder: "Descreva o objetivo, contexto e detalhes da tarefa...", maxLength: 1000, span: 2 },
    { label: "2. Acompanhamento", type: "section" },
    { label: "Anotações de acompanhamento", name: "followUpNotes", type: "textarea", rows: 3, value: task?.followUpNotes || "", placeholder: "Registre observações, atualizações ou próximos passos...", maxLength: 1000, span: 2 },
    { label: "3. Responsáveis e prazo", type: "section" },
    { label: "Criada por", name: "createdByLabel", type: "readonly", value: ownerName(task?.createdBy || currentUser.id) },
    { label: "Responsável", name: "ownerId", type: "select", value: task?.ownerId || currentUser.id, options: userOptions },
    { label: "Prazo", name: "dueDate", type: "date", value: task?.dueDate || "" },
    { label: "Prioridade", name: "priority", type: "select", value: normalizeTaskPriority(task?.priority), options: taskPriorityValues().map((value) => ({ value, label: value })) },
    { label: "Status", name: "status", type: "select", value: task?.status || "Pendente", options: taskStatusValues().map((value) => ({ value, label: value })) },
    { label: "Visibilidade", name: "visibility", type: "select", value: task?.visibility || "team", options: visibilityOptions },
  ], (values) => {
    if (!values.title) {
      alert("Informe o nome da tarefa.");
      return false;
    }

    const now = new Date().toISOString();
    const payload = {
      title: values.title,
      description: values.description || "",
      followUpNotes: values.followUpNotes || "",
      ownerId: values.ownerId || currentUser.id,
      dueDate: values.dueDate,
      priority: normalizeTaskPriority(values.priority),
      status: values.status || "Pendente",
      visibility: currentUser.role === "admin" ? values.visibility || "team" : "team",
      updatedAt: now,
    };

    if (task) {
      Object.assign(task, payload);
      recordActivity("task", `Atualizou tarefa interna: ${task.title || "Tarefa sem título"}.`, task.description || "", {
        internalTaskId: task.id,
        ownerId: task.ownerId,
        visibility: task.visibility,
      });
    } else if (values.clientId) {
      const linked = findLinkedClientRecord(values.clientId);
      const client = linked?.record;
      if (!client) {
        alert("Cliente vinculado não encontrado.");
        return false;
      }
      const newTask = {
        id: id(),
        title: payload.title,
        description: payload.description,
        followUpNotes: payload.followUpNotes,
        ownerId: payload.ownerId,
        dueDate: payload.dueDate,
        priority: payload.priority,
        status: payload.status,
        createdBy: currentUser.id,
        createdAt: now,
        updatedAt: now,
      };
      client.tasks = Array.isArray(client.tasks) ? client.tasks : [];
      client.tasks.push(newTask);
      client.updatedAt = now;
      addHistoryEntry(client, "Tarefa criada", [
        `${newTask.title || "Tarefa sem título"} vinculada pela central de tarefas.`,
        `Responsável: ${ownerName(newTask.ownerId)}.`,
        newTask.dueDate ? `Prazo: ${formatDate(newTask.dueDate)}.` : "Sem prazo informado.",
      ]);
      recordActivity("task", `Criou tarefa em ${client.clientName || "cliente"}.`, newTask.title || "Tarefa sem título", {
        clientId: client.id,
        clientSource: linked.source,
        clientName: client.clientName,
        ownerId: newTask.ownerId,
      });
    } else {
      const newTask = {
        id: id(),
        ...payload,
        createdBy: currentUser.id,
        createdAt: now,
      };
      state.internalTasks.unshift(newTask);
      recordActivity("task", `Criou tarefa interna: ${newTask.title}.`, newTask.description || "", {
        internalTaskId: newTask.id,
        ownerId: newTask.ownerId,
        visibility: newTask.visibility,
      });
    }

    saveState();
    renderMetrics();
    renderClients();
    renderTaskCenter();
    renderUpdates();
    return true;
  }, {
    className: "task-form-dialog",
    subtitle: "Organize demandas internas e vincule a um cliente quando fizer sentido.",
    saveLabel: "Salvar tarefa",
    saveIcon: "save",
  });
}

function openMeetingDialog(meetingId = null) {
  const meeting = state.meetings.find((item) => item.id === meetingId) || null;
  const clientOptions = linkedClientOptions();
  openSimpleDialog(meeting ? "Editar reunião" : "Nova reunião", [
    { label: "1. Informações principais", type: "section" },
    { label: "Cliente vinculado", name: "clientId", type: "select", value: meeting?.clientId ? linkedClientValue(meeting.clientSource || "inss", meeting.clientId) : "", options: clientOptions, span: 2 },
    { label: "Reunião", name: "title", type: "text", value: meeting?.title || "", placeholder: "Ex.: Alinhamento semanal de projetos", span: 2 },
    { label: "Pauta/descrição", name: "description", type: "textarea", rows: 4, value: meeting?.description || "", placeholder: "Descreva os principais pontos que serão discutidos na reunião...", maxLength: 1000, span: 2 },
    { label: "2. Agendamento", type: "section" },
    { label: "Responsável", name: "ownerId", type: "select", value: meeting?.ownerId || currentUser.id, options: state.users.map((user) => ({ value: user.id, label: user.name })) },
    { label: "Data", name: "date", type: "date", value: meeting?.date || "" },
    { label: "Horário", name: "time", type: "time", value: meeting?.time || "" },
    { label: "Participantes", name: "participants", type: "text", value: meeting?.participants || "", placeholder: "Ex.: Mayssa, Camilli, cliente" },
    { label: "Local ou link", name: "location", type: "text", value: meeting?.location || "", placeholder: "Ex.: Sala de reuniões ou link da videochamada", span: 2 },
  ], (values) => {
    if (!values.title) {
      alert("Informe o título da reunião.");
      return false;
    }
    if (!values.date) {
      alert("Informe a data da reunião.");
      return false;
    }

    const payload = {
      title: values.title,
      description: values.description || "",
      clientId: parseLinkedClientValue(values.clientId).id || "",
      clientSource: parseLinkedClientValue(values.clientId).source || "inss",
      ownerId: values.ownerId || currentUser.id,
      date: values.date,
      time: values.time || "",
      participants: values.participants || "",
      location: values.location || "",
      updatedAt: new Date().toISOString(),
    };

    if (meeting) {
      Object.assign(meeting, payload);
      recordActivity("meeting", `Atualizou reunião: ${meeting.title}.`, meeting.description || "", { ownerId: meeting.ownerId });
    } else {
      const newMeeting = {
        id: id(),
        ...payload,
        createdBy: currentUser.id,
        createdAt: new Date().toISOString(),
      };
      state.meetings.unshift(newMeeting);
      recordActivity("meeting", `Criou reunião: ${newMeeting.title}.`, newMeeting.description || "", { ownerId: newMeeting.ownerId });
    }

    saveState();
    renderTaskCenter();
    renderUpdates();
    return true;
  }, {
    className: "task-form-dialog meeting-form-dialog",
    subtitle: "Agende encontros e organize alinhamentos da equipe.",
    saveLabel: "Salvar reunião",
    saveIcon: "calendar-check",
  });
}

function openSimpleDialog(title, fields, onSave, options = {}) {
  el.simpleDialog.className = `simple-dialog ${options.className || ""}`.trim();
  el.simpleDialogTitle.textContent = title;
  if (el.simpleDialogSubtitle) {
    el.simpleDialogSubtitle.textContent = options.subtitle || "";
    el.simpleDialogSubtitle.hidden = !options.subtitle;
  }
  el.simpleDialogSave.innerHTML = options.saveLabel ? `<i data-lucide="${options.saveIcon || "save"}"></i> ${escapeHtml(options.saveLabel)}` : "Salvar";
  el.simpleDialogBody.innerHTML = fields
    .map(
      (field) =>
        field.type === "section"
          ? `<div class="simple-section-title ${field.className || ""}">${escapeHtml(field.label)}</div>`
          : `
        <label class="${field.span === 2 ? "span-2" : ""}">${field.label}
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
  el.simpleDialogBody.querySelectorAll("[data-money-field]").forEach((input) => {
    input.addEventListener("input", () => {
      input.value = formatCurrencyValue(input.value);
    });
  });
  el.simpleDialog.showModal();
  refreshIcons();
}

function simpleFieldControl(field) {
  if (field.type === "textarea") {
    return `<textarea rows="${field.rows || 5}" ${field.maxLength ? `maxlength="${field.maxLength}"` : ""} placeholder="${escapeAttr(field.placeholder || "")}" data-simple-field="${field.name}">${escapeHtml(field.value)}</textarea>`;
  }

  if (field.type === "readonly") {
    return `<input type="text" value="${escapeAttr(field.value)}" data-simple-field="${field.name}" disabled />`;
  }

  if (field.type === "select") {
    return `<select data-simple-field="${field.name}">${(field.options || [])
      .map((option) => `<option value="${escapeAttr(option.value)}" ${option.value === field.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`)
      .join("")}</select>`;
  }

  if (field.type === "money") {
    return `<input type="text" inputmode="numeric" value="${escapeAttr(formatCurrencyValue(field.value || ""))}" data-simple-field="${field.name}" data-money-field />`;
  }

  return `<input class="${field.type === "color" ? "color-input" : ""}" type="${field.type}" value="${escapeAttr(field.value)}" placeholder="${escapeAttr(field.placeholder || "")}" data-simple-field="${field.name}" />`;
}

function switchSection(sectionId) {
  if (sectionId === "usersSection" && currentUser.role !== "admin") return;
  if (sectionId === "statusSection" && currentUser.role !== "admin") return;
  if (sectionId === "billsSection" && currentUser.role !== "admin") return;
  if (sectionId === "accountSection" && currentUser.role === "admin") return;

  document.querySelectorAll(".app-section").forEach((section) => {
    section.hidden = section.id !== sectionId;
  });
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === sectionId);
  });
  el.newClientButton.hidden = sectionId !== "clientsSection";
  if (sectionId === "tasksSection") {
    activeTaskCalendarMode = "day";
    activeTaskDate = new Date();
    markNewTaskActivitiesRead();
    renderTaskCenter();
  }
  if (sectionId === "goalsSection") {
    renderGoalsDashboard();
  }
  if (sectionId === "billsSection") {
    renderBillsDashboard();
  }
  if (sectionId === "dataSection") {
    renderDataDashboard();
  }
}

function markNewTaskActivitiesRead() {
  const activities = unreadNewTaskActivities();
  if (!activities.length) return;
  activities.forEach((activity) => {
    activity.readBy = [...new Set([...(activity.readBy || []), currentUser.id])];
  });
  saveState();
  renderTaskNavSignals();
  renderUpdates();
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
    workTitle: "Obra principal",
    workResponsible: "",
    destination: "",
    workType: "",
    concrete: "",
    state: "",
    contractClosedDate: "",
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
    inssOriginalValue: "",
    inssReducedValue: "",
    paymentMethod: "",
    installments: "",
    financeStatus: "Em andamento",
    clientOrigin: "",
    hasReferralCommission: "",
    referralCommission: "",
    referrer: "",
    commissionPaid: "",
    financeNotes: "",
    financeMessages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
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
    description: "",
    followUpNotes: "",
    ownerId: currentUser.id,
    dueDate: "",
    status: "Pendente",
    priority: "Normal",
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

function isClientFinished(client) {
  return getClientStatuses(client).some((status) => normalize(status.name).includes("finaliz"));
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
  return ["Pendente", "Em andamento", "Aguardando cliente", "Aguardando terceiro", "Concluída"];
}

function renderTaskQuickFilters() {
  if (!el.taskMineFilterButton) return;
  el.taskMineFilterButton.classList.toggle("active", taskMineOnly);
  el.taskMineFilterButton.setAttribute("aria-pressed", String(taskMineOnly));
}

function taskPriorityValues() {
  return ["Normal", "Importante", "Urgente"];
}

function normalizeTaskPriority(value) {
  return normalizeSelectValue(value, taskPriorityValues()) || "Normal";
}

function deadlineTypeOptions(selected = "Interno") {
  return deadlineTypeValues()
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function deadlineTypeValues() {
  return ["Guia", "Receita", "Cliente", "Interno", "NF", "Outro"];
}

function destinationValues() {
  return [
    "Residencial unifamiliar",
    "Residencial multifamiliar",
    "Comercial salas e lojas",
    "Galpão industrial",
    "Casa popular",
    "Conjunto habitacional popular",
    "Edifício de garagens",
  ];
}

function destinationList(value) {
  if (Array.isArray(value)) return value.map((item) => normalizeSelectValue(item, destinationValues())).filter(Boolean);
  return String(value || "")
    .split(/\s*\+\s*|\s*,\s*/)
    .map((item) => normalizeSelectValue(item, destinationValues()))
    .filter(Boolean);
}

function documentStatusOptions(selected = "Pendente") {
  return ["Pendente", "Recebido", "Aprovado", "Inválido", "Não possui"]
    .map((value) => `<option value="${value}" ${selected === value ? "selected" : ""}>${value}</option>`)
    .join("");
}

function formatFieldValue(field, value) {
  if (field === "clientName") return value.toLocaleUpperCase("pt-BR");
  if (field === "cpf") return formatDocumentNumber(value, activeClient?.documentType || "cpf");
  if (field === "phone") return formatPhoneNumber(value);
  if (field === "area") return formatAreaValue(value);
  if (field === "feeValue") return formatCurrencyValue(value);
  if (field === "inssOriginalValue" || field === "inssReducedValue") return formatCurrencyValue(value);
  if (field === "referralCommission") return formatCurrencyValue(value);
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

function formatCurrencyValue(value) {
  const digits = onlyDigits(value);
  if (!digits) return "";
  const cents = Number(digits) / 100;
  return cents.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatFlexibleCurrencyValue(value) {
  const amount = flexibleCurrencyAmount(value);
  return amount === null ? "" : calculatedCurrency(amount);
}

function flexibleCurrencyAmount(value) {
  const text = String(value || "").trim();
  if (!text) return null;
  if (/^\d+$/.test(text)) return Number(text);
  const clean = text.replace(/[^\d,.-]/g, "");
  if (!clean) return null;
  if (clean.includes(",")) {
    const normalized = clean.replace(/\./g, "").replace(",", ".");
    const amount = Number(normalized);
    return Number.isNaN(amount) ? null : amount;
  }
  const normalized = clean.replace(/\./g, "");
  const amount = Number(normalized);
  return Number.isNaN(amount) ? null : amount;
}

function currencyAmount(value) {
  const digits = onlyDigits(value);
  return digits ? Number(digits) / 100 : null;
}

function calculatedCurrency(value) {
  if (value === null || Number.isNaN(value)) return "Não informado";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function calculatedPercent(value) {
  if (value === null || Number.isNaN(value)) return "Não informado";
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

function financePaymentMethods() {
  return ["Pix", "Boleto", "Dinheiro", "Cartão de crédito"];
}

function normalizeInstallmentsValue(value) {
  if (normalize(value) === "sem parcelas") return "Sem parcelas";
  const digits = onlyDigits(value);
  if (!digits) return "";
  const count = Number(digits);
  if (count < 1 || count > 20) return "";
  return String(count);
}

function normalizeReferralCommissionChoice(client = {}) {
  const selected = normalizeSelectValue(client.hasReferralCommission, ["Sim", "Não"]);
  if (selected) return selected;
  return client.referralCommission || client.commissionPaid ? "Sim" : "";
}

function clientOriginValues() {
  return ["BNI", "Instagram", "Facebook", "Outdoor", "Panfleto", "Prospecção ativa", "Site", "Indicação"];
}

function normalizeClientOrigin(client = {}) {
  const selected = normalizeSelectValue(client.clientOrigin, clientOriginValues());
  if (selected) return selected;
  return client.referrer || client.referralCommission || client.commissionPaid ? "Indicação" : "";
}

function normalizeFinanceStatus(value) {
  const aliases = {
    pendente: "Em andamento",
    parcial: "Em andamento",
  };
  return normalizeSelectValue(aliases[normalize(value)] || value, ["Pago", "Em andamento", "Atrasado"]);
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
  const rawDestination = destinationAliases[normalize(client.destination)] || client.destination;
  client.destination = destinationList(rawDestination).join(" + ");
  client.workType = normalizeSelectValue(workTypeAliases[normalize(client.workType)] || client.workType, ["Alvenaria", "Madeira ou mista"]);
  client.concrete = normalizeSelectValue(client.concrete, ["Sim", "Não"]);
  client.state = normalizeSelectValue(String(client.state || "").toUpperCase(), brazilianStates());
  client.feeValue = formatCurrencyValue(client.feeValue || "");
  client.inssOriginalValue = formatCurrencyValue(client.inssOriginalValue || "");
  client.inssReducedValue = formatCurrencyValue(client.inssReducedValue || "");
  client.paymentMethod = normalizeSelectValue(client.paymentMethod, financePaymentMethods());
  client.installments = normalizeInstallmentsValue(client.installments);
  client.financeStatus = normalizeFinanceStatus(client.financeStatus);
  client.clientOrigin = normalizeClientOrigin(client);
  client.hasReferralCommission = normalizeReferralCommissionChoice(client);
  client.referralCommission = formatCurrencyValue(client.referralCommission || "");
  client.commissionPaid = normalizeSelectValue(client.commissionPaid, ["Sim", "Não"]);
  client.financeMessages = normalizeFinanceMessages(client, client.internalOwner || currentUser?.id || "");
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
  if (item.kind.includes("Tarefa") && localizeLabel(item.status) === "Concluída") return "done";
  if (!item.date) return "no-date";
  const today = localDateKey();
  if (item.date < today && item.kind.includes("Tarefa") && isWaitingTaskStatus(item.status)) return "waiting";
  if (item.date < today) return "overdue";
  if (item.date === today) return "today";
  return "upcoming";
}

function urgencyLabel(urgency) {
  return {
    overdue: "Atrasada",
    waiting: "Aguardando retorno",
    today: "Hoje",
    upcoming: "Próxima",
    "no-date": "Sem prazo",
    done: "Concluída",
  }[urgency] || "Aberta";
}

function isWaitingTaskStatus(status) {
  return ["Aguardando cliente", "Aguardando terceiro"].includes(localizeLabel(status || ""));
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

function formatShortDateTime(dateValue) {
  const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
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
