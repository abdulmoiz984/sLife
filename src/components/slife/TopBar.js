import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Typography } from '../../atomComponents';
import { COLORS } from '../../globalStyle/Theme';
import Icon from './Icon';
import Overline from './Overline';

const TopBar = ({ title, onBack, right, overline }) => {
  return (
    <View style={styles.bar}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={8} style={styles.back}>
          <Icon.ArrowLeft size={24} color={COLORS.foreground} />
        </Pressable>
      ) : null}
      <View style={styles.titles}>
        {!!overline && <Overline>{overline}</Overline>}
        {!!title && (
          <Typography
            fixed
            size={17}
            fFamily="spaceGroteskSemiBold600"
            color={COLORS.foreground}
            numberOfLines={1}
            style={styles.title}>
            {title}
          </Typography>
        )}
      </View>
      <View style={styles.right}>{right || null}</View>
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  back: {
    marginRight: 8,
    marginLeft: -4,
    padding: 4,
  },
  titles: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    letterSpacing: -0.3,
  },
  right: {
    marginLeft: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
