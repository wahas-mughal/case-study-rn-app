import { useEffect, useState } from 'react';
import { Image, StyleSheet } from 'react-native';
import type { ImageStyle, StyleProp } from 'react-native';

import { cacheImage, readCachedImage } from '../images/cacheImage';

type CachedImageProps = {
  uri: string;
  style?: StyleProp<ImageStyle>;
};

export function CachedImage({ uri, style }: CachedImageProps) {
  const [source, setSource] = useState(() => readCachedImage(uri) ?? uri);

  useEffect(() => {
    let active = true;
    const cached = readCachedImage(uri);

    if (cached) {
      setSource(cached);
      return () => {
        active = false;
      };
    }

    setSource(uri);
    cacheImage(uri).then(local => {
      if (active && local) {
        setSource(local);
      }
    });

    return () => {
      active = false;
    };
  }, [uri]);

  return <Image source={{ uri: source }} style={[styles.image, style]} />;
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: '#e5e5ea',
  },
});
