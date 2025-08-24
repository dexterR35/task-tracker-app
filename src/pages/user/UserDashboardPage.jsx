import { useAuth } from "../../shared/hooks/useAuth";
import DashboardWrapper from "../../features/tasks/components/DashboardWrapper";
import { format } from "date-fns";

const UserDashboardPage = () => {
  const { user } = useAuth();
  const currentMonth = format(new Date(), "yyyy-MM");

  return (
    <DashboardWrapper
      title={`${user.name} - Dashboard`}
      monthId={currentMonth}
      isAdmin={false}
    />
  );
};

export default UserDashboardPage;
