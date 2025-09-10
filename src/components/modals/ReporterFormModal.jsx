import React from 'react';
import { Modal } from '@/components/ui';
import { ReporterForm } from '@/features/reporters';

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
        formType="reporter"
        mode={mode}
        initialValues={reporter}
        onSuccess={() => {
          onSuccess?.();
          onClose();
        }}
      />
    </Modal>
  );
};

export default ReporterFormModal;
