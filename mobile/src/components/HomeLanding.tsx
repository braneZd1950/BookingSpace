import { useCallback, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { env } from '../config/env';
import {
  homeBenefits,
  homeCalendars,
  homeFaqs,
  homeSteps,
} from '../content/homeLanding';
import { openWebPath } from '../lib/openWeb';
import { homeLandingStyles as s } from '../ui/homeLandingStyles';

type ScrollHandle = {
  scrollTo: (options: { y: number; animated?: boolean }) => void;
};

export default function HomeLanding() {
  const router = useRouter();
  const scrollRef = useRef<ScrollHandle | null>(null);
  const howY = useRef(0);
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const onHowLayout = useCallback((event: LayoutChangeEvent) => {
    howY.current = event.nativeEvent.layout.y;
  }, []);

  const scrollToHow = useCallback(() => {
    scrollRef.current?.scrollTo({ y: Math.max(0, howY.current - 12), animated: true });
  }, []);

  return (
    <SafeAreaView style={s.root} edges={['top', 'left', 'right']}>
      <ScrollView
        ref={(node) => {
          scrollRef.current = node as unknown as ScrollHandle | null;
        }}
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero} accessibilityLabel="anyminutes početna">
          <View style={s.heroShade} pointerEvents="none" />
          <View style={s.calendars} pointerEvents="none" accessibilityElementsHidden>
            {homeCalendars.map((sheet, index) => (
              <View
                key={sheet.month}
                style={[
                  s.cal,
                  {
                    transform: [
                      { rotate: `${[-5, 4, -3, 6][index]}deg` },
                      { translateX: index % 2 === 0 ? 0 : 18 },
                    ],
                  },
                ]}
              >
                <View style={s.calHeader}>
                  <Text style={s.calHeaderText}>{sheet.month}</Text>
                  <Text style={s.calHeaderText}>{sheet.year}</Text>
                </View>
                <View style={s.calGrid}>
                  {sheet.days.map((day) => (
                    <Text
                      key={day}
                      style={[s.calDay, day === sheet.booked && s.calDayBooked]}
                    >
                      {day}
                    </Text>
                  ))}
                </View>
                <Text style={s.calNote}>{sheet.note}</Text>
              </View>
            ))}
          </View>

          <View style={s.heroCopy}>
            <Text style={s.brand} accessibilityRole="header">
              {env.appName}
            </Text>
            <Text style={s.title}>Vaši termini. Vaši klijenti. Jedno mjesto.</Text>
            <Text style={s.lead}>
              Napravite vlastitu stranicu za rezervacije, podijelite link s klijentima
              i vodite cijeli raspored bez stalnih poruka i dogovaranja. Jednostavno, od prvog dana.
            </Text>
            <View style={s.actions}>
              <Pressable style={s.cta} onPress={() => void openWebPath('/register')}>
                <Text style={s.ctaLabel}>Napravite svoju stranicu</Text>
              </Pressable>
              <Pressable style={s.ctaGhost} onPress={scrollToHow}>
                <Text style={s.ctaGhostLabel}>Pogledajte kako radi</Text>
              </Pressable>
              <Pressable style={s.ctaApp} onPress={() => router.push('/(auth)/login')}>
                <Text style={s.ctaLabel}>Prijava</Text>
              </Pressable>
            </View>
            <Text style={s.trust}>Postavljanje traje svega nekoliko minuta. Bez komplikacija.</Text>
          </View>
        </View>

        <View style={s.block} accessibilityLabel="Poznato vam je ovo?">
          <Text style={s.h2}>Poznato vam je ovo?</Text>
          <View style={s.prose}>
            <Text style={s.proseText}>
              Dan vam je pun, a termini i klijenti još uvijek žive po papirima,
              bilježnicama i porukama. Poruke stižu kasno navečer i u pauzama.
              Netko otkaže u zadnji čas, a vi ručno tražite kome taj termin ponuditi.
            </Text>
            <Text style={s.proseText}>
              Raspored vam je na papiru, u glavi i u tri različite aplikacije.
              Teško je pratiti tko dolazi, tko još nije platio članarinu i koji je
              termin slobodan — lako se nešto izgubi.
            </Text>
            <Text style={s.proseText}>
              Umjesto da radite svoj posao, veći dio dana provodite dogovarajući se oko njega.
            </Text>
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.h2}>anyminutes preuzima dogovaranje umjesto vas</Text>
          <View style={s.prose}>
            <Text style={s.proseText}>
              S anyminutesom klijenti sami rezerviraju termin preko vaše stranice,
              u bilo koje doba dana. Vi u svakom trenutku vidite tko dolazi i kada,
              sve na jednom mjestu.
            </Text>
            <Text style={s.proseText}>
              Nema više prebrojavanja poruka ni ručnog upisivanja termina.
              Raspored se slaže sam, a vama ostaje više vremena za klijente i za posao.
            </Text>
            <Text style={s.proseText}>Jednostavno za vas i jednostavno za vaše klijente.</Text>
          </View>
        </View>

        <View style={s.blockWide}>
          <Text style={s.h2}>Zašto vlasnici biraju anyminutes</Text>
          <View style={s.edges}>
            {homeBenefits.map((item) => (
              <View key={item.title} style={s.edge}>
                <Text style={s.edgeTitle}>{item.title}</Text>
                <Text style={s.edgeText}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.blockWide} onLayout={onHowLayout}>
          <Text style={s.h2}>U tri koraka do prvih rezervacija</Text>
          <View style={s.steps}>
            {homeSteps.map((step) => (
              <View key={step.n} style={s.step}>
                <Text style={s.stepN}>{step.n}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{step.title}</Text>
                  <Text style={s.stepText}>{step.text}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={s.block}>
          <Text style={s.h2}>Vlastita stranica koju dijelite samo sa svojim klijentima</Text>
          <View style={s.prose}>
            <Text style={s.proseText}>
              Svaki posao kod nas dobiva svoju online stranicu i svoj link za rezervacije.
              Na njoj su vaše usluge, vaše radno vrijeme i vaš način rada.
            </Text>
            <Text style={s.proseText}>
              Taj link šaljete izravno svojim klijentima — u poruci, na društvenim mrežama
              ili na posjetnici. Klijent ga otvori i odmah rezervira termin.
            </Text>
            <Text style={s.proseText}>
              Stranica je vaša i služi samo vašem poslu. Klijenti ne lutaju među drugim
              ponudama — dolaze točno k vama.
            </Text>
          </View>
          <Text style={s.note}>
            Primjer adrese:
            {' '}
            <Text style={s.code}>/s/vas-studio</Text>
          </Text>
        </View>

        <View style={s.block}>
          <Text style={s.h2}>Termini, raspored i članarine na jednom mjestu</Text>
          <View style={s.prose}>
            <Text style={s.proseText}>
              U anyminutesu na jednom mjestu vodite termine, svoj raspored, popis
              klijenata i njihove članarine.
            </Text>
            <Text style={s.proseText}>
              Vidite tko je rezervirao, koji su termini slobodni i kako vam izgleda tjedan.
              Podatke o klijentima držite uredno, bez bilježnica i razbacanih poruka.
            </Text>
            <Text style={s.proseText}>
              Sve je posloženo tako da brzo nađete ono što trebate i da manje vremena
              trošite na administraciju.
            </Text>
          </View>
        </View>

        <View style={s.split}>
          <View style={s.splitCard}>
            <Text style={s.h2}>I vaši klijenti će biti zadovoljni</Text>
            <Text style={s.proseText}>
              Vaši klijenti rezerviraju termin u nekoliko klikova, bez dopisivanja i
              čekanja na odgovor. Jasno vide koji su termini slobodni i biraju onaj
              koji im najbolje odgovara.
            </Text>
            <Text style={s.splitExtra}>
              Rezerviraju kad njima odgovara — ujutro, navečer ili za vikend.
              Jednostavno iskustvo znači da se rado vraćaju.
            </Text>
            <Pressable onPress={() => void openWebPath('/otkrij')}>
              <Text style={s.textLink}>Otkrijte studije</Text>
            </Pressable>
          </View>
          <View style={s.splitCard}>
            <Text style={s.h2}>Vaš posao i vaši klijenti ostaju vaši</Text>
            <Text style={s.proseText}>
              anyminutes nije javni imenik u kojem klijenti pregledavaju i uspoređuju
              razne poslove. Nema preusmjeravanja vaših klijenata drugima.
            </Text>
            <Text style={s.splitExtra}>
              Vi dobivate vlastiti online prostor i vlastiti link, a mi vam dajemo
              samo alate da sve vodite lakše. Vaša stranica, vaši klijenti i vaši
              odnosi pripadaju vama — mi smo tu da vam vratimo vrijeme za posao.
            </Text>
            <Pressable onPress={() => void openWebPath('/register')}>
              <Text style={s.textLink}>Napravite svoju stranicu</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.block} accessibilityLabel="O nama">
          <Text style={s.h2}>Jedna ideja da vođenje posla bude jednostavnije</Text>
          <View style={s.prose}>
            <Text style={s.proseText}>
              AnyMinutes je nastao od stvarnog problema malih poslova — studija,
              salona i igraonica — kojima složeni programi samo dodaju posla.
              Gradimo ga uz prve korisnike: jednostavan, pregledan i bez priručnika.
            </Text>
            <Text style={s.proseText}>
              Cilj je vratiti vam vrijeme koje danas trošite na poruke, papire i
              dogovaranje — da se možete vratiti klijentima.
            </Text>
          </View>
          <Pressable onPress={() => void openWebPath('/o-nama')}>
            <Text style={s.textLink}>Pročitajte više o nama</Text>
          </Pressable>
        </View>

        <View style={s.close}>
          <Text style={s.closeTitle}>Spremni za manje dogovaranja, a više posla?</Text>
          <Text style={s.closeLead}>
            Napravite svoju stranicu danas i pustite da rezervacije stižu same.
            Postavljanje traje svega nekoliko minuta.
          </Text>
          <View style={s.actions}>
            <Pressable style={s.ctaSolid} onPress={() => void openWebPath('/register')}>
              <Text style={s.ctaSolidLabel}>Napravite svoju stranicu</Text>
            </Pressable>
            <Pressable style={s.ctaLine} onPress={() => router.push('/(auth)/login')}>
              <Text style={s.ctaLineLabel}>Prijava</Text>
            </Pressable>
            <Pressable style={s.ctaApp} onPress={() => void openWebPath('/preuzmi')}>
              <Text style={s.ctaLabel}>Preuzmite aplikaciju</Text>
            </Pressable>
          </View>
          <Text style={s.trustClose}>Jednostavno za postaviti. Jednostavno za koristiti.</Text>
        </View>

        <View style={s.faqBlock}>
          <Text style={s.h2}>Česta pitanja</Text>
          {homeFaqs.map((item) => {
            const open = openFaq === item.q;
            return (
              <Pressable
                key={item.q}
                style={s.faqItem}
                onPress={() => setOpenFaq(open ? null : item.q)}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <Text style={s.faqQ}>{item.q}</Text>
                {open ? <Text style={s.faqA}>{item.a}</Text> : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
