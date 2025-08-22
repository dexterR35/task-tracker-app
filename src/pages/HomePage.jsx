import { useNavigate } from "../hooks/useImports";
import DynamicButton from "../components/button/DynamicButton";
import netbetLogo from "../assets/netbet-logo.png";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex-center flex-col relative">
      <div>
        <div className="flex-center flex-row gap-4">
          <h1>Welcome to</h1>
          <img
            src={netbetLogo}
            alt="NetBet Logo"
            className="h-fit w-75 object-contain"
          />
        </div>
        <p className="mt-2 max-w-1/1 text-center mx-auto ">
          Track tasks, generate insights, and stay productive with monthly
          analytics.
        </p>
      </div>
      <div className="mt-10 flex-center">
        <DynamicButton
          variant="primary"
          size="lg"
          onClick={() => navigate("/login")}
          className="w-40 !text-xl !font-bold"
        >
          Explore
        </DynamicButton>
      </div>
      {/* Footer */}
      <p className="absolute text-xs text-center  bottom-10 left-1/2 -translate-x-1/2 -translate-y-1/2">
        © {new Date().getFullYear()} NetBet — Task & Analytics Dashboard
      </p>
    </div>
  );
};

export default HomePage;
