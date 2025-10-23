import { getTranslations } from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return {
    title: locale === 'fr' ? 'Politique des Cookies' : 'Cookie Policy',
    description: locale === 'fr' 
      ? 'Politique des cookies d\'Avenir AI Solutions'
      : 'Avenir AI Solutions Cookie Policy',
  };
}

export default async function CookiePolicy({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              {locale === 'fr' ? 'Politique des Cookies' : 'Cookie Policy'}
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Qu'est-ce qu'un Cookie ?</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Un cookie est un petit fichier texte stocké sur votre appareil lorsque vous visitez 
                    notre site web. Les cookies nous aident à améliorer votre expérience de navigation 
                    et à analyser l'utilisation de notre site.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types de Cookies Utilisés</h2>
                  
                  <div className="bg-blue-50 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-semibold text-blue-900 mb-3">Cookies Essentiels</h3>
                    <p className="text-blue-800 mb-3">
                      Ces cookies sont nécessaires au fonctionnement de notre site web et ne peuvent pas être désactivés.
                    </p>
                    <ul className="list-disc pl-6 text-blue-700">
                      <li>Cookies de session pour maintenir votre connexion</li>
                      <li>Cookies de sécurité pour protéger contre les attaques</li>
                      <li>Cookies de préférences linguistiques</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-semibold text-green-900 mb-3">Cookies Analytiques</h3>
                    <p className="text-green-800 mb-3">
                      Ces cookies nous aident à comprendre comment vous utilisez notre site.
                    </p>
                    <ul className="list-disc pl-6 text-green-700">
                      <li>Google Analytics pour les statistiques de visite</li>
                      <li>Métriques de performance des pages</li>
                      <li>Données d'utilisation des fonctionnalités IA</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-semibold text-yellow-900 mb-3">Cookies de Fonctionnalité</h3>
                    <p className="text-yellow-800 mb-3">
                      Ces cookies améliorent votre expérience utilisateur.
                    </p>
                    <ul className="list-disc pl-6 text-yellow-700">
                      <li>Préférences d'affichage</li>
                      <li>Paramètres de personnalisation</li>
                      <li>Mémorisation des choix de consentement</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cookies Tiers</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Nous utilisons des services tiers qui peuvent placer leurs propres cookies :
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Google Analytics :</strong> Analyse du trafic et du comportement des utilisateurs</li>
                    <li><strong>Supabase :</strong> Gestion de la base de données et authentification</li>
                    <li><strong>OpenAI :</strong> Fonctionnalités d'intelligence artificielle</li>
                    <li><strong>Vercel :</strong> Analyse des performances et du déploiement</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Gestion des Cookies</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Vous pouvez contrôler et gérer les cookies de plusieurs façons :
                  </p>
                  
                  <div className="bg-gray-50 p-6 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Paramètres du Navigateur</h3>
                    <p className="text-gray-700 mb-3">
                      La plupart des navigateurs vous permettent de :
                    </p>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>Voir quels cookies sont stockés</li>
                      <li>Supprimer les cookies existants</li>
                      <li>Bloquer les cookies futurs</li>
                      <li>Recevoir des notifications avant l'installation de cookies</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Centre de Préférences</h3>
                    <p className="text-gray-700">
                      Utilisez notre centre de préférences de cookies pour personnaliser votre expérience 
                      et gérer vos choix de consentement.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Durée de Conservation</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Les cookies sont conservés pour différentes durées selon leur type :
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Cookies de session :</strong> Supprimés à la fermeture du navigateur</li>
                    <li><strong>Cookies persistants :</strong> Conservés de 30 jours à 2 ans maximum</li>
                    <li><strong>Cookies analytiques :</strong> Généralement 24 mois</li>
                    <li><strong>Cookies de préférences :</strong> Jusqu'à 12 mois</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Impact de la Désactivation</h2>
                  <p className="text-gray-700 leading-relaxed">
                    Si vous désactivez les cookies, certaines fonctionnalités de notre site peuvent 
                    ne pas fonctionner correctement. Cela peut inclure la perte de vos préférences, 
                    des difficultés de connexion, ou une expérience utilisateur dégradée.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Pour toute question concernant notre utilisation des cookies :
                  </p>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <p className="text-gray-700"><strong>E-mail :</strong> contact@aveniraisolutions.ca</p>
                  </div>
                </section>
              </>
            ) : (
              <>
                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What is a Cookie?</h2>
                  <p className="text-gray-700 leading-relaxed">
                    A cookie is a small text file stored on your device when you visit our website. 
                    Cookies help us improve your browsing experience and analyze how our site is used.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
                  
                  <div className="bg-blue-50 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-semibold text-blue-900 mb-3">Essential Cookies</h3>
                    <p className="text-blue-800 mb-3">
                      These cookies are necessary for our website to function and cannot be disabled.
                    </p>
                    <ul className="list-disc pl-6 text-blue-700">
                      <li>Session cookies to maintain your login</li>
                      <li>Security cookies to protect against attacks</li>
                      <li>Language preference cookies</li>
                    </ul>
                  </div>

                  <div className="bg-green-50 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-semibold text-green-900 mb-3">Analytics Cookies</h3>
                    <p className="text-green-800 mb-3">
                      These cookies help us understand how you use our site.
                    </p>
                    <ul className="list-disc pl-6 text-green-700">
                      <li>Google Analytics for visit statistics</li>
                      <li>Page performance metrics</li>
                      <li>AI feature usage data</li>
                    </ul>
                  </div>

                  <div className="bg-yellow-50 p-6 rounded-lg mb-6">
                    <h3 className="text-xl font-semibold text-yellow-900 mb-3">Functionality Cookies</h3>
                    <p className="text-yellow-800 mb-3">
                      These cookies enhance your user experience.
                    </p>
                    <ul className="list-disc pl-6 text-yellow-700">
                      <li>Display preferences</li>
                      <li>Personalization settings</li>
                      <li>Consent choice memory</li>
                    </ul>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Third-Party Cookies</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We use third-party services that may place their own cookies:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Google Analytics:</strong> Traffic and user behavior analysis</li>
                    <li><strong>Supabase:</strong> Database management and authentication</li>
                    <li><strong>OpenAI:</strong> Artificial intelligence features</li>
                    <li><strong>Vercel:</strong> Performance and deployment analytics</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Managing Cookies</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    You can control and manage cookies in several ways:
                  </p>
                  
                  <div className="bg-gray-50 p-6 rounded-lg mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Browser Settings</h3>
                    <p className="text-gray-700 mb-3">
                      Most browsers allow you to:
                    </p>
                    <ul className="list-disc pl-6 text-gray-700">
                      <li>View which cookies are stored</li>
                      <li>Delete existing cookies</li>
                      <li>Block future cookies</li>
                      <li>Receive notifications before cookies are installed</li>
                    </ul>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Preference Center</h3>
                    <p className="text-gray-700">
                      Use our cookie preference center to customize your experience and manage 
                      your consent choices.
                    </p>
                  </div>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Retention Period</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Cookies are retained for different periods depending on their type:
                  </p>
                  <ul className="list-disc pl-6 text-gray-700 mb-4">
                    <li><strong>Session cookies:</strong> Deleted when browser is closed</li>
                    <li><strong>Persistent cookies:</strong> Retained from 30 days to 2 years maximum</li>
                    <li><strong>Analytics cookies:</strong> Generally 24 months</li>
                    <li><strong>Preference cookies:</strong> Up to 12 months</li>
                  </ul>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Impact of Disabling</h2>
                  <p className="text-gray-700 leading-relaxed">
                    If you disable cookies, some features of our site may not work properly. 
                    This may include loss of your preferences, login difficulties, or degraded 
                    user experience.
                  </p>
                </section>

                <section className="mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Contact Us</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    For any questions about our use of cookies:
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
