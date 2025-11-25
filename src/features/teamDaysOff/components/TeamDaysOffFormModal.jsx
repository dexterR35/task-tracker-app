import React from 'react';
import Modal from '@/components/ui/Modal/Modal';
import TeamDaysOffForm from './TeamDaysOffForm';

const TeamDaysOffFormModal = ({ 
  isOpen, 
  onClose, 
  mode = 'create', 
  teamDaysOff = null,
  initialUserId = null,
  onSuccess,
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
      title={mode === 'create' ? 'Create Team Days Off Entry' : 'Edit Team Days Off Entry'} 
      maxWidth="max-w-2xl"
    >
      <TeamDaysOffForm 
        mode={mode} 
        teamDaysOff={teamDaysOff}
        initialUserId={initialUserId}
        onSuccess={handleSuccess} 
        onCancel={handleCancel}
      />
    </Modal>
  );
};

export default TeamDaysOffFormModal;

