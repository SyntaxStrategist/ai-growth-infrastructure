/**
 * Industry Translation Helper for French Localization
 * Provides English → French translations for industry/sector names
 * with proper capitalization
 */

// Comprehensive industry translation dictionary (English → French)
const INDUSTRY_TRANSLATIONS: Record<string, string> = {
  // Technology & Digital
  'Technology': 'Technologie',
  'Software': 'Logiciel',
  'IT': 'Informatique',
  'Digital': 'Numérique',
  'E-commerce': 'Commerce électronique',
  'SaaS': 'Logiciel en tant que service',
  'Fintech': 'Technologie financière',
  'Edtech': 'Technologie éducative',
  'Healthtech': 'Technologie de la santé',
  'Cleantech': 'Technologie propre',
  'AI': 'Intelligence artificielle',
  'Machine Learning': 'Apprentissage automatique',
  'Data Science': 'Science des données',
  'Cybersecurity': 'Cybersécurité',
  'Blockchain': 'Chaîne de blocs',
  'IoT': 'Internet des objets',
  'Cloud': 'Cloud',
  'DevOps': 'Développement et opérations',
  'Mobile': 'Mobile',
  'Web Development': 'Développement web',
  'Game Development': 'Développement de jeux',
  'AR/VR': 'Réalité augmentée/virtuelle',
  'Robotics': 'Robotique',
  'Automation': 'Automatisation',
  
  // Business & Professional Services
  'Marketing': 'Marketing',
  'Advertising': 'Publicité',
  'Digital Marketing': 'Marketing numérique',
  'Content Marketing': 'Marketing de contenu',
  'Social Media': 'Médias sociaux',
  'SEO': 'Optimisation pour les moteurs de recherche',
  'PPC': 'Publicité au clic',
  'Email Marketing': 'Marketing par e-mail',
  'Influencer Marketing': 'Marketing d\'influence',
  'Branding': 'Image de marque',
  'PR': 'Relations publiques',
  'Sales': 'Ventes',
  'Business Development': 'Développement commercial',
  'Consulting': 'Conseil',
  'Management Consulting': 'Conseil en gestion',
  'Strategy Consulting': 'Conseil en stratégie',
  'IT Consulting': 'Conseil en informatique',
  'HR': 'Ressources humaines',
  'Recruitment': 'Recrutement',
  'Training': 'Formation',
  'Coaching': 'Coaching',
  'Project Management': 'Gestion de projet',
  'Operations': 'Opérations',
  'Supply Chain': 'Chaîne d\'approvisionnement',
  'Logistics': 'Logistique',
  'Procurement': 'Achats',
  'Quality Assurance': 'Assurance qualité',
  'Compliance': 'Conformité',
  'Legal': 'Juridique',
  'Law': 'Droit',
  'Intellectual Property': 'Propriété intellectuelle',
  'Corporate Law': 'Droit des sociétés',
  'Tax': 'Fiscal',
  'Accounting': 'Comptabilité',
  'Audit': 'Audit',
  'Finance': 'Finance',
  'Investment': 'Investissement',
  'Banking': 'Banque',
  'Insurance': 'Assurance',
  'Real Estate': 'Immobilier',
  'Property Management': 'Gestion immobilière',
  'Architecture': 'Architecture',
  'Engineering': 'Ingénierie',
  'Civil Engineering': 'Génie civil',
  'Mechanical Engineering': 'Génie mécanique',
  'Electrical Engineering': 'Génie électrique',
  'Chemical Engineering': 'Génie chimique',
  'Environmental Engineering': 'Génie environnemental',
  
  // Healthcare & Life Sciences
  'Healthcare': 'Santé',
  'Medical': 'Médical',
  'Pharmaceutical': 'Pharmaceutique',
  'Biotech': 'Biotechnologie',
  'Biotechnology': 'Biotechnologie',
  'biotechnology': 'Biotechnologie',
  'Life Sciences': 'Sciences de la vie',
  'Medical Devices': 'Dispositifs médicaux',
  'Telemedicine': 'Télémédecine',
  'Mental Health': 'Santé mentale',
  'Dental': 'Dentaire',
  'Veterinary': 'Vétérinaire',
  'Fitness': 'Fitness',
  'Wellness': 'Bien-être',
  'Nutrition': 'Nutrition',
  'Alternative Medicine': 'Médecine alternative',
  
  // Education & Training
  'Education': 'Éducation',
  'E-learning': 'Apprentissage en ligne',
  'Online Education': 'Éducation en ligne',
  'Professional Development': 'Développement professionnel',
  'Corporate Training': 'Formation d\'entreprise',
  'Language Learning': 'Apprentissage des langues',
  'Vocational Training': 'Formation professionnelle',
  'Higher Education': 'Enseignement supérieur',
  'K-12': 'Éducation primaire et secondaire',
  'Early Childhood': 'Petite enfance',
  'Special Education': 'Éducation spécialisée',
  'Research': 'Recherche',
  'Academic': 'Académique',
  'Publishing': 'Édition',
  'Media': 'Médias',
  'Journalism': 'Journalisme',
  'Broadcasting': 'Radiodiffusion',
  'Entertainment': 'Divertissement',
  'Film': 'Cinéma',
  'Television': 'Télévision',
  'Music': 'Musique',
  'Gaming': 'Jeux vidéo',
  'Sports': 'Sports',
  'Recreation': 'Loisirs',
  'Travel': 'Voyage',
  'Tourism': 'Tourisme',
  'Hospitality': 'Hôtellerie',
  'Restaurant': 'Restauration',
  'Food & Beverage': 'Alimentation et boissons',
  'Catering': 'Traiteur',
  'Event Planning': 'Planification d\'événements',
  'Events': 'Événements',
  'Services': 'Services',
  'Information Technology': 'Technologie de l\'information',
  'Information Technology and Services': 'Technologie de l\'information et services',
  'Marketing and Advertising': 'Marketing et Publicité',
  'Wedding Planning': 'Planification de mariage',
  'Conference': 'Conférence',
  'Exhibition': 'Exposition',
  'Trade Show': 'Salon professionnel',
  
  // Manufacturing & Industrial
  'Manufacturing': 'Fabrication',
  'Industrial': 'Industriel',
  'Automotive': 'Automobile',
  'Aerospace': 'Aérospatial',
  'Defense': 'Défense',
  'Marine': 'Marine',
  'Railway': 'Chemin de fer',
  'Aviation': 'Aviation',
  'Shipping': 'Transport maritime',
  'Transportation': 'Transport',
  'Warehousing': 'Entreposage',
  'Distribution': 'Distribution',
  'Retail': 'Commerce de détail',
  'Wholesale': 'Commerce de gros',
  'Fashion': 'Mode',
  'Apparel': 'Vêtements',
  'Textiles': 'Textiles',
  'Footwear': 'Chaussures',
  'Jewelry': 'Bijoux',
  'Luxury': 'Luxe',
  'Beauty': 'Beauté',
  'Cosmetics': 'Cosmétiques',
  'Personal Care': 'Soins personnels',
  'Home & Garden': 'Maison et jardin',
  'Furniture': 'Mobilier',
  'Interior Design': 'Design d\'intérieur',
  'Construction': 'Construction',
  'Building': 'Bâtiment',
  'Contracting': 'Entrepreneuriat',
  'Renovation': 'Rénovation',
  'Plumbing': 'Plomberie',
  'Electrical': 'Électricité',
  'HVAC': 'Chauffage, ventilation et climatisation',
  'Roofing': 'Toiture',
  'Landscaping': 'Aménagement paysager',
  'Cleaning': 'Nettoyage',
  'Maintenance': 'Maintenance',
  'Repair': 'Réparation',
  'Home Services': 'Services à domicile',
  'Moving': 'Déménagement',
  'Storage': 'Stockage',
  'Security': 'Sécurité',
  'Surveillance': 'Surveillance',
  'Locksmith': 'Serrurier',
  'Pest Control': 'Lutte antiparasitaire',
  
  // Energy & Environment
  'Energy': 'Énergie',
  'Oil & Gas': 'Pétrole et gaz',
  'Renewable Energy': 'Énergie renouvelable',
  'Solar': 'Solaire',
  'Wind': 'Éolien',
  'Hydroelectric': 'Hydroélectrique',
  'Nuclear': 'Nucléaire',
  'Coal': 'Charbon',
  'Utilities': 'Services publics',
  'Water': 'Eau',
  'Waste Management': 'Gestion des déchets',
  'Recycling': 'Recyclage',
  'Environmental': 'Environnemental',
  'Sustainability': 'Durabilité',
  'Green Technology': 'Technologie verte',
  'Carbon': 'Carbone',
  'Climate': 'Climat',
  
  // Agriculture & Food
  'Agriculture': 'Agriculture',
  'Farming': 'Agriculture',
  'Livestock': 'Élevage',
  'Dairy': 'Laitier',
  'Poultry': 'Volaille',
  'Crops': 'Cultures',
  'Organic': 'Biologique',
  'Food Production': 'Production alimentaire',
  'Food Processing': 'Transformation alimentaire',
  'Beverage': 'Boisson',
  'Wine': 'Vin',
  'Brewing': 'Brassage',
  'Distilling': 'Distillation',
  'Food Service': 'Service alimentaire',
  'Grocery': 'Épicerie',
  'Supermarket': 'Supermarché',
  'Convenience Store': 'Dépanneur',
  'Specialty Food': 'Alimentation spécialisée',
  'Organic Food': 'Alimentation biologique',
  'Health Food': 'Alimentation santé',
  'Supplements': 'Compléments',
  'Vitamins': 'Vitamines',
  'Herbs': 'Herbes',
  'Spices': 'Épices',
  
  // Non-profit & Government
  'Non-profit': 'Organisme sans but lucratif',
  'NGO': 'Organisation non gouvernementale',
  'Charity': 'Organisme de bienfaisance',
  'Foundation': 'Fondation',
  'Government': 'Gouvernement',
  'Public Sector': 'Secteur public',
  'Military': 'Militaire',
  'Intelligence': 'Renseignement',
  'Diplomacy': 'Diplomatie',
  'International Relations': 'Relations internationales',
  'Public Policy': 'Politique publique',
  'Public Administration': 'Administration publique',
  'Civil Service': 'Fonction publique',
  'Municipal': 'Municipal',
  'Urban Planning': 'Planification urbaine',
  'Community Development': 'Développement communautaire',
  'Social Services': 'Services sociaux',
  'Childcare': 'Garde d\'enfants',
  'Elderly Care': 'Soins aux personnes âgées',
  'Disability Services': 'Services aux personnes handicapées',
  'Housing': 'Logement',
  'Homeless Services': 'Services aux sans-abri',
  'Immigration': 'Immigration',
  'Refugee Services': 'Services aux réfugiés',
  'Emergency Services': 'Services d\'urgence',
  'Fire': 'Pompiers',
  'Police': 'Police',
  'EMS': 'Services médicaux d\'urgence',
  'Disaster Relief': 'Secours en cas de catastrophe',
  
  // Creative & Arts
  'Creative': 'Créatif',
  'Design': 'Design',
  'Graphic Design': 'Design graphique',
  'Web Design': 'Design web',
  'UI/UX': 'Interface utilisateur/expérience utilisateur',
  'Product Design': 'Design de produit',
  'Industrial Design': 'Design industriel',
  'Fashion Design': 'Design de mode',
  'Landscape Architecture': 'Architecture paysagère',
  'Urban Design': 'Design urbain',
  'Art': 'Art',
  'Fine Arts': 'Beaux-arts',
  'Visual Arts': 'Arts visuels',
  'Performing Arts': 'Arts du spectacle',
  'Theater': 'Théâtre',
  'Dance': 'Danse',
  'Photography': 'Photographie',
  'Videography': 'Vidéographie',
  'Film Production': 'Production cinématographique',
  'Animation': 'Animation',
  'Game Design': 'Design de jeux',
  'Writing': 'Écriture',
  'Copywriting': 'Rédaction publicitaire',
  'Content Writing': 'Rédaction de contenu',
  'Technical Writing': 'Rédaction technique',
  'Translation': 'Traduction',
  'Editing': 'Édition',
  'Proofreading': 'Correction d\'épreuves',
  'Book Publishing': 'Édition de livres',
  'Magazine': 'Magazine',
  'Newspaper': 'Journal',
  'Blogging': 'Blog',
  'Podcasting': 'Podcast',
  'Radio': 'Radio',
  'Streaming': 'Diffusion en continu',
  'Influencer': 'Influenceur',
  'Public Relations': 'Relations publiques',
  'Event Management': 'Gestion d\'événements',
  'Party Planning': 'Planification de fête',
  'Museum': 'Musée',
  'Gallery': 'Galerie',
  'Cultural': 'Culturel',
  'Heritage': 'Patrimoine',
  'Adventure': 'Aventure',
  'Eco-tourism': 'Écotourisme',
  'Luxury Travel': 'Voyage de luxe',
  'Business Travel': 'Voyage d\'affaires',
  'Leisure': 'Loisirs',
  'Spa': 'Spa',
  'Salon': 'Salon',
  'Barbershop': 'Barbier',
  'Nail Salon': 'Salon d\'ongles',
  'Massage': 'Massage',
  'Yoga': 'Yoga',
  'Pilates': 'Pilates',
  'Martial Arts': 'Arts martiaux',
  'Dance Studio': 'Studio de danse',
  'Gym': 'Salle de sport',
  'Personal Training': 'Entraînement personnel',
  'Dietitian': 'Diététiste',
  'Life Coaching': 'Coaching de vie',
  'Career Coaching': 'Coaching de carrière',
  'Business Coaching': 'Coaching d\'entreprise',
  'Executive Coaching': 'Coaching exécutif',
  'Leadership': 'Leadership',
  'Team Building': 'Renforcement d\'équipe',
  'Motivational Speaking': 'Conférences motivationnelles',
  'Public Speaking': 'Prise de parole en public',
  'Presentation': 'Présentation',
  'Workshop': 'Atelier',
  'Seminar': 'Séminaire',
  'Webinar': 'Webinaire',
  'Online Course': 'Cours en ligne',
  'Educational': 'Éducatif',
  'Scientific': 'Scientifique',
  'Laboratory': 'Laboratoire',
  'Testing': 'Test',
  'Quality Control': 'Contrôle qualité',
  'Inspection': 'Inspection',
  'Certification': 'Certification',
  'Standards': 'Normes',
  'Regulatory': 'Réglementaire',
  'Risk Management': 'Gestion des risques',
  'Actuarial': 'Actuariel',
  'Underwriting': 'Souscription',
  'Claims': 'Réclamations',
  'Brokerage': 'Courtage',
  'Portfolio Management': 'Gestion de portefeuille',
  'Wealth Management': 'Gestion de patrimoine',
  'Financial Planning': 'Planification financière',
  'Tax Services': 'Services fiscaux',
  'Bookkeeping': 'Tenue de livres',
  'Payroll': 'Paie',
  'Forensic': 'Judiciaire',
  'Valuation': 'Évaluation',
  'Merger & Acquisition': 'Fusion et acquisition',
  'Corporate Finance': 'Finance d\'entreprise',
  'Investment Banking': 'Banque d\'investissement',
  'Private Equity': 'Capital-investissement',
  'Venture Capital': 'Capital-risque',
  'Hedge Fund': 'Fonds spéculatif',
  'Mutual Fund': 'Fonds commun de placement',
  'ETF': 'Fonds négocié en bourse',
  'Trading': 'Négociation',
  'Securities': 'Valeurs mobilières',
  'Commodities': 'Matières premières',
  'Foreign Exchange': 'Change',
  'Derivatives': 'Dérivés',
  'Options': 'Options',
  'Futures': 'Contrats à terme',
  'Bonds': 'Obligations',
  'Equity': 'Actions',
  'Debt': 'Dette',
  'Credit': 'Crédit',
  'Lending': 'Prêt',
  'Mortgage': 'Hypothèque',
  'Property': 'Propriété',
  'Commercial Real Estate': 'Immobilier commercial',
  'Residential Real Estate': 'Immobilier résidentiel',
  'Industrial Real Estate': 'Immobilier industriel',
  'Retail Real Estate': 'Immobilier de détail',
  'Hospitality Real Estate': 'Immobilier hôtelier',
  'Property Development': 'Développement immobilier',
  'Facilities Management': 'Gestion d\'installations',
  'Asset Management': 'Gestion d\'actifs',
  'Property Valuation': 'Évaluation immobilière',
  'Real Estate Brokerage': 'Courtage immobilier',
  'Real Estate Investment': 'Investissement immobilier',
  'REIT': 'Fiducie de placement immobilier',
  'General Contracting': 'Entrepreneur général',
  'Subcontracting': 'Sous-traitance',
  'Specialty Contracting': 'Entrepreneur spécialisé',
  'Residential Construction': 'Construction résidentielle',
  'Commercial Construction': 'Construction commerciale',
  'Industrial Construction': 'Construction industrielle',
  'Infrastructure': 'Infrastructure',
  'Structural Engineering': 'Génie structural',
  'Flooring': 'Revêtement de sol',
  'Painting': 'Peinture',
  'Drywall': 'Cloison sèche',
  'Carpentry': 'Menuiserie',
  'Masonry': 'Maçonnerie',
  'Concrete': 'Béton',
  'Steel': 'Acier',
  'Glass': 'Verre',
  'Aluminum': 'Aluminium',
  'Wood': 'Bois',
  'Plastic': 'Plastique',
  'Composite': 'Composite',
  'Fiberglass': 'Fibre de verre',
  'Carbon Fiber': 'Fibre de carbone',
  'Ceramics': 'Céramique',
  'Metals': 'Métaux',
  'Mining': 'Exploitation minière',
  'Petroleum': 'Pétrole',
  'Natural Gas': 'Gaz naturel',
  'Uranium': 'Uranium',
  'Gold': 'Or',
  'Silver': 'Argent',
  'Copper': 'Cuivre',
  'Iron': 'Fer',
  'Zinc': 'Zinc',
  'Lead': 'Plomb',
  'Nickel': 'Nickel',
  'Tin': 'Étain',
  'Platinum': 'Platine',
  'Palladium': 'Palladium',
  'Diamonds': 'Diamants',
  'Gemstones': 'Pierres précieuses',
  'Precious Metals': 'Métaux précieux',
  'Base Metals': 'Métaux de base',
  'Rare Earth': 'Terre rare',
  'Lithium': 'Lithium',
  'Cobalt': 'Cobalt',
  'Manganese': 'Manganèse',
  'Chromium': 'Chrome',
  'Titanium': 'Titane',
  'Vanadium': 'Vanadium',
  'Molybdenum': 'Molybdène',
  'Tungsten': 'Tungstène',
  'Tantalum': 'Tantale',
  'Niobium': 'Niobium',
  'Rhenium': 'Rhénium',
  'Osmium': 'Osmium',
  'Iridium': 'Iridium',
  'Ruthenium': 'Ruthénium',
  'Rhodium': 'Rhodium',
  'Mercury': 'Mercure',
  'Cadmium': 'Cadmium',
  'Arsenic': 'Arsenic',
  'Antimony': 'Antimoine',
  'Bismuth': 'Bismuth',
  'Selenium': 'Sélénium',
  'Tellurium': 'Tellure',
  'Polonium': 'Polonium',
  'Astatine': 'Astate',
  'Radon': 'Radon',
  'Francium': 'Francium',
  'Radium': 'Radium',
  'Actinium': 'Actinium',
  'Thorium': 'Thorium',
  'Protactinium': 'Protactinium',
  'Neptunium': 'Neptunium',
  'Plutonium': 'Plutonium',
  'Americium': 'Américium',
  'Curium': 'Curium',
  'Berkelium': 'Berkélium',
  'Californium': 'Californium',
  'Einsteinium': 'Einsteinium',
  'Fermium': 'Fermium',
  'Mendelevium': 'Mendélévium',
  'Nobelium': 'Nobélium',
  'Lawrencium': 'Lawrencium',
  'Rutherfordium': 'Rutherfordium',
  'Dubnium': 'Dubnium',
  'Seaborgium': 'Seaborgium',
  'Bohrium': 'Bohrium',
  'Hassium': 'Hassium',
  'Meitnerium': 'Meitnerium',
  'Darmstadtium': 'Darmstadtium',
  'Roentgenium': 'Roentgenium',
  'Copernicium': 'Copernicium',
  'Nihonium': 'Nihonium',
  'Flerovium': 'Flerovium',
  'Moscovium': 'Moscovium',
  'Livermorium': 'Livermorium',
  'Tennessine': 'Tennessine',
  'Oganesson': 'Oganesson'
};

// Keyword-based translation patterns for compound phrases
const KEYWORD_PATTERNS: Record<string, string> = {
  'marketing': 'Marketing',
  'advertising': 'Publicité',
  'technology': 'Technologie',
  'information technology': 'Technologie de l\'information',
  'it': 'Informatique',
  'services': 'Services',
  'events': 'Événements',
  'event': 'Événement',
  'real estate': 'Immobilier',
  'construction': 'Construction',
  'healthcare': 'Santé',
  'medical': 'Médical',
  'finance': 'Finance',
  'legal': 'Juridique',
  'education': 'Éducation',
  'consulting': 'Conseil',
  'engineering': 'Ingénierie',
  'manufacturing': 'Fabrication',
  'retail': 'Commerce de détail',
  'hospitality': 'Hôtellerie',
  'tourism': 'Tourisme',
  'travel': 'Voyage',
  'entertainment': 'Divertissement',
  'media': 'Médias',
  'publishing': 'Édition',
  'design': 'Design',
  'art': 'Art',
  'sports': 'Sports',
  'fitness': 'Fitness',
  'wellness': 'Bien-être',
  'beauty': 'Beauté',
  'fashion': 'Mode',
  'food': 'Alimentation',
  'beverage': 'Boisson',
  'restaurant': 'Restauration',
  'automotive': 'Automobile',
  'transportation': 'Transport',
  'logistics': 'Logistique',
  'energy': 'Énergie',
  'environmental': 'Environnemental',
  'agriculture': 'Agriculture',
  'government': 'Gouvernement',
  'non-profit': 'Organisme sans but lucratif',
  'charity': 'Organisme de bienfaisance'
};

// Common conjunctions and connectors
const CONJUNCTIONS = ['and', 'et', '&', '+', 'plus', 'with', 'avec'];

/**
 * Translates an industry name from English to French with intelligent compound and plural handling
 * @param value - The industry name to translate
 * @returns The translated and properly capitalized industry name
 */
export function translateIndustry(value: string): string {
  if (!value || typeof value !== 'string') {
    return 'N/A';
  }

  // Trim whitespace and normalize
  const normalizedValue = value.trim();
  
  // Check for exact match first
  if (INDUSTRY_TRANSLATIONS[normalizedValue]) {
    return INDUSTRY_TRANSLATIONS[normalizedValue];
  }

  // Check for case-insensitive match
  const lowerValue = normalizedValue.toLowerCase();
  for (const [english, french] of Object.entries(INDUSTRY_TRANSLATIONS)) {
    if (english.toLowerCase() === lowerValue) {
      return french;
    }
  }

  // Handle compound phrases with conjunctions
  const compoundResult = translateCompoundPhrase(normalizedValue);
  if (compoundResult !== normalizedValue) {
    return compoundResult;
  }

  // Handle plural forms
  const pluralResult = translatePluralForm(normalizedValue);
  if (pluralResult !== normalizedValue) {
    return pluralResult;
  }

  // Handle keyword-based matching for compound terms
  const keywordResult = translateByKeywords(normalizedValue);
  if (keywordResult !== normalizedValue) {
    return keywordResult;
  }

  // If no translation found, return the original value with proper capitalization
  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1).toLowerCase();
}

/**
 * Translates compound phrases with conjunctions like "Marketing and Advertising"
 */
function translateCompoundPhrase(value: string): string {
  const lowerValue = value.toLowerCase();
  
  // Split by common conjunctions
  for (const conjunction of CONJUNCTIONS) {
    if (lowerValue.includes(` ${conjunction} `)) {
      const parts = lowerValue.split(` ${conjunction} `);
      if (parts.length === 2) {
        const part1 = parts[0].trim();
        const part2 = parts[1].trim();
        
        // Translate each part
        const translatedPart1 = translateSingleTerm(part1);
        const translatedPart2 = translateSingleTerm(part2);
        
        // Use appropriate French conjunction
        const frenchConjunction = conjunction === 'and' || conjunction === '&' ? 'et' : conjunction;
        
        return `${translatedPart1} ${frenchConjunction} ${translatedPart2}`;
      }
    }
  }
  
  return value;
}

/**
 * Translates plural forms by removing 's' and translating the singular form
 */
function translatePluralForm(value: string): string {
  const lowerValue = value.toLowerCase();
  
  // Handle common plural patterns
  if (lowerValue.endsWith('s') && lowerValue.length > 3) {
    const singular = lowerValue.slice(0, -1);
    
    // Check if the singular form has a translation
    if (INDUSTRY_TRANSLATIONS[singular]) {
      return INDUSTRY_TRANSLATIONS[singular];
    }
    
    // Check case-insensitive match for singular
    for (const [english, french] of Object.entries(INDUSTRY_TRANSLATIONS)) {
      if (english.toLowerCase() === singular) {
        return french;
      }
    }
    
    // Check keyword patterns for singular
    if (KEYWORD_PATTERNS[singular]) {
      return KEYWORD_PATTERNS[singular];
    }
  }
  
  return value;
}

/**
 * Translates using keyword-based matching for compound terms
 */
function translateByKeywords(value: string): string {
  const lowerValue = value.toLowerCase();
  
  // Check for keyword patterns
  for (const [keyword, translation] of Object.entries(KEYWORD_PATTERNS)) {
    if (lowerValue.includes(keyword)) {
      // If the value contains the keyword, try to build a compound translation
      const parts = lowerValue.split(' ');
      const translatedParts: string[] = [];
      
      for (const part of parts) {
        if (KEYWORD_PATTERNS[part]) {
          translatedParts.push(KEYWORD_PATTERNS[part]);
        } else if (INDUSTRY_TRANSLATIONS[part]) {
          translatedParts.push(INDUSTRY_TRANSLATIONS[part]);
        } else {
          // Keep original part with proper capitalization
          translatedParts.push(part.charAt(0).toUpperCase() + part.slice(1));
        }
      }
      
      return translatedParts.join(' ');
    }
  }
  
  return value;
}

/**
 * Translates a single term using all available methods
 */
function translateSingleTerm(term: string): string {
  const trimmedTerm = term.trim();
  
  // Check exact match
  if (INDUSTRY_TRANSLATIONS[trimmedTerm]) {
    return INDUSTRY_TRANSLATIONS[trimmedTerm];
  }
  
  // Check case-insensitive match
  const lowerTerm = trimmedTerm.toLowerCase();
  for (const [english, french] of Object.entries(INDUSTRY_TRANSLATIONS)) {
    if (english.toLowerCase() === lowerTerm) {
      return french;
    }
  }
  
  // Check keyword patterns
  if (KEYWORD_PATTERNS[lowerTerm]) {
    return KEYWORD_PATTERNS[lowerTerm];
  }
  
  // Return with proper capitalization
  return trimmedTerm.charAt(0).toUpperCase() + trimmedTerm.slice(1).toLowerCase();
}

/**
 * Gets all available industry translations
 * @returns Object with English → French industry translations
 */
export function getIndustryTranslations(): Record<string, string> {
  return { ...INDUSTRY_TRANSLATIONS };
}

/**
 * Checks if an industry has a French translation
 * @param value - The industry name to check
 * @returns True if a translation exists, false otherwise
 */
export function hasIndustryTranslation(value: string): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }

  const normalizedValue = value.trim();
  
  // Check exact match
  if (INDUSTRY_TRANSLATIONS[normalizedValue]) {
    return true;
  }

  // Check case-insensitive match
  const lowerValue = normalizedValue.toLowerCase();
  return Object.keys(INDUSTRY_TRANSLATIONS).some(
    key => key.toLowerCase() === lowerValue
  );
}