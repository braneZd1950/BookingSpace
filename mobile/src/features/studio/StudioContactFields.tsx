import { TextInput } from 'react-native';
import { studioUiStyles as ui } from './studioUiStyles.js';

type StudioContactFieldsProps = {
  name: string;
  email: string;
  phone: string;
  onChangeName: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangePhone: (value: string) => void;
  editable?: boolean;
  namePlaceholder?: string;
  emailPlaceholder?: string;
  phonePlaceholder?: string;
};

/** Shared name / email / phone inputs for member + staff forms. */
export default function StudioContactFields({
  name,
  email,
  phone,
  onChangeName,
  onChangeEmail,
  onChangePhone,
  editable = true,
  namePlaceholder = 'Ime i prezime',
  emailPlaceholder = 'E-pošta',
  phonePlaceholder = 'Telefon (opcionalno)',
}: StudioContactFieldsProps) {
  return (
    <>
      <TextInput
        style={ui.input}
        value={name}
        onChangeText={onChangeName}
        placeholder={namePlaceholder}
        placeholderTextColor="rgba(232, 242, 239, 0.28)"
        autoCapitalize="words"
        editable={editable}
      />
      <TextInput
        style={ui.input}
        value={email}
        onChangeText={onChangeEmail}
        placeholder={emailPlaceholder}
        placeholderTextColor="rgba(232, 242, 239, 0.28)"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={editable}
      />
      <TextInput
        style={ui.input}
        value={phone}
        onChangeText={onChangePhone}
        placeholder={phonePlaceholder}
        placeholderTextColor="rgba(232, 242, 239, 0.28)"
        keyboardType="phone-pad"
        editable={editable}
      />
    </>
  );
}
