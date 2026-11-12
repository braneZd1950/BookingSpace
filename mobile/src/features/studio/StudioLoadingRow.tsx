import { ActivityIndicator, Text, View } from 'react-native';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioLoadingRowProps = {
  hint: string;
};

/** Shared spinner + hint for studio list loads. */
export default function StudioLoadingRow({ hint }: StudioLoadingRowProps) {
  return (
    <View style={ui.loadingRow}>
      <ActivityIndicator color="#5EEAD4" size="small" />
      <Text style={ui.hint}>{hint}</Text>
    </View>
  );
}
