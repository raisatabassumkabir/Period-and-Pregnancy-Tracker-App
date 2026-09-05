import { cssInterop } from 'nativewind';
import Svg from 'react-native-svg';

export * from './button';
export * from './checkbox';
export { default as colors } from './colors';
export * from './error-banner';
export * from './focus-aware-status-bar';
export * from './form-field';
export * from './image';
export * from './input';
export * from './kicker';
export * from './list';
export * from './modal';
export * from './pill';
export * from './progress-bar';
export * from './progress-track';
export * from './query-status';
export * from './screen-header';
export * from './search-field';
export * from './segmented-control';
export * from './select';
export * from './text';
export * from './utils';

// export base components from react-native
export {
  ActivityIndicator,
  Pressable,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
export { SafeAreaView } from 'react-native-safe-area-context';

//Apply cssInterop to Svg to resolve className string into style
cssInterop(Svg, {
  className: {
    target: 'style',
  },
});
