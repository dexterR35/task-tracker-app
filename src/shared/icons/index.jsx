
import {
  FiArrowLeft,
  FiLogOut,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiDownload,
  FiEye,
  FiEdit,
  FiPlus,
  FiTrash,
  FiUser,
  FiColumns,
  FiBarChart2,
} from "react-icons/fi";
import {FcFlashOn,FcNfcSign,FcLock} from "react-icons/fc";
import {IoLogInSharp} from "react-icons/io5";
const withSize = (IconComponent) => (props) => (
  <IconComponent className={props?.className || "w-6 h-6"} />
);

export const Icons = {
  buttons: {
    back: withSize(FiArrowLeft),
    logout: withSize(FiLogOut),
    save: withSize(FiDownload),
    submit: withSize(FiCheck),
    edit: withSize(FiEdit),
    delete: withSize(FiTrash),
    add: withSize(FiPlus),
    show: withSize(FiEye),
    chevronUp: withSize(FiChevronUp),
    chevronDown: withSize(FiChevronDown),
    default: withSize(FcFlashOn),
    login:withSize(IoLogInSharp)
  },

  cards: {
    user: withSize(FiUser),
    dashboard: withSize(FiColumns),
    chart: withSize(FiBarChart2),
  },

  pages: {
    dashboard: withSize(FiColumns),
    analytics: withSize(FiBarChart2),
    users: withSize(FiUser),
  },

  generic: {
    user: withSize(FiUser),
    dashboard: withSize(FiColumns),
  },
};

export default Icons;


