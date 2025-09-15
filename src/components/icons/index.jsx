
import {
  FiArrowLeft,
  FiLogOut,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiEye,
  FiEyeOff,
  FiEdit,
  FiPlus,
  FiTrash,
  FiColumns,
  FiBarChart2,
  FiClock,
  FiUsers,
  FiCheckCircle,
  FiTrendingUp,
  FiUser,
  FiZap,
  FiPackage,
  FiTarget,
  FiArrowUp,
  FiArrowDown,
  FiMinus,
  FiSettings,
  FiList,
  FiRefreshCw,
  FiX,
  FiHome,
  FiUserCheck,
  FiFileText,
  FiActivity,
  FiTool,
  FiDownload,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiVideo,
  FiMonitor,
  FiCode,
  FiCpu,
} from "react-icons/fi";
import {FcFlashOn,FcNfcSign,FcLock} from "react-icons/fc";
import {IoLogInSharp,IoAdd,IoAlert,IoFingerPrint,IoCheckmarkSharp,IoClose,IoMoonOutline,IoSunnyOutline,IoPerson} from "react-icons/io5";
import {MdDashboard, MdPeople, MdAssignment, MdAnalytics, MdBugReport, MdSettings, MdAdd, MdEdit, MdDelete, MdVisibility, MdVisibilityOff, MdRefresh, MdClear, MdHome, MdTask, MdBarChart, MdCode, MdDownload, MdSearch, MdFilterList, MdChevronLeft, MdChevronRight} from "react-icons/md";
const withSize = (IconComponent) => (props) => (
  <IconComponent className={props?.className || "w-5 h-5"} />
);

export const Icons = {
  pages: {
    dashboard: withSize(MdDashboard),
    users: withSize(MdPeople),
    management: withSize(MdSettings),
    tasks: withSize(MdAssignment),
    analytics: withSize(MdAnalytics),
    debug: withSize(MdBugReport),
  },

  admin: {
    dashboard: withSize(MdDashboard),
    management: withSize(MdSettings),
    tasks: withSize(MdAssignment),
    analytics: withSize(MdAnalytics),
    debug: withSize(MdBugReport),
    users: withSize(MdPeople),
    reporters: withSize(FiFileText),
  },

  buttons: {
    back: withSize(FiArrowLeft),
    logout: withSize(FiLogOut),
    login: withSize(IoLogInSharp),
    save: withSize(IoCheckmarkSharp),
    cancel: withSize(IoClose),
    submit: withSize(FiCheck),
    edit: withSize(MdEdit),
    delete: withSize(MdDelete),
    add: withSize(MdAdd),
    show: withSize(MdVisibility),
    hide: withSize(MdVisibilityOff),
    chevronUp: withSize(FiChevronUp),
    chevronDown: withSize(FiChevronDown),
    chevronLeft: withSize(MdChevronLeft),
    chevronRight: withSize(MdChevronRight),
    refresh: withSize(MdRefresh),
    clear: withSize(MdClear),
    search: withSize(MdSearch),
    filter: withSize(MdFilterList),
    download: withSize(MdDownload),
    code: withSize(MdCode),
    menu: withSize(FiMenu),
    minus: withSize(FiMinus),
    default: withSize(FcFlashOn),
    generate: withSize(IoAdd),
    funny: withSize(IoFingerPrint),
    alert: withSize(IoAlert),
  },

  cards: {
    user: withSize(FiUser),
    dashboard: withSize(MdDashboard),
    chart: withSize(MdBarChart),
    task: withSize(MdTask),
    home: withSize(MdHome),
  },

  generic: {
    user: withSize(FiUser),
    dashboard: withSize(MdDashboard),
    moon: withSize(IoMoonOutline),
    sun: withSize(IoSunnyOutline),
    chart: withSize(MdBarChart),
    task: withSize(MdTask),
    settings: withSize(MdSettings),
    home: withSize(MdHome),
    clock: withSize(FiClock),
    zap: withSize(FiZap),
    package: withSize(FiPackage),
    target: withSize(FiTarget),
    video: withSize(FiVideo),
    design: withSize(FiMonitor),
    code: withSize(FiCode),
    ai: withSize(FiCpu),
  },
  
  profile: {
    user: withSize(IoPerson),
  },
};

export default Icons;


