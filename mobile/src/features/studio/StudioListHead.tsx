import { Text, View } from 'react-native';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioListHeadProps = {
  sectionLabel: string;
  dayLabel: string;
  countLabel: string;
  countStrong?: boolean;
};

export default function StudioListHead({
  sectionLabel,
  dayLabel,
  countLabel,
  countStrong = false,
}: StudioListHeadProps) {
  return (
    <View style={ui.listHead}>
      <View style={ui.listHeadCopy}>
        <Text style={ui.sectionLabel}>{sectionLabel}</Text>
        <Text style={ui.listDay}>{dayLabel}</Text>
      </View>
      <Text style={[ui.count, countStrong && ui.countStrong]}>{countLabel}</Text>
    </View>
  );
}
