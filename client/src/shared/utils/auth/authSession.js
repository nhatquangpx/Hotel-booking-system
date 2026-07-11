import api from '@/apis/config/axios';
import { setLogout } from '@/store/slices/userSlice';
import { clearCccdReminderDismissals } from './cccdReminder';

/** Đăng xuất: xóa cookie phía server và dọn Redux. */
export const performLogout = async (dispatch) => {
  try {
    await api.post('/auth/logout');
  } catch {
    // Cookie có thể đã hết hạn — vẫn dọn state phía client
  }
  clearCccdReminderDismissals();
  dispatch(setLogout());
};
