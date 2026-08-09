# Hors Service — espace privé du groupe

App interne pour suivre la production des morceaux, la promo, les concerts et l'administratif du groupe Hors Service.

- **Production** — suivi des morceaux (démo → production → mixage → mastering → publié) avec un fil de retours par étape.
- **Promotion** — suivi des contenus, calendrier, singles/campagnes, contacts presse.
- **Booking** — calendrier des concerts et opportunités, salles et contacts.
- **Administratif** — contrats, paiements et documents juridiques (liés à Google Drive).

Connexion Google, données partagées en temps réel (Firestore), synchronisation avec Google Calendar/Drive/Gmail, installable comme app sur iPhone.

## Démarrer en local

```bash
npm install
cp .env.example .env.local   # puis remplis .env.local avec ta config Firebase
npm run dev
```

Voir [SETUP.md](./SETUP.md) pour la configuration complète (Google Cloud, Firebase, GitHub Pages) — à faire une seule fois.

## Stack

Vite + React + TypeScript + Tailwind CSS + React Router (`HashRouter`) + Firebase (Auth + Firestore) + `vite-plugin-pwa`. Hébergé sur GitHub Pages via GitHub Actions.
