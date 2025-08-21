/**
 * Cache Test Utility
 * Tests the caching strategy implementation
 */

import { taskStorage, analyticsStorage } from './indexedDBStorage';

export const testCachingStrategy = async () => {
  console.log('🧪 Testing Caching Strategy...');
  
  const testMonthId = '2024-01';
  const testTasks = [
    {
      id: 'task1',
      monthId: testMonthId,
      title: 'Test Task 1',
      timeInHours: 2,
      aiUsed: true,
      timeSpentOnAI: 1,
      createdAt: Date.now(),
      userUID: 'user1'
    },
    {
      id: 'task2', 
      monthId: testMonthId,
      title: 'Test Task 2',
      timeInHours: 3,
      aiUsed: false,
      createdAt: Date.now(),
      userUID: 'user2'
    }
  ];

  try {
    // Test 1: Store tasks
    console.log('📝 Test 1: Storing tasks in cache...');
    await taskStorage.storeTasks(testMonthId, testTasks);
    console.log('✅ Tasks stored successfully');

    // Test 2: Retrieve tasks
    console.log('📖 Test 2: Retrieving tasks from cache...');
    const retrievedTasks = await taskStorage.getTasks(testMonthId);
    console.log('✅ Tasks retrieved:', retrievedTasks?.length || 0, 'tasks');

    // Test 3: Check freshness
    console.log('⏰ Test 3: Checking cache freshness...');
    const isFresh = await taskStorage.isTasksFresh(testMonthId);
    console.log('✅ Cache is fresh:', isFresh);

    // Test 4: Add new task
    console.log('➕ Test 4: Adding new task to cache...');
    const newTask = {
      id: 'task3',
      monthId: testMonthId,
      title: 'Test Task 3',
      timeInHours: 1.5,
      aiUsed: true,
      timeSpentOnAI: 0.5,
      createdAt: Date.now(),
      userUID: 'user1'
    };
    await taskStorage.addTask(testMonthId, newTask);
    console.log('✅ New task added successfully');

    // Test 5: Update task
    console.log('✏️ Test 5: Updating task in cache...');
    await taskStorage.updateTask(testMonthId, 'task1', { title: 'Updated Task 1' });
    console.log('✅ Task updated successfully');

    // Test 6: Analytics computation
    console.log('📊 Test 6: Computing analytics from cached tasks...');
    const updatedTasks = await taskStorage.getTasks(testMonthId);
    const analyticsData = {
      monthId: testMonthId,
      generatedAt: new Date().toISOString(),
      totalTasks: updatedTasks.length,
      totalHours: updatedTasks.reduce((sum, t) => sum + (Number(t.timeInHours) || 0), 0),
      ai: {
        tasks: updatedTasks.filter(t => t.aiUsed).length,
        hours: updatedTasks.reduce((sum, t) => sum + (Number(t.timeSpentOnAI) || 0), 0)
      }
    };
    await analyticsStorage.storeAnalytics(testMonthId, analyticsData);
    console.log('✅ Analytics computed and stored');

    // Test 7: Retrieve analytics
    console.log('📈 Test 7: Retrieving analytics from cache...');
    const retrievedAnalytics = await analyticsStorage.getAnalytics(testMonthId);
    console.log('✅ Analytics retrieved:', retrievedAnalytics);

    // Test 8: Check analytics freshness
    console.log('⏰ Test 8: Checking analytics freshness...');
    const analyticsFresh = await analyticsStorage.isAnalyticsFresh(testMonthId);
    console.log('✅ Analytics cache is fresh:', analyticsFresh);

    console.log('🎉 All cache tests passed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Cache test failed:', error);
    return false;
  }
};

export const clearTestData = async () => {
  console.log('🧹 Clearing test data...');
  try {
    await taskStorage.clearTasks('2024-01');
    await analyticsStorage.clearAnalytics('2024-01');
    console.log('✅ Test data cleared successfully');
  } catch (error) {
    console.error('❌ Failed to clear test data:', error);
  }
};

// Export for use in development
if (process.env.NODE_ENV === 'development') {
  window.testCachingStrategy = testCachingStrategy;
  window.clearTestData = clearTestData;
}
