import debounce from 'lodash.debounce';
import { Search } from 'lucide-react-native';
import React from 'react';
import { TextInput, View } from 'react-native';

import { usePaletteColors } from '@/lib/theme';

const SEARCH_ICON_SIZE = 18;
const DEBOUNCE_MS = 300;

interface SearchFieldProps {
  placeholder: string;
  /** Fires debounced — wire this straight to the query variable. */
  onQueryChange: (query: string) => void;
  /** Lets a caller focus the field from another affordance. */
  inputRef?: React.Ref<TextInput>;
  testID?: string;
}

/**
 * Pill search field. Keeps its own immediate text state so typing stays
 * responsive, and only the debounced value reaches the caller's query.
 */
export function SearchField({
  placeholder,
  onQueryChange,
  inputRef,
  testID,
}: SearchFieldProps) {
  const colors = usePaletteColors();
  const [text, setText] = React.useState('');

  const emit = React.useMemo(
    () => debounce(onQueryChange, DEBOUNCE_MS),
    [onQueryChange]
  );
  React.useEffect(() => () => emit.cancel(), [emit]);

  const handleChange = (next: string) => {
    setText(next);
    emit(next.trim());
  };

  return (
    <View className="h-[46px] flex-row items-center gap-2 rounded-full bg-surface px-4">
      <Search size={SEARCH_ICON_SIZE} color={colors.tone[600]} />
      <TextInput
        ref={inputRef}
        testID={testID}
        value={text}
        onChangeText={handleChange}
        placeholder={placeholder}
        placeholderTextColor={colors.tone[600]}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        className="h-full flex-1 font-body text-sm text-ink"
      />
    </View>
  );
}
