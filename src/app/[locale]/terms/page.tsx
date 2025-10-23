import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === 'fr' ? 'Conditions d\'Utilisation' : 'Terms of Service',
    description: locale === 'fr' 
      ? 'Conditions d\'utilisation d\'Avenir AI Solutions'
      : 'Avenir AI Solutions Terms of Service',
  };
}

export default async function TermsOfService({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {locale === 'fr' ? 'Conditions d\'Utilisation' : 'Terms of Service'}
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptation des Conditions</h2>
                  <p className="text-gray-700 leading-relaxed">
                    En accédant et en utilisant les services d'Avenir AI Solutions, vous acceptez d'être 
                    lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, 
                    veuillez ne pas utiliser nos services.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description des Services</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Avenir AI Solutions fournit une infrastructure de croissance IA complète, incluant :
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Analyse d'intention et d'urgence des leads</li>
                    <li>Personnalisation des communications</li>
                    <li>Intelligence de prospection</li>
                    <li>Automatisation des campagnes de marketing</li>
                    <li>Tableaux de bord analytiques</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Utilisation Acceptable</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Vous vous engagez à utiliser nos services uniquement à des fins légales et conformément 
                    à ces conditions. Il est interdit de :
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Utiliser nos services pour des activités illégales</li>
                    <li>Tenter de contourner les mesures de sécurité</li>
                    <li>Partager vos identifiants de connexion</li>
                    <li>Utiliser nos services pour envoyer du spam</li>
                    <li>Violer les droits de propriété intellectuelle</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Propriété Intellectuelle</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Tous les droits de propriété intellectuelle relatifs à nos services, y compris mais 
                    sans s'y limiter, les logiciels, algorithmes, et contenus, restent la propriété 
                    exclusive d'Avenir AI Solutions. Vous ne pouvez pas copier, modifier, ou distribuer 
                    nos services sans autorisation écrite.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation de Responsabilité</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Dans la mesure permise par la loi, Avenir AI Solutions ne sera pas responsable des 
                    dommages indirects, accessoires, spéciaux, ou consécutifs résultant de l'utilisation 
                    de nos services. Notre responsabilité totale ne dépassera pas le montant payé pour 
                    les services au cours des 12 derniers mois.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Modification des Services</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Nous nous réservons le droit de modifier, suspendre ou interrompre nos services à 
                    tout moment, avec ou sans préavis. Nous ne serons pas responsables envers vous 
                    ou tout tiers pour toute modification, suspension ou interruption des services.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Résiliation</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Nous pouvons résilier ou suspendre votre accès à nos services immédiatement, 
                    sans préavis, pour toute violation de ces conditions. Vous pouvez résilier 
                    votre compte à tout moment en nous contactant.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Loi Applicable</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Ces conditions sont régies par les lois de la province de l'Ontario, Canada. 
                    Tout litige sera soumis à la juridiction exclusive des tribunaux de l'Ontario.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Pour toute question concernant ces conditions d'utilisation :
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700"><strong>E-mail :</strong> contact@aveniraisolutions.ca</p>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
                  <p className="text-gray-700 leading-relaxed">
                    By accessing and using Avenir AI Solutions services, you agree to be bound by these 
                    terms of service. If you do not agree to these terms, please do not use our services.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Description of Services</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Avenir AI Solutions provides a complete AI growth infrastructure, including:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Lead intent and urgency analysis</li>
                    <li>Communication personalization</li>
                    <li>Prospect intelligence</li>
                    <li>Marketing campaign automation</li>
                    <li>Analytics dashboards</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Acceptable Use</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You agree to use our services only for lawful purposes and in accordance with these 
                    terms. You may not:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li>Use our services for illegal activities</li>
                    <li>Attempt to circumvent security measures</li>
                    <li>Share your login credentials</li>
                    <li>Use our services to send spam</li>
                    <li>Violate intellectual property rights</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Intellectual Property</h2>
                  <p className="text-gray-700 leading-relaxed">
                    All intellectual property rights in our services, including but not limited to 
                    software, algorithms, and content, remain the exclusive property of Avenir AI Solutions. 
                    You may not copy, modify, or distribute our services without written permission.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Limitation of Liability</h2>
                  <p className="text-gray-700 leading-relaxed">
                    To the extent permitted by law, Avenir AI Solutions shall not be liable for any 
                    indirect, incidental, special, or consequential damages resulting from the use of 
                    our services. Our total liability shall not exceed the amount paid for services 
                    in the past 12 months.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Service Modifications</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We reserve the right to modify, suspend, or discontinue our services at any time, 
                    with or without notice. We shall not be liable to you or any third party for any 
                    modification, suspension, or discontinuation of services.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Termination</h2>
                  <p className="text-gray-700 leading-relaxed">
                    We may terminate or suspend your access to our services immediately, without notice, 
                    for any violation of these terms. You may terminate your account at any time by 
                    contacting us.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Governing Law</h2>
                  <p className="text-gray-700 leading-relaxed">
                    These terms are governed by the laws of the Province of Ontario, Canada. Any 
                    disputes will be subject to the exclusive jurisdiction of the courts of Ontario.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    For any questions about these terms of service:
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
