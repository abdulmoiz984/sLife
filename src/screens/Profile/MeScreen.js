import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button } from '../../components';
import { FullProfileView, Icon, Overline } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { people } from '../../constants/mockData';
import { getProfileCompletion } from '../../helpers/profileCompletion';

const MeScreen = ({ navigation }) => {
  const me = people[1];
  const completion = getProfileCompletion(me);

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <FullProfileView
        person={me}
        showCompletion
        headerActions={
          <Pressable
            onPress={() => navigation.getParent()?.navigate('SettingsScreen')}
            style={styles.settingsBtn}>
            <Icon.Settings size={20} color={COLORS.foreground} />
          </Pressable>
        }
        actions={
          <View style={styles.actions}>
            <View style={styles.memberCard}>
              <View style={styles.checkBox}>
                <Icon.Check size={16} color={COLORS.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.memberCopy}>
                <Overline>Membership status</Overline>
                <Typography fixed size={13} color={COLORS.foreground} mT={4}>
                  You are Elite Verified. Your profile is open to every kind of professional.
                </Typography>
              </View>
            </View>
            <Button
              type="secondary"
              label="Edit profile"
              onPress={() => navigation.getParent()?.navigate('ProfileSetupScreen')}
            />
            {completion < 100 && (
              <Button
                label={`Complete profile (${completion}%)`}
                onPress={() => navigation.getParent()?.navigate('ProfileSetupScreen')}
                mt={12}
              />
            )}
          </View>
        }
      />
    </SafeAreaWrapper>
  );
};

export default MeScreen;

const styles = StyleSheet.create({
  settingsBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    zIndex: 10,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
  },
  actions: { gap: 0 },
  memberCard: {
    borderWidth: 1,
    borderColor: 'rgba(241,0,0,0.6)',
    backgroundColor: 'rgba(241,0,0,0.05)',
    borderRadius: RADIUS.md,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  checkBox: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberCopy: { flex: 1 },
});
