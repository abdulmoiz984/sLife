import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useDispatch } from 'react-redux';
//------------------
import { SafeAreaWrapper } from '../atomComponents';
import { AppLogo } from '../components';
import { Overline } from '../components/slife';
import { COLORS, GRADIENTS } from '../globalStyle/Theme';
import { storage } from '../api/api';
import { KEYS } from '../constants';
import { getMe, login } from '../api/authService';
import { useCustomMutation } from '../query/useCustomMutation';
import { onLoginSuccess } from '../query/partials/responseManager';
import { handleLogout } from '../redux/slices/appSlice';

const SplashScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const shimmer = useRef(new Animated.Value(0)).current;
  const didBoot = useRef(false);

  const goUnauthenticated = () => {
    dispatch(handleLogout());
    const seenOnboard = storage.getString(KEYS.IS_ONBOARD);
    navigation.replace(seenOnboard ? 'LoginScreen' : 'OnboardingScreen');
  };

  const { mutate: requestLogin } = useCustomMutation({
    mutationFn: data => login(data, () => {}),
    onSuccess: (response, reqData) => {
      onLoginSuccess(response, navigation, dispatch, reqData, () => {});
    },
    onError: goUnauthenticated,
  });

  const restoreWithMe = async credentials => {
    try {
      const meRes = await getMe();
      if (!meRes?.success || !meRes?.user) {
        throw new Error('Invalid me response');
      }
      await onLoginSuccess(
        {
          success: true,
          token: storage.getString(KEYS.ACCESS_TOKEN),
          user: meRes.user,
        },
        navigation,
        dispatch,
        credentials || {},
        () => {},
      );
    } catch {
      if (credentials?.email && credentials?.password) {
        requestLogin(credentials);
        return;
      }
      goUnauthenticated();
    }
  };

  const checkUser = async () => {
    try {
      const token = storage.getString(KEYS.ACCESS_TOKEN);
      const rawCredentials = storage.getString(KEYS.CREDENTIALS);
      const credentials = rawCredentials ? JSON.parse(rawCredentials) : null;

      if (token) {
        await restoreWithMe(credentials);
        return;
      }

      if (credentials?.email && credentials?.password) {
        requestLogin(credentials);
        return;
      }

      goUnauthenticated();
    } catch (err) {
      console.log('🚀 ~ SplashScreen ~ checkUser:', err);
      goUnauthenticated();
    }
  };

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1600,
        useNativeDriver: true,
      }),
    );
    loop.start();

    const t = setTimeout(() => {
      if (didBoot.current) return;
      didBoot.current = true;
      checkUser();
    }, 1800);

    return () => {
      loop.stop();
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-48, 48],
  });

  return (
    <SafeAreaWrapper edges={[]} bgColor={COLORS.black100}>
      <LinearGradient colors={GRADIENTS.splash} style={styles.fill}>
        <View style={styles.center}>
          <AppLogo size={220} />
          <View style={styles.tag}>
            <Overline textAlign="center">Where Influence Connects</Overline>
          </View>
        </View>
        <View style={styles.barWrap}>
          <View style={styles.barTrack}>
            <Animated.View
              style={[styles.barFill, { transform: [{ translateX }] }]}
            />
          </View>
        </View>
      </LinearGradient>
    </SafeAreaWrapper>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  tag: {
    marginTop: 24,
  },
  barWrap: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  barTrack: {
    height: 2,
    width: 96,
    backgroundColor: 'rgba(241,0,0,0.4)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    width: '50%',
    backgroundColor: COLORS.primary,
  },
});
