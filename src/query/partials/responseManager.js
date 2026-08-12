import { CommonActions } from '@react-navigation/native';
//-------
import { showMessage } from '../../utils';
import { setUser, handleLogout } from '../../redux/slices/appSlice';
import { storage } from '../../api/api';
import { KEYS } from '../../constants';
import { getMe } from '../../api/authService';

async function resolveUser(loginUser) {
  let user = loginUser;
  try {
    const meRes = await getMe();
    if (meRes?.success && meRes?.user) {
      user = { ...loginUser, ...meRes.user };
    }
  } catch (err) {
    console.log('🚀 ~ resolveUser ~ getMe err:', err?.response?.data || err);
  }
  return user;
}

/**
 * Post-login / session-restore success handler (ClayMaster pattern).
 * Stores Sanctum token, hydrates Redux user, then routes.
 */
export const onLoginSuccess = async (
  response,
  navigation,
  dispatch,
  { email, password } = {},
  setIsLoading = () => {},
) => {
  console.log('response', response);
  try {
    if (response?.success) {
      if (response?.token) {
        storage.set(KEYS.ACCESS_TOKEN, response.token);
      }
      if (email && password) {
        storage.set(KEYS.CREDENTIALS, JSON.stringify({ email, password }));
      }

      const user = await resolveUser(response?.user);
      dispatch(setUser(user));

      if (user?.status === 'rejected') {
        showMessage({
          type: 'danger',
          message:
            response?.message ||
            'Your membership application was not approved.',
        });
        dispatch(handleLogout());
        return;
      }

      if (!user?.profile_completed) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [
              {
                name: 'VerifyScreen',
                params: {
                  email: email || user?.email,
                  fromLogin: true,
                },
              },
            ],
          }),
        );
        return;
      }

      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        }),
      );
    }
  } catch (err) {
    console.log('🚀 ~ onLoginSuccess ~ err:', err);
  } finally {
    setIsLoading(false);
  }
};

export const onRegisterSuccess = async (response, email, navigation, dispatch) => {
  if (response?.success) {
    if (response?.token) {
      storage.set(KEYS.ACCESS_TOKEN, response.token);
    }
    if (response?.user) {
      dispatch?.(setUser(response.user));
    }

    showMessage({
      type: 'success',
      message: response?.message || 'Registration successful.',
    });

    navigation.navigate('VerifyScreen', { email });
  }
};
