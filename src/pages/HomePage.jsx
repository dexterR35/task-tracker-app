import { useNavigate } from "react-router-dom";
import DynamicButton from "../components/DynamicButton";
import netbetLogo from "../assets/netbet-logo.png";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#141C33] px-4 py-14 relative">
      <div className="max-w-5xl mx-auto">
        <div className="relative overflow-hidden">
          {/* Accent gradient blob */}

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

          {/* Feature grid */}
          <div className="mt-6 grid grid-cols-1 gap-6  px-10 py-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-red-50 p-2 text-red-600">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7 7h10v2H7V7zm0 4h10v2H7v-2zm0 4h7v2H7v-2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Track Tasks
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Log work with markets, AI models, and deliverables.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6  ">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-rose-50 p-2 text-rose-600">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M3 3h2v18H3V3zm4 10h2v8H7v-8zm4-6h2v14h-2V7zm4 4h2v10h-2V11zm4-8h2v18h-2V3z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Generate Analytics
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                One-click monthly analytics across markets, models, and
                deliverables.
              </p>
            </div>

            <div className="rounded-2xl border border-black/10 bg-white p-6  ">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-fuchsia-50 p-2 text-fuchsia-600">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M14 2H6a2 2 0 0 0-2 2v16l4-4h6a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-gray-800">
                  Export & Share
                </h3>
              </div>
              <p className="mt-2 text-sm text-gray-600">
                Save analytics to Firestore and export clean PDFs for your team.
              </p>
            </div>
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
    </div>
  );
};

export default HomePage;
