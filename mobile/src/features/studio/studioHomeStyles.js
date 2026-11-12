import { StyleSheet } from 'react-native';

/** Local layout for studio home menu / facts. */
export const studioHomeStyles = StyleSheet.create({
  facts: { paddingTop: 2 },
  menuTitle: {
    marginBottom: 12,
    marginTop: 18,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuCard: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    gap: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(232, 242, 239, 0.16)',
    borderRadius: 8,
    backgroundColor: 'rgba(10, 20, 18, 0.4)',
  },
  menuLabel: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 15,
    color: '#F7FCFA',
  },
  menuNote: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(232, 242, 239, 0.5)',
  },
  hint: {
    marginTop: 12,
    fontFamily: 'Outfit_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(94, 234, 212, 0.75)',
  },
});
