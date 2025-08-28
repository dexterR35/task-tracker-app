import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAuth } from "../../shared/hooks/useAuth";

import { 
  useCreateReporterMutation, 
  useUpdateReporterMutation, 
  useDeleteReporterMutation 
} from "../../features/reporters/reportersApi";
import { useCentralizedDataAnalytics } from "../../shared/hooks/analytics/useCentralizedDataAnalytics";
import DynamicButton from "../../shared/components/ui/DynamicButton";
import Loader from "../../shared/components/ui/Loader";
import { PencilIcon, TrashIcon, CheckIcon, XMarkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { sanitizeText } from "../../shared/utils/sanitization";
import { logger } from "../../shared/utils/logger";
import { useCacheManagement } from "../../shared/hooks/useCacheManagement";
import { useGlobalMonthId } from "../../shared/hooks/useGlobalMonthId";

const AdminReportersPage = () => {
  const { user: currentUser, canAccess } = useAuth();
  const { monthId } = useGlobalMonthId();
  
  // Debug logging
  logger.debug('[AdminReportersPage] Rendering with:', {
    user: currentUser?.email,
    canAccessAdmin: canAccess('admin'),
    monthId
  });

  // Check access
  if (!canAccess('admin')) {
    logger.warn('[AdminReportersPage] Access denied for user:', currentUser?.email);
    return (
      <div className="min-h-screen flex-center bg-primary">
        <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md mx-4">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You don't have permission to access the reporters page.
          </p>
        </div>
      </div>
    );
  }

  // Local state
  const [editingId, setEditingId] = useState(null);
  const [editingForm, setEditingForm] = useState({});
  const [rowActionId, setRowActionId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Validation schema
  const validationSchema = Yup.object({
    name: Yup.string()
      .required("Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(50, "Name must be less than 50 characters"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    role: Yup.string()
      .required("Role is required")
      .min(1, "Role is required")
      .max(50, "Role must be less than 50 characters"),
    departament: Yup.string()
      .required("Departament is required")
      .min(1, "Departament is required")
      .max(50, "Departament must be less than 50 characters"),
    occupation: Yup.string()
      .required("Occupation is required")
      .min(1, "Occupation is required")
      .max(100, "Occupation must be less than 100 characters"),
  });

  // Initial values for create form
  const createInitialValues = {
    name: "",
    email: "",
    role: "",
    departament: "",
    occupation: "",
  };

  // Use centralized data system - reporters are loaded globally
  const { reporters = [], isLoading, isFetching, error: reportersError } = useCentralizedDataAnalytics(monthId);
  
  // Show loading state if data is being fetched or loaded
  const showLoading = isLoading || isFetching;
  
  // API hooks from centralized store
  const [createReporter] = useCreateReporterMutation();
  const [updateReporter] = useUpdateReporterMutation();
  const [deleteReporter] = useDeleteReporterMutation();
  
  // Cache management
  const { clearReportersCache, clearCacheOnDataChange } = useCacheManagement();

  // Handle create reporter
  const startCreate = () => {
    setShowCreateForm(true);
  };

  const cancelCreate = () => {
    setShowCreateForm(false);
  };

  const handleCreateSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      setRowActionId("create");

      // Additional validation check
      const requiredFields = ['name', 'email', 'role', 'departament', 'occupation'];
      const missingFields = requiredFields.filter(field => !values[field] || values[field].trim() === '');
      
      if (missingFields.length > 0) {
        const { showError } = await import("../../shared/utils/toast");
        showError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setRowActionId(null);
        setSubmitting(false);
        return;
      }

      const reporterData = {
        name: sanitizeText(values.name),
        email: sanitizeText(values.email),
        role: sanitizeText(values.role),
        departament: sanitizeText(values.departament),
        occupation: sanitizeText(values.occupation),
        createdBy: currentUser?.uid,
        createdByName: currentUser?.name || currentUser?.email,
      };

      await createReporter(reporterData).unwrap();
      logger.log("[AdminReportersPage] created reporter", reporterData);
      clearCacheOnDataChange('reporters', 'create');
      const { showSuccess } = await import("../../shared/utils/toast");
      showSuccess("Reporter created successfully!");
      setShowCreateForm(false);
      resetForm();
    } catch (e) {
      logger.error("Reporter creation error:", e);
      const { showError } = await import("../../shared/utils/toast");
      showError(`Failed to create reporter: ${e.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
      setSubmitting(false);
    }
  };

  // Handle edit reporter
  const startEdit = (reporter) => {
    setEditingId(reporter.id);
    setEditingForm({
      name: reporter.name || "",
      email: reporter.email || "",
      role: reporter.role || "",
              departament: reporter.departament || "",
      occupation: reporter.occupation || "",
    });
  };

  const handleEditSubmit = async (values) => {
    if (!editingId) return;

    try {
      setRowActionId(editingId);

      // Additional validation check
      const requiredFields = ['name', 'email', 'role', 'departament', 'occupation'];
      const missingFields = requiredFields.filter(field => !values[field] || values[field].trim() === '');
      
      if (missingFields.length > 0) {
        const { showError } = await import("../../shared/utils/toast");
        showError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        setRowActionId(null);
        return;
      }

      const updates = {
        name: sanitizeText(values.name),
        email: sanitizeText(values.email),
        role: sanitizeText(values.role),
        departament: sanitizeText(values.departament),
        occupation: sanitizeText(values.occupation),
      };

      await updateReporter({ id: editingId, updates }).unwrap();
      logger.log("[AdminReportersPage] updated reporter", { id: editingId, updates });
      clearCacheOnDataChange('reporters', 'update');
      const { showSuccess } = await import("../../shared/utils/toast");
      showSuccess("Reporter updated successfully!");
    } catch (e) {
      logger.error("Reporter update error:", e);
      const { showError } = await import("../../shared/utils/toast");
      showError(`Failed to update reporter: ${e.message || "Please try again."}`);
    } finally {
      setEditingId(null);
      setRowActionId(null);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingForm({});
  };

  const removeReporter = async (reporter) => {
    if (!window.confirm("Delete this reporter?")) return;

    try {
      setRowActionId(reporter.id);
      await deleteReporter(reporter.id).unwrap();
      clearCacheOnDataChange('reporters', 'delete');
      const { showSuccess } = await import("../../shared/utils/toast");
      showSuccess("Reporter deleted successfully!");
    } catch (e) {
      logger.error("Reporter delete error:", e);
      const { showError } = await import("../../shared/utils/toast");
      showError(`Failed to delete reporter: ${e.message || "Please try again."}`);
    } finally {
      setRowActionId(null);
    }
  };

  // Show error state
  if (reportersError) {
    return (
      <div className="bg-red-error border rounded-lg p-6 text-center text-white">
        <p className="text-sm">
          Error loading reporters: {reportersError.message || "Unknown error"}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-white text-red-error rounded hover:bg-gray-100"
        >
          Retry
        </button>
      </div>
    );
  }

  if (showLoading) {
    return (
      <Loader 
        size="xl" 
        variant="spinner" 
        text="Loading reporters..." 
        fullScreen={true}
      />
    );
  }

  return (
    <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-100 mb-2">Reporter Management</h1>
            <p className="text-sm text-gray-300">
              Manage reporters who can be assigned to tasks
            </p>
          </div>

          {/* Create Reporter Button */}
          <div className="mb-6 flex gap-4">
            <DynamicButton
              onClick={startCreate}
              variant="primary"
              icon={PlusIcon}
              size="md"
              disabled={showCreateForm}
            >
              Add Reporter
            </DynamicButton>
            
            {/* Debug: Clear Cache Button */}
            {import.meta.env.MODE === 'development' && (
              <DynamicButton
                onClick={clearReportersCache}
                variant="outline"
                size="md"
              >
                Clear Cache (Debug)
              </DynamicButton>
            )}
          </div>

          {/* Create Reporter Form */}
          {showCreateForm && (
            <div className="mb-6 bg-primary p-6 border rounded-lg">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">Add New Reporter</h3>
              <Formik
                initialValues={createInitialValues}
                validationSchema={validationSchema}
                onSubmit={handleCreateSubmit}
              >
                {({ isSubmitting, isValid }) => (
                  <Form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Name *
                        </label>
                        <Field
                          name="name"
                          type="text"
                          className="w-full px-3 py-2 border rounded-md bg-secondary text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-600"
                          placeholder="Enter reporter name"
                        />
                        <ErrorMessage
                          name="name"
                          component="div"
                          className="text-red-error text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email *
                        </label>
                        <Field
                          name="email"
                          type="email"
                          className="w-full px-3 py-2 border rounded-md bg-secondary text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-600"
                          placeholder="Enter reporter email"
                        />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="text-red-error text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Role *
                        </label>
                        <Field
                          name="role"
                          type="text"
                          className="w-full px-3 py-2 border rounded-md bg-secondary text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-600"
                          placeholder="Enter reporter role"
                        />
                        <ErrorMessage
                          name="role"
                          component="div"
                          className="text-red-error text-sm mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Departament *
                        </label>
                        <Field
                          name="departament"
                          type="text"
                          className="w-full px-3 py-2 border rounded-md bg-secondary text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-600"
                          placeholder="Enter departament"
                        />
                        <ErrorMessage
                          name="departament"
                          component="div"
                          className="text-red-error text-sm mt-1"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Occupation *
                        </label>
                        <Field
                          name="occupation"
                          type="text"
                          className="w-full px-3 py-2 border rounded-md bg-secondary text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-600"
                          placeholder="Enter occupation"
                        />
                        <ErrorMessage
                          name="occupation"
                          component="div"
                          className="text-red-error text-sm mt-1"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2 mt-4">
                      <DynamicButton
                        type="submit"
                        variant="success"
                        size="sm"
                        icon={CheckIcon}
                        loading={isSubmitting}
                        disabled={!isValid}
                      >
                        Save
                      </DynamicButton>
                      <DynamicButton
                        type="button"
                        variant="outline"
                        size="sm"
                        icon={XMarkIcon}
                        onClick={cancelCreate}
                      >
                        Cancel
                      </DynamicButton>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* Reporters Table */}
          <div className="bg-primary p-6 border rounded-lg overflow-x-auto shadow-sm">
            <div className="flex-center !mx-0 !justify-between p-3 text-xs text-gray-300">
              <div>
                Showing {reporters.length} reporters
              </div>
            </div>

            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-gray-800">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Role</th>
                                          <th className="px-6 py-3">Departament</th>
                  <th className="px-6 py-3">Occupation</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                                {reporters.map((reporter) => (
                  <tr key={reporter.id} className="border-b border-gray-700 hover:bg-gray-800">
                    {editingId === reporter.id ? (
                      <>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editingForm.name || ""}
                            onChange={(e) => setEditingForm({ ...editingForm, name: e.target.value })}
                            className="w-full px-2 py-1 border rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="email"
                            value={editingForm.email || ""}
                            onChange={(e) => setEditingForm({ ...editingForm, email: e.target.value })}
                            className="w-full px-2 py-1 border rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editingForm.role || ""}
                            onChange={(e) => setEditingForm({ ...editingForm, role: e.target.value })}
                            className="w-full px-2 py-1 border rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                                                    value={editingForm.departament || ""}
                        onChange={(e) => setEditingForm({ ...editingForm, departament: e.target.value })}
                            className="w-full px-2 py-1 border rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editingForm.occupation || ""}
                            onChange={(e) => setEditingForm({ ...editingForm, occupation: e.target.value })}
                            className="w-full px-2 py-1 border rounded bg-gray-700 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 border-gray-600"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-400">
                            {reporter.createdAt 
                              ? new Date(reporter.createdAt).toLocaleDateString()
                              : "N/A"
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <DynamicButton
                              onClick={() => handleEditSubmit(editingForm)}
                              variant="success"
                              size="xs"
                              icon={CheckIcon}
                              loading={rowActionId === reporter.id}
                            >
                              Save
                            </DynamicButton>
                            <DynamicButton
                              type="button"
                              variant="outline"
                              size="xs"
                              icon={XMarkIcon}
                              onClick={cancelEdit}
                            >
                              Cancel
                            </DynamicButton>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4">
                          <span>{reporter.name || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span>{reporter.email || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span>{reporter.role || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span>{reporter.departament || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span>{reporter.occupation || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-gray-400">
                            {reporter.createdAt 
                              ? new Date(reporter.createdAt).toLocaleDateString()
                              : "N/A"
                            }
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <DynamicButton
                              onClick={() => startEdit(reporter)}
                              variant="outline"
                              size="xs"
                              icon={PencilIcon}
                            >
                              Edit
                            </DynamicButton>
                            <DynamicButton
                              onClick={() => removeReporter(reporter)}
                              variant="danger"
                              size="xs"
                              icon={TrashIcon}
                              loading={rowActionId === reporter.id}
                            >
                              Delete
                            </DynamicButton>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty state */}
            {reporters.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No reporters found. Add your first reporter above.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

export default AdminReportersPage;
