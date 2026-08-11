import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button } from '../../components';
import { FullProfileView, Icon } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { getPersonById } from '../../constants/mockData';

const ProfileDetailsScreen = ({ navigation, route }) => {
  const person = getPersonById(route.params?.id);
  if (!person) {
    return (
      <SafeAreaWrapper bgColor={COLORS.background}>
        <View style={styles.empty}>
          <Typography fixed size={24} fFamily="spaceGroteskBold700" color={COLORS.foreground}>
            Profile unavailable
          </Typography>
          <Button label="Back to Network" onPress={() => navigation.goBack()} mt={24} />
        </View>
      </SafeAreaWrapper>
    );
  }

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <FullProfileView
        person={person}
        headerActions={
          <>
            <Pressable onPress={() => navigation.goBack()} style={[styles.iconBtn, styles.leftBtn]}>
              <Icon.ArrowLeft size={20} color={COLORS.foreground} />
            </Pressable>
            <Pressable style={[styles.iconBtn, styles.rightBtn]}>
              <Icon.DotsV size={20} color={COLORS.foreground} />
            </Pressable>
          </>
        }
        actions={
          <View style={styles.ctaRow}>
            <View style={styles.col}>
              <Button
                type="outline"
                label="Connected"
                disabled
                icon={<Icon.Check size={16} color={COLORS.mute} />}
                textColor={COLORS.mute}
              />
            </View>
            <View style={styles.col}>
              <Button
                label="Message"
                onPress={() => navigation.navigate('ChatScreen', { id: person.id })}
              />
            </View>
          </View>
        }
      />
    </SafeAreaWrapper>
  );
};

export default ProfileDetailsScreen;

const styles = StyleSheet.create({
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  iconBtn: {
    position: 'absolute',
    top: 16,
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10,
  },
  leftBtn: { left: 20 },
  rightBtn: { right: 20 },
  ctaRow: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
});
