import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy',
    description: locale === 'fr' 
      ? 'Politique de confidentialité d\'Avenir AI Solutions conforme à la LPRPDE'
      : 'Avenir AI Solutions Privacy Policy compliant with PIPEDA',
  };
}

export default async function PrivacyPolicy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {locale === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy'}
            </h1>
            <p className="text-xl text-gray-600">
              {locale === 'fr' 
                ? 'Dernière mise à jour: 22 octobre 2025'
                : 'Last updated: October 22, 2025'
              }
            </p>
          </div>

          <div className="prose prose-lg max-w-none">
            {locale === 'fr' ? (
              <>
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Avenir AI Solutions (« nous », « notre », « nos ») s'engage à protéger votre vie privée. 
                    Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons 
                    et protégeons vos informations personnelles conformément à la Loi sur la protection des 
                    renseignements personnels et les documents électroniques (LPRPDE) du Canada.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Informations que nous collectons</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Informations personnelles</h3>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Nom et adresse e-mail</li>
                    <li>Informations de contact professionnel</li>
                    <li>Messages et communications</li>
                    <li>Préférences linguistiques</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Informations techniques</h3>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Adresse IP et données de navigation</li>
                    <li>Cookies et technologies similaires</li>
                    <li>Données d'utilisation de l'IA</li>
                    <li>Métriques de performance</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation des informations</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Nous utilisons vos informations personnelles pour :
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Fournir et améliorer nos services d'IA</li>
                    <li>Analyser l'intention et l'urgence des leads</li>
                    <li>Personnaliser les communications</li>
                    <li>Respecter nos obligations légales</li>
                    <li>Améliorer la sécurité et prévenir la fraude</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Partage des informations</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Nous ne vendons jamais vos informations personnelles. Nous pouvons partager vos informations 
                    uniquement dans les cas suivants :
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Avec votre consentement explicite</li>
                    <li>Pour respecter une obligation légale</li>
                    <li>Avec nos fournisseurs de services (sous contrat de confidentialité)</li>
                    <li>En cas de fusion ou d'acquisition (avec notification préalable)</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Vos droits</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Conformément à la LPRPDE, vous avez le droit de :
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Accéder à vos informations personnelles</li>
                    <li>Demander la correction d'informations inexactes</li>
                    <li>Retirer votre consentement</li>
                    <li>Déposer une plainte auprès du Commissaire à la protection de la vie privée</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Sécurité</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Nous mettons en place des mesures de sécurité appropriées pour protéger vos informations 
                    personnelles contre l'accès non autorisé, la modification, la divulgation ou la destruction. 
                    Cela inclut le chiffrement des données, l'authentification à deux facteurs et des audits 
                    de sécurité réguliers.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Conservation des données</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Nous conservons vos informations personnelles aussi longtemps que nécessaire pour les 
                    finalités décrites dans cette politique, ou conformément aux exigences légales. 
                    Les données sont automatiquement supprimées après 7 ans d'inactivité.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Pour toute question concernant cette politique de confidentialité ou vos informations 
                    personnelles, contactez-nous :
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700"><strong>E-mail :</strong> contact@aveniraisolutions.ca</p>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Avenir AI Solutions ("we", "our", "us") is committed to protecting your privacy. 
                    This privacy policy explains how we collect, use, disclose, and protect your personal 
                    information in accordance with Canada's Personal Information Protection and Electronic 
                    Documents Act (PIPEDA).
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Personal Information</h3>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Name and email address</li>
                    <li>Professional contact information</li>
                    <li>Messages and communications</li>
                    <li>Language preferences</li>
                  </ul>
                  
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Technical Information</h3>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>IP address and browsing data</li>
                    <li>Cookies and similar technologies</li>
                    <li>AI usage data</li>
                    <li>Performance metrics</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Information</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We use your personal information to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Provide and improve our AI services</li>
                    <li>Analyze lead intent and urgency</li>
                    <li>Personalize communications</li>
                    <li>Comply with legal obligations</li>
                    <li>Enhance security and prevent fraud</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Information Sharing</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We never sell your personal information. We may share your information only in the 
                    following circumstances:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>With your explicit consent</li>
                    <li>To comply with legal obligations</li>
                    <li>With our service providers (under confidentiality agreements)</li>
                    <li>In case of merger or acquisition (with prior notice)</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Your Rights</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Under PIPEDA, you have the right to:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Access your personal information</li>
                    <li>Request correction of inaccurate information</li>
                    <li>Withdraw your consent</li>
                    <li>File a complaint with the Privacy Commissioner</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Security</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We implement appropriate security measures to protect your personal information from 
                    unauthorized access, alteration, disclosure, or destruction. This includes data encryption, 
                    two-factor authentication, and regular security audits.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We retain your personal information for as long as necessary for the purposes described 
                    in this policy, or as required by law. Data is automatically deleted after 7 years of inactivity.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    For any questions about this privacy policy or your personal information, contact us:
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700"><strong>Email:</strong> contact@aveniraisolutions.ca</p>
                  </div>
                </section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
