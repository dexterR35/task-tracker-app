import { useNavigate } from "../hooks/useImports";
import DynamicButton from "../components/button/DynamicButton";
import netbetLogo from "../assets/netbet-logo.png";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary px-4 py-14 relative">
      <div className="max-w-5xl mx-auto">      
          <div className="px-10 pt-12 text-center mt-10">
            <h1 className="mt-2 text-5xl font-extrabold tracking-tight flex flex-row items-center justify-center gap-4 text-gray-100">
              Welcome to   <img
                src={netbetLogo}
                alt="NetBet Logo"
                className="h-fit w-50 object-contain"
              />
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Track tasks, generate insights, and stay productive with monthly
              analytics.
            </p>
          </div>
          <div className="mt-4 mb-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <DynamicButton
              variant="primary"
              size="lg"
              onClick={() => navigate("/login")}
              successMessage="Welcome back!"
              className="w-48 !font-extrabold !text-lg"
            >
              Login
            </DynamicButton>
          </div>
          {/* Footer */}
          <div className=" px-8 py-5  text-xs text-center w-full text-gray-400 bottom-0 left-50">
            © {new Date().getFullYear()} NetBet — Task & Analytics Dashboard
          </div>
      </div>
    </div>
  );
};

export default HomePage;
