-- ========================================================================
-- SKEMA DATABASE MYSQL / MARIADB SIAKAD MADRASAH
-- ========================================================================
-- Petunjuk Import:
-- 1. Buka phpMyAdmin di Plesk / cPanel / DirectAdmin hosting Anda.
-- 2. Pilih nama database yang telah Anda buat di menu Database hosting.
-- 3. Klik tab "Import" di bagian atas phpMyAdmin.
-- 4. Pilih file `database-mysql.sql` ini dan klik tombol "Go" / "Kirim".
-- ========================================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- 1. Tabel Utama `site_settings`
-- Menyimpan seluruh konfigurasi, siswa, guru, artikel, & data siakad (Format JSON)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_settings` (
  `id` VARCHAR(191) NOT NULL,
  `value` LONGTEXT NOT NULL,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- 2. Tabel `users` (Opsional / Data Pengguna Administrator)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) DEFAULT 'admin',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Admin Default
INSERT IGNORE INTO `users` (`id`, `username`, `email`, `password`, `role`) 
VALUES (1, 'admin', 'admin@madrasah.sch.id', '$2y$10$4qK1nZ94f1O1wUfB1y5lce0Yl9e4k1w8m9Z1x2y3z4a5b6c7d8e9f', 'admin');

COMMIT;
SET FOREIGN_KEY_CHECKS = 1;
