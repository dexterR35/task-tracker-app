import Modal from '@/components/ui/Modal/Modal';
import DeliverableForm from './DeliverableForm';

// ===== DELIVERABLE FORM MODAL =====
const DeliverableFormModal = ({ 
  isOpen, 
  onClose, 
  mode = 'create', 
  deliverable = null, 
  onSuccess 
}) => {
  const handleSuccess = () => { 
    onSuccess?.(); 
    onClose(); 
  };

  const handleCancel = () => onClose();

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={mode === 'create' ? 'Create New Deliverable' : 'Edit Deliverable'} 
      maxWidth="max-w-2xl"
    >
      <DeliverableForm 
        mode={mode} 
        deliverable={deliverable} 
        onSuccess={handleSuccess} 
        onCancel={handleCancel} 
      />
    </Modal>
  );
};

export default DeliverableFormModal;
