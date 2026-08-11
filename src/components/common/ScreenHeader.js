import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
//-----
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';
import Sizer from '../../helpers/Sizer';

const ScreenHeader = ({ title, onBack, right, titleStyle }) => {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={8} style={styles.backBtn}>
        <ArrowLeft
          size={Sizer.hSize(22)}
          color={COLORS.foreground}
          strokeWidth={1.8}
        />
      </Pressable>
      <Typography
        fFamily="sourceSerifBold700"
        size={18}
        color={COLORS.foreground}
        style={[styles.title, titleStyle]}>
        {title}
      </Typography>
      <View style={styles.right}>{right || null}</View>
    </View>
  );
};

export default ScreenHeader;

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Sizer.hSize(16),
    paddingVertical: Sizer.vSize(12),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  backBtn: {
    padding: Sizer.hSize(8),
    marginLeft: Sizer.hSize(-8),
  },
  title: {
    flex: 1,
    marginLeft: Sizer.hSize(8),
  },
  right: {
    minWidth: Sizer.hSize(40),
    alignItems: 'flex-end',
  },
});
