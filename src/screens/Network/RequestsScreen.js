import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button } from '../../components';
import { Avatar, TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { people } from '../../constants/mockData';

const RequestsScreen = ({ navigation }) => {
  const [tab, setTab] = useState('received');
  const received = people.slice(0, 2);
  const sent = people.slice(2, 4);
  const list = tab === 'received' ? received : sent;

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar
        overline="Your Circle"
        title="Requests"
        onBack={() => navigation.goBack()}
      />
      <View style={styles.tabs}>
        {['received', 'sent'].map(t => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, tab === t && styles.tabOn]}>
            <Typography
              fixed
              size={12}
              fFamily="interSemiBold600"
              color={tab === t ? COLORS.primary : COLORS.mute}
              textTransform="uppercase"
              style={styles.track}>
              {t} ({t === 'received' ? received.length : sent.length})
            </Typography>
          </Pressable>
        ))}
      </View>
      <ScrollView>
        {list.map(p => (
          <View key={p.id} style={styles.row}>
            <Avatar src={p.avatar} size={52} tier={p.tier} />
            <View style={styles.copy}>
              <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground}>
                {p.name}
              </Typography>
              <Typography fixed size={12} color={COLORS.body} numberOfLines={1}>
                {p.headline}
              </Typography>
              <Typography fixed size={11} color={COLORS.mute} mT={4}>
                {p.mutual} mutual connections
              </Typography>
              <View style={styles.actions}>
                {tab === 'received' ? (
                  <>
                    <View style={styles.btnSm}>
                      <Button label="Accept" onPress={() => {}} />
                    </View>
                    <Pressable style={styles.decline}>
                      <Typography
                        fixed
                        size={11}
                        fFamily="interSemiBold600"
                        color={COLORS.foreground}
                        textTransform="uppercase"
                        style={styles.trackSmall}>
                        Decline
                      </Typography>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <View style={styles.pending}>
                      <Typography
                        fixed
                        size={11}
                        fFamily="interSemiBold600"
                        color={COLORS.mute}
                        textTransform="uppercase"
                        style={styles.trackSmall}>
                        Pending
                      </Typography>
                    </View>
                    <Typography
                      fixed
                      size={11}
                      fFamily="interSemiBold600"
                      color={COLORS.primary}
                      textTransform="uppercase"
                      style={[styles.trackSmall, styles.underline]}>
                      Withdraw
                    </Typography>
                  </>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default RequestsScreen;

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabOn: { borderBottomColor: COLORS.primary },
  track: { letterSpacing: 0.96 },
  trackSmall: { letterSpacing: 0.66 },
  row: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  copy: { flex: 1, minWidth: 0 },
  actions: { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  btnSm: { width: 100 },
  decline: {
    height: 36,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pending: {
    height: 36,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  underline: { textDecorationLine: 'underline' },
});
