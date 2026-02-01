# Departments – one folder per department

Each department has its **own folder** with layout, sidebar, nav config, routes, and (optional) pages. Shared data (API, context, components, constants) is used from `@/app/api`, `@/context`, `@/components`, `@/constants`.

## Structure (add a new department by adding a folder)

```
src/app/departments/
  design/           # Task tracker (Dashboard, Analytics, Tasks)
    index.js        # Export: Layout, Sidebar, routes, basePath, slug, loginRedirectPath
    Layout.jsx
    Sidebar.jsx
    navConfig.js    # Menu items, base path
    routes.jsx      # Route definitions (path + element)
    (optional) pages/
  food/             # Office food orders (Order board, Orders, History)
    index.js
    Layout.jsx
    Sidebar.jsx
    navConfig.js
    routes.jsx
    # Food pages live in src/pages/food/ (next to admin, auth)
  index.js          # Export departmentsBySlug { design, food, … }
```

## Adding a new department

1. Create a folder under `src/app/departments/<slug>/` (e.g. `support/`).
2. Add `navConfig.js` (basePath, slug, mainMenuItems, settingsItems).
3. Add `Sidebar.jsx` (use navConfig and shared Icons, CARD_SYSTEM, useAuth).
4. Add `Layout.jsx` (Sidebar + TopNavbar from `@/components/layout/navigation` + Outlet).
5. Add `routes.jsx` (array of `{ path, element }` or `{ index: true, element }`). Use pages from `@/pages` (e.g. `@/pages/food/`, `@/pages/admin/`, `@/pages/ProfilePage`). Keep all page components in `src/pages/` (e.g. `pages/food/`, `pages/admin/`), not inside the department folder.
6. Add `index.js` that exports `Layout`, `Sidebar`, `routes`, `basePath`, `slug`, `loginRedirectPath`.
7. In `src/app/departments/index.js`, import the new department and add it to `departmentsBySlug`.
8. In `src/app/router.jsx`, add a route block that uses `<department.Layout />` and `department.routes` under the path (e.g. `support`).
9. In `src/constants/index.js`, add the new department slug to `DEPARTMENT_APP` if needed for guard logic (e.g. which departments use tasks vs orders). Update `useDepartmentApp` or backend guards if you have slug-based rules.

Shared pieces used by all departments:

- **API:** `@/app/api` (authApi, usersApi, departmentsApi, orderBoardsApi, ordersApi, etc.)
- **Context:** `@/context/AuthContext`, `@/context/SelectedDepartmentContext`, etc.
- **Components:** `@/components/ui/*`, `@/components/icons`, `TopNavbar` from `@/components/layout/navigation/TopNavbar`
- **Constants:** `@/constants` (CARD_SYSTEM, NAVIGATION_CONFIG.SETTINGS_ITEMS, DEPARTMENT_APP, ROUTES)
- **Pages:** shared pages like `ProfilePage`, `UsersPage`, `DepartmentsPage`, `UIShowcasePage` from `@/pages`
