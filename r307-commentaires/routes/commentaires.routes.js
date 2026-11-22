// ROUTEUR des commentaires, monte sur /api dans serveur.js.
// Une ligne par route : methode + chemin -> controleur, comme dans routes/articles.routes.js.
// Le jeton n'est requis que sur PATCH et DELETE (ecrire), comme dans le contrat.

const express = require('express');
const verifierJeton = require('../middlewares/jeton');
const controleur = require('../controllers/commentaires.controller');

const router = express.Router();

router.get('/articles/:id/commentaires', controleur.lister);       // la liste d'un article
router.post('/articles/:id/commentaires', controleur.creer);       // creer sur un article
router.get('/commentaires', controleur.parVisiteur);               // ?nom=... AVANT /commentaires/:id
router.get('/commentaires/:id', controleur.trouver);               // un commentaire
router.patch('/commentaires/:id', verifierJeton, controleur.modifier);   // jeton : ecrire
router.delete('/commentaires/:id', verifierJeton, controleur.supprimer); // jeton : ecrire

module.exports = router;
