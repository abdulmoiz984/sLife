import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Button, AppLogo } from '../../components';
import { Avatar, Icon, Overline } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { people } from '../../constants/mockData';

const HomeScreen = ({ navigation }) => {
  const featured = people.slice(0, 4);
  const [requestFor, setRequestFor] = useState(null);
  const [note, setNote] = useState('');
  const [pendingIds, setPendingIds] = useState([]);

  const openRequest = person => {
    setRequestFor(person);
    setNote('');
  };

  const closeRequest = () => {
    setRequestFor(null);
    setNote('');
  };

  const sendRequest = () => {
    if (!requestFor) return;
    setPendingIds(prev => [...prev, requestFor.id]);
    closeRequest();
  };

  return (
    <SafeAreaWrapper edges={['top']} bgColor={COLORS.background}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <AppLogo size={32} />
          <Typography fixed size={16} fFamily="spaceGroteskBold700" color={COLORS.foreground}>
            S-Life
          </Typography>
        </View>
        <View style={styles.headerActions}>
          <Pressable onPress={() => navigation.navigate('DiscoverTab')} hitSlop={8}>
            <Icon.Search size={20} color={COLORS.foreground} />
          </Pressable>
          <Pressable
            onPress={() => navigation.getParent()?.navigate('NotificationsScreen')}
            hitSlop={8}
            style={styles.bell}>
            <Icon.Bell size={20} color={COLORS.foreground} />
            <View style={styles.dot} />
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.sectionHead}>
          <View>
            <Overline>Recommended for you</Overline>
            <View style={styles.titleRow}>
              <Icon.Sparkle size={20} color={COLORS.primary} />
              <Typography fixed size={20} fFamily="spaceGroteskBold700" color={COLORS.foreground}>
                AI Curated Matches
              </Typography>
            </View>
          </View>
          <Pressable onPress={() => navigation.navigate('DiscoverTab')}>
            <Typography
              fixed
              size={11}
              fFamily="interSemiBold600"
              color={COLORS.primary}
              textTransform="uppercase"
              style={styles.track}>
              See all
            </Typography>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}>
          {featured.map(p => (
            <Pressable
              key={p.id}
              style={styles.matchCard}
              onPress={() =>
                navigation.getParent()?.navigate('ProfileScreen', { id: p.id })
              }>
              <View style={styles.matchInner}>
                <Avatar src={p.avatar} size={56} tier={p.tier} />
                <View style={styles.matchCopy}>
                  <Typography fixed size={15} fFamily="interSemiBold600" color={COLORS.foreground} numberOfLines={1}>
                    {p.name}
                  </Typography>
                  <Typography fixed size={12} color={COLORS.body} numberOfLines={1}>
                    {p.headline}
                  </Typography>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.feedHead}>
          <Overline>The Circle</Overline>
          <Typography fixed size={20} fFamily="spaceGroteskBold700" color={COLORS.foreground} mT={4}>
            Members you should know
          </Typography>
        </View>

        {people.map(p => {
          const isPending = pendingIds.includes(p.id);
          return (
            <View key={p.id} style={styles.feedCard}>
              <View style={styles.matchInner}>
                <Avatar src={p.avatar} size={56} tier={p.tier} />
                <View style={styles.matchCopy}>
                  <Typography fixed size={15} fFamily="interSemiBold600" color={COLORS.foreground} numberOfLines={1}>
                    {p.name}
                  </Typography>
                  <Typography fixed size={13} color={COLORS.body} numberOfLines={1}>
                    {p.headline}
                  </Typography>
                </View>
              </View>
              <View style={styles.ctaRow}>
                <View style={styles.ctaCol}>
                  <Button
                    type="outline"
                    label="View Profile"
                    onPress={() => navigation.getParent()?.navigate('ProfileScreen', { id: p.id })}
                  />
                </View>
                <View style={styles.ctaCol}>
                  {isPending ? (
                    <Button type="outline" label="Pending" disabled />
                  ) : (
                    <Button label="Send request" onPress={() => openRequest(p)} />
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <Modal visible={!!requestFor} transparent animationType="fade" onRequestClose={closeRequest}>
        <Pressable style={styles.backdrop} onPress={closeRequest}>
          <Pressable style={styles.sheet} onPress={e => e.stopPropagation()}>
            <View style={styles.handle} />
            <Overline>Send request</Overline>
            <Typography fixed size={18} fFamily="spaceGroteskBold700" color={COLORS.foreground} mT={4}>
              Connect with {requestFor?.name?.split(' ')[0]}
            </Typography>
            <Typography fixed size={13} color={COLORS.body} mT={4}>
              {requestFor?.headline}
            </Typography>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Introduce yourself or share why you'd like to connect"
              placeholderTextColor={COLORS.mute}
              multiline
              style={styles.note}
            />
            <View style={styles.ctaRow}>
              <View style={styles.ctaCol}>
                <Button type="ghost" label="Cancel" onPress={closeRequest} textColor={COLORS.mute} />
              </View>
              <View style={styles.ctaCol}>
                <Button label="Send request" onPress={sendRequest} />
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaWrapper>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bell: { position: 'relative' },
  dot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.destructive,
  },
  scroll: { paddingBottom: 32 },
  sectionHead: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  track: { letterSpacing: 0.88 },
  carousel: {
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 8,
  },
  matchCard: {
    width: 260,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  matchInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  matchCopy: { flex: 1, minWidth: 0 },
  feedHead: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  feedCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 16,
  },
  ctaRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 8,
  },
  ctaCol: { flex: 1 },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.elevated,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 20,
  },
  handle: {
    width: 48,
    height: 4,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  note: {
    marginTop: 16,
    minHeight: 112,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: 12,
    color: COLORS.foreground,
    fontSize: 14,
    textAlignVertical: 'top',
  },
});
