const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Read logo
const logoPath = path.join(__dirname, '..', 'public', 'assets', 'logos', 'logo-512x512.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');

const HTML_FR = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Avenir AI - Guide du Tableau de Bord Client</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #1e293b;
            background: white;
        }
        
        /* Cover Page */
        .cover {
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: white;
            page-break-after: always;
            padding: 60px;
        }
        
        .cover-logo {
            width: 180px;
            height: 180px;
            margin-bottom: 40px;
            animation: float 3s ease-in-out infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        
        .cover h1 {
            font-size: 64px;
            font-weight: 800;
            margin-bottom: 20px;
            color: #ffffff !important;
            background: none !important;
            -webkit-background-clip: unset !important;
            -webkit-text-fill-color: #ffffff !important;
            background-clip: unset !important;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5), 0 4px 20px rgba(0,0,0,0.3);
        }
        
        .cover .subtitle {
            font-size: 28px;
            font-weight: 300;
            margin-bottom: 40px;
            color: #ffffff;
        }
        
        .cover .tagline {
            font-size: 20px;
            max-width: 600px;
            line-height: 1.6;
            color: #ffffff;
        }
        
        .cover .version {
            margin-top: 60px;
            font-size: 16px;
            color: #ffffff;
            opacity: 0.9;
        }
        
        /* Section Divider */
        .section-divider {
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            page-break-before: always;
            page-break-after: always;
        }
        
        .section-divider-content {
            text-align: center;
            color: white;
            padding: 80px;
        }
        
        .section-divider h2 {
            font-size: 56px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #ffffff !important;
            background: none !important;
            -webkit-background-clip: unset !important;
            -webkit-text-fill-color: #ffffff !important;
            background-clip: unset !important;
            text-shadow: 0 2px 10px rgba(0,0,0,0.5);
        }
        
        .section-divider p {
            font-size: 24px;
            color: #ffffff !important;
        }
        
        /* Content Pages */
        .content-page {
            min-height: 100vh;
            padding: 40px;
            background: white;
        }
        
        /* Header with Logo */
        .page-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 50px;
            padding-bottom: 20px;
            border-bottom: 3px solid transparent;
            background: linear-gradient(white, white) padding-box,
                        linear-gradient(135deg, #667eea, #764ba2) border-box;
        }
        
        .header-logo {
            width: 50px;
            height: 50px;
        }
        
        .header-title {
            font-size: 18px;
            font-weight: 600;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        h1 {
            font-size: 42px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 50px 0 30px;
        }
        
        h2 {
            font-size: 32px;
            color: #764ba2;
            margin: 40px 0 20px;
            font-weight: 600;
        }
        
        h3 {
            font-size: 24px;
            color: #475569;
            margin: 30px 0 15px;
            font-weight: 600;
        }
        
        p {
            margin-bottom: 18px;
            color: #475569;
            font-size: 16px;
        }
        
        ul, ol {
            margin-left: 30px;
            margin-bottom: 25px;
        }
        
        li {
            margin-bottom: 12px;
            color: #475569;
            line-height: 1.8;
        }
        
        /* Fancy Cards */
        .fancy-card {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            border-radius: 16px;
            padding: 30px;
            margin: 30px 0;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.1);
            border-left: 5px solid transparent;
            background-clip: padding-box;
            position: relative;
        }
        
        .fancy-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            bottom: 0;
            width: 5px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 16px 0 0 16px;
        }
        
        .fancy-card-title {
            font-size: 20px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 15px;
        }
        
        /* Table */
        table {
            width: 100%;
            border-collapse: separate;
            border-spacing: 0;
            margin: 30px 0;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        th {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            padding: 18px;
            text-align: left;
            font-weight: 600;
            font-size: 16px;
        }
        
        td {
            padding: 18px;
            border-bottom: 1px solid #e2e8f0;
            background: white;
        }
        
        tr:last-child td {
            border-bottom: none;
        }
        
        tr:hover td {
            background: #f8fafc;
        }
        
        /* Code */
        code {
            background: #1e293b;
            color: #10b981;
            padding: 3px 8px;
            border-radius: 6px;
            font-size: 14px;
            font-family: 'Monaco', 'Courier New', monospace;
        }
        
        pre {
            background: #1e293b;
            color: #e2e8f0;
            padding: 25px;
            border-radius: 12px;
            overflow-x: auto;
            margin: 25px 0;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
        }
        
        pre code {
            background: transparent;
            color: inherit;
            padding: 0;
        }
        
        /* Badges */
        .badge {
            display: inline-flex;
            align-items: center;
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-right: 10px;
            margin-bottom: 10px;
        }
        
        .badge-blue {
            background: linear-gradient(135deg, #dbeafe, #bfdbfe);
            color: #1e40af;
        }
        
        .badge-purple {
            background: linear-gradient(135deg, #ede9fe, #ddd6fe);
            color: #6b21a8;
        }
        
        .badge-green {
            background: linear-gradient(135deg, #d1fae5, #a7f3d0);
            color: #065f46;
        }
        
        /* TOC */
        .toc {
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            padding: 40px;
            border-radius: 16px;
            margin: 40px 0;
            box-shadow: 0 10px 40px rgba(102, 126, 234, 0.1);
        }
        
        .toc-title {
            font-size: 32px;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 25px;
        }
        
        .toc ul {
            list-style: none;
            margin: 0;
        }
        
        .toc li {
            margin-bottom: 15px;
            font-size: 18px;
            padding-left: 30px;
            position: relative;
        }
        
        .toc li::before {
            content: '▸';
            position: absolute;
            left: 0;
            color: #667eea;
            font-weight: bold;
        }
        
        /* Footer */
        .footer {
            margin-top: 80px;
            padding: 40px 0;
            text-align: center;
            border-top: 3px solid transparent;
            background: linear-gradient(white, white) padding-box,
                        linear-gradient(135deg, #667eea, #764ba2) border-box;
        }
        
        .footer p {
            color: #64748b;
            font-size: 14px;
        }
        
        /* Emoji */
        .emoji {
            font-size: 1.3em;
            margin-right: 12px;
        }
    </style>
</head>
<body>
    <!-- COVER PAGE -->
    <div class="cover">
        <img src="data:image/png;base64,${logoBase64}" class="cover-logo" alt="Logo Avenir AI" />
        <h1>Avenir AI</h1>
        <div class="subtitle">Guide du Tableau de Bord Client</div>
        <p class="tagline">
            Maîtrisez votre système d'intelligence de prospects IA en temps réel
        </p>
        <div class="version">
            Version 2.0 • Novembre 2024
        </div>
    </div>
    
    <!-- SECTION DIVIDER: Getting Started -->
    <div class="section-divider">
        <div class="section-divider-content">
            <h2>🚀 Démarrage</h2>
            <p>Votre parcours vers une gestion intelligente des prospects commence ici</p>
        </div>
    </div>
    
    <!-- CONTENT: Getting Started -->
    <div class="content-page">
        <div class="page-header">
            <img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />
            <div class="header-title">AVENIR AI • GUIDE CLIENT</div>
        </div>
        
        <h1><span class="emoji">🔐</span>Connexion</h1>
        
        <ol>
            <li>Accédez à : <code>https://www.aveniraisolutions.ca/{locale}/client/login</code></li>
            <li>Entrez votre adresse courriel enregistrée</li>
            <li>Entrez votre mot de passe sécurisé</li>
            <li>Cliquez sur <strong>"Connexion"</strong> / <strong>"Login"</strong></li>
        </ol>
        
        <div class="fancy-card">
            <div class="fancy-card-title">💡 Astuce : Changement de Langue</div>
            <p>Basculez instantanément entre l'anglais et le français à l'aide du sélecteur de langue dans le coin supérieur droit de votre tableau de bord. Votre préférence est sauvegardée automatiquement.</p>
        </div>
        
        <h2>Configuration Initiale</h2>
        
        <p>Après votre première connexion, vous serez guidé à travers une configuration rapide en 3 étapes :</p>
        
        <ul>
            <li><strong>Étape 1 :</strong> Vérifiez vos informations d'entreprise</li>
            <li><strong>Étape 2 :</strong> Configurez vos préférences de prospects</li>
            <li><strong>Étape 3 :</strong> Obtenez votre clé API pour l'intégration web</li>
        </ul>
    </div>
    
    <!-- SECTION DIVIDER: Dashboard Overview -->
    <div class="section-divider">
        <div class="section-divider-content">
            <h2>📊 Vue d'Ensemble du Tableau de Bord</h2>
            <p>Naviguez votre centre de commande en toute confiance</p>
        </div>
    </div>
    
    <!-- CONTENT: Dashboard Overview -->
    <div class="content-page">
        <div class="page-header">
            <img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />
            <div class="header-title">AVENIR AI • GUIDE CLIENT</div>
        </div>
        
        <h1><span class="emoji">📊</span>Votre Tableau de Bord</h1>
        
        <h2>Menu de Navigation</h2>
        
        <div class="fancy-card">
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                <span class="badge badge-blue">📊 Analyses</span>
                <span class="badge badge-purple">🧠 Intelligence IA</span>
                <span class="badge badge-green">⚙️ Paramètres</span>
                <span class="badge badge-blue">🔑 Accès API</span>
            </div>
        </div>
        
        <h3>1. Tableau des Prospects (Vue Centrale)</h3>
        <ul>
            <li>Affichage en temps réel de tous vos prospects</li>
            <li>Analyse IA complétée en 5-15 secondes</li>
            <li>Options de filtrage : Tous / Actifs / Convertis / Archivés</li>
            <li>Tri par : Date, Urgence, Confiance, Statut</li>
        </ul>
        
        <h3>2. Métriques Clés du Tableau de Bord</h3>
        <ul>
            <li><strong>Total des Prospects :</strong> Compte cumulatif de toutes les soumissions</li>
            <li><strong>Haute Priorité :</strong> Prospects nécessitant une attention immédiate</li>
            <li><strong>Confiance Moyenne :</strong> Niveau de certitude de l'IA (0-100%)</li>
            <li><strong>Taux de Conversion :</strong> Pourcentage de prospects convertis en clients</li>
        </ul>
    </div>
    
    <!-- SECTION DIVIDER: Lead Management -->
    <div class="section-divider">
        <div class="section-divider-content">
            <h2>📧 Gestion des Prospects</h2>
            <p>Chaque prospect, analysé et actionnable</p>
        </div>
    </div>
    
    <!-- CONTENT: Lead Information -->
    <div class="content-page">
        <div class="page-header">
            <img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />
            <div class="header-title">AVENIR AI • GUIDE CLIENT</div>
        </div>
        
        <h1><span class="emoji">📧</span>Comprendre Vos Prospects</h1>
        
        <h2>Tableau des Informations sur les Prospects</h2>
        
        <table>
            <thead>
                <tr>
                    <th>Champ</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td><strong>Nom</strong></td>
                    <td>Nom complet du prospect tel que soumis</td>
                </tr>
                <tr>
                    <td><strong>Courriel</strong></td>
                    <td>Adresse courriel de contact principale</td>
                </tr>
                <tr>
                    <td><strong>Langue</strong></td>
                    <td>EN (Anglais) ou FR (Français) - détecté automatiquement</td>
                </tr>
                <tr>
                    <td><strong>Message</strong></td>
                    <td>Message original soumis par le prospect</td>
                </tr>
                <tr>
                    <td><strong>Résumé IA</strong></td>
                    <td>Aperçu concis de l'intention et des besoins du prospect</td>
                </tr>
                <tr>
                    <td><strong>Intention</strong></td>
                    <td>Raison catégorisée du contact (Demande de service, Partenariat, etc.)</td>
                </tr>
                <tr>
                    <td><strong>Ton</strong></td>
                    <td>Style de communication (Professionnel, Décontracté, Urgent, Direct, etc.)</td>
                </tr>
                <tr>
                    <td><strong>Urgence</strong></td>
                    <td>Niveau de priorité : Élevée / Moyenne / Faible</td>
                </tr>
                <tr>
                    <td><strong>Confiance</strong></td>
                    <td>Certitude de l'IA dans son analyse (0-100%)</td>
                </tr>
                <tr>
                    <td><strong>Horodatage</strong></td>
                    <td>Date et heure de soumission du prospect</td>
                </tr>
            </tbody>
        </table>
        
        <h2>Actions Disponibles</h2>
        
        <div class="fancy-card">
            <div class="fancy-card-title">Actions Rapides pour Chaque Prospect</div>
            <ul style="margin: 0;">
                <li>📞 <strong>Marquer comme Contacté</strong> - Suivez votre progression de suivi</li>
                <li>📅 <strong>Réunion Réservée</strong> - Enregistrez les rendez-vous programmés</li>
                <li>💰 <strong>Client Converti</strong> - Marquez les conversions réussies</li>
                <li>❌ <strong>Pas de Vente</strong> - Documentez les prospects non convertis</li>
                <li>🏷️ <strong>Étiqueter le Prospect</strong> - Ajoutez des étiquettes de catégorisation personnalisées</li>
                <li>📦 <strong>Archiver le Prospect</strong> - Retirer de la vue active (récupérable)</li>
                <li>🗑️ <strong>Supprimer le Prospect</strong> - Retirer définitivement (irréversible)</li>
            </ul>
        </div>
    </div>
    
    <!-- SECTION DIVIDER: Analytics -->
    <div class="section-divider">
        <div class="section-divider-content">
            <h2>📈 Analyses et Aperçus</h2>
            <p>Décisions basées sur les données à portée de main</p>
        </div>
    </div>
    
    <!-- CONTENT: Analytics -->
    <div class="content-page">
        <div class="page-header">
            <img src="data:image/png;base64,${logoBase64}" class="header-logo" alt="Logo" />
            <div class="header-title">AVENIR AI • GUIDE CLIENT</div>
        </div>
        
        <h1><span class="emoji">📈</span>Tableau de Bord des Analyses</h1>
        
        <p><strong>Accès :</strong> Cliquez sur <span class="badge badge-blue">📊 Analyses</span> dans le menu de navigation supérieur</p>
        
        <h2>Métriques Disponibles</h2>
        
        <h3>1. Total des Prospects</h3>
        <p>Compte complet de tous les prospects reçus depuis l'activation du compte. Cette métrique suit votre performance globale de génération de prospects.</p>
        
        <h3>2. Confiance Moyenne</h3>
        <p>Score de certitude moyen de l'IA sur tous les prospects analysés. Des scores plus élevés indiquent des modèles d'analyse plus définitifs.</p>
        
        <h3>3. Distribution des Intentions</h3>
        <p>Répartition visuelle des types de prospects :</p>
        <ul>
            <li><strong>Demande de Service :</strong> Prospects recherchant vos offres principales</li>
            <li><strong>Partenariat B2B :</strong> Opportunités de collaboration commerciale</li>
            <li><strong>Consultation :</strong> Demandes de conseil ou de consultation</li>
            <li><strong>Demande de Support :</strong> Besoins de support technique ou client</li>
            <li><strong>Demande d'Information :</strong> Chercheurs d'informations générales</li>
        </ul>
        
        <h3>4. Répartition de l'Urgence</h3>
        <div class="fancy-card">
            <ul style="margin: 0;">
                <li><strong>🔴 Élevée :</strong> Nécessite une action immédiate (dans les 24 heures)</li>
                <li><strong>🟡 Moyenne :</strong> Suivi dans les 24-48 heures</li>
                <li><strong>🟢 Faible :</strong> Demandes générales (48+ heures acceptable)</li>
            </ul>
        </div>
        
        <h3>5. Analyse du Ton</h3>
        <p>Comprendre les styles de communication aide à prioriser et personnaliser vos réponses :</p>
        <ul>
            <li><strong>Professionnel :</strong> Communication d'affaires formelle</li>
            <li><strong>Décontracté :</strong> Approche amicale, informelle</li>
            <li><strong>Urgent :</strong> Modèles de langage sensibles au temps</li>
            <li><strong>Curieux :</strong> Ton exploratoire, de collecte d'informations</li>
            <li><strong>Direct :</strong> Communication directe et concise</li>
        </ul>
        
        <h3>6. Distribution des Langues</h3>
        <p>Répartition en pourcentage des prospects anglophones vs francophones, vous aidant à comprendre la démographie de votre marché.</p>
        
        <div class="footer">
            <p><strong>© 2024 Avenir AI Solutions • Tous droits réservés</strong></p>
            <p>contact@aveniraisolutions.ca</p>
        </div>
    </div>
    
    <!-- Additional sections would follow the same pattern -->
</body>
</html>
`;

async function generatePDF() {
  console.log('🚀 Generating professional PDF with logo and transitions...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setContent(HTML_FR, { waitUntil: 'networkidle0' });
  
  const outputPath = path.join(__dirname, '..', 'public', 'client-guides', 'AVENIR_CLIENT_GUIDE_FR_2024.pdf');
  
  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' },
    preferCSSPageSize: true
  });
  
  console.log('✅ Professional PDF generated!');
  await browser.close();
}

generatePDF().catch(console.error);

