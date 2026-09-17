// Base data for the six supplied real profiles. These are the only profiles
// an email address can claim on the join page; demo profiles use example.com
// placeholders and cannot be claimed. Kept in sync with members.html.

export const CLAIMABLE = {
  'sparlay.khan@learningplanetinstitute.org': {
    id: 'sparlay-khan',
    name: "Sparlay Khan",
    role: "Manager · Pakistan",
    summary: "Member since 2025, with an interest in environmental studies, exploring nature, and travelling.",
    tags: ["Environmental studies", "Exploring nature", "Travelling"],
    photoPath: './assets/member-sparlay-khan.jpeg'
  },
  'zixuan.gui@learningplanetinstitute.org': {
    id: 'zixuan-gui',
    name: "Zixuan Gui",
    role: "Volunteer · China",
    summary: "A sports enthusiast and ski instructor with a background in computer science.",
    tags: ["Chinese/English", "Ski", "Coding"],
    photoPath: './assets/member-zixuan-gui.jpeg'
  },
  'matijevictamara@yahoo.com': {
    id: 'tamara-matijevic',
    name: "Tamara Matijević",
    role: "Community member · Serbia",
    summary: "Interested in neuroscience and molecular biology.",
    tags: ["English / French / Serbian", "Neuroscience", "Molecular biology"],
    photoPath: './assets/member-tamara-matijevic.jpeg'
  },
  'alessio.saturnino@pasteur.fr': {
    id: 'alessio-saturnino',
    name: "Alessio SATURNINO",
    role: "Community member · Italy",
    summary: "A molecular biologist interested in cancer epigenetics, nature, and poetry. Reach out for any fun activity!",
    tags: ["Italian / English / French / Spanish", "Running 🏃 / Strava", "Gym", "Basketball / Volleyball", "Techno / EDM", "Reggaeton / Latin house", "Commercial music"],
    photoPath: './assets/member-alessio-saturnino.jpeg'
  },
  'amirmohammad.cheraghali@learningplanetinstitute.org': {
    id: 'amir-cheraghali',
    name: "Amir M. Cheraghali",
    role: "Community member",
    summary: "Enjoys hiking, football and playing the piano.",
    tags: ["Hiking", "Football", "Piano"],
    photoPath: './assets/member-amir-cheraghali.png'
  },
  'meghna.varma@learningplanetinstitute.org': {
    id: 'meghna-varma',
    name: "Meghna Varma",
    role: "Community member",
    summary: "An astrophysicist interested in gender equality in STEM, science education and communication.",
    tags: ["Astrophysics", "Gender equality in STEM", "Science communication", "Music", "Dance", "Basketball", "Reading"],
    photoPath: './assets/member-meghna-varma.jpeg'
  },
};

const BY_EMAIL = new Map(Object.entries(CLAIMABLE).map(([email, p]) => [email.toLowerCase(), p]));

export function findClaimableByEmail(email) {
  return BY_EMAIL.get(String(email || '').toLowerCase()) || null;
}

const BY_ID = new Map(Object.values(CLAIMABLE).map((p) => [p.id, p]));

export function findClaimableById(id) {
  return BY_ID.get(String(id || '')) || null;
}
