import * as OrderModel from '../models/order.model.js';

export async function getPurchases(req, res, next) {
  try {
    res.json(await OrderModel.getPurchases(req.user.id_users));
  } catch (err) { next(err); }
}

export async function getSales(req, res, next) {
  try {
    res.json(await OrderModel.getSales(req.user.id_users));
  } catch (err) { next(err); }
}

export async function getOrder(req, res, next) {
  try {
    const order = await OrderModel.getOrderById(Number(req.params.id), req.user.id_users);
    if (!order) return res.status(404).json({ error: 'Orden no encontrada o sin acceso' });
    res.json(order);
  } catch (err) { next(err); }
}
