import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";
import Badge from "@/components/ui/Badge/Badge";
import { formatDate, normalizeTimestamp } from "@/utils/dateUtils";
import { useDeliverableCalculation, useDeliverablesOptionsFromProps } from "@/features/deliverables/DeliverablesManager";
import { TABLE_SYSTEM, CARD_SYSTEM } from "@/constants";
import { differenceInDays } from "date-fns";

const columnHelper = createColumnHelper();
const DF = TABLE_SYSTEM.DATE_FORMATS;

const simpleCell = (fallback = "-") => ({ getValue }) => getValue() ?? fallback;

const dateCell = (format = DF.SHORT) => ({ getValue }) => {
  const v = getValue();
  return v ? <span className="table-cell-text">{formatDate(v, format, true)}</span> : "-";
};

const daysBetween = (start, end) => {
  if (!start || !end) return null;
  const s = normalizeTimestamp(start);
  const e = normalizeTimestamp(end);
  if (!s || !e) return null;
  const d = differenceInDays(e, s);
  return d < 0 ? 0 : Math.ceil(d);
};

const yesNoCell = ({ getValue }) => {
  const v = getValue();
  return v ? <Badge variant="green" size="md">Yes</Badge> : "-";
};

const nameTwoLines = (name) => {
  if (!name?.trim()) return "-";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return (
    <div className="flex flex-col leading-tight">
      <span>{parts[0]}</span>
      <span>{parts.slice(1).join(" ")}</span>
    </div>
  );
};

const badgeCell = (variant) => ({ getValue }) => {
  const v = getValue();
  return v ? <Badge variant={variant} size="md" className="uppercase">{v}</Badge> : <span className="text-gray-500 dark:text-gray-400 text-xs">-</span>;
};

function DeliverableCalculationCell({ deliverablesUsed, isUserAdmin, deliverables = [] }) {
  const { deliverablesOptions = [] } = useDeliverablesOptionsFromProps(deliverables);
  const { deliverablesList, totalTime } = useDeliverableCalculation(deliverablesUsed, deliverablesOptions);

  if (!deliverablesList?.length) {
    return <span className="table-cell-text opacity-80">No deliverables</span>;
  }

  return (
    <div className="space-y-1 table-cell-text">
      {deliverablesList.map((d, i) => (
        <div key={i}>
          <div className="font-medium">
            {d.quantity}x{d.name}
            {(d.variationsQuantity || d.declinariQuantity) > 0 && (
              <span style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.amber }}>
                {" "}+{" "}{d.variationsQuantity || d.declinariQuantity} variations
              </span>
            )}
          </div>
          <div className="space-y-1">
            {d.configured ? (
              <>
                <div className="block">
                  {d.timePerUnit}{d.timeUnit} × {d.quantity}
                  {(d.variationsQuantity || d.declinariQuantity) > 0 && d.variationsTimeInMinutes > 0 && (
                    <span> + {d.variationsQuantity || d.declinariQuantity} × {(d.variationsTimeInMinutes || 0).toFixed(0)} min</span>
                  )}
                </div>
                <div className="block font-semibold" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.amber }}>
                  Total: {d.time.toFixed(2)}h ({((d.time * 60) / 480).toFixed(2)} days)
                </div>
              </>
            ) : d.notConfigured ? (
              <span style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.amber }}>⚠️ Not configured in settings</span>
            ) : (
              <span className="table-cell-text opacity-80">No time configuration</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function createTaskColumns(isUserAdmin, stableReporters, deliverables = []) {
  return [
    columnHelper.accessor("data_task.taskName", {
      header: "JIRA LINK",
      cell: ({ getValue, row }) => {
        const taskName = getValue() ?? row.original?.data_task?.taskName;
        return taskName ? <Badge variant="green" size="md">{taskName}</Badge> : <span className="table-cell-text opacity-80">No Link</span>;
      },
      size: 120,
    }),
    columnHelper.accessor((row) => row.data_task?.products, { id: "products", header: "PRODUCT", cell: simpleCell(), size: 70 }),
    columnHelper.accessor((row) => row.data_task?.markets, {
      id: "markets",
      header: "MARKETS",
      cell: ({ getValue }) => {
        const markets = getValue();
        if (!markets?.length) return "-";
        return (
          <div className="flex flex-wrap gap-1 uppercase">
            {markets.map((m, i) => <Badge key={i} variant="pink" size="md">{m}</Badge>)}
          </div>
        );
      },
      size: 140,
    }),
    columnHelper.accessor((row) => row.data_task?.aiUsed?.[0]?.aiModels, {
      id: "aiModels",
      header: "AI MODELS",
      cell: ({ getValue, row }) => {
        const models = getValue();
        const aiTime = row.original?.data_task?.aiUsed?.[0]?.aiTime;
        if (!models?.length) return "-";
        return (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {models.map((m, i) => <Badge key={i} variant="pink" size="md">{m}</Badge>)}
            </div>
            {aiTime > 0 && <div className="table-cell-text">Total hr: {aiTime}h</div>}
          </div>
        );
      },
      size: 80,
    }),
    columnHelper.accessor((row) => row.data_task?.deliverablesUsed, {
      id: "deliverables",
      header: "LIVRABLES",
      cell: ({ getValue, row }) => (
        <DeliverableCalculationCell deliverablesUsed={getValue()} isUserAdmin={isUserAdmin} deliverables={deliverables} />
      ),
      size: 220,
    }),
    columnHelper.accessor((row) => row.data_task?.reporters, {
      id: "reporters",
      header: "REPORTERS",
      cell: ({ getValue, row }) => {
        const reporterId = getValue();
        if (!reporterId) return "-";
        const reporter = stableReporters.find((r) =>
          r.reporterUID && String(r.reporterUID).toLowerCase() === String(reporterId).toLowerCase()
        );
        const name = reporter?.name ?? row.original?.data_task?.reporterName ?? reporterId;
        return nameTwoLines(name);
      },
      size: 60,
    }),
    columnHelper.accessor("createdByName", { header: "CREATED BY", cell: ({ getValue }) => nameTwoLines(getValue()), size: 80 }),
    columnHelper.accessor("createdAt", { header: "TASK ADDED", cell: dateCell(DF.DATETIME_LONG), size: 120 }),
    columnHelper.accessor((row) => row.data_task?.observations, {
      id: "observations",
      header: "OBSERVATIONS",
      cell: ({ getValue }) => {
        const v = getValue();
        if (!v) return "-";
        const text = v.length > 50 ? `${v.slice(0, 50)}...` : v;
        return <span title={v} className="table-cell-text block truncate">{text}</span>;
      },
      size: 80,
    }),
    columnHelper.accessor((row) => row.data_task?.startDate, { id: "startDate", header: "TASK START", cell: dateCell(DF.LONG), size: 100 }),
    columnHelper.accessor((row) => row.data_task?.endDate, { id: "endDate", header: "TASK END", cell: dateCell(DF.LONG), size: 80 }),
    columnHelper.accessor((row) => row.data_task?.startDate, {
      id: "done",
      header: "DONE BY",
      cell: ({ getValue, row }) => {
        const days = daysBetween(getValue(), row.original?.data_task?.endDate);
        if (days === 0 || days == null) return days === 0 ? <Badge variant="green" size="md">Same day</Badge> : "-";
        return <Badge variant="pink" size="md">{days} days</Badge>;
      },
      size: 80,
    }),
    columnHelper.accessor((row) => row.data_task?.timeInHours, {
      id: "timeInHours",
      header: "TASK HR",
      cell: ({ getValue }) => {
        const v = getValue();
        return v ? <Badge variant="amber" size="md">{v}h</Badge> : "-";
      },
      size: 70,
    }),
    columnHelper.accessor((row) => row.data_task?.isVip, { id: "isVip", header: "VIP", cell: yesNoCell, size: 40 }),
    columnHelper.accessor((row) => row.data_task?.reworked, { id: "reworked", header: "REWORKED", cell: yesNoCell, size: 60 }),
    columnHelper.accessor((row) => row.data_task?.useShutterstock, { id: "useShutterstock", header: "SHUTTERSTOCK", cell: yesNoCell, size: 50 }),
  ];
}

export function useTaskColumns(reporters = [], user = null, deliverables = []) {
  const stableReporters = Array.isArray(reporters) ? reporters : [];
  const isUserAdmin = user?.role === "admin";
  return useMemo(
    () => createTaskColumns(isUserAdmin, stableReporters, deliverables),
    [stableReporters, isUserAdmin, deliverables]
  );
}

function createUserColumns() {
  return [
    columnHelper.accessor("name", { header: "USERS", cell: simpleCell(), size: 200 }),
    columnHelper.accessor("username", { header: "USERNAME", cell: simpleCell(), size: 120 }),
    columnHelper.accessor("avatarUrl", {
      id: "avatar",
      header: "AVATAR",
      cell: ({ getValue }) => {
        const url = getValue();
        if (!url) return "-";
        return (
          <img src={url} alt="" className="h-8 w-8 rounded-full object-cover bg-gray-200" onError={(e) => { e.target.style.display = "none"; }} />
        );
      },
      size: 56,
    }),
    columnHelper.accessor("email", { header: "EMAIL", cell: simpleCell(), size: 200 }),
    columnHelper.accessor("phone", { header: "PHONE", cell: simpleCell(), size: 120 }),
    columnHelper.accessor("role", {
      header: "ROLE",
      cell: ({ getValue }) => {
        const role = getValue() ?? "user";
        return <Badge variant={role === "admin" ? "pink" : "blue"} size="xs">{role}</Badge>;
      },
      size: 100,
    }),
    columnHelper.accessor("occupation", { header: "DEPARTMENT", cell: simpleCell(), size: 150 }),
    columnHelper.accessor("taskCount", {
      id: "tasks",
      header: "TASKS",
      cell: ({ getValue }) => {
        const n = getValue() ?? 0;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{n}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">tasks overall</span>
          </div>
        );
      },
      size: 120,
    }),
    columnHelper.accessor("createdAt", { header: "CREATED", cell: dateCell(DF.DATETIME_LONG), size: 150 }),
  ];
}

function createReporterColumns() {
  return [
    columnHelper.accessor("name", { header: "REPORTERS", cell: simpleCell(), size: 200 }),
    columnHelper.accessor("email", { header: "Email", cell: simpleCell(), size: 200 }),
    columnHelper.accessor("departament", { header: "DEPARTMENT", cell: badgeCell("green"), size: 150 }),
    columnHelper.accessor("country", { header: "COUNTRY", cell: badgeCell("amber"), size: 100 }),
    columnHelper.accessor("channelName", { header: "CHANNEL", cell: badgeCell("orange"), size: 120 }),
    columnHelper.accessor("createdAt", { header: "CREATED", cell: dateCell(DF.DATETIME_LONG), size: 150 }),
  ];
}

export function getColumns(tableType, _monthId = null, _reporters = [], _user = null) {
  switch (tableType) {
    case "tasks":
      return [];
    case "users":
      return createUserColumns();
    case "reporters":
      return createReporterColumns();
    default:
      return [];
  }
}
