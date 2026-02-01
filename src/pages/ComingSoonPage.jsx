import DynamicButton from "@/components/ui/Button/DynamicButton";

/**
 * Coming Soon page for routes that are under development.
 */
const ComingSoonPage = () => {
  return (
    <div className="min-h-screen flex-center relative">
      <div className="card relative">
        <div className="mb-6 text-center">
          <div className="flex justify-center items-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">🚧</span>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This page is under development. Check back later.
          </p>
        </div>
        <div className="space-y-3">
          <DynamicButton
            to="/dashboard"
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
            variant="primary"
            size="lg"
            type="button"
            iconName="default"
          >
            Back to Dashboard
          </DynamicButton>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
