import { ActivityIndicator, View } from 'react-native';
import { studioChromeStyles as chrome } from './studioChrome.js';

/** Shared loading gate for owner studio screens. */
export default function StudioBoot() {
  return (
    <View style={chrome.boot}>
      <ActivityIndicator color="#5EEAD4" />
    </View>
  );
}
