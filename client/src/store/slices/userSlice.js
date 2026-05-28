import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    user: null,
    sessionChecked: false,
}

export const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        setLogin: (state, action) => {
            state.user = action.payload.user
            state.sessionChecked = true
        },
        setLogout: (state) => {
            state.user = null;
            state.sessionChecked = true;
        },
        setSessionChecked: (state) => {
            state.sessionChecked = true;
        },
        setUser: (state, action) => {
            state.user = action.payload;
        },
    }
})

export const { setLogin, setLogout, setSessionChecked, setUser } = userSlice.actions
export default userSlice.reducer
