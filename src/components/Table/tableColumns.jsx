import { createColumnHelper } from "@tanstack/react-table";
import { format, parseISO, isValid } from "date-fns";
import Badge from "@/components/ui/Badge/Badge";
import { TABLE_SYSTEM } from "@/constants";

const columnHelper = createColumnHelper();
const DF = TABLE_SYSTEM.DATE_FORMATS;

const simpleCell = (fallback = "-") => ({ getValue }) => getValue() ?? fallback;

const toDate = (v) => {
  if (!v) return null;
  if (v instanceof Date) return isValid(v) ? v : null;
  if (typeof v === "string" || typeof v === "number") {
    const d = typeof v === "number" ? new Date(v) : parseISO(v);
    return isValid(d) ? d : null;
  }
  return null;
};

const dateCell = (pattern) => ({ getValue }) => {
  const v = getValue();
  const d = toDate(v);
  return d ? <span className="table-cell-text">{format(d, pattern)}</span> : "-";
};

/**
 * User table column definitions (TanStack Table).
 * Used by UsersPage via TanStackTable.
 */
export function getUserColumns() {
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
    columnHelper.accessor("departmentName", { header: "DEPARTMENT", cell: simpleCell(), size: 140 }),
    columnHelper.accessor("phone", { header: "PHONE", cell: simpleCell(), size: 120 }),
    columnHelper.accessor("role", {
      header: "ROLE",
      cell: ({ getValue }) => {
        const role = getValue() ?? "user";
        const variant = role === "super_admin" ? "crimson" : role === "admin" ? "pink" : "blue";
        const label = role === "super_admin" ? "Super Admin" : role;
        return <Badge variant={variant} size="xs">{label}</Badge>;
      },
      size: 100,
    }),
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
