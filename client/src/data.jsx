import { FaUser, FaUsers, FaHotel } from "react-icons/fa";
import {BiWorld} from "react-icons/bi";
import {GiFamilyHouse} from "react-icons/gi";

export const categories = [
  {
    label: "Tất cả",
    icon: <BiWorld />,
  },
  {
    img: "assets/single_room.jpg",
    label: "Phòng đơn",
    icon: <FaUser />,
    description: "Phòng dành cho 1 người với không gian thoải mái và tiện nghi."
  },
  {
    img: "assets/double_room.jpg",
    label: "Phòng đôi",
    icon: <FaUsers />,
    description: "Phòng lý tưởng cho 2 người với giường đôi hoặc 2 giường đơn."
  },
  {
    img: "assets/family_room.jpg",
    label: "Phòng gia đình",
    icon: <GiFamilyHouse/>,
    description: "Phòng rộng rãi dành cho gia đình với nhiều giường và không gian sinh hoạt chung."
  },
  {
    img: "assets/luxury_room.jpg",
    label: "Phòng cao cấp",
    icon: <FaHotel />,
    description: "Phòng hạng sang với nội thất hiện đại và dịch vụ cao cấp."
  }
];
