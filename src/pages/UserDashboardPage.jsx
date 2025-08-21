import { useAuth } from "../hooks/useAuth";
import DashboardWrapper from "../components/dashboard/DashboardWrapper";

const UserDashboardPage = () => {
  const { user } = useAuth();

  return (
    <DashboardWrapper
      title={`${user.name} - Dashboard`}
      isAdmin={false}
      
    />
  );
};

export default UserDashboardPage;
