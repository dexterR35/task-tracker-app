
export const getMarketsByUsersCardProps = (tasks = [], users = [], isLoading = false) => {
  // Return the same structure that MarketsByUsersCard expects
  // The card will do the calculations internally via useMemo
  return {
    tasks,
    users,
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

