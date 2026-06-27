-- Seed mínimo para desarrollo
-- Contraseña admin: Admin1234! (bcrypt hash)
-- Contraseña user:  User1234!  (bcrypt hash)

INSERT IGNORE INTO `categories` (`name`, `description`) VALUES
  ('Juguetes clásicos', 'Muñecas, peluches, juegos de mesa y juguetes tradicionales'),
  ('Vehículos', 'Coches, trenes, motos y todo tipo de vehículos de juguete');

INSERT IGNORE INTO `users`
  (`username`, `email`, `password`, `first_name`, `last_name`, `user_birthday`, `user_city`, `user_province`, `user_zipcode`, `role`, `status`)
VALUES
  ('admin', 'admin@toybox.com',
   '$2a$10$hxlKoE6V5EoYb5hRCn5sAOUKBqTQ5RnJg3FbV.pnRYXpuXm.YRHwy',
   'Admin', 'ToyBox', '1990-01-01', 'Madrid', 'Madrid', '28001',
   'administrator', 'active'),
  ('testuser', 'user@toybox.com',
   '$2a$10$hxlKoE6V5EoYb5hRCn5sAOUKBqTQ5RnJg3FbV.pnRYXpuXm.YRHwy',
   'Test', 'User', '1995-06-15', 'Barcelona', 'Cataluña', '08001',
   'user', 'active');
