// Permission Test Example
// This file demonstrates how the new permission system works with your user data

// Example user data (stefan rosioru - video-editor)
const exampleUser = {
  createdAt: "August 20, 2025 at 2:02:03 AM UTC+3",
  createdBy: "WspEtFTrDvbIZ7mk9QdIPix0q2u1",
  email: "stefan.rosioru@netbet.ro",
  isActive: true,
  name: "stefan rosioru",
  occupation: "video-editor",
  permissions: [
    "update_task",
    "delete_task", 
    "create_task"
  ],
  role: "user",
  userUID: "50BCCjKNb9fQZtjkPyGmU5iOMMI3"
};

// Example admin data (marian iordache - developer)
const exampleAdmin = {
  createdAt: "August 25, 2025 at 8:04:28 PM UTC+3",
  createdBy: "WspEtFTrDvbIZ7mk9QdIPix0q2u1",
  email: "marian.iordache@netbet.ro",
  isActive: true,
  name: "marian iordache",
  occupation: "developer",
  permissions: [
    "create_board",
    "delete_task",
    "create_task",
    "update_task",
    "generate_charts"
  ],
  role: "admin",
  userUID: "WspEtFTrDvbIZ7mk9QdIPix0q2u1"
};

// Permission checking functions (copied from the implementation)
const hasPermission = (userData, permission) => {
  if (!userData || !userData.permissions) return false;
  return userData.permissions.includes(permission);
};

const canAccessTasks = (userData) => {
  return hasPermission(userData, 'create_task') || 
         hasPermission(userData, 'update_task') || 
         hasPermission(userData, 'delete_task');
};

const canGenerateCharts = (userData) => {
  return hasPermission(userData, 'generate_charts');
};

// Test the permission system
console.log("=== Permission System Test ===\n");

console.log("Testing Stefan (video-editor):");
console.log("- Can create tasks:", hasPermission(exampleUser, 'create_task'));
console.log("- Can update tasks:", hasPermission(exampleUser, 'update_task'));
console.log("- Can delete tasks:", hasPermission(exampleUser, 'delete_task'));
console.log("- Can generate charts:", canGenerateCharts(exampleUser));
console.log("- Can access tasks:", canAccessTasks(exampleUser));
console.log("- Can create boards:", hasPermission(exampleUser, 'create_board'));

console.log("\nTesting Marian (admin/developer):");
console.log("- Can create tasks:", hasPermission(exampleAdmin, 'create_task'));
console.log("- Can update tasks:", hasPermission(exampleAdmin, 'update_task'));
console.log("- Can delete tasks:", hasPermission(exampleAdmin, 'delete_task'));
console.log("- Can generate charts:", canGenerateCharts(exampleAdmin));
console.log("- Can access tasks:", canAccessTasks(exampleAdmin));
console.log("- Can create boards:", hasPermission(exampleAdmin, 'create_board'));

console.log("\n=== Task API Permission Checks ===");
console.log("The task API now includes these permission checks:");
console.log("1. createTask: Requires 'create_task' permission");
console.log("2. updateTask: Requires 'update_task' permission");
console.log("3. deleteTask: Requires 'delete_task' permission");
console.log("4. generateCharts: Requires 'generate_charts' permission");
console.log("\nAll operations also require authentication (auth.currentUser must exist)");

console.log("\n=== Expected Results ===");
console.log("Stefan should be able to:");
console.log("✓ Create tasks");
console.log("✓ Update tasks");
console.log("✓ Delete tasks");
console.log("✗ Generate charts (no permission)");
console.log("✗ Create boards (no permission)");

console.log("\nMarian should be able to:");
console.log("✓ Create tasks");
console.log("✓ Update tasks");
console.log("✓ Delete tasks");
console.log("✓ Generate charts");
console.log("✓ Create boards");