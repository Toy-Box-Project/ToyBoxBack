-- ToyBox Schema
-- MySQL 8.0+

SET FOREIGN_KEY_CHECKS = 0;

-- --------------------------------------------------------
-- USERS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id_users`          INT UNSIGNED     NOT NULL AUTO_INCREMENT,
  `username`          VARCHAR(50)      NOT NULL,
  `email`             VARCHAR(100)     NOT NULL,
  `password`          VARCHAR(255)     NOT NULL,
  `first_name`        VARCHAR(50)      NOT NULL,
  `last_name`         VARCHAR(50)      NOT NULL,
  `user_birthday`     DATE             NOT NULL,
  `user_city`         VARCHAR(100)     NOT NULL,
  `user_province`     VARCHAR(100)     NOT NULL,
  `user_zipcode`      VARCHAR(10)      NOT NULL,
  `phone_number`      VARCHAR(20)      DEFAULT NULL,
  `profile_picture`   VARCHAR(255)     DEFAULT NULL,
  `role`              ENUM('user','moderator','administrator') NOT NULL DEFAULT 'user',
  `status`            ENUM('active','blocked')                NOT NULL DEFAULT 'active',
  `registration_date` DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_users`),
  UNIQUE KEY `uq_users_email`    (`email`),
  UNIQUE KEY `uq_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- CATEGORIES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `categories` (
  `id_categories` INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `name`          VARCHAR(100)  NOT NULL,
  `description`   TEXT          DEFAULT NULL,
  PRIMARY KEY (`id_categories`),
  UNIQUE KEY `uq_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ITEMS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `items` (
  `id_items`             INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  `title`                VARCHAR(150)   NOT NULL,
  `description`          VARCHAR(255)   NOT NULL,
  `price`                DECIMAL(10,2)  NOT NULL,
  `location`             VARCHAR(150)   DEFAULT NULL,
  `conservation_status`  ENUM('draft','published','reserved','under_review','sold','removed') NOT NULL DEFAULT 'draft',
  `item_status`          ENUM('available','sold','deleted') NOT NULL DEFAULT 'available',
  `publication_date`     DATETIME       DEFAULT NULL,
  `item_update`          DATETIME       DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  `fk_seller_id`         INT UNSIGNED   NOT NULL,
  `fk_categories_id`     INT UNSIGNED   NOT NULL,
  PRIMARY KEY (`id_items`),
  KEY `idx_items_seller`   (`fk_seller_id`),
  KEY `idx_items_category` (`fk_categories_id`),
  KEY `idx_items_status`   (`conservation_status`),
  CONSTRAINT `fk_items_seller`   FOREIGN KEY (`fk_seller_id`)     REFERENCES `users`       (`id_users`)       ON DELETE RESTRICT,
  CONSTRAINT `fk_items_category` FOREIGN KEY (`fk_categories_id`) REFERENCES `categories`  (`id_categories`)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ITEMS_PHOTOS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `items_photos` (
  `id_items_photos` INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `photo_url`       VARCHAR(255)  NOT NULL,
  `photo_order`     TINYINT       NOT NULL DEFAULT 1,
  `fk_items_id`     INT UNSIGNED  NOT NULL,
  PRIMARY KEY (`id_items_photos`),
  KEY `idx_photos_item` (`fk_items_id`),
  CONSTRAINT `fk_photos_item` FOREIGN KEY (`fk_items_id`) REFERENCES `items` (`id_items`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- CONVERSATIONS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `conversations` (
  `id_conversations` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `fk_items_id`      INT UNSIGNED NOT NULL,
  `fk_seller_id`     INT UNSIGNED NOT NULL,
  `fk_buyer_id`      INT UNSIGNED NOT NULL,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_conversations`),
  UNIQUE KEY `uq_product_sell_buy` (`fk_items_id`, `fk_seller_id`, `fk_buyer_id`),
  CONSTRAINT `fk_conv_item`   FOREIGN KEY (`fk_items_id`)  REFERENCES `items` (`id_items`)  ON DELETE CASCADE,
  CONSTRAINT `fk_conv_seller` FOREIGN KEY (`fk_seller_id`) REFERENCES `users` (`id_users`)  ON DELETE RESTRICT,
  CONSTRAINT `fk_conv_buyer`  FOREIGN KEY (`fk_buyer_id`)  REFERENCES `users` (`id_users`)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- MESSAGES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
  `id_messages`          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `content`              TEXT         NOT NULL,
  `sent_at`              DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `read`                 TINYINT(1)   NOT NULL DEFAULT 0,
  `fk_conversations_id`  INT UNSIGNED NOT NULL,
  `fk_users_id_sent`     INT UNSIGNED NOT NULL,
  `fk_users_id_received` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_messages`),
  KEY `idx_msg_conv`     (`fk_conversations_id`),
  KEY `idx_msg_sender`   (`fk_users_id_sent`),
  KEY `idx_msg_receiver` (`fk_users_id_received`),
  CONSTRAINT `fk_msg_conv`     FOREIGN KEY (`fk_conversations_id`) REFERENCES `conversations` (`id_conversations`) ON DELETE CASCADE,
  CONSTRAINT `fk_msg_sender`   FOREIGN KEY (`fk_users_id_sent`)     REFERENCES `users` (`id_users`) ON DELETE RESTRICT,
  CONSTRAINT `fk_msg_receiver` FOREIGN KEY (`fk_users_id_received`) REFERENCES `users` (`id_users`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- REPORTS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reports` (
  `id_reports`              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `reason`                  TEXT         NOT NULL,
  `status`                  ENUM('pending','resolved') NOT NULL DEFAULT 'pending',
  `report_date`             DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fk_items_id`             INT UNSIGNED NOT NULL,
  `fk_user_reported`        INT UNSIGNED NOT NULL,
  `fk_user_reports_received` INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_reports`),
  KEY `idx_report_item`     (`fk_items_id`),
  CONSTRAINT `fk_report_item`     FOREIGN KEY (`fk_items_id`)              REFERENCES `items` (`id_items`)  ON DELETE CASCADE,
  CONSTRAINT `fk_report_reported` FOREIGN KEY (`fk_user_reported`)         REFERENCES `users` (`id_users`)  ON DELETE RESTRICT,
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`fk_user_reports_received`) REFERENCES `users` (`id_users`)  ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- MODERATION_ACTIONS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `moderation_actions` (
  `id_moderation_actions` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `decision`              ENUM('reactivated','removed') NOT NULL,
  `action_date`           DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `notes`                 TEXT         DEFAULT NULL,
  `fk_reports_id`         INT UNSIGNED NOT NULL,
  `fk_moderator_id`       INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_moderation_actions`),
  CONSTRAINT `fk_modaction_report` FOREIGN KEY (`fk_reports_id`)   REFERENCES `reports` (`id_reports`) ON DELETE CASCADE,
  CONSTRAINT `fk_modaction_mod`    FOREIGN KEY (`fk_moderator_id`) REFERENCES `users`   (`id_users`)   ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ITEM_HISTORY (reservas / transacciones)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `item_history` (
  `id_item_history` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `trade_status`    ENUM('pending','done','cancelled') NOT NULL DEFAULT 'pending',
  `trade_date`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fk_items_id`     INT UNSIGNED NOT NULL,
  `fk_buyer_id`     INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_item_history`),
  KEY `idx_history_item`  (`fk_items_id`),
  KEY `idx_history_buyer` (`fk_buyer_id`),
  CONSTRAINT `fk_history_item`  FOREIGN KEY (`fk_items_id`) REFERENCES `items` (`id_items`) ON DELETE RESTRICT,
  CONSTRAINT `fk_history_buyer` FOREIGN KEY (`fk_buyer_id`) REFERENCES `users` (`id_users`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- REVIEWS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `reviews` (
  `id_reviews`    INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `rating`        TINYINT      NOT NULL CHECK (`rating` BETWEEN 1 AND 5),
  `comment`       TEXT         DEFAULT NULL,
  `review_date`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fk_items_id`   INT UNSIGNED NOT NULL,
  `fk_reviewer_id`  INT UNSIGNED NOT NULL,
  `fk_reviewed_id`  INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_reviews`),
  UNIQUE KEY `uq_review_item_reviewer` (`fk_items_id`, `fk_reviewer_id`),
  CONSTRAINT `fk_review_item`     FOREIGN KEY (`fk_items_id`)    REFERENCES `items` (`id_items`) ON DELETE CASCADE,
  CONSTRAINT `fk_review_reviewer` FOREIGN KEY (`fk_reviewer_id`) REFERENCES `users` (`id_users`) ON DELETE RESTRICT,
  CONSTRAINT `fk_review_reviewed` FOREIGN KEY (`fk_reviewed_id`) REFERENCES `users` (`id_users`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- FAVORITES
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `favorites` (
  `fk_users_id` INT UNSIGNED NOT NULL,
  `fk_items_id` INT UNSIGNED NOT NULL,
  `added_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`fk_users_id`, `fk_items_id`),
  CONSTRAINT `fk_fav_user` FOREIGN KEY (`fk_users_id`) REFERENCES `users` (`id_users`) ON DELETE CASCADE,
  CONSTRAINT `fk_fav_item` FOREIGN KEY (`fk_items_id`) REFERENCES `items` (`id_items`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- NOTIFICATIONS
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id_notifications` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `message`          TEXT         NOT NULL,
  `read`             TINYINT(1)   NOT NULL DEFAULT 0,
  `created_at`       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fk_users_id`      INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_notifications`),
  KEY `idx_notif_user` (`fk_users_id`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`fk_users_id`) REFERENCES `users` (`id_users`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- ITEMS_VIEW (registro de visitas)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `items_view` (
  `id_items_view` INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `viewed_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `fk_items_id`   INT UNSIGNED NOT NULL,
  `fk_users_id`   INT UNSIGNED NOT NULL,
  PRIMARY KEY (`id_items_view`),
  KEY `idx_view_item` (`fk_items_id`),
  CONSTRAINT `fk_view_item` FOREIGN KEY (`fk_items_id`) REFERENCES `items` (`id_items`) ON DELETE CASCADE,
  CONSTRAINT `fk_view_user` FOREIGN KEY (`fk_users_id`) REFERENCES `users` (`id_users`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
