import pool from '../config/db.js';

export async function findOrCreate({ fk_items_id, fk_seller_id, fk_buyer_id }) {
  const [existing] = await pool.query(
    `SELECT * FROM conversations WHERE fk_items_id=? AND fk_seller_id=? AND fk_buyer_id=? LIMIT 1`,
    [fk_items_id, fk_seller_id, fk_buyer_id]
  );
  if (existing.length) return { conversation: existing[0], created: false };

  const [result] = await pool.query(
    `INSERT INTO conversations (fk_items_id, fk_seller_id, fk_buyer_id) VALUES (?, ?, ?)`,
    [fk_items_id, fk_seller_id, fk_buyer_id]
  );
  const [rows] = await pool.query(
    'SELECT * FROM conversations WHERE id_conversations=? LIMIT 1', [result.insertId]
  );
  return { conversation: rows[0], created: true };
}

export async function getById(id) {
  const [rows] = await pool.query(
    `SELECT c.*,
            i.title AS item_title, i.price AS item_price, i.conservation_status, i.item_status,
            (SELECT ip.photo_url FROM items_photos ip WHERE ip.fk_items_id=c.fk_items_id ORDER BY ip.photo_order ASC LIMIT 1) AS item_photo,
            seller.username AS seller_username, seller.profile_picture AS seller_avatar,
            buyer.username  AS buyer_username,  buyer.profile_picture  AS buyer_avatar
     FROM conversations c
     JOIN items i ON i.id_items=c.fk_items_id
     JOIN users seller ON seller.id_users=c.fk_seller_id
     JOIN users buyer  ON buyer.id_users=c.fk_buyer_id
     WHERE c.id_conversations=? LIMIT 1`,
    [id]
  );
  return rows[0] ?? null;
}

export async function getUserConversations(userId) {
  const [rows] = await pool.query(
    `SELECT c.*,
            i.id_items AS item_id, i.title AS item_title, i.price AS item_price,
            i.conservation_status, i.item_status,
            (SELECT ip.photo_url FROM items_photos ip WHERE ip.fk_items_id=c.fk_items_id ORDER BY ip.photo_order ASC LIMIT 1) AS item_photo,
            seller.id_users AS seller_id, seller.username AS seller_username, seller.profile_picture AS seller_avatar,
            buyer.id_users AS buyer_id, buyer.username AS buyer_username, buyer.profile_picture AS buyer_avatar,
            (SELECT m.content FROM messages m WHERE m.fk_conversations_id=c.id_conversations ORDER BY m.sent_at DESC LIMIT 1) AS last_message,
            (SELECT COUNT(*) FROM messages m WHERE m.fk_conversations_id=c.id_conversations AND m.fk_users_id_received=? AND m.read=false) AS unread_count,
            c.created_at
     FROM conversations c
     JOIN items i ON i.id_items=c.fk_items_id
     JOIN users seller ON seller.id_users=c.fk_seller_id
     JOIN users buyer ON buyer.id_users=c.fk_buyer_id
     WHERE c.fk_seller_id=? OR c.fk_buyer_id=?
     ORDER BY c.id_conversations DESC`,
    [userId, userId, userId]
  );

  return rows.map(row => ({
    id_conversations: row.id_conversations,
    started_date: row.created_at,
    fk_items_id: row.fk_items_id,
    fk_seller_id: row.fk_seller_id,
    fk_buyer_id: row.fk_buyer_id,
    last_message: row.last_message,
    unread_count: row.unread_count,

    conservation_status: row.conservation_status,
    item_status: row.item_status,

    item_id: row.item_id,
    item_title: row.item_title,
    item_price: row.item_price,
    item_photo: row.item_photo,

    seller_id: row.seller_id,
    seller_username: row.seller_username,
    seller_avatar: row.seller_avatar,

    buyer_id: row.buyer_id,
    buyer_username: row.buyer_username,
    buyer_avatar: row.buyer_avatar
  }));
}

export async function getMessages(conversationId) {
  const [rows] = await pool.query(
    `SELECT m.*, u.username AS sender_username, u.profile_picture AS sender_avatar
     FROM messages m
     JOIN users u ON u.id_users=m.fk_users_id_sent
     WHERE m.fk_conversations_id=?
     ORDER BY m.sent_at ASC`,
    [conversationId]
  );
  return rows;
}


export async function createMessage({ fk_conversations_id, fk_users_id_sent, fk_users_id_received, content }) {
  const [result] = await pool.query(
    `INSERT INTO messages (fk_conversations_id, fk_users_id_sent, fk_users_id_received, content, \`read\`)
    VALUES (?, ?, ?, ?, 0)`,  // ← Cambiar "false" por "0"
    [fk_conversations_id, fk_users_id_sent, fk_users_id_received, content]
  );
  const [rows] = await pool.query('SELECT * FROM messages WHERE id_messages=? LIMIT 1', [result.insertId]);
  return rows[0];
}


export async function markAsRead({ conversationId, userId }) {
  const [result] = await pool.query(
    `UPDATE messages SET \`read\`=1 WHERE fk_conversations_id=? AND fk_users_id_received=? AND \`read\`=0`,
    [conversationId, userId]
  );
  return result.affectedRows;
}


