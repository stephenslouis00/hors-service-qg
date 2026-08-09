# Mise en route — Hors Service

Ce document liste tout ce que **toi seul** (Louis) dois faire, avec ton propre compte Google/GitHub, pour que l'app fonctionne. Le code est déjà prêt — il ne reste que de la configuration.

## 1. Google Cloud — API et écran de consentement

1. Va sur [console.cloud.google.com](https://console.cloud.google.com) et crée un nouveau projet (ex : `hors-service`).
2. Dans **APIs & Services → Library**, active ces trois API :
   - **Google Calendar API**
   - **Google Drive API**
   - **Google Picker API**
3. Dans **APIs & Services → OAuth consent screen** :
   - Type : **External**
   - Renseigne le nom de l'app (« Hors Service »), ton email de contact.
   - Dans **Test users**, ajoute l'email Google de chaque membre du groupe qui doit pouvoir se connecter (tant que l'app reste en mode « Testing », ce qui suffit largement pour un usage privé).
4. Dans **APIs & Services → Credentials** :
   - **Create credentials → OAuth client ID** → type **Web application**.
     - Authorized JavaScript origins : `http://localhost:5173` et `https://<ton-pseudo-github>.github.io`.
     - **Copie le « Client ID »** affiché (ex. `123456789-abc...apps.googleusercontent.com`) — c'est la valeur `VITE_GOOGLE_CLIENT_ID`, utilisée pour demander l'accès à Drive/Calendar séparément de la connexion Google elle-même.
   - **Create credentials → API key** → restreins-la à la **Google Picker API** uniquement. C'est la valeur `VITE_GOOGLE_PICKER_API_KEY`.
5. Dans **APIs & Services → OAuth consent screen**, onglet **Data Access** (ou « Scopes » selon la version) → **Add or Remove Scopes** → ajoute ces deux-là et sauvegarde :
   - `.../auth/calendar` (accès complet à Calendar — nécessaire pour créer et synchroniser sur l'agenda dédié « HS »)
   - `.../auth/drive.file` (Drive, pour attacher des fichiers)

## 2. Firebase — Auth + Firestore

1. Va sur [console.firebase.google.com](https://console.firebase.google.com) et crée un projet **lié au même projet Google Cloud** que ci-dessus (Firebase te le propose automatiquement si tu choisis le même nom/organisation).
2. **Build → Authentication → Sign-in method** → active le fournisseur **Google**.
3. **Build → Firestore Database** → crée une base en **mode production**.
4. **Project settings → General → Your apps** → ajoute une **Web app**, copie les valeurs affichées (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
5. Copie `.env.example` vers `.env.local` à la racine du projet et colle-y ces valeurs, plus la clé Picker de l'étape 1 :
   ```bash
   cp .env.example .env.local
   ```
   Puis édite `.env.local` toi-même — ne me communique jamais ces valeurs en clair, colle-les directement dans le fichier.
6. (Optionnel) Ajoute aussi `VITE_BAND_DRIVE_FOLDER_URL` dans `.env.local` avec le lien vers le dossier Drive partagé du groupe — ça affiche un bouton « Drive du groupe » sur le tableau de bord.

## 3. Créer le premier membre autorisé (bootstrap)

L'app refuse tout compte qui n'est pas dans la liste `allowlist`. Comme personne ne peut encore s'y ajouter, il faut créer ta propre entrée à la main. Ce panneau se trouve maintenant dans la nouvelle console Google Cloud (`console.cloud.google.com/.../firestore/databases/-default-/data`), plus dans l'ancienne Firebase Console — les champs sont les mêmes, seuls l'habillage et les noms de types changent légèrement.

1. Dans la console Firestore → **Start a collection**.
2. ID de la collection : `allowlist`.
3. ID du document : **ton adresse Gmail en minuscules** (ex. `stephenslouis00@gmail.com`).
4. Ajoute ces champs un par un avec **+ Add field** :
   - `email` — type `string` → ton adresse email
   - `role` — type `string` → `admin`
   - `addedBy` — type `string` → ton adresse email
   - `addedAt` — type **`int64`** (c'est le nom utilisé pour un entier dans cette version de la console ; l'ancienne Firebase Console l'appelait juste « number ») → un timestamp quelconque en millisecondes, ex. `1754000000000`
5. Clique **Save**.

Une fois connecté, tu pourras ajouter le reste du groupe directement depuis l'onglet **Administratif → Membres autorisés** de l'app (plus besoin de toucher à Firebase).

## 4. Déployer les règles et index Firestore

Les règles de sécurité (`firestore.rules`) et un index (`firestore.indexes.json`, nécessaire pour que le tableau de bord puisse afficher les derniers commentaires tous morceaux confondus) sont déjà écrits dans le repo. Pour les publier :

```bash
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes --project <ton-project-id>
```

L'index peut prendre quelques minutes à se construire côté Firebase après le déploiement — c'est normal, le tableau de bord fonctionnera dès qu'il sera prêt.

## 5. GitHub — hébergement du site

Quand tu es prêt à le mettre en ligne (dis-le-moi et je m'en occupe avec toi, plutôt que de le faire seul sans confirmation) :

1. Créer un dépôt GitHub **public** nommé `hors-service-qg`.
2. Pousser le code.
3. Dans **Settings → Pages** du dépôt, choisir **Source: GitHub Actions** (le fichier `.github/workflows/deploy.yml` est déjà prêt).
4. Dans **Settings → Secrets and variables → Actions**, ajouter un secret pour chacune des valeurs de ton `.env.local` (mêmes noms de variables : `VITE_FIREBASE_API_KEY`, etc.) — c'est ce qui permet au build automatique d'avoir accès à ta config Firebase sans qu'elle soit commitée en clair.
5. Retourne dans Google Cloud Console → OAuth client → ajoute `https://<ton-pseudo-github>.github.io` comme origine autorisée si ce n'est pas déjà fait.
6. Chaque `push` sur `main` republie automatiquement le site sur `https://<ton-pseudo-github>.github.io/hors-service-qg/`.

## 6. Tester en local en attendant

```bash
npm install
npm run dev
```

L'app s'ouvre sur `http://localhost:5173/hors-service-qg/`. Connecte-toi avec ton compte Google (celui ajouté à l'étape 3) et tu devrais accéder à l'espace.
