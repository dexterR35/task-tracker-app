
import {
  FiArrowLeft,
  FiLogOut,
  FiCheck,
  FiChevronDown,
  FiChevronUp,
  FiEye,
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
} from "react-icons/fi";
import {FcFlashOn,FcNfcSign,FcLock} from "react-icons/fc";
import {IoLogInSharp,IoAdd,IoAlert,IoFingerPrint,IoCheckmarkSharp,IoClose,IoMoonOutline,IoSunnyOutline,IoPerson} from "react-icons/io5";
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
    funny:withSize(IoFingerPrint),
    alert:withSize(IoAlert),
    // home:withSize(FiHome)

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
    moon: withSize(IoMoonOutline),
    sun: withSize(IoSunnyOutline),
  },
  profile:{
    user: withSize(IoPerson),
  },

};

export default Icons;


