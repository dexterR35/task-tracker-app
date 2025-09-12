import React, { useState } from "react";
import DynamicButton from "../../Button/DynamicButton";
import { useDeleteReporterMutation } from "@/features/reporters/reportersApi";
import { showError, showSuccess } from "@/utils/toast";
import { logger } from "@/utils/logger";
import ReporterFormModal from "@/components/modals/ReporterFormModal";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import SkeletonCards from "../SkeletonCards/SkeletonCards";
import { formatDate } from "@/utils/dateUtils";
import { isAdmin } from "@/utils/permissions";

const CardsGrid = ({
  className = "",
  items = [],
  type = "user", // 'user' or 'reporter'
  monthId,
  isLoading = false,
  error = null,
  children, // Function to render each card: (item) => JSX
}) => {
  const [rowActionId, setRowActionId] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // API hooks for reporter CRUD (only used when type is 'reporter')
  const [deleteReporter] = useDeleteReporterMutation();

  // Handle item edit
  const handleItemEdit = (item) => {
    if (type === "reporter" || type === "reporters") {
      setEditingItem(item);
      setShowEditModal(true);
    } else if (type === "user" || type === "users") {
      showError("You don't have superpower for that!");
      logger.log(`${type} edit requested for:`, item);
    } else {
      // For other types, you can implement actual edit logic here
      logger.log(`${type} edit requested for:`, item);
    }
  };

  // Handle item delete
  const handleItemDelete = (item) => {
    if (type === "reporter" || type === "reporters") {
      setItemToDelete(item);
      setShowDeleteConfirm(true);
    } else if (type === "user" || type === "users") {
      showError("You don't have superpower for that!");
      logger.log(`${type} deletion requested for:`, item);
    } else {
      // For other types, you can implement actual delete logic here
      logger.log(`${type} deletion requested for:`, item);
    }
  };

  const confirmDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      setRowActionId(itemToDelete.id);
      if (type === "reporter") {
        await deleteReporter(itemToDelete.id).unwrap();
        showSuccess("Reporter deleted successfully!");
      }
    } catch (error) {
      logger.error(`${type} delete error:`, error);
      showError(
        `Failed to delete ${type}: ${error?.message || "Please try again."}`
      );
    } finally {
      setRowActionId(null);
      setItemToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  // Card rendering with all information and actions
  const renderCard = (item) => {
    const displayName = item.name || "No Name";
    const displaySymbol = displayName.substring(0, 2).toUpperCase();

    // Get status based on data type and content
    const getStatus = () => {
      if (type === "user" || item.role) {
        if (isAdmin(item)) return "ADMIN";
        if (item.role === "reporter") return "REPORTER";
        return "USER";
      }

      if (type === "reporter" || item.departament) {
        if (item.departament) return item.departament.toUpperCase();
        return "REPORTER";
      }

      return null;
    };

    return (
      <div
        key={item.id}
        className="cards_item card min-w-[220px] !h-[160px] p-0 overflow-hidden relative !rounded-md border border-gray-600/50 !bg-linear-to-br from-[#067acc] to-[#021b2f] "
      >
        {children ? (
          children(item, {
            displayName,
            displaySymbol,
            status: getStatus(),
            onEdit: () => handleItemEdit(item),
            onDelete: () => handleItemDelete(item),
            isActionLoading: rowActionId === item.id,
          })
        ) : (
          <>
            <p className="bg-[#0c8ae3] h-[4px] w-full p-0 !m-0"></p>
            <div className="flex flex-col justify-between h-full px-2 pb-3 pt-1 ">
              <div className="flex-center justify-between !important w-full flex-row  text-[11px]">
                <p className="lowercase">{getStatus()}</p>

                <p className="text-center !text-[10px] -mt-1">{item.email}</p>
              </div>
              <div>
                <p className="text-5xl text-center font-bold">
                  {displaySymbol}
                </p>
                <p className="text-center !text-[10px] -mt-1.5">{displayName}</p>
              </div>
              <div className="cards_footer flex items-end justify-between !text-[10px]">
                <div className="flex flex-col items-start justify-start">
                  {(type === "user" || item.role) && item.occupation && (
                    <p className="cards_occupation">{item.occupation}</p>
                  )}
                  {(type === "reporter" || item.departament) && item.country && (
                    <p className="cards_country">Country: {item.country}</p>
                  )}
                  {item.createdAt && (
                    <p className="cards_created">
                      Created: {formatDate(item.createdAt, 'yyyy-MM-dd')}
                    </p>
                  )}
                </div>
                <div className="cards_actions !flex !flex-row gap-1">
                  <DynamicButton
                    variant="outline"
                    size="xs"
                    onClick={() => handleItemEdit(item)}
                    className="!text-[10px] !p-1 !rounded-sm min-w-[40px] !border"
                  >
                    Edit
                  </DynamicButton>

                  <DynamicButton
                    variant="outline"
                    size="xs"
                    onClick={() => handleItemDelete(item)}
                    className="!text-[10px] !p-1 !rounded-sm min-w-[40px] !border"
                    isLoading={rowActionId === item.id}
                  >
                    Delete
                  </DynamicButton>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  // Render edit modal (only for reporters)
  const renderEditModal = () => {
    if (
      (type !== "reporter" && type !== "reporters") ||
      !showEditModal ||
      !editingItem
    ) {
      return null;
    }

    return (
      <ReporterFormModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
        mode="edit"
        reporter={editingItem}
        onSuccess={() => {
          setShowEditModal(false);
          setEditingItem(null);
        }}
      />
    );
  };

  if (isLoading) {
    return <SkeletonCards className={className} />;
  }

  if (error) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-red-400 text-lg mb-2">Error loading {type}s</div>
        <div className="text-gray-400">
          {error.message || `Failed to load ${type}s`}
        </div>
      </div>
    );
  }

  if (items.length == 0) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-gray-400 text-lg">No {type}s found</div>
      </div>
    );
  }

  return (
    <>
      <div className={`${className} flex flex-wrap gap-4`}>
        {items.map((item) => renderCard(item))}
      </div>
      {renderEditModal()}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setItemToDelete(null);
        }}
        onConfirm={confirmDeleteItem}
        title={`Delete ${type.charAt(0).toUpperCase() + type.slice(1)}`}
        message={`Are you sure you want to delete ${type} "${itemToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={rowActionId === itemToDelete?.id}
      />
    </>
  );
};

export default CardsGrid;
