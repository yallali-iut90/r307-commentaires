// SERVICE : le seul a toucher aux donnees, ici la base PostgreSQL.
// Il ne connait ni req, ni res, ni HTTP. Il recoit des valeurs, il rend des valeurs,
// ou il lance une erreur. Memes fonctions, memes reponses que la version JSON :
// le routeur et le controleur n'ont pas change.
//
// Les valeurs ne sont JAMAIS collees dans le texte SQL : elles passent par $1, $2...

const pool = require('../db/pool');
const ErreurHttp = require('../utils/erreur-http');

const articleIntrouvable = (id) =>
  new ErreurHttp(404, 'ARTICLE_INTROUVABLE', `L'article ${id} n'existe pas.`);
const commentaireIntrouvable = (id) =>
  new ErreurHttp(404, 'COMMENTAIRE_INTROUVABLE', `Le commentaire ${id} n'existe pas.`);

// READ · les commentaires d'un article, du plus ancien au plus recent.
// Deux requetes : d'abord l'article doit exister, ensuite ses commentaires.
async function lister(articleId) {
  const article = await pool.query('SELECT id FROM articles WHERE id = $1', [articleId]);
  if (article.rowCount === 0) throw articleIntrouvable(articleId);
  const resultat = await pool.query(
    'SELECT id, article_id, nom, texte, cree_le FROM commentaires WHERE article_id = $1 ORDER BY cree_le',
    [articleId],
  );
  return resultat.rows;
}

// READ · un commentaire
async function trouver(id) {
  const resultat = await pool.query(
    'SELECT id, article_id, nom, texte, cree_le FROM commentaires WHERE id = $1',
    [id],
  );
  if (resultat.rowCount === 0) throw commentaireIntrouvable(id);
  return resultat.rows[0];
}

// READ · les commentaires d'un visiteur, du plus recent au plus ancien,
// chacun avec en plus le titre de son article.
async function parVisiteur(nom) {
  const resultat = await pool.query(
    `SELECT c.id, c.article_id, c.nom, c.texte, c.cree_le, a.titre
     FROM commentaires c JOIN articles a ON a.id = c.article_id
     WHERE c.nom = $1
     ORDER BY c.cree_le DESC`,
    [nom],
  );
  return resultat.rows;
}

// CREATE · un commentaire sur un article.
// Si la cle etrangere echoue (23503), l'article n'existe pas : 404.
async function creer(articleId, { nom, texte }) {
  try {
    const resultat = await pool.query(
      `INSERT INTO commentaires (article_id, nom, texte)
       VALUES ($1, $2, $3)
       RETURNING id, article_id, nom, texte, cree_le`,
      [articleId, nom, texte],
    );
    return resultat.rows[0];
  } catch (err) {
    if (err.code === '23503') throw articleIntrouvable(articleId);
    throw err;
  }
}

// UPDATE · le texte d'un commentaire
async function modifier(id, { texte }) {
  const resultat = await pool.query(
    `UPDATE commentaires SET texte = $2
     WHERE id = $1
     RETURNING id, article_id, nom, texte, cree_le`,
    [id, texte],
  );
  if (resultat.rowCount === 0) throw commentaireIntrouvable(id);
  return resultat.rows[0];
}

// DELETE · un commentaire
async function supprimer(id) {
  const resultat = await pool.query('DELETE FROM commentaires WHERE id = $1', [id]);
  if (resultat.rowCount === 0) throw commentaireIntrouvable(id);
}

module.exports = { lister, trouver, parVisiteur, creer, modifier, supprimer };
