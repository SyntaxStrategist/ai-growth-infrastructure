# Comment Exécuter Votre Formulaire Démo - Guide du Serveur

**Dernière mise à jour:** 22 octobre 2025  
**Objectif:** Démarrer le serveur local pour les formulaires de contact démo  
**Temps requis:** 30 secondes

---

## 🎯 Démarrage Rapide (3 Étapes)

### **Étape 1: Ouvrir Terminal**

**Sur Mac:**
1. Appuyez sur `Cmd + Espace` (ouvre Spotlight)
2. Tapez: `Terminal`
3. Appuyez sur `Entrée`

**Vous verrez une fenêtre noire ou blanche avec du texte.**

---

### **Étape 2: Naviguer vers Votre Projet**

**Copiez et collez cette commande dans Terminal:**

```bash
cd /Users/michaeloni/ai-growth-infrastructure
```

**Appuyez sur `Entrée`**

**Ce que cela fait:** Se déplace vers le dossier où vos formulaires démo sont stockés.

---

### **Étape 3: Démarrer le Serveur**

**Copiez et collez cette commande:**

```bash
python3 -m http.server 8000
```

**Appuyez sur `Entrée`**

**Vous verrez:**
```
Serving HTTP on :: port 8000 (http://[::]:8000/) ...
```

✅ **Le serveur fonctionne!**

---

## 🌐 Ouvrir Vos Formulaires Démo

**Maintenant que le serveur fonctionne, ouvrez ces URLs dans Chrome:**

### **Formulaire Anglais:**
```
http://localhost:8000/DEMO_CONTACT_FORM_EN.html
```

### **Formulaire Français:**
```
http://localhost:8000/DEMO_CONTACT_FORM_FR.html
```

**Mettez ces URLs en favori pour un accès facile pendant les démos!**

---

## ✅ Tester le Formulaire

1. Remplissez le formulaire avec des données de test:
   - Nom: `Lead Test`
   - Email: `test@exemple.com`
   - Message: `J'ai besoin de charpentage et de gypse pour un projet commercial. Urgence élevée.`

2. Cliquez sur **"Envoyer le Message"**

3. Vous devriez voir: ✅ **"Merci! Votre message a été envoyé."**

4. Allez à votre tableau de bord: `https://www.aveniraisolutions.ca/fr/client/dashboard`

5. Rafraîchissez la page

6. **Votre lead de test devrait apparaître avec l'analyse IA!**

---

## ⏹️ Comment Arrêter le Serveur

**Lorsque vous avez terminé les démos:**

1. Retournez au Terminal (où le serveur fonctionne)
2. Appuyez sur `Ctrl + C`
3. Le serveur s'arrête

**Vous verrez l'invite de commande revenir:**
```
michaeloni@Michaels-MacBook ai-growth-infrastructure %
```

✅ **Le serveur est arrêté.**

---

## 🔄 Comment Redémarrer le Serveur

**La prochaine fois que vous devez faire une démo:**

1. Ouvrez Terminal
2. Exécutez ces 2 commandes:
   ```bash
   cd /Users/michaeloni/ai-growth-infrastructure
   python3 -m http.server 8000
   ```
3. Ouvrez l'URL mise en favori dans Chrome
4. Le formulaire fonctionne à nouveau!

---

## 📋 Problèmes Courants & Solutions

### **Problème 1: "Address already in use"**

**Message d'erreur:**
```
OSError: [Errno 48] Address already in use
```

**Solution:** Le serveur fonctionne déjà!
- Vérifiez si vous avez une autre fenêtre Terminal ouverte
- Ou utilisez un port différent: `python3 -m http.server 8001`

---

### **Problème 2: "python3: command not found"**

**Solution:** Utilisez `python` à la place:
```bash
python -m http.server 8000
```

---

### **Problème 3: Le formulaire affiche toujours une erreur CORS**

**Causes:**
1. Serveur non démarré → Vérifiez Terminal, redémarrez le serveur
2. Mauvaise URL → Assurez-vous d'utiliser `http://localhost:8000/...` et non d'ouvrir le fichier directement
3. Clé API non définie → Vérifiez la ligne 118 dans le fichier HTML

---

### **Problème 4: Le lead n'apparaît pas dans le tableau de bord**

**Liste de vérification:**
1. ✅ La clé API est correcte (vérifiez la ligne 118)
2. ✅ Le serveur fonctionne (`http://localhost:8000`)
3. ✅ Le formulaire a été soumis avec succès (message de succès vert)
4. ✅ Le tableau de bord a été rafraîchi
5. ✅ Utilisation du bon compte client

---

## 🎬 Pour Vos Démos de Vente

### **Avant la Démo:**
1. Démarrez le serveur (30 secondes)
2. Ouvrez l'URL du formulaire dans Chrome
3. Mettez-la en favori
4. Ouvrez votre tableau de bord dans un autre onglet
5. Prêt pour la démo!

### **Pendant la Démo:**
1. Partagez l'écran Chrome
2. Montrez le formulaire
3. Remplissez-le en direct (ou utilisez un exemple pré-rempli)
4. Cliquez sur Soumettre
5. Passez à l'onglet du tableau de bord
6. Rafraîchissez → Montrez le lead qui apparaît
7. Montrez l'analyse IA (intention, ton, urgence, confiance)

### **Après la Démo:**
1. Fermez les onglets Chrome
2. Laissez le serveur fonctionner si vous faites plus de démos aujourd'hui
3. Arrêtez le serveur lorsque vous avez terminé pour la journée

---

## 🔑 Référence Rapide

### **Démarrer le Serveur:**
```bash
cd /Users/michaeloni/ai-growth-infrastructure
python3 -m http.server 8000
```

### **Arrêter le Serveur:**
```bash
Ctrl + C
```

### **URLs du Formulaire:**
```
Anglais: http://localhost:8000/DEMO_CONTACT_FORM_EN.html
Français: http://localhost:8000/DEMO_CONTACT_FORM_FR.html
```

### **Votre Tableau de Bord:**
```
https://www.aveniraisolutions.ca/fr/client/dashboard
```

---

## 💡 Conseils Pro

### **Conseil 1: Gardez la Fenêtre Terminal Ouverte**
- Ne fermez pas Terminal pendant les démos
- Minimisez-le plutôt
- Le serveur doit continuer à fonctionner

### **Conseil 2: Mettez les URLs en Favori**
- Économise du temps pendant les démos
- Ouvrez le favori → Le formulaire se charge instantanément

### **Conseil 3: Utilisez le Mode Incognito pour les Tests**
- Cmd + Shift + N (Chrome Incognito)
- Évite les problèmes de cache
- Nouveau départ pour chaque test

### **Conseil 4: Pré-Remplissez des Données d'Exemple**
- Ayez du texte d'exemple prêt à copier-coller
- Plus rapide pendant les démos en direct
- Apparence plus professionnelle

---

## 📱 Raccourcis Clavier Utiles

**Dans Terminal:**
- `Ctrl + C` - Arrêter le serveur
- `Cmd + K` - Effacer l'écran Terminal
- `↑` (flèche haut) - Commande précédente

**Dans Chrome:**
- `Cmd + R` - Rafraîchir la page
- `Cmd + Shift + N` - Nouvelle fenêtre Incognito
- `Cmd + T` - Nouvel onglet

---

## ✅ Vous Êtes Prêt!

**Tout ce dont vous avez besoin:**
- ✅ Formulaires démo créés
- ✅ Clé API ajoutée
- ✅ Serveur en cours d'exécution
- ✅ URLs mises en favori
- ✅ Prêt pour les démos

**Maintenant testez-le:**
1. Ouvrez `http://localhost:8000/DEMO_CONTACT_FORM_EN.html`
2. Remplissez le formulaire
3. Soumettez
4. Vérifiez votre tableau de bord
5. Voyez la magie opérer! ✨

---

## 🎯 Pour Chaque Démo

### **Routine de Démo (15 minutes):**

**Minute 1-2:** Découverte
- "Quel est votre plus grand défi avec les leads du site web?"

**Minute 3-10:** Démo en Direct
1. Partagez l'écran → Montrez le formulaire
2. "Voici ce qui se passe quand quelqu'un remplit votre formulaire"
3. Remplissez le formulaire en direct
4. Cliquez sur Soumettre → Montrez le message de succès
5. Passez à l'onglet du tableau de bord
6. Rafraîchissez → "En 30 secondes, l'IA a analysé..."
7. Montrez: Intention, Ton, Urgence, Confiance
8. Montrez: Email automatique envoyé

**Minute 11-13:** Répondre aux Objections
- "Combien ça coûte?" → "299$/mois. Une affaire supplémentaire = ROI de 10-30x"
- "Et si l'IA se trompe?" → "L'IA ne fait jamais de promesses ou de devis. Elle accuse réception et inclut votre lien de réservation"

**Minute 14-15:** Conclure
- "Les 10 premiers clients obtiennent 50% de réduction pendant 6 mois. Nous sommes à 7/10."
- "Je peux vous configurer aujourd'hui. Cet après-midi ou demain matin?"

---

## 📞 Besoin d'Aide?

**Si vous êtes bloqué:**
1. Vérifiez que le serveur fonctionne (Terminal affiche "Serving HTTP...")
2. Vérifiez que vous utilisez `http://localhost:8000/...` et non `file://...`
3. Vérifiez que la clé API est définie à la ligne 118

**Toujours bloqué?** Vérifiez la console Chrome (Cmd + Option + J) pour les messages d'erreur.

---

**Créé Par:** Avenir AI Solutions  
**Dernière Mise à Jour:** 22 octobre 2025  
**Statut:** ✅ Prêt à Utiliser

