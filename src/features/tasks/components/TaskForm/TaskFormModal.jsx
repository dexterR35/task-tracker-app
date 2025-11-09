import React from 'react';
import Modal from '@/components/ui/Modal/Modal';
import TaskForm from '@/features/tasks/components/TaskForm/TaskForm';

const TaskFormModal = ({
  isOpen,
  onClose,
  mode = 'create', // 'create' or 'edit'
  task = null, // task data for edit mode
  monthId = null, // monthId for task creation
  onSuccess,
  onError
}) => {
  const title = mode === 'create' ? 'Create New Task' : 'Edit Task';
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-4xl"
      bgColor="primary"
    >
      <TaskForm
        mode={mode}
        initialData={task}
        monthId={monthId}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Modal>
  );
};

export default TaskFormModal;
