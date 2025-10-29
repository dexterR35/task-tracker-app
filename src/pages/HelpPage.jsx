/**
 * Help Page Component
 * 
 * @fileoverview Help page with last updates, feedback form, and feedback table
 * @author Senior Developer
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Icons } from '@/components/icons';
import DynamicButton from '@/components/ui/Button/DynamicButton';
import TextareaField from '@/components/forms/components/TextareaField';
import TanStackTable from '@/components/Table/TanStackTable';
import { createColumnHelper } from '@tanstack/react-table';
import { CARD_SYSTEM, TABLE_SYSTEM } from '@/constants';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, limit } from 'firebase/firestore';
import { db } from '@/app/firebase';
import { logger } from '@/utils/logger';

const columnHelper = createColumnHelper();

const HelpPage = () => {
  const { user } = useAuth();
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [updatesList, setUpdatesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatesLoading, setIsUpdatesLoading] = useState(true);

  // Get user's color based on role
  const getUserColor = () => {
    const role = user?.role || 'user';
    return CARD_SYSTEM.COLOR_HEX_MAP[role === 'admin' ? 'crimson' : 'purple'];
  };

  const userColor = getUserColor();

  // Submit feedback to Firebase dev collection
  const handleSubmitFeedback = async () => {
    if (!feedbackText.trim()) {
      alert('Please enter your feedback before submitting');
      return;
    }

    if (feedbackText.length > 300) {
      alert('Feedback must be 300 characters or less');
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Submit to dev collection feedback
      const feedbackData = {
        description: feedbackText.trim(),
        status: 'pending',
        submittedBy: user?.email || 'unknown',
        submittedByName: user?.name || 'Unknown User',
        submittedAt: serverTimestamp(),
        type: 'feedback' // Can be 'bug', 'feature', 'feedback'
      };

      await addDoc(collection(db, 'feedback'), feedbackData);
      
      logger.log('Feedback submitted successfully', feedbackData);
      alert('Thank you for your feedback! It has been submitted successfully.');
      setFeedbackText('');
      
    } catch (error) {
      logger.error('Error submitting feedback:', error);
      alert('Error submitting feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load updates from Firebase
  useEffect(() => {
    const loadUpdates = () => {
      try {
        const updatesQuery = query(
          collection(db, 'updates'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );

        const unsubscribe = onSnapshot(updatesQuery, (snapshot) => {
          const updatesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date()
          }));
          setUpdatesList(updatesData);
          setIsUpdatesLoading(false);
        }, (error) => {
          logger.error('Error loading updates:', error);
          setIsUpdatesLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        logger.error('Error setting up updates listener:', error);
        setIsUpdatesLoading(false);
      }
    };

    const unsubscribe = loadUpdates();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load feedback from Firebase
  useEffect(() => {
    const loadFeedback = () => {
      try {
        const feedbackQuery = query(
          collection(db, 'feedback'),
          orderBy('submittedAt', 'desc')
        );

        const unsubscribe = onSnapshot(feedbackQuery, (snapshot) => {
          const feedbackData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            submittedAt: doc.data().submittedAt?.toDate?.() || new Date()
          }));
          setFeedbackList(feedbackData);
          setIsLoading(false);
        }, (error) => {
          logger.error('Error loading feedback:', error);
          setIsLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        logger.error('Error setting up feedback listener:', error);
        setIsLoading(false);
      }
    };

    const unsubscribe = loadFeedback();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Table columns for feedback
  const feedbackColumns = useMemo(() => [
    columnHelper.accessor('submittedByName', {
      header: 'Submitted By',
      cell: ({ getValue, row }) => {
        const name = getValue();
        const email = row.original.submittedBy;
        return (
          <div className="flex items-center space-x-2">
            <div 
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
              style={{ backgroundColor: userColor }}
            >
              {name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-200">{name}</div>
              <div className="text-xs text-gray-400">{email}</div>
            </div>
          </div>
        );
      },
      size: 200,
    }),
    columnHelper.accessor('description', {
      header: 'Description',
      cell: ({ getValue }) => {
        const description = getValue();
        const truncated = description?.length > 100 ? description.substring(0, 100) + '...' : description;
        return (
          <div className="text-sm text-gray-300 max-w-xs">
            {truncated}
          </div>
        );
      },
      size: 300,
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: ({ getValue }) => {
        const status = getValue();
        const statusConfig = {
          pending: { color: 'amber', text: 'Pending' },
          done: { color: 'green', text: 'Done' },
          in_progress: { color: 'blue', text: 'In Progress' },
          rejected: { color: 'red', text: 'Rejected' }
        };
        
        const config = statusConfig[status] || statusConfig.pending;
        const colorHex = CARD_SYSTEM.COLOR_HEX_MAP[config.color];
        
        return (
          <span 
            className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
            style={{ 
              backgroundColor: `${colorHex}15`,
              color: colorHex,
              border: `1px solid ${colorHex}30`
            }}
          >
            {config.text}
          </span>
        );
      },
      size: 120,
    }),
    columnHelper.accessor('submittedAt', {
      header: 'Submitted At',
      cell: ({ getValue }) => {
        const date = getValue();
        if (!date) return '-';
        
        return (
          <div className="text-sm text-gray-400">
            {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        );
      },
      size: 150,
    }),
  ], [userColor]);

  // Update type badge component - memoized for performance
  const UpdateTypeBadge = useCallback(({ type }) => {
    const typeConfig = {
      feature: { color: 'green', text: 'Feature', icon: Icons.generic.plus },
      bugfix: { color: 'red', text: 'Bug Fix', icon: Icons.generic.warning },
      improvement: { color: 'blue', text: 'Improvement', icon: Icons.generic.settings },
      security: { color: 'amber', text: 'Security', icon: Icons.generic.warning },
      maintenance: { color: 'purple', text: 'Maintenance', icon: Icons.generic.settings }
    };
    
    const config = typeConfig[type] || typeConfig.feature;
    const colorHex = CARD_SYSTEM.COLOR_HEX_MAP[config.color];
    
    return (
      <span 
        className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded space-x-1"
        style={{ 
          backgroundColor: `${colorHex}15`,
          color: colorHex,
          border: `1px solid ${colorHex}30`
        }}
      >
        <config.icon className="w-3 h-3" />
        <span>{config.text}</span>
      </span>
    );
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icons.generic.help className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-200 mb-2">Access Denied</h2>
          <p className="text-gray-400">Please log in to access the help page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Help & Support
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Get help, report issues, and stay updated with the latest changes
            </p>
          </div>
        </div>
      </div>

      {/* Last Updates Section */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div
            className="icon-bg"
            style={{ backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.blue}20` }}
          >
            <Icons.generic.update className="w-6 h-6" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.blue }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-200">Last Updates</h2>
            <p className="text-sm text-gray-400">Recent changes and improvements</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Project Local Updates (manually curated) */}
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.green}08`,
              borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.green}20`
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-sm font-semibold text-gray-200">Recent Local Updates</h3>
                  <span 
                    className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded space-x-1"
                    style={{ 
                      backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.green}15`,
                      color: CARD_SYSTEM.COLOR_HEX_MAP.green,
                      border: `1px solid ${CARD_SYSTEM.COLOR_HEX_MAP.green}30`
                    }}
                  >
                    <Icons.generic.update className="w-3 h-3" />
                    <span>Now</span>
                  </span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm text-gray-300">
                  <li>
                    Landing Pages: Added NetBet LPs dashboard (TanStackTable, filters, global + brand stats)
                  </li>
                  <li>
                    Task Form: Fixed form behavior and validation issues
                  </li>
                  <li>
                    Auth: Fixed userUID role resolution for accurate permissions
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {isUpdatesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-4 rounded-lg border bg-gray-700/20 border-gray-600/30 animate-pulse">
                  <div className="h-4 bg-gray-600/30 rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-gray-600/20 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-600/20 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : updatesList.length > 0 ? (
            updatesList.map((update) => (
              <div 
                key={update.id}
                className="p-4 rounded-lg border hover:bg-gray-700/30 transition-colors"
                style={{ 
                  backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.blue}08`,
                  borderColor: `${CARD_SYSTEM.COLOR_HEX_MAP.blue}20`
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-sm font-semibold text-gray-200">{update.title}</h3>
                      <UpdateTypeBadge type={update.type} />
                    </div>
                    <p className="text-sm text-gray-400 mb-2">{update.description}</p>
                    <p className="text-xs text-gray-500">
                      {update.createdAt?.toLocaleDateString() || 'Unknown date'}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : null}
        </div>
      </div>

      {/* Feedback Form Section */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div
            className="icon-bg"
            style={{ backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.green}20` }}
          >
            <Icons.generic.message className="w-6 h-6" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.green }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-200">Submit Feedback</h2>
            <p className="text-sm text-gray-400">Report bugs, suggest features, or share your thoughts</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="field-wrapper">
            <label htmlFor="feedback" className="field-label">
              Your Feedback <span className="required-indicator">*</span>
            </label>
            <textarea
              id="feedback"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Describe bugs, suggest features, or share any feedback..."
              rows={4}
              maxLength={300}
              className="form-input"
              style={{ resize: 'vertical', minHeight: '100px' }}
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Maximum 300 characters
              </p>
              <p className="text-xs text-gray-500">
                {feedbackText.length}/300
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <DynamicButton
              onClick={handleSubmitFeedback}
              loading={isSubmitting}
              iconName="send"
              disabled={!feedbackText.trim() || feedbackText.length > 300}
            >
              Submit Feedback
            </DynamicButton>
          </div>
        </div>
      </div>

      {/* Feedback Table Section */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div
            className="icon-bg"
            style={{ backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.purple}20` }}
          >
            <Icons.generic.table className="w-6 h-6" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.purple }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-200">Feedback History</h2>
            <p className="text-sm text-gray-400">All submitted feedback and their status</p>
          </div>
        </div>

        <div className="mt-4">
          <TanStackTable
            data={feedbackList}
            columns={feedbackColumns}
            tableType="feedback"
            isLoading={isLoading}
            className="text-sm"
            enableRowSelection={false}
            showBulkActions={false}
            showFilters={false}
            showPagination={true}
            showColumnToggle={false}
            enablePagination={true}
            pageSize={TABLE_SYSTEM.DEFAULT_PAGE_SIZE}
            enableSorting={true}
            enableFiltering={false}
          />
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
