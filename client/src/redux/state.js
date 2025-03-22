import {createSlice} from "@reduxjs/toolkit"
import storage from "redux-persist/lib/storage"; 

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
            state.user = null
            state.token = null
            storage.removeItem("persist:root")
        }
    }
})

export const {setLogin, setLogout} = userSlice.actions
export default userSlice.reducer