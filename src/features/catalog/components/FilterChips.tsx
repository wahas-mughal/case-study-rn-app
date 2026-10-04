import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
} from 'react-native';

export type FilterChip = {
  id: string;
  label: string;
};

type FilterChipsProps = {
  chips: FilterChip[];
  selectedId: string;
  onSelect: (id: string) => void;
};

export function FilterChips({ chips, selectedId, onSelect }: FilterChipsProps) {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroller}
      contentContainerStyle={styles.row}
    >
      {chips.map(chip => {
        const selected = chip.id === selectedId;

        return (
          <Pressable
            key={chip.id}
            onPress={() => onSelect(chip.id)}
            style={[
              styles.chip,
              isDarkMode ? styles.chipDark : null,
              selected ? styles.chipSelected : null,
            ]}
          >
            <Text
              style={[
                styles.label,
                isDarkMode ? styles.labelDark : null,
                selected ? styles.labelSelected : null,
              ]}
            >
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroller: {
    flexGrow: 0,
    flexShrink: 0,
  },
  row: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  chip: {
    alignSelf: 'flex-start',
    marginRight: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f2f2f7',
  },
  chipDark: {
    backgroundColor: '#2c2c2e',
  },
  chipSelected: {
    backgroundColor: '#007aff',
  },
  label: {
    fontSize: 14,
    color: '#1c1c1e',
  },
  labelDark: {
    color: '#f2f2f7',
  },
  labelSelected: {
    color: '#ffffff',
  },
});
