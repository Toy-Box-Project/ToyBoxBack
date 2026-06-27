import * as ReservationModel from '../models/reservation.model.js';
import * as ItemModel from '../models/item.model.js';
import pool from '../config/db.js';

export async function createReservation(req, res, next) {
  try {
    const { fk_product_id } = req.body;
    if (!fk_product_id) return res.status(400).json({ error: 'fk_product_id es requerido' });

    const item = await ItemModel.getById(Number(fk_product_id));
    if (!item) return res.status(404).json({ error: 'Artículo no encontrado' });
    if (item.conservation_status !== 'published')
      return res.status(409).json({ error: 'Solo se pueden reservar artículos publicados' });
    if (item.fk_seller_id === req.user.id_users)
      return res.status(400).json({ error: 'No puedes reservar tu propio artículo' });

    // Verificar que no existe ya una reserva pendiente para este artículo
    const existing = await ReservationModel.getPendingByItem(item.id_items);
    if (existing) return res.status(409).json({ error: 'Este artículo ya tiene una reserva pendiente' });

    // Cambiar estado del item a reserved
    await pool.query(
      `UPDATE items SET conservation_status = 'reserved', item_update = NOW() WHERE id_items = ?`,
      [item.id_items]
    );

    const reservation = await ReservationModel.createReservation({
      fk_items_id: item.id_items,
      fk_buyer_id: req.user.id_users,
    });

    res.status(201).json(reservation);
  } catch (err) { next(err); }
}

export async function getMyReservations(req, res, next) {
  try {
    const reservations = await ReservationModel.getByBuyer(req.user.id_users);
    res.json(reservations);
  } catch (err) { next(err); }
}

export async function cancelReservation(req, res, next) {
  try {
    const reservation = await ReservationModel.getReservationById(Number(req.params.id));
    if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reservation.fk_buyer_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el comprador puede cancelar la reserva' });
    if (reservation.trade_status !== 'pending')
      return res.status(409).json({ error: 'Solo se pueden cancelar reservas pendientes' });

    // Devolver item a published
    await pool.query(
      `UPDATE items SET conservation_status = 'published', item_update = NOW() WHERE id_items = ?`,
      [reservation.fk_items_id]
    );

    const updated = await ReservationModel.cancelReservation(reservation.id_item_history);
    res.json(updated);
  } catch (err) { next(err); }
}

export async function completeReservation(req, res, next) {
  try {
    const reservation = await ReservationModel.getReservationById(Number(req.params.id));
    if (!reservation) return res.status(404).json({ error: 'Reserva no encontrada' });
    if (reservation.fk_buyer_id !== req.user.id_users)
      return res.status(403).json({ error: 'Solo el comprador puede completar la reserva' });
    if (reservation.trade_status !== 'pending')
      return res.status(409).json({ error: 'Solo se pueden completar reservas pendientes' });

    // Marcar item como vendido
    await pool.query(
      `UPDATE items SET conservation_status = 'sold', item_status = 'sold', item_update = NOW() WHERE id_items = ?`,
      [reservation.fk_items_id]
    );

    const updated = await ReservationModel.completeReservation(reservation.id_item_history);
    res.json(updated);
  } catch (err) { next(err); }
}
