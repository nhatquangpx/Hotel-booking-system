/**
 * Cities Constants
 * Configuration for city/destination categories
 */
import { IMAGE_PATHS } from './images';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import BeachAccessIcon from '@mui/icons-material/BeachAccess';
import LandscapeIcon from '@mui/icons-material/Landscape';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import PoolIcon from '@mui/icons-material/Pool';
import VillaIcon from '@mui/icons-material/Villa';

export const CITIES = [
  {
    id: 1,
    name: 'Hà Nội',
    img: IMAGE_PATHS.HANOI,
    icon: LocationCityIcon,
    description: 'Thủ đô ngàn năm văn hiến',
  },
  {
    id: 2,
    name: 'Hồ Chí Minh',
    img: IMAGE_PATHS.HOCHIMINH,
    icon: LocationCityIcon,
    description: 'Thành phố năng động và hiện đại',
  },
  {
    id: 3,
    name: 'Đà Nẵng',
    img: IMAGE_PATHS.DANANG,
    icon: BeachAccessIcon,
    description: 'Thành phố biển xinh đẹp',
  },
  {
    id: 4,
    name: 'Hải Phòng',
    img: IMAGE_PATHS.HAIPHONG,
    icon: DirectionsBoatIcon,
    description: 'Thành phố cảng sôi động',
  },
  {
    id: 5,
    name: 'Nha Trang',
    img: IMAGE_PATHS.NHATRANG,
    icon: PoolIcon,
    description: 'Thiên đường biển đảo',
  },
  {
    id: 6,
    name: 'Phú Quốc',
    img: IMAGE_PATHS.PHUQUOC,
    icon: VillaIcon,
    description: 'Đảo ngọc xinh đẹp',
  },
];

