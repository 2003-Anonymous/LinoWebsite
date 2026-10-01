// Sponsoren: frei sortierbare Kategorien + Abschluss-Text ("Interesse geweckt?").
// Über das Admin-Panel (admin/index.html) bearbeitbar.
//
// Die Reihenfolge der Kategorien in dieser Liste = Reihenfolge auf der Website.
const SPONSOREN = {
  kategorien: [
    {
      titel: "Materialsponsoren",
      text: "Diese Partner statten mich mit Material aus, auf das ich mich im Training und im Wettkampf verlassen kann.",
      sponsoren: [
        {
          name: "Beispiel Material GmbH",
          logo: "assets/images/sponsors/placeholder.svg",
          url: "https://example.com",
          beschreibung: "Kurzer Text zum Sponsor – was er beisteuert und warum die Zusammenarbeit passt."
        },
        {
          name: "Zweiter Materialsponsor",
          logo: "assets/images/sponsors/placeholder.svg",
          url: "",
          beschreibung: "Beispiel-Eintrag: So sieht ein zweiter Sponsor in dieser Kategorie aus."
        },
        {
          name: "Dritter Materialsponsor",
          logo: "assets/images/sponsors/placeholder.svg",
          url: "",
          beschreibung: "Beispiel-Eintrag – kann im Admin-Bereich jederzeit ersetzt oder gelöscht werden."
        }
      ]
    },
    {
      titel: "Geldsponsoren",
      text: "Dank finanzieller Unterstützung kann ich Trainingslager, Wettkämpfe und Reisen bestreiten.",
      sponsoren: [
        {
          name: "Beispiel Sponsor AG",
          logo: "assets/images/sponsors/placeholder.svg",
          url: "https://example.com",
          beschreibung: "Kurzer Text zum Sponsor – was er beisteuert und warum die Zusammenarbeit passt."
        },
        {
          name: "Zweiter Geldsponsor",
          logo: "assets/images/sponsors/placeholder.svg",
          url: "",
          beschreibung: "Beispiel-Eintrag: So sieht ein zweiter Sponsor in dieser Kategorie aus."
        }
      ]
    },
    {
      titel: "Sensolar",
      text: "",
      sponsoren: [
        {
          name: "Sensolar",
          logo: "assets/images/sponsors/placeholder.svg",
          url: "https://example.com",
          beschreibung: "Sensolar unterstützt mich auf meinem Weg im Rettungsschwimmsport."
        }
      ]
    }
  ],
  cta: {
    titel: "Habe ich dein Interesse geweckt?",
    text: "Als Sponsor unterstützt du nicht nur meinen Weg im Rettungsschwimmsport – dein Logo erscheint auf dieser Website, auf meiner Wettkampfausrüstung und in meinen Social-Media-Beiträgen. Melde dich gerne für ein unverbindliches Gespräch oder für meine Sponsoring-Unterlagen.",
    buttonText: "Kontakt aufnehmen",
    buttonLink: "#kontakt"
  }
};
