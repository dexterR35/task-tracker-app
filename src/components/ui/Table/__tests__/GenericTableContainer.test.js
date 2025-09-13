import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import GenericTableContainer from '../GenericTableContainer';

// Mock the dependencies
jest.mock('@/utils/toast.js', () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));

jest.mock('@/utils/logger.js', () => ({
  logger: {
    log: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock DynamicTable component
jest.mock('../DynamicTable.jsx', () => {
  return function MockDynamicTable({ data, onSelect, onEdit, onDelete }) {
    return (
      <div data-testid="dynamic-table">
        {data.map((item, index) => (
          <div key={index} data-testid={`table-row-${index}`}>
            <button 
              data-testid={`select-${index}`}
              onClick={() => onSelect && onSelect(item)}
            >
              Select
            </button>
            <button 
              data-testid={`edit-${index}`}
              onClick={() => onEdit && onEdit(item)}
            >
              Edit
            </button>
            <button 
              data-testid={`delete-${index}`}
              onClick={() => onDelete && onDelete(item)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    );
  };
});

// Mock ConfirmationModal component
jest.mock('../../Modal/ConfirmationModal', () => {
  return function MockConfirmationModal({ isOpen, onConfirm, onClose }) {
    if (!isOpen) return null;
    return (
      <div data-testid="confirmation-modal">
        <button data-testid="confirm-delete" onClick={onConfirm}>
          Confirm Delete
        </button>
        <button data-testid="cancel-delete" onClick={onClose}>
          Cancel
        </button>
      </div>
    );
  };
});

describe('GenericTableContainer', () => {
  const mockData = [
    { id: '1', name: 'Test Item 1', email: 'test1@example.com' },
    { id: '2', name: 'Test Item 2', email: 'test2@example.com' },
  ];

  const mockColumns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'email', header: 'Email' },
  ];

  const mockDeleteMutation = jest.fn().mockResolvedValue({ unwrap: () => Promise.resolve() });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders table with data', () => {
    render(
      <GenericTableContainer
        data={mockData}
        columns={mockColumns}
        tableType="test"
      />
    );

    expect(screen.getByTestId('dynamic-table')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-0')).toBeInTheDocument();
    expect(screen.getByTestId('table-row-1')).toBeInTheDocument();
  });

  it('handles item selection', () => {
    const { showSuccess } = require('@/utils/toast.js');
    
    render(
      <GenericTableContainer
        data={mockData}
        columns={mockColumns}
        tableType="test"
      />
    );

    fireEvent.click(screen.getByTestId('select-0'));
    expect(showSuccess).toHaveBeenCalledWith('Selected item: Test Item 1');
  });

  it('handles item deletion with confirmation', async () => {
    render(
      <GenericTableContainer
        data={mockData}
        columns={mockColumns}
        tableType="test"
        deleteMutation={mockDeleteMutation}
        deleteItemName="test item"
        getItemDisplayName={(item) => item.name}
      />
    );

    // Click delete button
    fireEvent.click(screen.getByTestId('delete-0'));
    
    // Should show confirmation modal
    expect(screen.getByTestId('confirmation-modal')).toBeInTheDocument();
    
    // Click confirm
    fireEvent.click(screen.getByTestId('confirm-delete'));
    
    // Should call delete mutation
    expect(mockDeleteMutation).toHaveBeenCalledWith({
      id: '1',
      name: 'Test Item 1',
      email: 'test1@example.com'
    });
  });

  it('handles custom onSelect handler', () => {
    const customOnSelect = jest.fn();
    
    render(
      <GenericTableContainer
        data={mockData}
        columns={mockColumns}
        tableType="test"
        onSelect={customOnSelect}
      />
    );

    fireEvent.click(screen.getByTestId('select-0'));
    expect(customOnSelect).toHaveBeenCalledWith(mockData[0]);
  });

  it('handles custom onEdit handler', () => {
    const customOnEdit = jest.fn();
    
    render(
      <GenericTableContainer
        data={mockData}
        columns={mockColumns}
        tableType="test"
        onEdit={customOnEdit}
      />
    );

    fireEvent.click(screen.getByTestId('edit-0'));
    expect(customOnEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('handles custom onDelete handler', () => {
    const customOnDelete = jest.fn();
    
    render(
      <GenericTableContainer
        data={mockData}
        columns={mockColumns}
        tableType="test"
        onDelete={customOnDelete}
      />
    );

    fireEvent.click(screen.getByTestId('delete-0'));
    expect(customOnDelete).toHaveBeenCalledWith(mockData[0]);
  });
});
