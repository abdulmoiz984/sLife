import React, { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaWrapper, Typography } from '../../atomComponents';
import { Avatar, Icon } from '../../components/slife';
import { COLORS, RADIUS } from '../../globalStyle/Theme';
import { getPersonById } from '../../constants/mockData';

const MESSAGES = [
  { from: 'them', text: "Great to connect. I've been following your recent fund updates.", time: '10:12' },
  { from: 'me', text: 'Likewise — really impressed by the last portfolio note.', time: '10:14' },
  { from: 'them', text: 'Happy to make an intro to the team at Meridian if useful.', time: '10:24' },
];

const ChatScreen = ({ navigation, route }) => {
  const person = getPersonById(route.params?.id) || getPersonById('marcus-chen');
  const [text, setText] = useState('');

  return (
    <SafeAreaWrapper edges={['top', 'bottom']} bgColor={COLORS.background}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
            <Icon.ArrowLeft size={20} color={COLORS.foreground} />
          </Pressable>
          <Pressable onPress={() => navigation.navigate('ProfileScreen', { id: person.id })}>
            <Avatar src={person.avatar} size={36} tier={person.tier} />
          </Pressable>
          <Pressable
            style={styles.headerCopy}
            onPress={() => navigation.navigate('ProfileScreen', { id: person.id })}>
            <Typography fixed size={14} fFamily="interSemiBold600" color={COLORS.foreground} numberOfLines={1}>
              {person.name}
            </Typography>
            <Typography fixed size={11} color={COLORS.mute} numberOfLines={1}>
              Verified · Online
            </Typography>
          </Pressable>
          <Icon.DotsV size={20} color={COLORS.foreground} />
        </View>

        <ScrollView contentContainerStyle={styles.thread} showsVerticalScrollIndicator={false}>
          {MESSAGES.map((m, i) => {
            const mine = m.from === 'me';
            return (
              <View key={i} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  <Typography
                    fixed
                    size={14}
                    color={mine ? COLORS.foreground : COLORS.body}
                    LineHeight={21}>
                    {m.text}
                  </Typography>
                </View>
                <View style={[styles.meta, mine && styles.metaMine]}>
                  <Typography fixed size={10} color={COLORS.mute}>
                    {m.time}
                  </Typography>
                  {mine && <Icon.Check size={12} color={COLORS.primary} />}
                </View>
              </View>
            );
          })}
        </ScrollView>

        <View style={styles.composer}>
          <View style={styles.tools}>
            <Icon.Attach size={20} color={COLORS.mute} />
            <Icon.Doc size={20} color={COLORS.mute} />
            <Icon.Mic size={20} color={COLORS.mute} />
            <Icon.Calendar size={20} color={COLORS.mute} />
          </View>
          <View style={styles.inputRow}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder="Write a message"
              placeholderTextColor={COLORS.mute}
              style={styles.input}
            />
            <Pressable style={styles.send}>
              <Icon.Send size={20} color={COLORS.primaryForeground} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaWrapper>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconBtn: { padding: 4 },
  headerCopy: { flex: 1, minWidth: 0 },
  thread: { padding: 20, gap: 16, flexGrow: 1 },
  bubbleRow: { alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: RADIUS.md },
  mine: {
    backgroundColor: COLORS.elevated,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  theirs: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  meta: { marginTop: 4, flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaMine: { justifyContent: 'flex-end' },
  composer: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    padding: 12,
    backgroundColor: COLORS.background,
  },
  tools: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    color: COLORS.foreground,
    fontSize: 14,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
