const fs = require('fs');
const path = require('path');

const files = [
  'src/features/studio/StudioMembersScreen.tsx',
  'src/features/studio/StudioBookingsScreen.tsx',
  'src/features/studio/StudioAnalyticsScreen.tsx',
  'src/features/studio/StudioCalendarScreen.tsx',
  'src/features/studio/StudioServicesScreen.tsx',
  'src/features/studio/StudioSettingsScreen.tsx',
  'src/features/studio/StudioHomeScreen.tsx',
  'src/features/auth/RegisterScreen.tsx',
  'src/features/auth/LoginScreen.tsx',
  'src/features/auth/LandingScreen.tsx',
  'src/features/auth/ForgotPasswordScreen.tsx',
  'src/features/auth/SessionSuccessScreen.tsx',
  'src/features/auth/LegalDocumentScreen.tsx',
];

const root = path.resolve(__dirname, '..');

for (const rel of files) {
  const file = path.join(root, rel);
  let text = fs.readFileSync(file, 'utf8');

  text = text.replace(
    /import \{[\s\S]*?\} from '@expo-google-fonts\/cormorant-garamond';\r?\n/g,
    '',
  );
  text = text.replace(
    /import \{[\s\S]*?\} from '@expo-google-fonts\/outfit';\r?\n/g,
    '',
  );
  text = text.replace(/import \{ useFonts \} from 'expo-font';\r?\n/g, '');

  text = text.replace(
    /\n\s*const \[fontsLoaded\] = useFonts\(\{[\s\S]*?\}\);\r?\n/g,
    '\n',
  );

  text = text.replace(/if \(!fontsLoaded \|\| loading\)/g, 'if (loading)');
  text = text.replace(
    /if \(!fontsLoaded \|\| loading \|\| !tenantId\)/g,
    'if (loading || !tenantId)',
  );

  text = text.replace(
    /\n\s*if \(!fontsLoaded\) \{\r?\n\s*return <View style=\{styles\.boot\} \/>;\r?\n\s*\}\r?\n/g,
    '\n',
  );
  text = text.replace(
    /\n\s*if \(!fontsLoaded\) \{\r?\n\s*return \(\r?\n\s*<View style=\{styles\.boot\}[\s\S]*?\);\r?\n\s*\}\r?\n/g,
    '\n',
  );
  text = text.replace(/\n\s*if \(!fontsLoaded\) return null;\r?\n/g, '\n');

  text = text.replace(
    /if \(!fontsLoaded \|\| loading\) return undefined;/g,
    'if (loading) return undefined;',
  );
  text = text.replace(/if \(!fontsLoaded\) return undefined;/g, '');
  text = text.replace(/, fontsLoaded,/g, ',');
  text = text.replace(/fontsLoaded, /g, '');
  text = text.replace(/, fontsLoaded/g, '');
  text = text.replace(/\n\s*fontsLoaded,\r?\n/g, '\n');

  fs.writeFileSync(file, text);
  console.log('updated', rel, text.includes('fontsLoaded') ? 'STILL HAS fontsLoaded' : 'ok');
}
