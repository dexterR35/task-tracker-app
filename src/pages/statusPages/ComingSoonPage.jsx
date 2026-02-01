import { useDepartmentApp } from "@/hooks/useDepartmentApp";
import StatusPage from "@/components/ui/StatusPage";

/** Coming Soon – same StatusPage design as Access Denied, 404, Error Boundary. */
const ComingSoonPage = () => {
  const { loginRedirectPath } = useDepartmentApp();
  return (
    <StatusPage
      variant="coming-soon"
      title="Coming Soon"
      message="This page is under development. Check back later."
      primaryAction={{ to: loginRedirectPath, label: "Back to Dashboard", iconName: "home" }}
    />
  );
};

export default ComingSoonPage;
