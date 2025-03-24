import { FaUser, FaUsers, FaHotel } from "react-icons/fa";

import {
  FaPumpSoap,
  FaShower,
  FaFireExtinguisher,
  FaUmbrellaBeach,
  FaKey,
} from "react-icons/fa";
import { FaHouseUser, FaPeopleRoof, FaKitchenSet } from "react-icons/fa6";
import {
  BiSolidWasher,
  BiSolidDryer,
  BiSolidFirstAid,
  BiWifi,
  BiSolidFridge,
  BiWorld,
} from "react-icons/bi";
import { BsSnow, BsFillDoorOpenFill, BsPersonWorkspace } from "react-icons/bs";
import { MdMicrowave, MdBalcony, MdYard, MdPets } from "react-icons/md";
import {
  PiBathtubFill,
  PiCoatHangerFill,
  PiTelevisionFill,
} from "react-icons/pi";
import { TbIroning3 } from "react-icons/tb";
import {
  GiHeatHaze,
  GiCctvCamera,
  GiBarbecue,
  GiToaster,
  GiCampfire,
  GiFamilyHouse,
} from "react-icons/gi";
import { AiFillCar } from "react-icons/ai";
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
export const types = [
    {
      name: "An entire place",
      description: "Guests have the whole place to themselves",
      icon: <FaHouseUser />,
    },
    {
      name: "Room(s)",
      description:
        "Guests have their own room in a house, plus access to shared places",
      icon: <BsFillDoorOpenFill />,
    },
    {
      name: "A Shared Room",
      description:
        "Guests sleep in a room or common area that maybe shared with you or others",
      icon: <FaPeopleRoof />,
    },
  ];
  
  export const facilities = [
    {
      name: "Bath tub",
      icon: <PiBathtubFill />,
    },
    {
      name: "Personal care products",
      icon: <FaPumpSoap />,
    },
    {
      name: "Outdoor shower",
      icon: <FaShower />,
    },
    {
      name: "Washer",
      icon: <BiSolidWasher />,
    },
    {
      name: "Dryer",
      icon: <BiSolidDryer />,
    },
    {
      name: "Hangers",
      icon: <PiCoatHangerFill />,
    },
    {
      name: "Iron",
      icon: <TbIroning3 />,
    },
    {
      name: "TV",
      icon: <PiTelevisionFill />,
    },
    {
      name: "Dedicated workspace",
      icon: <BsPersonWorkspace />
    },
    {
      name: "Air Conditioning",
      icon: <BsSnow />,
    },
    {
      name: "Heating",
      icon: <GiHeatHaze />,
    },
    {
      name: "Security cameras",
      icon: <GiCctvCamera />,
    },
    {
      name: "Fire extinguisher",
      icon: <FaFireExtinguisher />,
    },
    {
      name: "First Aid",
      icon: <BiSolidFirstAid />,
    },
    {
      name: "Wifi",
      icon: <BiWifi />,
    },
    {
      name: "Cooking set",
      icon: <FaKitchenSet />,
    },
    {
      name: "Refrigerator",
      icon: <BiSolidFridge />,
    },
    {
      name: "Microwave",
      icon: <MdMicrowave />,
    },
    {
      name: "Stove",
      icon: <GiToaster />,
    },
    {
      name: "Barbecue grill",
      icon: <GiBarbecue />,
    },
    {
      name: "Outdoor dining area",
      icon: <FaUmbrellaBeach />,
    },
    {
      name: "Private patio or Balcony",
      icon: <MdBalcony />,
    },
    {
      name: "Camp fire",
      icon: <GiCampfire />,
    },
    {
      name: "Garden",
      icon: <MdYard />,
    },
    {
      name: "Free parking",
      icon: <AiFillCar />,
    },
    {
      name: "Self check-in",
      icon: <FaKey />
    },
    {
      name: " Pet allowed",
      icon: <MdPets />
    }
  ];
