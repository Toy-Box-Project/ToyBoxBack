const pool = require("../config/db");

const ItemsController = {
  getAll: async (req, res) => {
    try {
      const [items] = await pool.query("SELECT * FROM items");
      return res.status(200).json(items);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al obtener los items" });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;
      const [items] = await pool.query("SELECT * FROM items WHERE id_items = ?", [id]);

      if (items.length === 0) {
        return res.status(404).json({ message: "Item no encontrado" });
      }

      return res.status(200).json(items[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al obtener el item" });
    }
  },

  create: async (req, res) => {
    try {
      const {
        title,
        description,
        price,
        conservation_status,
        location,
        fk_categories_id
      } = req.body;

      const [result] = await pool.query(
        `INSERT INTO items 
        (title, description, price, conservation_status, location, fk_categories_id) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [title, description, price, conservation_status, location, fk_categories_id]
      );

      return res.status(201).json({ id_items: result.insertId });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al crear el item" });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;
      const fields = req.body;

      const [result] = await pool.query(
        "UPDATE items SET ? WHERE id_items = ?",
        [fields, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Item no encontrado" });
      }

      return res.status(200).json({ message: "Item actualizado" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al actualizar el item" });
    }
  },

  delete: async (req, res) => {
    try {
      const { id } = req.params;

      const [result] = await pool.query(
        "DELETE FROM items WHERE id_items = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: "Item no encontrado" });
      }

      return res.status(200).json({ message: "Item eliminado" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Error al eliminar el item" });
    }
  }
};

module.exports = ItemsController;
