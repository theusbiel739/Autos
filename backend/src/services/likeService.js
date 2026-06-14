const pool = require('../config/database');

const PUBLISHED_STATUS = 'publicado';

class LikeServiceError extends Error {
  constructor(code, message, statusCode = 500) {
    super(message);
    this.name = 'LikeServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

async function assertPublishedPostExists(postId) {
  const [rows] = await pool.execute(
    `SELECT id
     FROM posts
     WHERE id = ?
       AND status = ?
     LIMIT 1`,
    [postId, PUBLISHED_STATUS]
  );

  if (rows.length === 0) {
    throw new LikeServiceError(
      'POST_NOT_FOUND',
      'Post não encontrado.',
      404
    );
  }
}

async function countPostLikes(postId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM curtidas
     WHERE post_id = ?`,
    [postId]
  );

  return Number(rows[0].total);
}

function mapLikeState(postId, total, liked) {
  const like = {
    post_id: postId,
    total
  };

  if (typeof liked === 'boolean') {
    like.liked = liked;
  }

  return like;
}

async function getPostLikes(postId) {
  await assertPublishedPostExists(postId);

  const total = await countPostLikes(postId);

  return mapLikeState(postId, total);
}

async function likePost(postId, usuarioId) {
  await assertPublishedPostExists(postId);

  await pool.execute(
    `INSERT IGNORE INTO curtidas
      (usuario_id, post_id)
     VALUES (?, ?)`,
    [usuarioId, postId]
  );

  const total = await countPostLikes(postId);

  return mapLikeState(postId, total, true);
}

async function unlikePost(postId, usuarioId) {
  await assertPublishedPostExists(postId);

  await pool.execute(
    `DELETE FROM curtidas
     WHERE usuario_id = ?
       AND post_id = ?`,
    [usuarioId, postId]
  );

  const total = await countPostLikes(postId);

  return mapLikeState(postId, total, false);
}

module.exports = {
  LikeServiceError,
  getPostLikes,
  likePost,
  unlikePost
};
