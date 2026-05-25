import { createSlice } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { clearAuthSessionStorage } from "@/shared/utils/authSession";

const initialState = {
    user: null,
    token: null
}

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setLogin: (state, action) => {
            state.user = action.payload.user
            state.token = action.payload.token
        },
        setLogout: (state) => {
            state.user = null;
            state.token = null;
            clearAuthSessionStorage();
            storage.removeItem("persist:root");
        },
    }
})

export const {setLogin, setLogout} = userSlice.actions
export default userSlice.reducer

