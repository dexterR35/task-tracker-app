import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  setTheme, 
  toggleSidebar, 
  setSidebarOpen, 
  openModal, 
  closeModal,
  setGlobalLoading,
  setLoading,
  setError,
  clearError,
  clearAllErrors,
  setButtonState,
  updateComponentConfig,
  resetUI 
} from '../redux/slices/uiSlice';

export const useUI = () => {
  const dispatch = useDispatch();
  const ui = useSelector(state => state.ui);

  const toggleTheme = useCallback(() => {
    dispatch(setTheme(ui.theme === 'light' ? 'dark' : 'light'));
  }, [dispatch, ui.theme]);

  const changeTheme = useCallback((theme) => {
    dispatch(setTheme(theme));
  }, [dispatch]);

  const handleToggleSidebar = useCallback(() => {
    dispatch(toggleSidebar());
  }, [dispatch]);

  const handleSetSidebarOpen = useCallback((isOpen) => {
    dispatch(setSidebarOpen(isOpen));
  }, [dispatch]);

  const handleOpenModal = useCallback((modalId, props = {}) => {
    dispatch(openModal({ modalId, props }));
  }, [dispatch]);

  const handleCloseModal = useCallback((modalId) => {
    dispatch(closeModal(modalId));
  }, [dispatch]);

  const handleSetGlobalLoading = useCallback((isLoading) => {
    dispatch(setGlobalLoading(isLoading));
  }, [dispatch]);

  const handleSetLoading = useCallback((key, isLoading) => {
    dispatch(setLoading({ key, isLoading }));
  }, [dispatch]);

  const handleSetError = useCallback((key, error) => {
    dispatch(setError({ key, error }));
  }, [dispatch]);

  const handleClearError = useCallback((key) => {
    dispatch(clearError(key));
  }, [dispatch]);

  const handleClearAllErrors = useCallback(() => {
    dispatch(clearAllErrors());
  }, [dispatch]);

  const handleSetButtonState = useCallback((buttonId, state) => {
    dispatch(setButtonState({ buttonId, state }));
  }, [dispatch]);

  const handleUpdateComponentConfig = useCallback((component, config) => {
    dispatch(updateComponentConfig({ component, config }));
  }, [dispatch]);

  const handleResetUI = useCallback(() => {
    dispatch(resetUI());
  }, [dispatch]);

  return {
    // State
    theme: ui.theme,
    sidebarOpen: ui.sidebarOpen,
    modals: ui.modals,
    globalLoading: ui.globalLoading,
    loading: ui.loading,
    errors: ui.errors,
    buttonStates: ui.buttonStates,
    componentConfig: ui.componentConfig,

    // Actions
    toggleTheme,
    changeTheme,
    toggleSidebar: handleToggleSidebar,
    setSidebarOpen: handleSetSidebarOpen,
    openModal: handleOpenModal,
    closeModal: handleCloseModal,
    setGlobalLoading: handleSetGlobalLoading,
    setLoading: handleSetLoading,
    setError: handleSetError,
    clearError: handleClearError,
    clearAllErrors: handleClearAllErrors,
    setButtonState: handleSetButtonState,
    updateComponentConfig: handleUpdateComponentConfig,
    resetUI: handleResetUI,
  };
};
