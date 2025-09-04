import React from "react";
import { useFetchData } from "@/hooks/useFetchData.js";
import { useCreateReporterMutation, useUpdateReporterMutation } from "@/features/reporters";
import { useCacheManagement } from "@/hooks/useCacheManagement.js";
import DynamicForm from "@/components/forms/DynamicForm/DynamicForm.jsx";
import { reporterFormConfig } from "@/components/forms/configs/index.js";
import { showError, showSuccess } from "@/utils/toast.js";
import { logger } from "@/utils/logger.js";
import { sanitizeText } from "@/components/forms/utils/sanitization/sanitization";

const ReporterForm = ({
  mode = 'create', // 'create' or 'edit'
  reporterId = null,
  initialValues = null,
  className = "",
}) => {
  const { user: currentUser } = useFetchData();
  const [createReporter] = useCreateReporterMutation();
  const [updateReporter] = useUpdateReporterMutation();
  const { clearCacheOnDataChange } = useCacheManagement();

  // Get form configuration
  const { fields, options } = reporterFormConfig;

  // Get initial values
  const getInitialValues = () => {
    if (mode === 'edit' && initialValues) {
      return {
        name: initialValues.name || "",
        email: initialValues.email || "",
        role: "reporter", // Always set to reporter
        departament: initialValues.departament || "",
        occupation: initialValues.occupation || "",
      };
    }
    return {
      name: "",
      email: "",
      role: "reporter", // Always set to reporter
      departament: "",
      occupation: "",
    };
  };

  // Handle form submission
  const handleSubmit = async (preparedData, { setSubmitting, resetForm, setFieldError }) => {
    try {
      const data = {
        name: sanitizeText(preparedData.name),
        email: sanitizeText(preparedData.email),
        role: "reporter", // Always set to reporter
        departament: sanitizeText(preparedData.departament),
        occupation: sanitizeText(preparedData.occupation),
      };

      logger.log(`${mode === 'edit' ? 'Updating' : 'Creating'} reporter with data:`, data);

      let result;
      if (mode === 'edit') {
        if (!reporterId) {
          throw new Error('Reporter ID is required for editing');
        }
        result = await updateReporter({ id: reporterId, updates: data }).unwrap();
        logger.log(`Reporter updated successfully:`, result);
        showSuccess(`Reporter updated successfully!`);
        clearCacheOnDataChange('reporters', 'update');
      } else {
        const reporterData = {
          ...data,
          createdBy: currentUser?.uid,
          createdByName: currentUser?.name || currentUser?.email,
        };
        result = await createReporter(reporterData).unwrap();
        logger.log(`Reporter created successfully:`, result);
        showSuccess(`Reporter created successfully!`);
        clearCacheOnDataChange('reporters', 'create');
      }
      
      if (mode === 'create') {
        resetForm();
      }
    } catch (error) {
      logger.error(`Reporter ${mode === 'edit' ? 'update' : 'creation'} failed:`, error);
      showError(`Failed to ${mode === 'edit' ? 'update' : 'create'} reporter: ${error?.message || "Please try again."}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={className}>
      <DynamicForm
        fields={fields}
        options={options}
        initialValues={getInitialValues()}
        onSubmit={handleSubmit}
        className="space-y-6"
        submitText={mode === 'edit' ? 'Update Reporter' : 'Create Reporter'}
        submitButtonProps={{
          loadingText: mode === 'edit' ? "Updating..." : "Creating...",
          iconName: mode === 'edit' ? "edit" : "plus",
          iconPosition: "left",
          variant: mode === 'edit' ? "secondary" : "primary",
          disabled: false
        }}
        validateOnMount={false}
        validateOnChange={true}
        validateOnBlur={true}
      />
    </div>
  );
};

export default ReporterForm;
