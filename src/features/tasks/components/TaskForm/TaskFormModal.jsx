import React from 'react';
import Modal from '@/components/ui/Modal/Modal';
import TaskForm from './TaskForm';

const TaskFormModal = ({
  isOpen,
  onClose,
  mode = 'create', // 'create' or 'edit'
  task = null, // task data for edit mode
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
    >
      <TaskForm
        mode={mode}
        initialData={task}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Modal>
  );
};

export default TaskFormModal;
