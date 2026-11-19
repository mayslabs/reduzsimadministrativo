export const MONTHLY_TASK_SETTING = "monthlyClientTasks";
export const MONTHLY_TASK_ROUTINE = "receipts-esocial-darf-v1";
const MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const normalize = (value) => String(value || "").normalize("NFD").replace(/\p{M}/gu, "").trim().toLowerCase();

export const MONTHLY_TASK_STEPS = [
  {
    id: "documents", day: 3, startDay: 1, offset: 0,
    title: "Preparar e enviar documentos para assinatura",
    description: "Preparar e enviar os documentos para assinatura. Recibos de quitação devem corresponder a pagamentos já realizados; antes disso, preparar demonstrativos para conferência.",
  },
  {
    id: "signatures", day: 10, offset: 0,
    title: "Conferir assinaturas pendentes",
    description: "Identificar os documentos ainda não assinados e cobrar a devolução, mantendo as pendências registradas.",
  },
  {
    id: "review", day: 15, offset: 0,
    title: "Revisar e cobrar pendências de assinatura",
    description: "Conferir os documentos recebidos e fazer nova cobrança dos documentos restantes.",
  },
  {
    id: "esocial", day: 10, offset: 1,
    title: "Conferir a competência, transmitir eSocial e enviar DARF",
    description: "Conferir os valores e documentos do mês encerrado, informar os eventos aplicáveis, realizar o fechamento e providenciar o DARF na DCTFWeb para envio ao cliente. A falta de assinatura deve continuar registrada como pendência, sem impedir o cumprimento do prazo legal. Conferir os prazos legais aplicáveis; esta data é um lembrete interno.",
  },
  {
    id: "payments", day: 18, offset: 1,
    title: "Conferir pagamentos e lembrar os clientes",
    description: "Verificar quais guias já foram pagas e lembrar os clientes que ainda possuem pagamento pendente, informando o vencimento real da guia. O lembrete permanece no dia 18, sem presumir que essa seja a data de vencimento do DARF.",
  },
];

export function shiftCompetence(value, offset) {
  const match = MONTH_PATTERN.exec(String(value || ""));
  if (!match || !Number.isInteger(offset)) throw new Error("Competencia invalida.");
  const serial = Number(match[1]) * 12 + Number(match[2]) - 1 + offset;
  const year = Math.floor(serial / 12);
  if (year < 1 || year > 9999) throw new Error("Competencia fora do intervalo.");
  return `${String(year).padStart(4, "0")}-${String(serial % 12 + 1).padStart(2, "0")}`;
}

export function currentCompetence(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit" }).formatToParts(new Date(now));
  return `${parts.find((part) => part.type === "year").value}-${parts.find((part) => part.type === "month").value}`;
}

export function eligibleMonthlyClient(client, statuses) {
  const names = [client.status, ...(client.statusIds || []).map((id) => statuses.find((status) => status.id === id)?.name)];
  return !names.some((name) => ["finalizado", "processo administrativo"].includes(normalize(name)));
}

export function monthlyTaskPlan(client, config, throughMonth, now, ownerId) {
  if (!MONTH_PATTERN.test(config.startMonth) || !MONTH_PATTERN.test(throughMonth)) throw new Error("Competencia invalida.");
  let month = config.generatedThrough ? shiftCompetence(config.generatedThrough, 1) : config.startMonth;
  const existing = Array.isArray(client.tasks) ? client.tasks : [];
  const keys = new Set(existing.filter((task) => task.monthlyRoutine?.id === MONTHLY_TASK_ROUTINE)
    .map((task) => `${task.monthlyRoutine.competence}:${task.monthlyRoutine.activity}:${task.monthlyRoutine.workId}`));
  const tasks = [];
  const workId = client.id;
  for (let count = 0; month <= throughMonth && count < 12; count += 1, month = shiftCompetence(month, 1)) {
    const label = `${month.slice(5)}/${month.slice(0, 4)}`;
    for (const step of MONTHLY_TASK_STEPS) {
      const key = `${month}:${step.id}:${workId}`;
      const title = `${step.title} · ${label}`;
      const id = `monthly-${workId}-${month}-${step.id}`;
      // The competence, not the editable due date or status, identifies an occurrence.
      if (keys.has(key) || existing.some((task) => task.id === id || normalize(task.title) === normalize(title))) continue;
      const dateMonth = shiftCompetence(month, step.offset);
      const dueDate = `${dateMonth}-${String(step.day).padStart(2, "0")}`;
      const startDate = step.startDay ? `${dateMonth}-${String(step.startDay).padStart(2, "0")}` : "";
      const context = [client.clientName, client.workTitle].filter(Boolean).join(" · ");
      tasks.push({
        id, title, description: `Competência ${label}${context ? ` · ${context}` : ""}.\n${step.description}`,
        followUpNotes: "", ownerId, dueDate, startDate,
        status: "Pendente", priority: "Normal", visibility: "team",
        recorrencia: { frequencia: "mensal", soDiasUteis: false, diasSemana: [], dia: step.day, mes: Number(dateMonth.slice(5)) - 1, ate: null },
        proximaGerada: true, recurrenceParentId: "",
        monthlyRoutine: { id: MONTHLY_TASK_ROUTINE, competence: month, activity: step.id, clientId: client.id, workId },
        createdBy: config.createdBy, createdAt: now, updatedAt: null, completedAt: null, annotations: [],
        history: [{ id: `${id}-created`, text: `Lembrete mensal criado para a competência ${label}. Nenhuma atividade marcada como executada.`, actorId: config.createdBy, createdAt: now }],
      });
      keys.add(key);
    }
  }
  return tasks;
}

export function preserveMonthlyTaskIdentity(previous, next) {
  const prior = new Map((Array.isArray(previous?.tasks) ? previous.tasks : []).filter((task) => task.monthlyRoutine?.id === MONTHLY_TASK_ROUTINE).map((task) => [task.id, task]));
  for (const task of Array.isArray(next.tasks) ? next.tasks : []) {
    const saved = prior.get(task.id);
    if (!saved) continue;
    task.monthlyRoutine = structuredClone(saved.monthlyRoutine);
    task.startDate = saved.startDate || "";
    task.recorrencia = structuredClone(saved.recorrencia);
    task.proximaGerada = true;
  }
  return next;
}

export async function ensureMonthlyClientTasks(db, now = new Date().toISOString()) {
  const setting = await db.prepare("SELECT value_json, version FROM app_settings WHERE key = ?").bind(MONTHLY_TASK_SETTING).first();
  if (!setting) return { created: 0, clients: 0 };
  const config = JSON.parse(setting.value_json);
  const current = currentCompetence(now);
  if (config.enabled !== true || !MONTH_PATTERN.test(config.startMonth) || config.startMonth > current || config.generatedThrough >= current) return { created: 0, clients: 0 };
  const firstMonth = config.generatedThrough ? shiftCompetence(config.generatedThrough, 1) : config.startMonth;
  const through = [current, shiftCompetence(firstMonth, 11)].sort()[0];
  const [clientRows, statusRows, userRows] = await db.batch([
    db.prepare("SELECT id, payload, version, scope FROM clients WHERE deleted_at IS NULL AND id IN (SELECT value FROM json_each(?))").bind(JSON.stringify(config.clientIds || [])),
    db.prepare("SELECT id, payload FROM statuses WHERE deleted_at IS NULL"),
    db.prepare("SELECT id FROM app_users WHERE enabled = 1"),
  ]);
  const statuses = statusRows.results.map((row) => ({ ...JSON.parse(row.payload), id: row.id }));
  const users = new Set(userRows.results.map((row) => row.id));
  const plan = clientRows.results.flatMap((row) => {
    const client = JSON.parse(row.payload);
    if (!eligibleMonthlyClient(client, statuses)) return [];
    const ownerId = users.has(client.internalOwner) ? client.internalOwner : config.ownerId;
    if (!users.has(ownerId)) throw new Error("Responsavel da rotina mensal inativo.");
    const tasks = monthlyTaskPlan(client, config, through, now, ownerId);
    if (new TextEncoder().encode(JSON.stringify({ ...client, tasks: [...(client.tasks || []), ...tasks] })).byteLength > 900_000) {
      throw new Error("Um card ultrapassa o limite de dados para novos lembretes mensais.");
    }
    return tasks.length ? [{ row, tasks }] : [];
  });
  const guard = "EXISTS (SELECT 1 FROM app_settings WHERE key = ? AND version = ?)";
  const statements = [];
  for (const { row, tasks } of plan) {
    const args = [row.id, row.version, MONTHLY_TASK_SETTING, setting.version];
    statements.push(db.prepare(`
      INSERT INTO sync_log (record_type, record_id, action, version, scope, changed_at, changed_by)
      SELECT 'clients', id, 'upsert', version + 1, scope, ?, 'system'
      FROM clients WHERE id = ? AND version = ? AND deleted_at IS NULL AND ${guard}
    `).bind(now, ...args));
    // Append only new reminders; leave card dates, monthly progress and history untouched.
    statements.push(db.prepare(`
      UPDATE clients SET payload = json_set(payload, '$.tasks', json((
        SELECT json_group_array(json(value)) FROM (
          SELECT value FROM json_each(COALESCE(json_extract(clients.payload, '$.tasks'), '[]'))
          UNION ALL SELECT value FROM json_each(?)
        )
      ))), version = version + 1, updated_at = ?, updated_by = 'system'
      WHERE id = ? AND version = ? AND deleted_at IS NULL AND ${guard}
    `).bind(JSON.stringify(tasks), now, ...args));
  }
  const versions = JSON.stringify(plan.map(({ row }) => ({ id: row.id, version: row.version + 1 })));
  const complete = `NOT EXISTS (
    SELECT 1 FROM json_each(?) p LEFT JOIN clients c ON c.id = json_extract(p.value, '$.id')
    WHERE c.id IS NULL OR c.version != json_extract(p.value, '$.version') OR c.updated_at != ? OR c.updated_by != 'system'
  )`;
  statements.push(db.prepare(`
    INSERT INTO sync_log (record_type, record_id, action, version, scope, changed_at, changed_by)
    SELECT 'settings', key, 'upsert', version + 1, scope, ?, 'system' FROM app_settings
    WHERE key = ? AND version = ? AND ${complete}
  `).bind(now, MONTHLY_TASK_SETTING, setting.version, versions, now));
  statements.push(db.prepare(`
    UPDATE app_settings SET value_json = json_set(value_json, '$.generatedThrough', ?),
      version = version + 1, updated_at = ?, updated_by = 'system'
    WHERE key = ? AND version = ? AND ${complete}
  `).bind(through, now, MONTHLY_TASK_SETTING, setting.version, versions, now));
  await db.batch(statements);
  const saved = await db.prepare("SELECT version, updated_at, value_json FROM app_settings WHERE key = ?").bind(MONTHLY_TASK_SETTING).first();
  const applied = Number(saved?.version) === Number(setting.version) + 1 && saved.updated_at === now
    && JSON.parse(saved.value_json).generatedThrough === through;
  return { created: applied ? plan.reduce((total, item) => total + item.tasks.length, 0) : 0, clients: applied ? plan.length : 0, through, applied };
}
