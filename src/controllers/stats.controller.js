import pool from '../config/db.js';

export async function getAdminStats(req, res, next) {
  try {
    const [itemsByStatus] = await pool.query(
      `SELECT conservation_status, COUNT(*) AS total FROM items GROUP BY conservation_status`
    );
    const [[{ totalSales }]] = await pool.query(
      `SELECT COUNT(*) AS totalSales FROM item_history WHERE trade_status = 'done'`
    );
    const [usersByStatus] = await pool.query(
      `SELECT status, COUNT(*) AS total FROM users GROUP BY status`
    );
    const [topCategories] = await pool.query(
      `SELECT c.id_categories, c.name, COUNT(i.id_items) AS total_items
       FROM categories c
       LEFT JOIN items i ON i.fk_categories_id = c.id_categories AND i.conservation_status = 'published'
       GROUP BY c.id_categories, c.name
       ORDER BY total_items DESC
       LIMIT 10`
    );
    const [[{ pendingReservations }]] = await pool.query(
      `SELECT COUNT(*) AS pendingReservations FROM item_history WHERE trade_status = 'pending'`
    );
    const [[{ pendingReports }]] = await pool.query(
      `SELECT COUNT(*) AS pendingReports FROM reports WHERE status = 'pending'`
    );

    res.json({
      items_by_status: itemsByStatus,
      total_completed_sales: totalSales,
      users_by_status: usersByStatus,
      top_categories: topCategories,
      pending_reservations: pendingReservations,
      pending_reports: pendingReports,
    });
  } catch (err) { next(err); }
}
