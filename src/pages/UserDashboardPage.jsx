import { useAuth } from "../hooks/useAuth";
import DashboardWrapper from "../components/dashboard/DashboardWrapper";
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
