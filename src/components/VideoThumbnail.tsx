import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radii } from '../theme';

interface Props {
  uri?: string;
  aspectRatio?: number;
}

export const VideoThumbnail = ({ uri, aspectRatio = 9 / 16 }: Props) => {
  if (!uri) {
    return (
      <LinearGradient colors={gradients.primary} style={[styles.placeholder, { aspectRatio }]} />
    );
  }

  return (
    <View style={[styles.container, { aspectRatio }]}>
      <Image source={{ uri }} style={styles.image} resizeMode="cover" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceAlt,
  },
  placeholder: {
    borderRadius: radii.md,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
