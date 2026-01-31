import React from "react";
import SlidePanel from "@/components/ui/SlidePanel/SlidePanel";
import TaskForm from "@/features/tasks/components/TaskForm/TaskForm";

/**
 * Create/Edit task form in a right-side slide panel (aside), instead of a modal.
 */
const TaskFormPanel = ({
  isOpen,
  onClose,
  mode = "create",
  task = null,
  monthId = null,
  onSuccess,
  onError,
}) => {
  const title = mode === "create" ? "Create New Task" : "Edit Task";

  return (
    <SlidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      width="max-w-2xl"
      bgColor="primary"
      closeOnBackdropClick={false}
    >
      <TaskForm
        mode={mode}
        initialData={task}
        monthId={monthId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </SlidePanel>
  );
};

export default TaskFormPanel;
