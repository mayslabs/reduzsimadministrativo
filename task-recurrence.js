(function attachTaskRecurrence(globalScope) {
  const WEEKDAYS = [
    { short: "seg", full: "segunda" },
    { short: "ter", full: "terça" },
    { short: "qua", full: "quarta" },
    { short: "qui", full: "quinta" },
    { short: "sex", full: "sexta" },
    { short: "sáb", full: "sábado" },
    { short: "dom", full: "domingo" },
  ];
  const MONTHS = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const FREQUENCIES = new Set(["diaria", "semanal", "mensal", "anual"]);

  function clamp(value, minimum, maximum, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(maximum, Math.max(minimum, Math.trunc(number)));
  }

  function localDateKey(date = new Date()) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function parseDateKey(value) {
    const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]) - 1;
    const day = Number(match[3]);
    const date = new Date(year, month, day, 12, 0, 0, 0);
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) return null;
    return date;
  }

  function addDays(value, amount) {
    const date = value instanceof Date ? new Date(value) : parseDateKey(value);
    if (!date) return null;
    date.setDate(date.getDate() + Number(amount || 0));
    date.setHours(12, 0, 0, 0);
    return date;
  }

  function weekdayIndex(value) {
    const date = value instanceof Date ? value : parseDateKey(value);
    return date ? (date.getDay() + 6) % 7 : 0;
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0, 12, 0, 0, 0).getDate();
  }

  function dateWithClampedDay(year, month, day) {
    return new Date(year, month, Math.min(day, daysInMonth(year, month)), 12, 0, 0, 0);
  }

  function formatDate(value) {
    const date = value instanceof Date ? value : parseDateKey(value);
    if (!date) return "";
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  }

  function normalize(value) {
    if (!value || !FREQUENCIES.has(value.frequencia)) return null;
    const today = new Date();
    const diasSemana = [...new Set((Array.isArray(value.diasSemana) ? value.diasSemana : [])
      .map((day) => Number(day))
      .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6))]
      .sort((a, b) => a - b);
    return {
      frequencia: value.frequencia,
      soDiasUteis: value.frequencia === "diaria" && Boolean(value.soDiasUteis),
      diasSemana: value.frequencia === "semanal" ? diasSemana : [],
      dia: clamp(value.dia, 1, 31, today.getDate()),
      mes: clamp(value.mes, 0, 11, today.getMonth()),
      ate: parseDateKey(value.ate) ? value.ate : null,
    };
  }

  function withinEnd(rule, date) {
    return !rule.ate || localDateKey(date) <= rule.ate;
  }

  function firstOccurrence(value, startDate) {
    const rule = normalize(value);
    if (!rule) return "";
    const base = parseDateKey(startDate) || new Date();
    base.setHours(12, 0, 0, 0);
    let candidate = new Date(base);

    if (rule.frequencia === "diaria") {
      if (rule.soDiasUteis) {
        while (weekdayIndex(candidate) > 4) candidate = addDays(candidate, 1);
      }
    } else if (rule.frequencia === "semanal") {
      if (!rule.diasSemana.length) return "";
      for (let offset = 0; offset < 7; offset += 1) {
        const possible = addDays(base, offset);
        if (rule.diasSemana.includes(weekdayIndex(possible))) {
          candidate = possible;
          break;
        }
      }
    } else if (rule.frequencia === "mensal") {
      candidate = dateWithClampedDay(base.getFullYear(), base.getMonth(), rule.dia);
      if (candidate < base) {
        candidate = dateWithClampedDay(base.getFullYear(), base.getMonth() + 1, rule.dia);
      }
    } else if (rule.frequencia === "anual") {
      candidate = dateWithClampedDay(base.getFullYear(), rule.mes, rule.dia);
      if (candidate < base) {
        candidate = dateWithClampedDay(base.getFullYear() + 1, rule.mes, rule.dia);
      }
    }

    return withinEnd(rule, candidate) ? localDateKey(candidate) : "";
  }

  function nextOccurrence(value, currentDate) {
    const current = parseDateKey(currentDate) || new Date();
    return firstOccurrence(value, localDateKey(addDays(current, 1)));
  }

  function shortLabel(value) {
    const rule = normalize(value);
    if (!rule) return "";
    if (rule.frequencia === "diaria") return rule.soDiasUteis ? "Dias úteis" : "Diária";
    if (rule.frequencia === "semanal") {
      return `Toda ${rule.diasSemana.map((day) => WEEKDAYS[day].short).join(", ")}`;
    }
    if (rule.frequencia === "mensal") return `Todo dia ${rule.dia}`;
    return `Todo ano · ${String(rule.dia).padStart(2, "0")}/${String(rule.mes + 1).padStart(2, "0")}`;
  }

  function fullLabel(value) {
    const rule = normalize(value);
    if (!rule) return "";
    let label = "";
    if (rule.frequencia === "diaria") {
      label = rule.soDiasUteis ? "Repete todo dia útil (segunda a sexta)" : "Repete todos os dias";
    } else if (rule.frequencia === "semanal") {
      label = `Repete toda semana: ${rule.diasSemana.map((day) => WEEKDAYS[day].full).join(", ")}`;
    } else if (rule.frequencia === "mensal") {
      label = `Repete todo dia ${rule.dia} de cada mês`;
    } else {
      label = `Repete todo ano em ${rule.dia} de ${MONTHS[rule.mes]}`;
    }
    return rule.ate ? `${label} até ${formatDate(rule.ate)}` : label;
  }

  function summary(value, startDate) {
    const rule = normalize(value);
    if (!rule) return "";
    const next = firstOccurrence(rule, startDate);
    return `${fullLabel(rule)}${next ? ` · próxima: ${formatDate(next)}` : " · sem próximas datas antes do término"}`;
  }

  globalScope.ReduzSimTaskRecurrence = Object.freeze({
    WEEKDAYS,
    MONTHS,
    normalize,
    firstOccurrence,
    nextOccurrence,
    shortLabel,
    fullLabel,
    summary,
    localDateKey,
    weekdayIndex,
  });
})(globalThis);
