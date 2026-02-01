/**
 * Shared board section – same layout for Task board (Design) and Order board (Food).
 * Same buttons (Add, Export), same board tabs, same table structure; different data and column config.
 */
import React from "react";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Loader from "@/components/ui/Loader/Loader";

const BOARD_TAB_ACTIVE =
  "px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white";
const BOARD_TAB_INACTIVE =
  "px-3 py-1.5 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-app hover:bg-gray-200 dark:hover:bg-gray-600";

/** @param {{
 *   title: string;
 *   boards: Array<{ id: string; year: number; month: number; name?: string | null }>;
 *   selectedBoardId: string | null;
 *   onSelectBoard: (id: string) => void;
 *   items: Array<Record<string, unknown>>;
 *   itemsLoading: boolean;
 *   columns: Array<{ key: string; header: string; render: (item: Record<string, unknown>) => React.ReactNode }>;
 *   emptyBoardsMessage: string;
 *   emptyItemsMessage: string;
 *   loadingMessage?: string;
 *   boardsLoading?: boolean;
 *   addButtonLabel?: string;
 *   onAdd?: () => void;
 *   exportButtonLabel?: string;
 *   onExport?: () => void;
 * }} props
 */
const BoardSection = ({
  title,
  boards,
  selectedBoardId,
  onSelectBoard,
  items,
  itemsLoading,
  columns,
  emptyBoardsMessage,
  emptyItemsMessage,
  loadingMessage = "Loading…",
  boardsLoading = false,
  addButtonLabel,
  onAdd,
  exportButtonLabel,
  onExport,
}) => {
  if (boardsLoading && boards.length === 0) {
    return (
      <section className="mb-6" aria-label={title}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <span className="h-px max-w-[2rem] w-8 bg-gray-200 dark:bg-gray-600 rounded-full shrink-0" />
        </div>
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader size="md" text={loadingMessage} variant="spinner" />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6" aria-label={title}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            {title}
          </span>
          <span className="h-px max-w-[2rem] w-8 bg-gray-200 dark:bg-gray-600 rounded-full shrink-0" />
        </div>
        {(addButtonLabel || exportButtonLabel) && (onAdd || onExport) && (
          <div className="flex items-center gap-2 shrink-0">
            {addButtonLabel && onAdd && (
              <DynamicButton
                onClick={onAdd}
                variant="primary"
                size="sm"
                iconName="add"
                iconPosition="left"
                iconCategory="buttons"
                className="!text-xs !px-3 !py-1.5"
              >
                {addButtonLabel}
              </DynamicButton>
            )}
            {exportButtonLabel && onExport && (
              <DynamicButton
                onClick={onExport}
                variant="secondary"
                size="sm"
                iconName="download"
                iconPosition="left"
                iconCategory="buttons"
                className="!text-xs !px-3 !py-1.5"
              >
                {exportButtonLabel}
              </DynamicButton>
            )}
          </div>
        )}
      </div>

      {boards.length === 0 ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard p-6 text-center text-app-subtle">
          {emptyBoardsMessage}
        </div>
      ) : (
        <>
          <div className="flex gap-2 flex-wrap mb-4">
            {boards.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => onSelectBoard(b.id)}
                className={
                  selectedBoardId === b.id ? BOARD_TAB_ACTIVE : BOARD_TAB_INACTIVE
                }
              >
                {b.year}-{String(b.month).padStart(2, "0")}
                {b.name ? ` – ${b.name}` : ""}
              </button>
            ))}
          </div>

          {itemsLoading ? (
            <div className="flex items-center justify-center min-h-[120px]">
              <Loader size="sm" text={loadingMessage} variant="spinner" />
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-smallCard overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {columns.map((col) => (
                      <th
                        key={col.key}
                        className="px-4 py-2 text-left text-xs font-medium text-app-subtle uppercase"
                      >
                        {col.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="px-4 py-6 text-center text-app-subtle text-sm"
                      >
                        {emptyItemsMessage}
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr
                        key={item.id}
                        className="bg-white dark:bg-smallCard"
                      >
                        {columns.map((col) => (
                          <td
                            key={col.key}
                            className="px-4 py-2 text-sm text-app"
                          >
                            {col.render(item)}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
};

export default BoardSection;
