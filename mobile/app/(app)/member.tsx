import { Redirect } from 'expo-router';

/** Legacy path — Članovi live at /(app)/clanovi */
export default function MemberRedirect() {
  return <Redirect href="/(app)/clanovi" />;
}
