import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronUp,
  FiAlertTriangle,
  FiCalendar,
  FiClock,
  FiDownload,
  FiFileText,
  FiLayers,
  FiLogOut,
  FiStar,
  FiTarget,
  FiUser,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { IoLogInSharp, IoCheckmarkSharp, IoAlert, IoMoonOutline, IoSunnyOutline } from "react-icons/io5";
import {
  MdAdd,
  MdBarChart,
  MdChevronLeft,
  MdChevronRight,
  MdCode,
  MdDelete,
  MdEdit,
  MdHome,
  MdSettings,
  MdTask,
} from "react-icons/md";

const withSize = (Icon) => (props) => <Icon {...props} className={props?.className ?? "w-5 h-5"} />;

export const Icons = {
  admin: {
    reporters: withSize(FiFileText),
  },

  buttons: {
    back: withSize(FiArrowLeft),
    login: withSize(IoLogInSharp),
    logout: withSize(FiLogOut),
    alert: withSize(IoAlert),
    add: withSize(MdAdd),
    edit: withSize(MdEdit),
    delete: withSize(MdDelete),
    code: withSize(MdCode),
    download: withSize(FiDownload),
    chevronDown: withSize(FiChevronDown),
    chevronUp: withSize(FiChevronUp),
    chevronLeft: withSize(MdChevronLeft),
    chevronRight: withSize(MdChevronRight),
  },

  cards: {
    home: withSize(MdHome),
  },

  generic: {
    home: withSize(MdHome),
    chart: withSize(MdBarChart),
    settings: withSize(MdSettings),
    user: withSize(FiUser),
    users: withSize(FiUsers),
    task: withSize(MdTask),
    clock: withSize(FiClock),
    timer: withSize(FiClock),
    calendar: withSize(FiCalendar),
    deliverable: withSize(FiLayers),
    document: withSize(FiFileText),
    target: withSize(FiTarget),
    star: withSize(FiStar),
    zap: withSize(FiZap),
    check: withSize(IoCheckmarkSharp),
    warning: withSize(FiAlertTriangle),
    sun: withSize(IoSunnyOutline),
    moon: withSize(IoMoonOutline),
  },
};

export default Icons;
