import React from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { useAuth } from "../auth/AuthProvider";

const markets = [
  "RO",
  "COM",
  "UK",
  "IE",
  "FI",
  "DK",
  "DE",
  "AT",
  "IT",
  "GR",
  "FR",
  "Misc",
];

const departments = [
  "MKT C",
  "MKT S",
  "MKT P",
  "ACQ C",
  "ACQ S",
  "ACQ P",
  "PROD C",
  "PROD S",
  "PROD P",
  "Misc",
];

const aiOptions = ["Yes", "No"];

const aiModels = [
  "GPT-3",
  "GPT-4",
  "BERT",
  "T5",
  "RoBERTa",
  "DALL-E",
  "Stable Diffusion",
  "Claude",
  "PaLM",
  "Other",
];

const taskTypes = ["LP", "Banners", "Misc"];

const yesNoOptions = ["Yes", "No"];

export default function TaskForm() {
  const { currentUser, userRole } = useAuth();

  // Redirect if no user is logged in
  if (!currentUser) {
    return <div>Please log in to add tasks.</div>;
  }

  const getCurrentMonth = () => {
    const date = new Date();
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
      2,
      "0"
    )}`;
  };

  const validateForm = (values) => {
    const errors = {};
    
    // Basic field validation
    if (!values.jiraLink) {
      errors.jiraLink = 'Required';
    } else if (!/^https?:\/\/.*jira/i.test(values.jiraLink)) {
      errors.jiraLink = 'Must be a valid Jira URL';
    }
    
    if (!values.market) {
      errors.market = 'Required';
    }
    
    if (!values.department) {
      errors.department = 'Required';
    }
    
    if (!values.aiUsed) {
      errors.aiUsed = 'Required';
    }
    
    // AI-specific validation
    if (values.aiUsed === 'Yes') {
      if (!values.aiModel) {
        errors.aiModel = 'Required when AI is used';
      }
      if (values.aiModel === 'Other' && !values.otherAiModel) {
        errors.otherAiModel = 'Please specify the AI model';
      }
      if (values.timeAi === undefined || values.timeAi < 0) {
        errors.timeAi = 'Must be 0 or more hours';
      }
    }
    
    // Task type validation
    if (!values.taskType) {
      errors.taskType = 'Required';
    } else {
      if (values.taskType === 'LP' && (!values.lpNumber || values.lpNumber < 1)) {
        errors.lpNumber = 'Must be at least 1';
      }
      if (values.taskType === 'Banners' && (!values.bannerNumber || values.bannerNumber < 1)) {
        errors.bannerNumber = 'Must be at least 1';
      }
      if (values.taskType === 'Misc' && !values.miscInfo) {
        errors.miscInfo = 'Required for misc tasks';
      }
    }
    
    // Time validation
    if (!values.timeUser || values.timeUser < 0.5) {
      errors.timeUser = 'Must be at least 0.5 hours';
    }
    
    return errors;
  };

      const handleSubmit = async (values, { resetForm, setSubmitting }) => {
    try {
      setSubmitting(true);
      const currentMonth = getCurrentMonth();
      
      // Ensure we have the current user details
      if (!currentUser?.uid) {
        throw new Error('User not logged in');
      }

      const newTask = {
        ...values,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        status: 'active',
        month: currentMonth,
        // Add task type specific data
        ...(values.taskType === 'LP' && { lpCount: parseInt(values.lpNumber) }),
        ...(values.taskType === 'Banners' && { bannerCount: parseInt(values.bannerNumber) }),
        ...(values.taskType === 'Misc' && { miscDetails: values.miscInfo })
      };

      // Get existing tasks from localStorage
      let userTasks = {};
      try {
        userTasks = JSON.parse(localStorage.getItem('userTasks') || '{}');
        
        // Initialize tasks array for this user if it doesn't exist
        if (!userTasks[currentUser.uid]) {
          userTasks[currentUser.uid] = [];
        }
        
        // Add new task to user's tasks array
        userTasks[currentUser.uid].push(newTask);
        
        // Save back to localStorage
        localStorage.setItem('userTasks', JSON.stringify(userTasks));

        console.log(`Task added for user ${currentUser.uid} (${currentUser.email})`);      } catch (e) {
        console.error('Error handling tasks:', e);
        throw new Error('Failed to save task');
      }

      resetForm();
      alert("Task submitted successfully!");
      
      // Trigger a refresh of the TaskList component
      window.dispatchEvent(new Event('taskUpdated'));
    } catch (error) {
      console.error("Error submitting task:", error);
      alert("Error submitting task. Please try again.");
    }
  };

  return (
    <div className="task-form">
      <h2>New Task Entry</h2>
      <Formik
        initialValues={{
          jiraLink: "",
          market: "",
          department: "",
          aiUsed: "No",
          aiModel: "",
          otherAiModel: "",
          timeAi: 0,
          timeUser: 0.5,
          isOldTask: "No",
          taskType: "",
          lpNumber: "",
          bannerNumber: "",
          miscInfo: "",
        }}
        validate={validateForm}
        onSubmit={handleSubmit}
      >
        {({ values, isSubmitting }) => (
          <Form>
            <div className="form-group">
              <label htmlFor="jiraLink">Jira Ticket Link</label>
              <Field type="text" id="jiraLink" name="jiraLink" required />
              <ErrorMessage name="jiraLink" component="div" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="market">Market</label>
              <Field as="select" id="market" name="market" required>
                <option value="">Select Market</option>
                {markets.map((market) => (
                  <option key={market} value={market}>
                    {market}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="market" component="div" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="department">Department</label>
              <Field as="select" id="department" name="department" required>
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="department" component="div" className="error" />
            </div>

            <div className="form-group">
              <label htmlFor="aiUsed">AI Used</label>
              <Field as="select" id="aiUsed" name="aiUsed" required>
                <option value="">Select Option</option>
                {aiOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Field>
              <ErrorMessage name="aiUsed" component="div" className="error" />
            </div>

            {values.aiUsed === "Yes" && (
              <>
                <div className="form-group">
                  <label htmlFor="aiModel">AI Model</label>
                  <Field as="select" id="aiModel" name="aiModel" required>
                    <option value="">Select Model</option>
                    {aiModels.map((model) => (
                      <option key={model} value={model}>
                        {model}
                      </option>
                    ))}
                  </Field>
                </div>

                {values.aiModel === "Other" && (
                  <div className="form-group">
                    <label htmlFor="otherAiModel">Specify AI Model</label>
                    <Field
                      type="text"
                      id="otherAiModel"
                      name="otherAiModel"
                      placeholder="Enter AI model name"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="timeAi">Time Spent with AI (Hours)</label>
                  <Field
                    type="number"
                    id="timeAi"
                    name="timeAi"
                    step="0.5"
                    min="0"
                    required
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label htmlFor="timeUser">Time Spent on Task (Hours)</label>
              <Field
                type="number"
                id="timeUser"
                name="timeUser"
                step="0.5"
                min="0.5"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="isOldTask">Is this an old task?</label>
              <Field as="select" id="isOldTask" name="isOldTask" required>
                <option value="">Select Option</option>
                {yesNoOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Field>
            </div>

            <div className="form-group">
              <label htmlFor="taskType">Task Type</label>
              <Field as="select" id="taskType" name="taskType" required>
                <option value="">Select Task Type</option>
                {taskTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </Field>
            </div>

            {values.taskType === "LP" && (
              <div className="form-group">
                <label htmlFor="lpNumber">Number of Landing Pages</label>
                <Field
                  type="number"
                  id="lpNumber"
                  name="lpNumber"
                  min="1"
                  required
                />
              </div>
            )}

            {values.taskType === "Banners" && (
              <div className="form-group">
                <label htmlFor="bannerNumber">Number of Banners</label>
                <Field
                  type="number"
                  id="bannerNumber"
                  name="bannerNumber"
                  min="1"
                  required
                />
              </div>
            )}

            {values.taskType === "Misc" && (
              <div className="form-group">
                <label htmlFor="miscInfo">Miscellaneous Information</label>
                <Field type="text" id="miscInfo" name="miscInfo" required />
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="submit-button">
              {isSubmitting ? 'Submitting...' : 'Submit Task'}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
