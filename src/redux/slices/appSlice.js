import { createSlice } from '@reduxjs/toolkit';
//----------
import { storage } from '../../api/api';
import { KEYS } from '../../constants';

const readProfileSnapshot = () => {
  try {
    const raw = storage.getString(KEYS.PROFILE_SNAPSHOT);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

const savedProfile = readProfileSnapshot();

const PROFILE_SECTIONS = [
  'basic_info',
  'professional_info',
  'organization',
  'verification',
  'bio_interests',
];

export const mergeProfileData = (current, patch) => {
  if (!current) return patch || null;
  if (!patch) return current;

  const merged = { ...current, ...patch };
  PROFILE_SECTIONS.forEach(key => {
    if (patch[key] && typeof patch[key] === 'object') {
      merged[key] = { ...(current[key] || {}), ...patch[key] };
    }
  });
  return merged;
};

const persistProfile = state => {
  if (!state.profile || state.profileOwnerId == null) {
    storage.delete(KEYS.PROFILE_SNAPSHOT);
    return;
  }
  storage.set(
    KEYS.PROFILE_SNAPSHOT,
    JSON.stringify({
      userId: state.profileOwnerId,
      profile: state.profile,
    }),
  );
};

const initialState = {
  user: null,
  isLogged: false,
  profile: savedProfile?.profile || null,
  profileOwnerId: savedProfile?.userId || null,
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setUser: (state, action) => {
      const nextUserId = action.payload?.id ?? null;
      if (
        state.profile &&
        (state.profileOwnerId == null ||
          nextUserId == null ||
          String(state.profileOwnerId) !== String(nextUserId))
      ) {
        state.profile = null;
        state.profileOwnerId = null;
        storage.delete(KEYS.PROFILE_SNAPSHOT);
      }
      state.user = action.payload;
      state.isLogged = true;
    },
    setProfile: (state, action) => {
      state.profile = action.payload;
      state.profileOwnerId = action.payload ? (state.user?.id ?? null) : null;
      persistProfile(state);
    },
    mergeProfile: (state, action) => {
      state.profile = mergeProfileData(state.profile, action.payload);
      state.profileOwnerId = state.user?.id ?? null;
      persistProfile(state);
    },
    handleLogout: state => {
      storage.delete(KEYS.CREDENTIALS);
      storage.delete(KEYS.ACCESS_TOKEN);
      storage.delete(KEYS.SOCIAL_TOKEN);
      storage.delete(KEYS.LOGIN_TYPE);
      storage.delete(KEYS.PROFILE_SNAPSHOT);

      state.user = null;
      state.profile = null;
      state.profileOwnerId = null;
      state.isLogged = false;
    },
  },
});

export const { setUser, setProfile, mergeProfile, handleLogout } =
  appSlice.actions;
export default appSlice.reducer;
