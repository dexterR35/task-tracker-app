import React, { useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import Badge from "@/components/ui/Badge/Badge";
import DynamicButton from "@/components/ui/Button/DynamicButton";
import Avatar from "@/components/ui/Avatar/Avatar";
import SmallCard from "@/components/Card/smallCards/SmallCard";
import TanStackTable from "@/components/Table/TanStackTable";
import { getUserColumns } from "@/components/Table/tableColumns";
import Modal from "@/components/ui/Modal/Modal";
import ConfirmationModal from "@/components/ui/Modal/ConfirmationModal";
import Loader from "@/components/ui/Loader/Loader";
import Skeleton, {
  SkeletonCard,
  SkeletonTable,
  SkeletonButton,
} from "@/components/ui/Skeleton/Skeleton";
import Tooltip from "@/components/ui/Tooltip/Tooltip";
import SlidePanel from "@/components/ui/SlidePanel/SlidePanel";
import DarkModeToggle from "@/components/ui/DarkMode/DarkModeButtons";
import ComingSoon from "@/components/ui/ComingSoon/ComingSoon";
import {
  TextField,
  PasswordField,
  SelectField,
  SearchableSelectField,
  NumberField,
  TextareaField,
  CheckboxField,
  UrlField,
  MultiSelectField,
  SimpleDateField,
} from "@/components/forms/components";
import { Icons } from "@/components/icons";
import { createCards } from "@/components/Card/smallCards/smallCardConfig";
import { CARD_SYSTEM, FORM_OPTIONS } from "@/constants";

// JS mirror of CSS @theme (index.css) for displaying swatches on this page only. Keep in sync with index.css.
const THEME_COLORS = {
  primary: "#0a0a13",
  "primary-80": "#0a2470",
  secondary: "#0a0a13",
  "secondary-dark": "#4949492b",
  hover: "#c10f29",
  focus: "#aebfff",
  soft: "#3d48c9",
  smallCard: "#0e111b",
  "smallCard-white": "#e8edff",
  "red-error": "#FF204E",
  "green-success": "#2fd181",
  warning: "#eb2743",
  "blue-default": "#2a9df4",
  "blue-dark": "#1d2a4b",
  "text-primary": "#111827",
  "text-white": "#ffffff",
  "btn-primary": "#E50046",
  "btn-secondary": "#c10f29",
  "btn-warning": "#eb2743",
  "btn-info": "#2a9df4",
};
import {
  showSuccess,
  showError,
  showWarning,
  showInfo,
} from "@/utils/toast";

// Mock data for table
const MOCK_TABLE_DATA = [
  {
    id: "1",
    name: "Alex Johnson",
    username: "alex.j",
    email: "alex.j@example.com",
    phone: "+1 555-0101",
    role: "admin",
    occupation: "Engineering",
    taskCount: 12,
    createdAt: "2024-01-15T10:30:00.000Z",
  },
  {
    id: "2",
    name: "Sam Williams",
    username: "sam.w",
    email: "sam.w@example.com",
    phone: "+1 555-0102",
    role: "user",
    occupation: "Design",
    taskCount: 8,
    createdAt: "2024-02-01T14:00:00.000Z",
  },
  {
    id: "3",
    name: "Jordan Lee",
    username: "jordan.l",
    email: "jordan.l@example.com",
    phone: "+1 555-0103",
    role: "user",
    occupation: "Product",
    taskCount: 5,
    createdAt: "2024-02-10T09:15:00.000Z",
  },
];

// Mock app data for SmallCards
const MOCK_APP_DATA = {
  currentUser: { name: "Demo User", email: "demo@example.com", role: "admin" },
  tasks: [],
  selectedMonth: null,
  currentMonth: null,
  availableMonths: [],
  users: [{ id: "1", name: "User 1" }],
  reporters: [],
  selectedUserId: null,
  selectedUserName: null,
  selectedReporterId: null,
  selectedReporterName: null,
  isCurrentMonth: true,
  canCreateTasks: true,
  actionsTotalTasks: 24,
  actionsTotalHours: 48.5,
  actionsTotalDeliverables: 6,
  actionsTotalDeliverablesWithVariationsHours: 12,
  userFilterTotalTasks: 10,
  userFilterTotalHours: 20,
  reporterFilterTotalTasks: 0,
  reporterFilterTotalHours: 0,
};

const BADGE_VARIANTS = [
  "default",
  "gray",
  "green",
  "blue",
  "pink",
  "red",
  "amber",
  "orange",
  "purple",
  "crimson",
  "yellow",
];

const ShowcaseSection = ({ id, title, description, children, fillHeight = false }) => (
  <section
    id={id}
    className={`scroll-mt-4 ${fillHeight ? "h-full flex flex-col mb-0" : "mb-10"}`}
  >
    <div className={fillHeight ? "mb-4 shrink-0" : "mb-4"}>
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">
        {title}
      </h2>
      {description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
    </div>
    <div className={`card p-6 ${fillHeight ? "flex-1 min-h-0 flex flex-col" : ""}`}>{children}</div>
  </section>
);

// Section ids for search – keep lowercase, no spaces
const SECTION_IDS = {
  BADGE: "badge",
  BUTTON: "button",
  AVATAR: "avatar",
  CARD: "card",
  TABLE: "table",
  MODAL: "modal",
  LOADER: "loader",
  SKELETON: "skeleton",
  TOOLTIP: "tooltip",
  SLIDE_PANEL: "slidepanel",
  COLOR_PALETTE: "colorpalette",
  FORM: "form",
  COMING_SOON: "comingsoon",
  ICONS: "icons",
  TOASTS: "toasts",
  TYPOGRAPHY: "typography",
  GAMIFICATION: "gamification",
};

// Gamification: levels with funny names, XP calculation
const LEVEL_NAMES = {
  1: "Newbie",
  5: "Getting Warm",
  10: "Task Ticker",
  15: "Almost There",
  20: "Task Slayer",
  25: "Overachiever",
  30: "No-Life Mode",
  50: "Legend",
};
const XP_PER_LEVEL = 100; // XP needed to complete each level (level 20 = 20 * 100 = 2000 total)
const xpForLevel = (level) => level * XP_PER_LEVEL;

const MOCK_ACHIEVEMENTS = [
  { id: "first-task", title: "First Blood", description: "Complete your first task", xp: 25, badgeVariant: "green", Icon: Icons.generic.check, progress: 100, detail: "Unlocked 12 Jan 2025 · 1/1 done" },
  { id: "streak-5", title: "On Fire", description: "5 tasks in a row", xp: 50, badgeVariant: "amber", Icon: Icons.generic.zap, progress: 60, detail: "3/5 tasks in current streak · Best: 4" },
  { id: "early-bird", title: "Early Bird", description: "Finish a task before 9 AM", xp: 30, badgeVariant: "blue", Icon: Icons.generic.clock, progress: 40, detail: "2/5 early completions this month" },
  { id: "team-player", title: "Team Player", description: "Collaborate on 10 tasks", xp: 75, badgeVariant: "purple", Icon: Icons.generic.users, progress: 70, detail: "7/10 tasks with 2+ collaborators" },
  { id: "perfectionist", title: "Perfectionist", description: "Zero revisions on a deliverable", xp: 100, badgeVariant: "pink", Icon: Icons.generic.star, progress: 0, detail: "Submit one deliverable with no change requests" },
  { id: "level-20", title: "Task Slayer", description: "Reach level 20", xp: 200, badgeVariant: "crimson", Icon: Icons.generic.target, progress: 100, detail: "Unlocked at 2,000 XP · Level 20" },
];

// Searchable section keys and labels for filtering
const SECTION_META = [
  [SECTION_IDS.BADGE, "Badge", "Status and label variants"],
  [SECTION_IDS.BUTTON, "Button", "Variants sizes loading outline icon"],
  [SECTION_IDS.AVATAR, "Avatar", "Sizes initials name email"],
  [SECTION_IDS.CARD, "Small Card", "Dashboard credit-card strip details"],
  [SECTION_IDS.TABLE, "Table", "TanStack search sort pagination columns"],
  [SECTION_IDS.MODAL, "Modal", "Modal ConfirmationModal"],
  [SECTION_IDS.LOADER, "Loader", "Spinner dots sizes"],
  [SECTION_IDS.SKELETON, "Skeleton", "Loading placeholders card table button"],
  [SECTION_IDS.TOOLTIP, "Tooltip", "Hover string user list"],
  [SECTION_IDS.SLIDE_PANEL, "Slide Panel", "Drawer right forms"],
  [SECTION_IDS.COLOR_PALETTE, "Color palette", "CARD_SYSTEM hex theme CSS variables"],
  [SECTION_IDS.FORM, "Form fields", "TextField Password Select SearchableSelect Number Textarea Checkbox Url MultiSelect SimpleDate"],
  [SECTION_IDS.COMING_SOON, "Coming Soon", "Placeholder page"],
  [SECTION_IDS.ICONS, "Icons", "Generic buttons admin"],
  [SECTION_IDS.TOASTS, "Toasts", "Success error warning info notifications"],
  [SECTION_IDS.TYPOGRAPHY, "Typography", "Headings paragraph labels"],
  [SECTION_IDS.GAMIFICATION, "Gamification", "Achievement badge XP level progress bar popup"],
];

export default function UIShowcasePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [achievementPopupOpen, setAchievementPopupOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const demoLevel = 20;
  const demoCurrentXP = 2050; // at level 20, 50 XP into level 21
  const demoXPForCurrentLevel = xpForLevel(demoLevel);
  const demoXPToNext = XP_PER_LEVEL;
  const demoXPNextLevel = xpForLevel(demoLevel + 1);
  const demoProgress = Math.min(100, Math.round(((demoCurrentXP - demoXPForCurrentLevel) / demoXPToNext) * 100));
  const selectedAchievement = MOCK_ACHIEVEMENTS[0];

  const { register, watch, setValue, formState: { errors } } = useForm({
    defaultValues: {
      demoText: "",
      demoPassword: "",
      demoSelect: "",
      demoSearchable: "",
      demoNumber: 42,
      demoTextarea: "Sample textarea content.",
      demoCheck: false,
      demoUrl: "https://example.com",
      demoMultiSelect: [],
      demoDate: "",
    },
  });

  const visibleSectionIds = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return new Set(SECTION_META.map(([id]) => id));
    return new Set(
      SECTION_META.filter(
        ([id, title, desc]) =>
          id.includes(q) ||
          title.toLowerCase().includes(q) ||
          desc.toLowerCase().includes(q)
      ).map(([id]) => id)
    );
  }, [searchQuery]);

  const demoCards = createCards(MOCK_APP_DATA, [
    CARD_SYSTEM.SMALL_CARD_TYPES.USER_PROFILE,
    CARD_SYSTEM.SMALL_CARD_TYPES.PERFORMANCE,
    CARD_SYSTEM.SMALL_CARD_TYPES.EFFICIENCY,
    CARD_SYSTEM.SMALL_CARD_TYPES.ACTIONS,
    CARD_SYSTEM.SMALL_CARD_TYPES.USER_FILTER,
  ]).map((card) => ({
    ...card,
    id: card.id || `card-${card.title}`,
  }));

  const formFieldsConfig = {
    register,
    watch,
    setValue,
    errors,
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            UI Showcase
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Design system &amp; component library — same styles as the app
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Icons.generic.settings className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search components…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-56 sm:w-64 bg-white dark:bg-smallCard border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-default focus:border-transparent"
              aria-label="Search showcase sections"
            />
          </div>
          <DarkModeToggle />
        </div>
      </div>

      {visibleSectionIds.size === 0 && (
        <div className="card p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No sections match &quot;{searchQuery}&quot;. Try another term.</p>
        </div>
      )}

      {(visibleSectionIds.has(SECTION_IDS.BADGE) || visibleSectionIds.has(SECTION_IDS.BUTTON)) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 items-stretch">
        {visibleSectionIds.has(SECTION_IDS.BADGE) && (
        <ShowcaseSection
          id={SECTION_IDS.BADGE}
          fillHeight
          title="Badge"
          description="Status and label variants (size: xs, sm, md, lg)"
        >
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {BADGE_VARIANTS.map((v) => (
                <Badge key={v} variant={v}>
                  {v}
                </Badge>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <Badge size="xs">xs</Badge>
              <Badge size="sm">sm</Badge>
              <Badge size="md">md</Badge>
              <Badge size="lg">lg</Badge>
            </div>
          </div>
        </ShowcaseSection>
        )}
        {visibleSectionIds.has(SECTION_IDS.BUTTON) && (
        <ShowcaseSection
          id={SECTION_IDS.BUTTON}
          fillHeight
          title="Button"
          description="Variants, sizes, loading, outline, with icon"
        >
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              <DynamicButton variant="primary" size="sm">
                Primary
              </DynamicButton>
              <DynamicButton variant="secondary" size="sm">
                Secondary
              </DynamicButton>
              <DynamicButton variant="success" size="sm">
                Success
              </DynamicButton>
              <DynamicButton variant="danger" size="sm">
                Danger
              </DynamicButton>
              <DynamicButton variant="warning" size="sm">
                Warning
              </DynamicButton>
              <DynamicButton variant="outline" size="sm">
                Outline
              </DynamicButton>
              <DynamicButton variant="edit" size="sm" icon={Icons.buttons.edit}>
                Edit
              </DynamicButton>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DynamicButton size="xs">xs</DynamicButton>
              <DynamicButton size="sm">sm</DynamicButton>
              <DynamicButton size="md">md</DynamicButton>
              <DynamicButton size="lg">lg</DynamicButton>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <DynamicButton disabled>Disabled</DynamicButton>
              <DynamicButton loading>Loading…</DynamicButton>
            </div>
          </div>
        </ShowcaseSection>
        )}
      </div>
      )}

      {(visibleSectionIds.has(SECTION_IDS.AVATAR) || visibleSectionIds.has(SECTION_IDS.LOADER)) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 items-stretch">
        {visibleSectionIds.has(SECTION_IDS.AVATAR) && (
        <ShowcaseSection
          id={SECTION_IDS.AVATAR}
          fillHeight
          title="Avatar"
          description="Sizes and with/without name (initials when no image)"
        >
          <div className="flex flex-wrap items-end gap-8">
            <div className="flex flex-wrap items-end gap-4">
              {["xs", "sm", "md", "lg", "xl"].map((size) => (
                <Avatar
                  key={size}
                  name={`User ${size}`}
                  size={size}
                  showName={false}
                />
              ))}
            </div>
            <div className="pl-4 border-l border-gray-200 dark:border-gray-600">
              <div className="bg-gray-800 dark:bg-gray-800/80 rounded-xl p-4 inline-block">
                <Avatar
                  name="Demo User"
                  email="demo@example.com"
                  size="md"
                  showName
                  showEmail
                />
              </div>
            </div>
          </div>
        </ShowcaseSection>
        )}
        {visibleSectionIds.has(SECTION_IDS.LOADER) && (
        <ShowcaseSection
          id={SECTION_IDS.LOADER}
          fillHeight
          title="Loader"
          description="Spinner and dots, sizes (sm, md, lg)"
        >
          <div className="flex flex-wrap items-center gap-12">
            <div className="flex flex-col items-center gap-2">
              <Loader variant="spinner" size="sm" showText={false} />
              <span className="text-xs text-gray-500">spinner sm</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Loader variant="spinner" size="md" text="Loading…" />
              <span className="text-xs text-gray-500">spinner md</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Loader variant="dots" size="md" showText={false} />
              <span className="text-xs text-gray-500">dots</span>
            </div>
          </div>
        </ShowcaseSection>
        )}
      </div>
      )}

      {visibleSectionIds.has(SECTION_IDS.CARD) && (
      <ShowcaseSection
        id={SECTION_IDS.CARD}
        title="Small Card (dashboard style)"
        description="Credit-card style cards with strip and details"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {demoCards.map((card) => (
            <SmallCard key={card.id} card={card} />
          ))}
        </div>
      </ShowcaseSection>
      )}

      {visibleSectionIds.has(SECTION_IDS.TABLE) && (
      <ShowcaseSection
        id={SECTION_IDS.TABLE}
        title="Table"
        description="TanStack Table with search, sort, pagination, columns toggle"
      >
        <TanStackTable
          data={MOCK_TABLE_DATA}
          columns={getUserColumns()}
          showFilters
          showPagination
          showColumnToggle
          pageSize={5}
          enablePagination
        />
      </ShowcaseSection>
      )}

      {(visibleSectionIds.has(SECTION_IDS.MODAL) || visibleSectionIds.has(SECTION_IDS.SLIDE_PANEL)) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 items-stretch">
        {visibleSectionIds.has(SECTION_IDS.MODAL) && (
        <ShowcaseSection
          id={SECTION_IDS.MODAL}
          fillHeight
          title="Modal & Confirmation"
          description="Modal, ConfirmationModal — open with buttons below"
        >
          <div className="flex flex-wrap gap-2">
            <DynamicButton variant="primary" onClick={() => setModalOpen(true)}>
              Open Modal
            </DynamicButton>
            <DynamicButton
              variant="danger"
              size="sm"
              onClick={() => setConfirmOpen(true)}
            >
              Open Confirm
            </DynamicButton>
          </div>
          <Modal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Sample Modal"
            maxWidth="max-w-lg"
          >
            <div className="p-6">
              <p className="text-gray-700 dark:text-gray-300">
                This is the same Modal used across the app. You can put any
                content here.
              </p>
            </div>
          </Modal>
          <ConfirmationModal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            onConfirm={() => setConfirmOpen(false)}
            title="Confirm action"
            message="Are you sure you want to proceed? This is a demo."
            confirmText="Confirm"
            cancelText="Cancel"
          />
        </ShowcaseSection>
        )}
        {visibleSectionIds.has(SECTION_IDS.SLIDE_PANEL) && (
        <ShowcaseSection
          id={SECTION_IDS.SLIDE_PANEL}
          fillHeight
          title="Slide Panel"
          description="Drawer from the right — same as forms/panels in the app"
        >
          <DynamicButton variant="primary" onClick={() => setPanelOpen(true)}>
            Open Panel
          </DynamicButton>
          <SlidePanel
            isOpen={panelOpen}
            onClose={() => setPanelOpen(false)}
            title="Sample Panel"
            width="max-w-md"
          >
            <div className="space-y-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Panel content goes here. Used for forms and secondary content.
              </p>
              <div className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
              <div className="h-10 bg-gray-100 dark:bg-gray-700/50 rounded-lg" />
            </div>
          </SlidePanel>
        </ShowcaseSection>
        )}
      </div>
      )}

      {visibleSectionIds.has(SECTION_IDS.SKELETON) && (
      <ShowcaseSection
        id={SECTION_IDS.SKELETON}
        title="Skeleton"
        description="Loading placeholders: card, table, button"
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="flex gap-4">
            <SkeletonButton className="max-w-[120px]" />
            <Skeleton height="2rem" width="6rem" rounded="lg" />
            <Skeleton height="1rem" width="100%" rounded="md" />
          </div>
          <SkeletonTable rows={3} />
        </div>
      </ShowcaseSection>
      )}

      {(visibleSectionIds.has(SECTION_IDS.TOOLTIP) || visibleSectionIds.has(SECTION_IDS.TOASTS)) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 items-stretch">
        {visibleSectionIds.has(SECTION_IDS.TOOLTIP) && (
        <ShowcaseSection
          id={SECTION_IDS.TOOLTIP}
          fillHeight
          title="Tooltip"
          description="Hover to see tooltip (string or user list)"
        >
          <div className="flex flex-wrap gap-4">
            <Tooltip content="This is a simple tooltip">
              <DynamicButton variant="outline" size="sm">
                Hover me
              </DynamicButton>
            </Tooltip>
            <Tooltip
              users={[
                { id: "1", userName: "Alice", color: "#00d54d" },
                { id: "2", userName: "Bob", color: "#1177ff" },
              ]}
            >
              <DynamicButton variant="outline" size="sm">
                Users tooltip
              </DynamicButton>
            </Tooltip>
          </div>
        </ShowcaseSection>
        )}
        {visibleSectionIds.has(SECTION_IDS.TOASTS) && (
        <ShowcaseSection
          id={SECTION_IDS.TOASTS}
          fillHeight
          title="Toasts"
          description="Notifications (react-toastify) — click to trigger"
        >
          <div className="flex flex-wrap gap-2">
            <DynamicButton variant="success" size="sm" onClick={() => showSuccess("Action completed successfully!")}>
              Success
            </DynamicButton>
            <DynamicButton variant="danger" size="sm" onClick={() => showError("Something went wrong.")}>
              Error
            </DynamicButton>
            <DynamicButton variant="warning" size="sm" onClick={() => showWarning("Please review your input.")}>
              Warning
            </DynamicButton>
            <DynamicButton variant="primary" size="sm" onClick={() => showInfo("Here is some information.")}>
              Info
            </DynamicButton>
          </div>
        </ShowcaseSection>
        )}
      </div>
      )}

      {visibleSectionIds.has(SECTION_IDS.COLOR_PALETTE) && (
      <ShowcaseSection
        id={SECTION_IDS.COLOR_PALETTE}
        title="Color palette"
        description="All app colors: CARD_SYSTEM.COLOR_HEX_MAP from constants (live) + Theme from index.css @theme"
      >
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              CARD_SYSTEM.COLOR_HEX_MAP (constants)
            </h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(CARD_SYSTEM.COLOR_HEX_MAP).map(([name, hex]) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1"
                  title={hex}
                >
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 truncate max-w-[64px]">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Theme colors (index.css @theme)
            </h4>
            <div className="flex flex-wrap gap-3">
              {Object.entries(THEME_COLORS).map(([name, hex]) => (
                <div
                  key={name}
                  className="flex flex-col items-center gap-1"
                  title={hex}
                >
                  <div
                    className="w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-600"
                    style={{ backgroundColor: hex }}
                  />
                  <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 truncate max-w-[72px]">
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </ShowcaseSection>
      )}

      {(visibleSectionIds.has(SECTION_IDS.FORM) || visibleSectionIds.has(SECTION_IDS.COMING_SOON)) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 items-stretch">
        {visibleSectionIds.has(SECTION_IDS.FORM) && (
        <ShowcaseSection
          id={SECTION_IDS.FORM}
          fillHeight
          title="Form fields"
          description="All form primitives: TextField, PasswordField, Select, SearchableSelect, Number, Textarea, Checkbox, UrlField, MultiSelectField, SimpleDateField"
        >
          <form className="space-y-6">
            <TextField
              field={{ name: "demoText", label: "Text", placeholder: "Enter text…" }}
              {...formFieldsConfig}
            />
            <PasswordField
              field={{ name: "demoPassword", label: "Password", placeholder: "••••••••" }}
              {...formFieldsConfig}
            />
            <SelectField
              field={{
                name: "demoSelect",
                label: "Select",
                placeholder: "Choose one",
                options: [
                  { value: "a", label: "Option A" },
                  { value: "b", label: "Option B" },
                  { value: "c", label: "Option C" },
                ],
              }}
              {...formFieldsConfig}
            />
            <SearchableSelectField
              field={{
                name: "demoSearchable",
                label: "Searchable select",
                options: FORM_OPTIONS.DEPARTMENTS.slice(0, 12),
              }}
              {...formFieldsConfig}
            />
            <NumberField
              field={{ name: "demoNumber", label: "Number", min: 0, step: 0.5 }}
              {...formFieldsConfig}
            />
            <TextareaField
              field={{ name: "demoTextarea", label: "Textarea", placeholder: "Multi-line…", rows: 3 }}
              {...formFieldsConfig}
            />
            <CheckboxField
              field={{ name: "demoCheck", label: "I agree to the terms" }}
              {...formFieldsConfig}
            />
            <UrlField
              field={{ name: "demoUrl", label: "URL", placeholder: "https://…" }}
              {...formFieldsConfig}
            />
            <MultiSelectField
              field={{
                name: "demoMultiSelect",
                label: "Multi select",
                placeholder: "Add options",
                options: [
                  { value: "opt1", label: "Option 1" },
                  { value: "opt2", label: "Option 2" },
                  { value: "opt3", label: "Option 3" },
                ],
              }}
              {...formFieldsConfig}
            />
            <SimpleDateField
              field={{ name: "demoDate", label: "Date", placeholder: "Select a date" }}
              {...formFieldsConfig}
            />
          </form>
        </ShowcaseSection>
        )}
        {visibleSectionIds.has(SECTION_IDS.COMING_SOON) && (
        <ShowcaseSection
          id={SECTION_IDS.COMING_SOON}
          fillHeight
          title="Coming Soon"
          description="Placeholder block used for under-development pages"
        >
          <div className="flex flex-1 min-h-0 items-center justify-center">
            <ComingSoon
              title="Feature in progress"
              description="This block is used across the app for coming-soon pages."
              showHomeLink={false}
            />
          </div>
        </ShowcaseSection>
        )}
      </div>
      )}

      {(visibleSectionIds.has(SECTION_IDS.TYPOGRAPHY) || visibleSectionIds.has(SECTION_IDS.ICONS)) && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 items-stretch">
        {visibleSectionIds.has(SECTION_IDS.ICONS) && (
        <ShowcaseSection
          id={SECTION_IDS.ICONS}
          fillHeight
          title="Icons"
          description="Icon set used in sidebar, buttons, cards (generic, buttons, admin)"
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Generic</h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(Icons.generic).map(([name, Icon]) => (
                  <div key={name} className="flex flex-col items-center gap-1" title={name}>
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    <span className="text-[10px] text-gray-500 truncate max-w-[56px]">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Buttons</h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(Icons.buttons).map(([name, Icon]) => (
                  <div key={name} className="flex flex-col items-center gap-1" title={name}>
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    <span className="text-[10px] text-gray-500 truncate max-w-[56px]">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Admin</h4>
              <div className="flex flex-wrap gap-3">
                {Object.entries(Icons.admin).map(([name, Icon]) => (
                  <div key={name} className="flex flex-col items-center gap-1" title={name}>
                    <Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    <span className="text-[10px] text-gray-500 truncate max-w-[56px]">{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ShowcaseSection>
        )}
        {visibleSectionIds.has(SECTION_IDS.TYPOGRAPHY) && (
        <ShowcaseSection
          id={SECTION_IDS.TYPOGRAPHY}
          fillHeight
          title="Typography"
          description="Headings and text styles from the app"
        >
          <div className="space-y-4">
            <h1>Heading 1</h1>
            <h2>Heading 2</h2>
            <h3>Heading 3</h3>
            <h4>Heading 4</h4>
            <h5>Heading 5</h5>
            <p>Paragraph text — same as used across the app. Supports dark mode.</p>
            <label className="block text-sm text-gray-800 dark:text-gray-200 mb-2">Label (form style)</label>
            <p className="text-small">Small text utility</p>
            <p className="text-app">App text (gray-800 / gray-100)</p>
            <p className="text-app-muted">App muted (gray-500 / gray-400)</p>
          </div>
        </ShowcaseSection>
        )}
      </div>
      )}

      {visibleSectionIds.has(SECTION_IDS.GAMIFICATION) && (
      <ShowcaseSection
        id={SECTION_IDS.GAMIFICATION}
        title="Gamification (XP &amp; achievements)"
        description="Badge system for experience, achievement, level; progress bar; achievement popup with badges and icons; points/XP calculation; funny level names"
      >
        <div className="space-y-8">
          {/* System badges: Task Slayer first, then small badges */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">System badges</h4>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="purple" size="md">Task Slayer</Badge>
              <Badge variant="green" size="sm">Experience</Badge>
              <Badge variant="amber" size="sm">Achievement</Badge>
              <Badge variant="blue" size="sm">Level 20</Badge>
              <Badge variant="pink" size="sm">+50 XP</Badge>
            </div>
          </div>

          {/* Level + funny name + XP + progress bar */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-600 p-4 bg-white dark:bg-smallCard">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="blue" size="lg">Level {demoLevel}</Badge>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {LEVEL_NAMES[demoLevel] ?? `Level ${demoLevel}`}
                </span>
              </div>
              <div className="text-sm font-medium tabular-nums text-gray-600 dark:text-gray-400">
                {demoCurrentXP.toLocaleString()} / {demoXPNextLevel.toLocaleString()} XP
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Progress to next level</span>
                <span>{demoProgress}%</span>
              </div>
              <div className="h-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 bg-blue-default"
                  style={{ width: `${demoProgress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              XP calculation: {demoXPToNext} XP to Level {demoLevel + 1} ({LEVEL_NAMES[demoLevel + 1] ?? `Level ${demoLevel + 1}`})
            </p>
          </div>

          {/* Achievement cards with badges, icons, progress bar and details */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Achievements (badges + icons + progress + details)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MOCK_ACHIEVEMENTS.map((a) => (
                <div
                  key={a.id}
                  className="relative p-3 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50/50 dark:bg-gray-800/30 space-y-2"
                >
                  <div className="absolute top-2 right-2">
                    <Badge variant={a.badgeVariant} size="xs">+{a.xp} XP</Badge>
                  </div>
                  <div className="flex items-center gap-3 pr-16">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <a.Icon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-gray-900 dark:text-white truncate">{a.title}</div>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{a.detail}</p>
                  <div className="space-y-0.5">
                    <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${a.progress}%`,
                          backgroundColor: a.progress === 100 ? CARD_SYSTEM.COLOR_HEX_MAP.green : CARD_SYSTEM.COLOR_HEX_MAP.blue,
                        }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">{a.progress}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trigger achievement popup */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Achievement popup</h4>
            <DynamicButton variant="primary" onClick={() => setAchievementPopupOpen(true)}>
              Trigger achievement popup
            </DynamicButton>
          </div>
        </div>

        <Modal
          isOpen={achievementPopupOpen}
          onClose={() => setAchievementPopupOpen(false)}
          title="Achievement unlocked!"
          maxWidth="max-w-sm"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: `${CARD_SYSTEM.COLOR_HEX_MAP.amber}20`, color: CARD_SYSTEM.COLOR_HEX_MAP.amber }}
            >
              <selectedAchievement.Icon className="w-8 h-8" style={{ color: CARD_SYSTEM.COLOR_HEX_MAP.amber }} />
            </div>
            <Badge variant={selectedAchievement.badgeVariant} size="md" className="mb-2">
              +{selectedAchievement.xp} XP
            </Badge>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{selectedAchievement.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{selectedAchievement.description}</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-500 mb-4">{selectedAchievement.detail}</p>
            <div className="w-full space-y-1">
              <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${selectedAchievement.progress}%`, backgroundColor: CARD_SYSTEM.COLOR_HEX_MAP.green }}
                />
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums">Progress {selectedAchievement.progress}%</div>
            </div>
          </div>
        </Modal>
      </ShowcaseSection>
      )}
    </div>
  );
}
