import React from 'react';
import { Icons } from '@/components/icons';

/**
 * Theme Examples Component - Demonstrates the new Tailwind theme classes
 */
const ThemeExamples = () => {
  return (
    <div className="p-6 space-y-8 bg-white dark:bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Theme Examples
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Using centralized Tailwind theme classes
        </p>
      </div>

      {/* Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Cards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Default Card
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Standard card with soft shadow
            </p>
          </div>

          <div className="card-primary">
            <h3 className="text-lg font-semibold text-white mb-2">
              Primary Card
            </h3>
            <p className="text-blue-100">
              Primary themed card with glow effect
            </p>
          </div>

          <div className="card-success">
            <h3 className="text-lg font-semibold text-white mb-2">
              Success Card
            </h3>
            <p className="text-green-100">
              Success themed card with glow effect
            </p>
          </div>
        </div>
      </section>

      {/* Badges Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Badges
        </h2>
        <div className="flex flex-wrap gap-3">
          <span className="badge badge-primary">Primary</span>
          <span className="badge badge-success">Success</span>
          <span className="badge badge-warning">Warning</span>
          <span className="badge badge-error">Error</span>
          <span className="badge badge-info">Info</span>
        </div>
      </section>

      {/* Buttons Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-4">
          <button className="btn btn-primary">Primary Button</button>
          <button className="btn btn-success">Success Button</button>
          <button className="btn btn-warning">Warning Button</button>
          <button className="btn btn-error">Error Button</button>
          <button className="btn btn-outline">Outline Button</button>
        </div>
      </section>

      {/* Avatars Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Avatars
        </h2>
        <div className="flex items-center gap-4">
          <div className="avatar avatar-sm avatar-primary">JD</div>
          <div className="avatar avatar-md avatar-success">AB</div>
          <div className="avatar avatar-lg avatar-warning">CD</div>
          <div className="avatar avatar-md avatar-error">EF</div>
        </div>
      </section>

      {/* Icons Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Icons
        </h2>
        <div className="flex items-center gap-6">
          <Icons.generic.dashboard className="icon icon-primary w-8 h-8" />
          <Icons.generic.chart className="icon icon-success w-8 h-8" />
          <Icons.generic.task className="icon icon-warning w-8 h-8" />
          <Icons.generic.settings className="icon icon-error w-8 h-8" />
          <Icons.generic.home className="icon icon-muted w-8 h-8" />
        </div>
      </section>

      {/* Toasts Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Toasts
        </h2>
        <div className="space-y-3 max-w-md">
          <div className="toast toast-success">
            <Icons.generic.chart className="icon icon-success w-5 h-5 mr-3" />
            <span>Success message</span>
          </div>
          <div className="toast toast-warning">
            <Icons.generic.task className="icon icon-warning w-5 h-5 mr-3" />
            <span>Warning message</span>
          </div>
          <div className="toast toast-error">
            <Icons.generic.settings className="icon icon-error w-5 h-5 mr-3" />
            <span>Error message</span>
          </div>
          <div className="toast toast-info">
            <Icons.generic.home className="icon icon-info w-5 h-5 mr-3" />
            <span>Info message</span>
          </div>
        </div>
      </section>

      {/* Custom Colors Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Custom App Colors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-app text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">App Primary</h3>
            <p>Using bg-app class</p>
          </div>
          <div className="p-4 bg-success-custom text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Custom Success</h3>
            <p>Using bg-success-custom class</p>
          </div>
          <div className="p-4 bg-error-custom text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Custom Error</h3>
            <p>Using bg-error-custom class</p>
          </div>
          <div className="p-4 bg-warning-custom text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Custom Warning</h3>
            <p>Using bg-warning-custom class</p>
          </div>
        </div>
      </section>

      {/* Gradients Section */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Gradients
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-primary text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Primary Gradient</h3>
            <p>bg-gradient-primary</p>
          </div>
          <div className="p-6 bg-gradient-success text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Success Gradient</h3>
            <p>bg-gradient-success</p>
          </div>
          <div className="p-6 bg-gradient-warning text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Warning Gradient</h3>
            <p>bg-gradient-warning</p>
          </div>
          <div className="p-6 bg-gradient-error text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Error Gradient</h3>
            <p>bg-gradient-error</p>
          </div>
          <div className="p-6 bg-gradient-info text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Info Gradient</h3>
            <p>bg-gradient-info</p>
          </div>
          <div className="p-6 bg-gradient-app text-white rounded-lg">
            <h3 className="text-lg font-semibold mb-2">App Gradient</h3>
            <p>bg-gradient-app</p>
          </div>
        </div>
      </section>

      {/* Usage Examples */}
      <section>
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
          Usage Examples
        </h2>
        <div className="bg-gray-900 rounded-lg p-6 text-green-400 font-mono text-sm overflow-x-auto">
          <pre>{`// Cards
<div className="card">Default card</div>
<div className="card-primary">Primary card</div>
<div className="card-success">Success card</div>

// Badges
<span className="badge badge-primary">Primary</span>
<span className="badge badge-success">Success</span>

// Buttons
<button className="btn btn-primary">Primary</button>
<button className="btn btn-outline">Outline</button>

// Avatars
<div className="avatar avatar-md avatar-primary">JD</div>
<div className="avatar avatar-lg avatar-success">AB</div>

// Icons
<Icons.dashboard className="icon icon-primary w-6 h-6" />
<Icons.chart className="icon icon-success w-6 h-6" />

// Toasts
<div className="toast toast-success">Success message</div>
<div className="toast toast-error">Error message</div>

// Custom Colors
<div className="bg-app text-white">App primary</div>
<div className="bg-success-custom text-white">Custom success</div>

// Gradients
<div className="bg-gradient-primary text-white">Primary gradient</div>
<div className="bg-gradient-success text-white">Success gradient</div>`}</pre>
        </div>
      </section>
    </div>
  );
};

export default ThemeExamples;
