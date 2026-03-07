# 🏥 Medicals
## Plateforme de gestion et réservation de services médicaux

---

## 📌 À propos du projet

**Medicals** est une application web full stack conçue pour digitaliser la gestion des rendez-vous dans les cliniques et centres de santé.

La plateforme permet :

- La prise de rendez-vous avec des médecins
- La réservation de services médicaux (analyses, soins, examens, etc.)
- La gestion des plannings
- Le paiement en ligne sécurisé
- La gestion et l’optimisation des images

L’objectif est d’améliorer l’organisation interne des établissements de santé tout en offrant une meilleure expérience aux patients.

---

## 🎯 Pourquoi ce projet est utile

Dans de nombreux établissements :

- Les rendez-vous sont gérés manuellement
- Les conflits d’horaires sont fréquents
- Les paiements sont peu structurés
- La gestion administrative manque d’automatisation

Medicals propose une solution numérique centralisée, fiable et évolutive permettant une gestion moderne des services de santé.

---

## 🚀 Fonctionnalités principales

### 👥 Gestion des utilisateurs
- Authentification sécurisée
- Gestion des rôles (Administrateur, Médecin, Patient)

### 📅 Gestion des rendez-vous
- Prise de rendez-vous avec un médecin
- Réservation de services médicaux
- Gestion des disponibilités
- Suivi du statut des rendez-vous

### 💳 Paiement en ligne
- Intégration de Stripe pour le paiement sécurisé

### 🖼️ Gestion des images
- Upload et hébergement via Cloudinary
- Optimisation des médias

### 📊 Tableau de bord
- Vue administrative globale
- Gestion des médecins et services

---

## 🛠️ Technologies utilisées

### Frontend
- React

### Backend
- Node.js
- Express

### Base de données
- MongoDB

### Services externes
- Stripe (paiements en ligne)
- Cloudinary (gestion des images)

### Gestion de version
- Git

---

## ⚙️ Installation et démarrage

### 1. Cloner le dépôt

```bash
git clone https://github.com/Owedjangdev/medicals.git


2. Accéder au dossier du projet
cd medicals
3. Installer les dépendances
npm install
4. Configurer les variables d’environnement

Créer un fichier .env et ajouter :

MONGO_URI=
STRIPE_SECRET_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
JWT_SECRET=
5. Lancer l’application

npm run dev

Application accessible sur :

http://localhost:3000
🧩 Architecture

Le projet repose sur une architecture API REST avec séparation claire :

Frontend : Interface utilisateur

Backend : Logique métier et sécurité

Base de données : Gestion des relations entre utilisateurs, médecins et rendez-vous

🤝 Contribution

Les contributions sont les bienvenues.

Fork du projet

Création d’une branche dédiée

Commit des modifications

Pull Request

Merci de respecter la structure existante du projet.

🆘 Support

Pour toute question ou suggestion, vous pouvez ouvrir une issue sur le dépôt.

📄 Licence

Projet développé à des fins éducatives et professionnelles.

👨‍💻 Mainteneur

Epiphane Owedjangnon Houehanou
Développeur Full Stack


