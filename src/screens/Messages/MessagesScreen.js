import React, { useState } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { TextField } from '../../components';
import { Avatar, TopBar } from '../../components/slife';
import { COLORS } from '../../globalStyle/Theme';
import { conversations } from '../../constants/mockData';

const MessagesScreen = ({ navigation }) => {
  const [q, setQ] = useState('');
  const list = conversations.filter(
    c => !q || c.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <TopBar overline="Private Line" title="Messages" />
      <View style={styles.search}>
        <TextField placeholder="Search conversations" value={q} onChangeText={setQ} mB={0} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        {list.map(c => (
          <View key={c.id} style={styles.row}>
            <Pressable
              onPress={() => navigation.getParent()?.navigate('ProfileScreen', { id: c.id })}>
              <Avatar src={c.avatar} size={52} />
            </Pressable>
            <Pressable
              style={styles.copy}
              onPress={() => navigation.getParent()?.navigate('ChatScreen', { id: c.id })}>
              <View style={styles.top}>
                <Typography
                  fixed
                  size={14}
                  fFamily="interSemiBold600"
                  color={COLORS.foreground}
                  numberOfLines={1}
                  style={styles.name}>
                  {c.name}
                </Typography>
                <Typography fixed size={11} color={COLORS.mute}>
                  {c.time}
                </Typography>
              </View>
              <View style={styles.bottom}>
                <Typography fixed size={13} color={COLORS.body} numberOfLines={1} style={styles.preview}>
                  {c.preview}
                </Typography>
                {c.unread > 0 && (
                  <View style={styles.badge}>
                    <Typography fixed size={11} fFamily="interBold700" color={COLORS.primaryForeground}>
                      {c.unread}
                    </Typography>
                  </View>
                )}
              </View>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </SafeAreaWrapper>
  );
};

export default MessagesScreen;

const styles = StyleSheet.create({
  search: { padding: 20, paddingBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  copy: { flex: 1, minWidth: 0 },
  top: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  name: { flex: 1 },
  bottom: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  preview: { flex: 1 },
  badge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
