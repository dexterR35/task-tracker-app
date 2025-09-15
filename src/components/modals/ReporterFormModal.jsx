import React from 'react';
import Modal from '@/components/ui/Modal/Modal';
import { ReporterForm } from '@/components/forms';

/**
 * Modal component for creating/editing reporters
 * Extracted from AdminManagementPage for better separation of concerns
 */
const ReporterFormModal = ({
  isOpen,
  onClose,
  mode = 'create', // 'create' or 'edit'
  reporter = null, // reporter data for edit mode
  onSuccess
}) => {
  const title = mode === 'create' ? 'Create New Reporter' : 'Edit Reporter';
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <ReporterForm
        mode={mode}
        initialData={reporter}
        onSuccess={() => {
          onSuccess?.();
          onClose();
        }}
      />
    </Modal>
  );
};

export default ReporterFormModal;
