import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Avatar, TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { notifications } from '../../constants/mockData';

const GROUPS = ['Today', 'This Week', 'Earlier'];

const NotificationsScreen = ({ navigation }) => {
  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar overline="Signals" title="Notifications" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {GROUPS.map(g => {
          const items = notifications.filter(n => n.group === g);
          if (!items.length) return null;
          return (
            <View key={g}>
              <Typography
                fixed
                size={11}
                fFamily="interSemiBold600"
                color={COLORS.mute}
                textTransform="uppercase"
                style={styles.group}>
                {g}
              </Typography>
              {items.map(n => (
                <View key={n.id} style={styles.row}>
                  {n.unread && <View style={styles.unread} />}
                  <Avatar src={n.avatar} size={40} />
                  <Typography fixed size={14} LineHeight={20} style={styles.copy}>
                    <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground}>
                      {n.name}
                    </Typography>
                    <Typography fixed size={14} color={COLORS.body}>
                      {' '}
                      {n.text}
                    </Typography>
                  </Typography>
                  <Typography fixed size={11} color={COLORS.mute}>
                    {n.time}
                  </Typography>
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  body: { paddingBottom: 32 },
  group: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
    letterSpacing: 1.54,
  },
  row: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  unread: {
    position: 'absolute',
    left: 4,
    top: 24,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  copy: { flex: 1 },
});
