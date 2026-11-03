import { Redirect } from 'expo-router';

/** Legacy path — Termini live at /(app)/termini */
export default function StudioRedirect() {
  return <Redirect href="/(app)/termini" />;
}
