
export const getMarketsByUsersCardProps = (tasks = [], users = [], isLoading = false) => {
  // Calculate total tasks for the badge
  const totalTasks = tasks?.length || 0;
  
  // Return the same structure that MarketsByUsersCard expects
  // The card will do the calculations internally via useMemo
  return {
    tasks,
    users,
    totalTasks,
    isLoading,
  };
};


export const getCachedMarketsByUsersCardProps = (
  tasks = [],
  users = [],
  isLoading = false
) => {
  return getMarketsByUsersCardProps(tasks, users, isLoading);
};

