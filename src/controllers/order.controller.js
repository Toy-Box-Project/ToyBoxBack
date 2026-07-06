/**
 * Controller responsible for read access to a user's orders
 * (completed purchases and sales derived from item history).
 */
import * as OrderModel from '../models/order.model.js';

/**
 * Lists the current user's completed purchases (orders where they were the buyer).
 * Reads req.user.id_users.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of purchase orders.
 */
export async function getPurchases(req, res, next) {
  try {
    res.json(await OrderModel.getPurchases(req.user.id_users));
  } catch (err) { next(err); }
}

/**
 * Lists the current user's completed sales (orders where they were the seller).
 * Reads req.user.id_users.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with an array of sale orders.
 */
export async function getSales(req, res, next) {
  try {
    res.json(await OrderModel.getSales(req.user.id_users));
  } catch (err) { next(err); }
}

/**
 * Retrieves a single order by id, scoped to the current user.
 * Reads req.params.id and req.user.id_users; the model query itself
 * restricts results to orders the user participated in (as buyer or seller).
 * @param {import('express').Request} req - Express request; params.id identifies the order.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Delegates unexpected errors to the error handler.
 * @returns {Promise<void>} 200 with the order.
 * @throws Responds 404 if the order doesn't exist or the user has no access to it.
 */
export async function getOrder(req, res, next) {
  try {
    const order = await OrderModel.getOrderById(Number(req.params.id), req.user.id_users);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada o sin acceso' });
    res.json(order);
  } catch (err) { next(err); }
}
