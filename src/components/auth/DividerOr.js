import React from 'react';
import { View, StyleSheet } from 'react-native';
//-----
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';

const DividerOr = ({ mT = 24, mB = 24 }) => {
  return (
    <View style={[styles.row, { marginTop: mT, marginBottom: mB }]}>
      <View style={styles.line} />
      <Typography fixed size={13} color={COLORS.mutedForeground} style={styles.text}>
        or
      </Typography>
      <View style={styles.line} />
    </View>
  );
};

export default DividerOr;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: COLORS.border,
  },
  text: {
    textTransform: 'lowercase',
  },
});
