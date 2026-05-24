import { registerRootComponent } from 'expo';
import { StyleSheet } from 'react-native';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
// Fix css-interop color scheme error on web BEFORE mount
try {
  // @ts-ignore runtime available on web
  StyleSheet.setFlag && StyleSheet.setFlag('darkMode', 'class');
} catch {}

registerRootComponent(App);
