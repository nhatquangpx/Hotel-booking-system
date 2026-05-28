import api from '@/apis/config/axios';
import { setLogout } from '@/store/slices/userSlice';

/**
 * Đăng xuất: xóa cookie phía server và dọn Redux.
 */
export const performLogout = async (dispatch) => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Cookie có thể đã hết hạn — vẫn dọn state phía client
  }
  dispatch(setLogout());
};
