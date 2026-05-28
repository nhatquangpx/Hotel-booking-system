import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import api from '@/apis';
import { setLogin, setLogout, setSessionChecked } from '@/store/slices/userSlice';

/** Khôi phục phiên qua GET /auth/me — axios tự gọi /auth/refresh khi access hết hạn. */
export default function AuthInitializer({ children }) {
  const dispatch = useDispatch();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { user } = await api.auth.getMe();
        if (alive) dispatch(user ? setLogin({ user }) : setLogout());
      } catch {
        if (alive) dispatch(setLogout());
      } finally {
        if (alive) {
          dispatch(setSessionChecked());
          setReady(true);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [dispatch]);

  if (!ready) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Đang tải...</div>;
  }

  return children;
}
