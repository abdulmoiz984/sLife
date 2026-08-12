import { createSlice } from '@reduxjs/toolkit';
//----------
import { storage } from '../../api/api';
import { KEYS } from '../../constants';

const initialState = {
  user: null,
  isLogged: false,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
      state.isLogged = true;
    },
    handleLogout: state => {
      storage.delete(KEYS.CREDENTIALS);
      storage.delete(KEYS.ACCESS_TOKEN);
      storage.delete(KEYS.SOCIAL_TOKEN);
      storage.delete(KEYS.LOGIN_TYPE);

      state.user = null;
      state.isLogged = false;
    },
  },
});

export const { setUser, handleLogout } = appSlice.actions;
export default appSlice.reducer;
