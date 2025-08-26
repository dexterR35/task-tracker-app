
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
import {IoLogInSharp,IoAdd,IoAlert,IoCheckmarkSharp,IoClose,IoPencilSharp} from "react-icons/io5";
const withSize = (IconComponent) => (props) => (
  <IconComponent className={props?.className || "w-5 h-5"} />
);

export const Icons = {
  buttons: {
    back: withSize(FiArrowLeft),
    logout: withSize(FiLogOut),
    login:withSize(IoLogInSharp),
    save: withSize(IoCheckmarkSharp),
    cancel: withSize(IoClose),
    submit: withSize(FiCheck),
    edit: withSize(FiEdit),
    delete: withSize(FiTrash),
    add: withSize(FiPlus),
    show: withSize(FiEye),
    chevronUp: withSize(FiChevronUp),
    chevronDown: withSize(FiChevronDown),
    default: withSize(FcFlashOn),
    generate:withSize(IoAdd),
    alert:withSize(IoAlert)

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


