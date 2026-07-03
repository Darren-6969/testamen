/*
Navicat MySQL Data Transfer

Source Server         : localhost_3306
Source Server Version : 50505
Source Host           : localhost:3306
Source Database       : default_database

Target Server Type    : MYSQL
Target Server Version : 50505
File Encoding         : 65001

Date: 2025-09-12 16:52:13
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for module
-- ----------------------------
DROP TABLE IF EXISTS `module`;
CREATE TABLE `module` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(255) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `icon` varchar(255) DEFAULT NULL,
  `display_status` varchar(255) DEFAULT 'ACTIVE',
  `listing_order` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of module
-- ----------------------------
INSERT INTO `module` VALUES ('1', 'Dashboard', 'Dashboard', 'Home', 'ACTIVE', '1', '/module/dashboard');
INSERT INTO `module` VALUES ('2', 'Users', 'Users', 'Users', 'ACTIVE', '2', '/module/users');
INSERT INTO `module` VALUES ('3', 'Products', 'Products', 'Package', 'ACTIVE', '3', '/module/products');
INSERT INTO `module` VALUES ('4', 'Orders', 'Orders', 'FileText', 'ACTIVE', '4', '/module/orders');
INSERT INTO `module` VALUES ('5', 'Analytics', 'Analytics', 'BarChart3', 'ACTIVE', '5', '/module/analytics');
INSERT INTO `module` VALUES ('6', 'Settings', 'Settings', 'Settings', 'ACTIVE', '6', '/module/settings');
INSERT INTO `module` VALUES ('7', 'User Access', 'User Access', 'User', 'ACTIVE', '7', '/module/user-access');

-- ----------------------------
-- Table structure for running_no
-- ----------------------------
DROP TABLE IF EXISTS `running_no`;
CREATE TABLE `running_no` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doc_name` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '',
  `prefix` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT '',
  `next_no` int(11) DEFAULT 0,
  `digit_no` int(11) DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of running_no
-- ----------------------------

-- ----------------------------
-- Table structure for submodule
-- ----------------------------
DROP TABLE IF EXISTS `submodule`;
CREATE TABLE `submodule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `submodule` varchar(255) NOT NULL DEFAULT '',
  `module_id` int(11) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `display_status` varchar(255) DEFAULT 'ACTIVE',
  `url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of submodule
-- ----------------------------

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `role_id` int(10) DEFAULT NULL,
  `acc_status` varchar(255) DEFAULT 'Active',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of users
-- ----------------------------
INSERT INTO `users` VALUES ('1', 'admin', '$2b$10$YfVgRLm4opd.2t/GCm6vxuuQq8GH1DSgs.BY/DVrJDNqCdSBRFBle', '2025-06-18 16:16:37', 'John Doe', 'john@example.com', '1', 'Active');
INSERT INTO `users` VALUES ('2', 'janesmith', '$2b$10$kJjbIbxtb5E81IqpROK9H.lCteMzg7rx7R057A1R0Dl.LAMoKKF1m', '2025-06-18 16:23:07', 'Jane Smith', 'jane@example.com', '2', 'Active');

-- ----------------------------
-- Table structure for user_module_access
-- ----------------------------
DROP TABLE IF EXISTS `user_module_access`;
CREATE TABLE `user_module_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `module_id` int(11) DEFAULT NULL,
  `display_status` varchar(255) DEFAULT NULL,
  `access` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of user_module_access
-- ----------------------------
INSERT INTO `user_module_access` VALUES ('1', null, '1', '1', 'Active', '1');
INSERT INTO `user_module_access` VALUES ('2', null, '1', '2', 'Active', '1');
INSERT INTO `user_module_access` VALUES ('3', null, '1', '3', 'Active', '1');
INSERT INTO `user_module_access` VALUES ('4', null, '1', '4', 'Active', '1');
INSERT INTO `user_module_access` VALUES ('5', null, '1', '5', 'Active', '1');
INSERT INTO `user_module_access` VALUES ('6', null, '1', '6', 'Active', '1');
INSERT INTO `user_module_access` VALUES ('7', null, '1', '7', 'Active', '1');

-- ----------------------------
-- Table structure for user_role
-- ----------------------------
DROP TABLE IF EXISTS `user_role`;
CREATE TABLE `user_role` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_name` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'Active',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of user_role
-- ----------------------------
INSERT INTO `user_role` VALUES ('1', 'Admin', 'Active');
INSERT INTO `user_role` VALUES ('2', 'User', 'Active');

-- ----------------------------
-- Table structure for user_submodule_access
-- ----------------------------
DROP TABLE IF EXISTS `user_submodule_access`;
CREATE TABLE `user_submodule_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `staff_id` int(11) DEFAULT NULL,
  `module_id` int(11) DEFAULT NULL,
  `submodule_id` int(11) DEFAULT NULL,
  `display_status` varchar(255) DEFAULT NULL,
  `add_access` int(11) DEFAULT NULL,
  `edit_access` int(11) DEFAULT NULL,
  `view_access` int(11) DEFAULT NULL,
  `delete_access` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Records of user_submodule_access
-- ----------------------------
