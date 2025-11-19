-- MySQL dump 10.13  Distrib 8.0.44, for Linux (aarch64)
--
-- Host: localhost    Database: callcenter
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `agent_states`
--

DROP TABLE IF EXISTS `agent_states`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `agent_states` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `state` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'offline',
  `reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_state_change` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `total_login_time` int NOT NULL DEFAULT '0',
  `total_ready_time` int NOT NULL DEFAULT '0',
  `total_break_time` int NOT NULL DEFAULT '0',
  `total_away_time` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_user` (`tenant_id`,`user_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_state` (`state`),
  KEY `idx_last_state_change` (`last_state_change`),
  CONSTRAINT `agent_states_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `agent_states_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `agent_states`
--

LOCK TABLES `agent_states` WRITE;
/*!40000 ALTER TABLE `agent_states` DISABLE KEYS */;
/*!40000 ALTER TABLE `agent_states` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ai_agent_config`
--

DROP TABLE IF EXISTS `ai_agent_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ai_agent_config` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `model` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'gemini-pro',
  `api_key_encrypted` text COLLATE utf8mb4_unicode_ci,
  `system_prompt` text COLLATE utf8mb4_unicode_ci,
  `personality` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'professional',
  `max_tokens` int DEFAULT '500',
  `temperature` float DEFAULT '0.7',
  `auto_handoff_enabled` tinyint(1) DEFAULT '1',
  `handoff_confidence_threshold` float DEFAULT '0.5',
  `handoff_message_count` int DEFAULT '10',
  `handoff_timeout_seconds` int DEFAULT '300',
  `response_delay_ms` int DEFAULT '1000',
  `collect_email` tinyint(1) DEFAULT '1',
  `collect_phone` tinyint(1) DEFAULT '1',
  `collect_name` tinyint(1) DEFAULT '1',
  `business_hours_only` tinyint(1) DEFAULT '0',
  `fallback_message` text COLLATE utf8mb4_unicode_ci,
  `greeting_message` text COLLATE utf8mb4_unicode_ci,
  `rag_enabled` tinyint(1) DEFAULT '1',
  `rag_similarity_threshold` float DEFAULT '0.7',
  `rag_max_results` int DEFAULT '3',
  `sentiment_analysis_enabled` tinyint(1) DEFAULT '1',
  `intent_detection_enabled` tinyint(1) DEFAULT '1',
  `language_detection_enabled` tinyint(1) DEFAULT '0',
  `supported_languages` json DEFAULT NULL,
  `analytics_enabled` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `profile_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Default Profile',
  `description` text COLLATE utf8mb4_unicode_ci,
  `website_id` bigint DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `kb_tags` json DEFAULT NULL COMMENT 'KB articles matching these tags',
  PRIMARY KEY (`id`),
  KEY `fk_ai_agent_website` (`website_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  CONSTRAINT `ai_agent_config_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ai_agent_website` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_agent_config`
--

LOCK TABLES `ai_agent_config` WRITE;
/*!40000 ALTER TABLE `ai_agent_config` DISABLE KEYS */;
INSERT INTO `ai_agent_config` VALUES (1,'demo-tenant',1,'gemini-2.0-flash',NULL,'You are a helpful customer service AI assistant. Be friendly, professional, and concise. \n    If you cannot answer a question with confidence, politely offer to connect the customer with a human agent.\n    Always prioritize customer satisfaction and provide accurate information based on the knowledge base.','professional',500,0.7,1,0.5,10,300,1000,1,1,1,0,NULL,'Hello! I\'m your AI assistant. How can I help you today?',1,0.7,3,1,1,0,NULL,1,'2025-10-31 23:08:05','2025-11-04 00:20:47','E-commerce Support Bot','AI assistant specialized in product inquiries, shipping, and order management',1,1,'[\"ecommerce\", \"products\", \"shipping\", \"returns\"]'),(3,'demo-tenant',1,'gemini-2.0-flash',NULL,'You are a technical support AI assistant. Help users troubleshoot issues, find documentation, and resolve technical problems. Be precise and provide step-by-step instructions.','professional',800,0.5,1,0.5,10,300,1000,1,1,1,0,NULL,NULL,1,0.7,3,1,1,0,NULL,1,'2025-11-04 00:35:53','2025-11-04 00:35:53','Technical Support Bot','AI assistant specialized in technical troubleshooting and documentation',2,0,'[\"technical\", \"support\", \"troubleshooting\", \"docs\"]'),(4,'demo-tenant',1,'gemini-2.0-flash',NULL,'You are a sales and marketing AI assistant. Help visitors learn about our products, features, and pricing. Be enthusiastic and highlight value propositions.','professional',600,0.8,1,0.5,10,300,1000,1,1,1,0,NULL,NULL,1,0.7,3,1,1,0,NULL,1,'2025-11-04 00:35:53','2025-11-04 00:35:53','Sales & Marketing Bot','AI assistant focused on lead generation, product features, and pricing inquiries',3,0,'[\"marketing\", \"sales\", \"features\", \"pricing\"]'),(5,'demo-tenant',1,'','','','professional',0,0.8,1,0.5,10,300,1000,1,1,1,0,'','',0,0.7,3,1,1,0,NULL,1,'2025-11-04 10:41:49','2025-11-04 10:42:32','','',NULL,0,'[\"blog\", \"content\"]'),(6,'demo-tenant',1,'','','','professional',800,0.9,1,0.5,10,300,1000,1,1,1,0,'','',0,0.7,3,1,1,0,NULL,1,'2025-11-04 10:57:03','2025-11-04 10:57:03','','',NULL,0,'[\"test\", \"portal\", \"support\", \"faq\"]');
/*!40000 ALTER TABLE `ai_agent_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` bigint DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `resource_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `resource_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `changes` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_action` (`action`),
  KEY `idx_resource_type` (`resource_type`),
  KEY `idx_resource_id` (`resource_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `audit_logs_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `audit_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blacklist`
--

DROP TABLE IF EXISTS `blacklist`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blacklist` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `added_by` bigint DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_phone` (`tenant_id`,`phone_number`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_phone_number` (`phone_number`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `added_by` (`added_by`),
  CONSTRAINT `blacklist_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `blacklist_ibfk_2` FOREIGN KEY (`added_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blacklist`
--

LOCK TABLES `blacklist` WRITE;
/*!40000 ALTER TABLE `blacklist` DISABLE KEYS */;
/*!40000 ALTER TABLE `blacklist` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `call_surveys`
--

DROP TABLE IF EXISTS `call_surveys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `call_surveys` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `questions` json NOT NULL,
  `trigger_on` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'call_end',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `call_surveys_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_surveys`
--

LOCK TABLES `call_surveys` WRITE;
/*!40000 ALTER TABLE `call_surveys` DISABLE KEYS */;
/*!40000 ALTER TABLE `call_surveys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `call_tags`
--

DROP TABLE IF EXISTS `call_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `call_tags` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `cdr_id` bigint NOT NULL,
  `tag` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cdr_id` (`cdr_id`),
  KEY `idx_tag` (`tag`),
  KEY `idx_created_by` (`created_by`),
  CONSTRAINT `call_tags_ibfk_1` FOREIGN KEY (`cdr_id`) REFERENCES `cdrs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `call_tags_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `call_tags`
--

LOCK TABLES `call_tags` WRITE;
/*!40000 ALTER TABLE `call_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `call_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cdrs`
--

DROP TABLE IF EXISTS `cdrs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cdrs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unique_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `call_date` timestamp NOT NULL,
  `caller_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `destination_channel` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direction` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int NOT NULL DEFAULT '0',
  `billable_duration` int NOT NULL DEFAULT '0',
  `disposition` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recording_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agent_id` bigint DEFAULT NULL,
  `agent_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `queue_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `did_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_field` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_id` (`unique_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_unique_id` (`unique_id`),
  KEY `idx_call_date` (`call_date`),
  KEY `idx_caller_id` (`caller_id`),
  KEY `idx_destination` (`destination`),
  KEY `idx_disposition` (`disposition`),
  KEY `idx_agent_id` (`agent_id`),
  KEY `idx_queue_name` (`queue_name`),
  KEY `idx_direction` (`direction`),
  CONSTRAINT `cdrs_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `cdrs_ibfk_2` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cdrs`
--

LOCK TABLES `cdrs` WRITE;
/*!40000 ALTER TABLE `cdrs` DISABLE KEYS */;
/*!40000 ALTER TABLE `cdrs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `channel_connections`
--

DROP TABLE IF EXISTS `channel_connections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channel_connections` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `website_id` bigint NOT NULL COMMENT 'Which website/business this channel belongs to',
  `channel_type` enum('web','whatsapp','facebook','instagram','telegram','twitter','sms','email') COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Friendly name: "Main Website Chat", "Support WhatsApp"',
  `credentials` json DEFAULT NULL COMMENT 'Channel-specific connection details',
  `is_active` tinyint(1) DEFAULT '1',
  `auto_respond` tinyint(1) DEFAULT '0' COMMENT 'Enable AI auto-response',
  `business_hours_only` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_connected_at` timestamp NULL DEFAULT NULL,
  `connection_status` enum('active','disconnected','error','pending') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_website_channel` (`website_id`,`channel_type`,`channel_name`),
  KEY `idx_tenant_website` (`tenant_id`,`website_id`),
  KEY `idx_channel_type` (`channel_type`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `channel_connections_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `channel_connections_ibfk_2` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channel_connections`
--

LOCK TABLES `channel_connections` WRITE;
/*!40000 ALTER TABLE `channel_connections` DISABLE KEYS */;
INSERT INTO `channel_connections` VALUES (1,'demo-tenant',1,'whatsapp','E-commerce Store - WhatsApp','{\"access_token\": \"\", \"phone_number_id\": \"\", \"business_account_id\": \"\", \"webhook_verify_token\": \"whatsapp_1_verify\"}',0,1,0,'2025-11-04 12:55:40','2025-11-04 12:55:40',NULL,'disconnected'),(2,'demo-tenant',2,'whatsapp','Support Portal - WhatsApp','{\"access_token\": \"\", \"phone_number_id\": \"\", \"business_account_id\": \"\", \"webhook_verify_token\": \"whatsapp_2_verify\"}',0,1,0,'2025-11-04 12:55:40','2025-11-04 12:55:40',NULL,'disconnected'),(4,'demo-tenant',1,'facebook','E-commerce Store - Facebook Messenger','{\"app_id\": \"\", \"page_id\": \"\", \"app_secret\": \"\", \"page_access_token\": \"\", \"webhook_verify_token\": \"fb_1_verify\"}',0,1,0,'2025-11-04 12:55:40','2025-11-04 12:55:40',NULL,'disconnected'),(5,'demo-tenant',2,'facebook','Support Portal - Facebook Messenger','{\"app_id\": \"\", \"page_id\": \"\", \"app_secret\": \"\", \"page_access_token\": \"\", \"webhook_verify_token\": \"fb_2_verify\"}',0,1,0,'2025-11-04 12:55:40','2025-11-04 12:55:40',NULL,'disconnected'),(7,'demo-tenant',1,'instagram','E-commerce Store - Instagram DM','{\"access_token\": \"\", \"instagram_account_id\": \"\", \"webhook_verify_token\": \"ig_1_verify\"}',0,0,0,'2025-11-04 12:55:40','2025-11-04 12:55:40',NULL,'disconnected'),(8,'demo-tenant',1,'whatsapp','Test WhatsApp Channel','{\"access_token\": \"EAAtest_token_placeholder_for_demo_purposes_only\", \"phone_number_id\": \"123456789012345\", \"business_account_id\": \"987654321098765\", \"webhook_verify_token\": \"my_secure_verify_token_123\"}',1,1,0,'2025-11-04 17:26:56','2025-11-04 17:53:27',NULL,'pending');
/*!40000 ALTER TABLE `channel_connections` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `channel_integrations`
--

DROP TABLE IF EXISTS `channel_integrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `channel_integrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `channel` enum('whatsapp','facebook','instagram','twitter','telegram','web','sms') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `credentials` json NOT NULL,
  `webhook_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `webhook_secret` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `verify_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `page_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_bot_enabled` tinyint(1) DEFAULT '1',
  `welcome_message` text COLLATE utf8mb4_unicode_ci,
  `offline_message` text COLLATE utf8mb4_unicode_ci,
  `business_hours` json DEFAULT NULL,
  `last_sync_at` timestamp NULL DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT NULL,
  `message_count` int DEFAULT '0',
  `error_log` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_channel` (`tenant_id`,`channel`,`phone_number`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `channel_integrations_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `channel_integrations`
--

LOCK TABLES `channel_integrations` WRITE;
/*!40000 ALTER TABLE `channel_integrations` DISABLE KEYS */;
/*!40000 ALTER TABLE `channel_integrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_agents`
--

DROP TABLE IF EXISTS `chat_agents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_agents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_available` tinyint(1) NOT NULL DEFAULT '0',
  `max_concurrent_chats` int NOT NULL DEFAULT '5',
  `current_chat_count` int NOT NULL DEFAULT '0',
  `auto_accept` tinyint(1) NOT NULL DEFAULT '0',
  `away_message` text COLLATE utf8mb4_unicode_ci,
  `skills` json DEFAULT NULL,
  `last_activity_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `current_chats` int DEFAULT '0',
  `team` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auto_accept_chats` tinyint(1) DEFAULT '1',
  `notification_enabled` tinyint(1) DEFAULT '1',
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_user` (`tenant_id`,`user_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_available` (`is_available`),
  CONSTRAINT `chat_agents_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_agents_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_agents`
--

LOCK TABLES `chat_agents` WRITE;
/*!40000 ALTER TABLE `chat_agents` DISABLE KEYS */;
INSERT INTO `chat_agents` VALUES (1,'demo-tenant',1,NULL,NULL,1,5,0,1,NULL,NULL,NULL,'2025-11-02 10:11:57','2025-11-03 22:06:35',0,NULL,1,1,NULL),(2,'demo-tenant',2,NULL,NULL,1,5,0,1,NULL,NULL,NULL,'2025-11-02 10:11:57','2025-11-05 00:00:05',4,NULL,1,1,NULL),(3,'demo-tenant',3,NULL,NULL,1,5,0,1,NULL,NULL,NULL,'2025-11-02 10:11:57','2025-11-03 22:06:35',0,NULL,1,1,NULL),(4,'demo-tenant',4,NULL,NULL,1,5,0,1,NULL,NULL,NULL,'2025-11-02 10:11:57','2025-11-03 22:06:35',0,NULL,1,1,NULL);
/*!40000 ALTER TABLE `chat_agents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_messages`
--

DROP TABLE IF EXISTS `chat_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` bigint NOT NULL,
  `sender_id` bigint DEFAULT NULL,
  `sender_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'text',
  `attachment_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `attachment_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attachment_size` bigint DEFAULT NULL,
  `attachment_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `channel_message_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Original message ID from channel',
  `channel_metadata` json DEFAULT NULL COMMENT 'Channel-specific data (attachments, reactions, etc.)',
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_sender_id` (`sender_id`),
  KEY `idx_sender_type` (`sender_type`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `chat_messages_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=274 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_messages`
--

LOCK TABLES `chat_messages` WRITE;
/*!40000 ALTER TABLE `chat_messages` DISABLE KEYS */;
INSERT INTO `chat_messages` VALUES (1,4,NULL,'visitor','Test User','What are your business hours?','text',NULL,0,NULL,'2025-11-01 19:22:08',NULL,NULL,NULL,NULL,NULL,NULL),(2,5,NULL,'visitor','Guest','hello','text',NULL,0,NULL,'2025-11-01 20:09:12',NULL,NULL,NULL,NULL,NULL,NULL),(3,5,NULL,'visitor','Guest','hello','text',NULL,0,NULL,'2025-11-01 20:09:19',NULL,NULL,NULL,NULL,NULL,NULL),(4,5,NULL,'visitor','Guest','What are your business hours?','text',NULL,0,NULL,'2025-11-01 20:09:48',NULL,NULL,NULL,NULL,NULL,NULL),(5,5,NULL,'visitor','Guest','hi','text',NULL,0,NULL,'2025-11-01 20:12:41',NULL,NULL,NULL,NULL,NULL,NULL),(6,6,NULL,'visitor','Test Customer','Hello! I need help with my account.','text',NULL,0,NULL,'2025-11-01 20:23:19',NULL,NULL,NULL,NULL,NULL,NULL),(7,5,NULL,'visitor','Guest','hi','text',NULL,0,NULL,'2025-11-01 20:28:28',NULL,NULL,NULL,NULL,NULL,NULL),(8,5,NULL,'visitor','Guest','hello','text',NULL,0,NULL,'2025-11-01 20:28:34',NULL,NULL,NULL,NULL,NULL,NULL),(9,7,NULL,'visitor','Guest','dgdg','text',NULL,0,NULL,'2025-11-01 22:30:40',NULL,NULL,NULL,NULL,NULL,NULL),(10,8,NULL,'visitor','Guest','gbd','text',NULL,0,NULL,'2025-11-01 22:30:49',NULL,NULL,NULL,NULL,NULL,NULL),(11,8,NULL,'visitor','Guest','dgd','text',NULL,0,NULL,'2025-11-01 22:30:51',NULL,NULL,NULL,NULL,NULL,NULL),(12,8,NULL,'visitor','Guest','fddg','text',NULL,0,NULL,'2025-11-01 22:30:53',NULL,NULL,NULL,NULL,NULL,NULL),(13,8,NULL,'visitor','Guest','ddg','text',NULL,0,NULL,'2025-11-01 22:30:56',NULL,NULL,NULL,NULL,NULL,NULL),(14,9,NULL,'visitor','Test Customer','cv','text',NULL,0,NULL,'2025-11-01 22:49:17',NULL,NULL,NULL,NULL,NULL,NULL),(15,8,NULL,'visitor','Guest','hello','text',NULL,0,NULL,'2025-11-01 22:50:54',NULL,NULL,NULL,NULL,NULL,NULL),(16,9,NULL,'visitor','Test Customer','hello','text',NULL,0,NULL,'2025-11-01 22:51:01',NULL,NULL,NULL,NULL,NULL,NULL),(17,8,NULL,'visitor','Guest','this is surya','text',NULL,0,NULL,'2025-11-01 22:51:18',NULL,NULL,NULL,NULL,NULL,NULL),(18,12,NULL,'visitor','Guest','hi','text',NULL,0,NULL,'2025-11-01 23:29:48',NULL,NULL,NULL,NULL,NULL,NULL),(19,13,NULL,'visitor','Test Customer','fvd','text',NULL,0,NULL,'2025-11-01 23:31:07',NULL,NULL,NULL,NULL,NULL,NULL),(20,13,NULL,'visitor','Test Customer','dfv','text',NULL,0,NULL,'2025-11-01 23:31:09',NULL,NULL,NULL,NULL,NULL,NULL),(21,14,NULL,'visitor','Test Customer','gdbvgbd','text',NULL,0,NULL,'2025-11-01 23:31:18',NULL,NULL,NULL,NULL,NULL,NULL),(22,12,NULL,'visitor','Guest','dge','text',NULL,0,NULL,'2025-11-01 23:31:28',NULL,NULL,NULL,NULL,NULL,NULL),(23,12,NULL,'visitor','Guest','ufu','text',NULL,0,NULL,'2025-11-01 23:44:28',NULL,NULL,NULL,NULL,NULL,NULL),(24,15,NULL,'visitor','Test Customer','hbk','text',NULL,0,NULL,'2025-11-01 23:44:53',NULL,NULL,NULL,NULL,NULL,NULL),(25,23,NULL,'visitor','Test Customer','nlkn','text',NULL,0,NULL,'2025-11-02 00:05:44',NULL,NULL,NULL,NULL,NULL,NULL),(26,23,NULL,'visitor','Test Customer','n k','text',NULL,0,NULL,'2025-11-02 00:06:00',NULL,NULL,NULL,NULL,NULL,NULL),(27,23,NULL,'visitor','Test Customer','how are you','text',NULL,0,NULL,'2025-11-02 00:06:10',NULL,NULL,NULL,NULL,NULL,NULL),(28,23,NULL,'visitor','Test Customer','kjk','text',NULL,0,NULL,'2025-11-02 00:06:44',NULL,NULL,NULL,NULL,NULL,NULL),(29,23,NULL,'visitor','Test Customer','jn','text',NULL,0,NULL,'2025-11-02 00:06:51',NULL,NULL,NULL,NULL,NULL,NULL),(30,24,NULL,'visitor','Test Customer','dd','text',NULL,0,NULL,'2025-11-02 00:15:20',NULL,NULL,NULL,NULL,NULL,NULL),(31,24,NULL,'visitor','Test Customer','hello','text',NULL,0,NULL,'2025-11-02 00:15:23',NULL,NULL,NULL,NULL,NULL,NULL),(32,24,NULL,'visitor','Test Customer','sf','text',NULL,0,NULL,'2025-11-02 00:15:40',NULL,NULL,NULL,NULL,NULL,NULL),(33,25,NULL,'visitor','Test Customer','cv c','text',NULL,0,NULL,'2025-11-02 00:27:26',NULL,NULL,NULL,NULL,NULL,NULL),(34,26,NULL,'visitor','Test Customer','hello','text',NULL,0,NULL,'2025-11-02 00:37:44',NULL,NULL,NULL,NULL,NULL,NULL),(35,26,NULL,'visitor','Test Customer','hi','text',NULL,0,NULL,'2025-11-02 00:38:14',NULL,NULL,NULL,NULL,NULL,NULL),(36,26,NULL,'visitor','Test Customer','gh','text',NULL,0,NULL,'2025-11-02 00:40:27',NULL,NULL,NULL,NULL,NULL,NULL),(37,27,NULL,'visitor','Test Customer','hi','text',NULL,0,NULL,'2025-11-02 00:52:13',NULL,NULL,NULL,NULL,NULL,NULL),(38,28,NULL,'visitor','Test Customer','xvx','text',NULL,0,NULL,'2025-11-02 00:53:31',NULL,NULL,NULL,NULL,NULL,NULL),(39,29,NULL,'visitor','Test Customer','jhbk','text',NULL,0,NULL,'2025-11-02 00:59:43',NULL,NULL,NULL,NULL,NULL,NULL),(40,15,NULL,'visitor','Test Customer','ljn','text',NULL,0,NULL,'2025-11-02 01:02:16',NULL,NULL,NULL,NULL,NULL,NULL),(41,30,NULL,'visitor','Test Customer','kj','text',NULL,0,NULL,'2025-11-02 01:09:38',NULL,NULL,NULL,NULL,NULL,NULL),(42,30,NULL,'visitor','Test Customer','hh','text',NULL,0,NULL,'2025-11-02 01:09:43',NULL,NULL,NULL,NULL,NULL,NULL),(43,31,NULL,'visitor','Test Customer','jnjn','text',NULL,0,NULL,'2025-11-02 01:10:27',NULL,NULL,NULL,NULL,NULL,NULL),(44,32,NULL,'visitor','Test Customer','kkj','text',NULL,0,NULL,'2025-11-02 01:10:51',NULL,NULL,NULL,NULL,NULL,NULL),(45,34,NULL,'visitor','Test Customer','jhbk','text',NULL,0,NULL,'2025-11-02 01:16:13',NULL,NULL,NULL,NULL,NULL,NULL),(46,36,NULL,'visitor','Test Customer','kjk','text',NULL,0,NULL,'2025-11-02 01:24:38',NULL,NULL,NULL,NULL,NULL,NULL),(47,36,NULL,'visitor','Test Customer','kkj','text',NULL,0,NULL,'2025-11-02 01:25:15',NULL,NULL,NULL,NULL,NULL,NULL),(48,37,NULL,'visitor','Test Customer','jbkbbjb','text',NULL,0,NULL,'2025-11-02 01:28:42',NULL,NULL,NULL,NULL,NULL,NULL),(49,37,NULL,'visitor','Test Customer','hvm','text',NULL,0,NULL,'2025-11-02 01:28:49',NULL,NULL,NULL,NULL,NULL,NULL),(50,39,NULL,'visitor','Test Customer','hvk','text',NULL,0,NULL,'2025-11-02 01:35:36',NULL,NULL,NULL,NULL,NULL,NULL),(51,40,NULL,'visitor','Test Customer','jhhhhh','text',NULL,0,NULL,'2025-11-02 01:40:18',NULL,NULL,NULL,NULL,NULL,NULL),(52,41,NULL,'visitor','Test Customer','this is surya','text',NULL,0,NULL,'2025-11-02 01:54:10',NULL,NULL,NULL,NULL,NULL,NULL),(53,41,3,'agent','Agent','helo','text',NULL,0,NULL,'2025-11-02 02:07:54',NULL,NULL,NULL,NULL,NULL,NULL),(54,43,NULL,'visitor','Test Customer','hello','text',NULL,0,NULL,'2025-11-02 02:08:28',NULL,NULL,NULL,NULL,NULL,NULL),(55,43,3,'agent','Agent','please tell me','text',NULL,0,NULL,'2025-11-02 02:08:44',NULL,NULL,NULL,NULL,NULL,NULL),(56,44,NULL,'visitor','Test Customer','ok','text',NULL,0,NULL,'2025-11-02 02:14:24',NULL,NULL,NULL,NULL,NULL,NULL),(57,44,3,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 02:14:39',NULL,NULL,NULL,NULL,NULL,NULL),(58,44,NULL,'visitor','Test Customer','this is surya chandra?','text',NULL,0,NULL,'2025-11-02 02:15:04',NULL,NULL,NULL,NULL,NULL,NULL),(59,44,3,'agent','Agent','yes how are you sunmoon','text',NULL,0,NULL,'2025-11-02 02:15:37',NULL,NULL,NULL,NULL,NULL,NULL),(60,44,NULL,'visitor','Test Customer','goooder','text',NULL,0,NULL,'2025-11-02 02:15:57',NULL,NULL,NULL,NULL,NULL,NULL),(61,44,3,'agent','Agent','oh nice','text',NULL,0,NULL,'2025-11-02 02:16:29',NULL,NULL,NULL,NULL,NULL,NULL),(62,45,NULL,'visitor','Test Customer','banter oo','text',NULL,0,NULL,'2025-11-02 02:16:52',NULL,NULL,NULL,NULL,NULL,NULL),(63,45,3,'agent','Agent','ooh kantaroo','text',NULL,0,NULL,'2025-11-02 02:17:06',NULL,NULL,NULL,NULL,NULL,NULL),(64,44,3,'agent','Agent','okkk','text',NULL,0,NULL,'2025-11-02 02:17:12',NULL,NULL,NULL,NULL,NULL,NULL),(65,44,NULL,'visitor','Test Customer','good night','text',NULL,0,NULL,'2025-11-02 02:17:28',NULL,NULL,NULL,NULL,NULL,NULL),(66,45,NULL,'visitor','Test Customer','see you tomorrrow','text',NULL,0,NULL,'2025-11-02 02:17:43',NULL,NULL,NULL,NULL,NULL,NULL),(67,46,NULL,'visitor','Test Customer','helo','text',NULL,0,NULL,'2025-11-02 02:31:12',NULL,NULL,NULL,NULL,NULL,NULL),(68,46,NULL,'visitor','Test Customer','helo','text',NULL,0,NULL,'2025-11-02 02:31:26',NULL,NULL,NULL,NULL,NULL,NULL),(69,46,NULL,'visitor','Test Customer','agent transfer','text',NULL,0,NULL,'2025-11-02 02:31:36',NULL,NULL,NULL,NULL,NULL,NULL),(70,46,NULL,'system','System','🤚 Customer has requested to speak with a human agent. Reason: customer_request','text',NULL,0,NULL,'2025-11-02 02:31:50',NULL,NULL,NULL,NULL,NULL,NULL),(71,46,NULL,'visitor','Test Customer','after tranfer','text',NULL,0,NULL,'2025-11-02 02:32:02',NULL,NULL,NULL,NULL,NULL,NULL),(72,47,NULL,'visitor','Test Customer','What are your business hours?','text',NULL,0,NULL,'2025-11-02 02:44:13',NULL,NULL,NULL,NULL,NULL,NULL),(73,47,NULL,'visitor','Test Customer','This is terrible! I\'m so frustrated and angry with your service!','text',NULL,0,NULL,'2025-11-02 02:44:15',NULL,NULL,NULL,NULL,NULL,NULL),(74,47,NULL,'visitor','Test Customer','URGENT: I need to speak to a manager immediately!','text',NULL,0,NULL,'2025-11-02 02:44:17',NULL,NULL,NULL,NULL,NULL,NULL),(75,47,NULL,'system','System','🤚 Customer has requested to speak with a human agent. Reason: customer_request','text',NULL,0,NULL,'2025-11-02 02:44:17',NULL,NULL,NULL,NULL,NULL,NULL),(76,47,NULL,'visitor','Test Customer','hello','text',NULL,0,NULL,'2025-11-02 02:50:34',NULL,NULL,NULL,NULL,NULL,NULL),(77,47,NULL,'visitor','Test Customer','hello there','text',NULL,0,NULL,'2025-11-02 02:54:08',NULL,NULL,NULL,NULL,NULL,NULL),(78,48,NULL,'visitor','Test AI','What are your business hours?','text',NULL,0,NULL,'2025-11-02 03:09:17',NULL,NULL,NULL,NULL,NULL,NULL),(79,48,NULL,'visitor','Test AI','Hello, what can you help me with?','text',NULL,0,NULL,'2025-11-02 03:09:54',NULL,NULL,NULL,NULL,NULL,NULL),(80,48,NULL,'visitor','Test AI','What services do you offer?','text',NULL,0,NULL,'2025-11-02 03:19:05',NULL,NULL,NULL,NULL,NULL,NULL),(81,48,NULL,'visitor','Test AI','hello','text',NULL,0,NULL,'2025-11-02 03:20:04',NULL,NULL,NULL,NULL,NULL,NULL),(82,48,NULL,'visitor','Test AI','What are your business hours?','text',NULL,0,NULL,'2025-11-02 03:20:47',NULL,NULL,NULL,NULL,NULL,NULL),(83,50,NULL,'visitor','Test Customer','kjk','text',NULL,0,NULL,'2025-11-02 04:03:34',NULL,NULL,NULL,NULL,NULL,NULL),(84,12,NULL,'visitor','Guest','gvh','text',NULL,0,NULL,'2025-11-02 04:03:44',NULL,NULL,NULL,NULL,NULL,NULL),(85,46,NULL,'visitor','Test Customer','hello','text',NULL,0,NULL,'2025-11-02 04:16:19',NULL,NULL,NULL,NULL,NULL,NULL),(86,51,NULL,'visitor','Test Customer','hjhjhjhj','text',NULL,0,NULL,'2025-11-02 04:17:15',NULL,NULL,NULL,NULL,NULL,NULL),(87,52,NULL,'visitor','Test Customer','kj','text',NULL,0,NULL,'2025-11-02 04:31:08',NULL,NULL,NULL,NULL,NULL,NULL),(88,52,NULL,'visitor','Test Customer','hkk','text',NULL,0,NULL,'2025-11-02 04:34:54',NULL,NULL,NULL,NULL,NULL,NULL),(89,53,NULL,'visitor','Test Customer','cvcvcv','text',NULL,0,NULL,'2025-11-02 10:14:36',NULL,NULL,NULL,NULL,NULL,NULL),(90,53,NULL,'visitor','Test Customer','ok','text',NULL,0,NULL,'2025-11-02 10:50:02',NULL,NULL,NULL,NULL,NULL,NULL),(91,53,3,'agent','Agent','kubk','text',NULL,0,NULL,'2025-11-02 10:50:14',NULL,NULL,NULL,NULL,NULL,NULL),(92,54,NULL,'visitor','Test Customer','jgjgk','text',NULL,0,NULL,'2025-11-02 10:51:14',NULL,NULL,NULL,NULL,NULL,NULL),(93,54,3,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 10:51:30',NULL,NULL,NULL,NULL,NULL,NULL),(94,53,3,'agent','Agent','ngrr','text',NULL,0,NULL,'2025-11-02 10:51:47',NULL,NULL,NULL,NULL,NULL,NULL),(95,53,3,'agent','Agent','hello','text',NULL,0,NULL,'2025-11-02 10:57:42',NULL,NULL,NULL,NULL,NULL,NULL),(96,54,NULL,'visitor','Test Customer','hello','text',NULL,0,NULL,'2025-11-02 10:57:52',NULL,NULL,NULL,NULL,NULL,NULL),(97,55,NULL,'visitor','Test Customer','jhvkjh','text',NULL,0,NULL,'2025-11-02 10:59:06',NULL,NULL,NULL,NULL,NULL,NULL),(98,56,NULL,'visitor','Test Customer','hgj','text',NULL,0,NULL,'2025-11-02 11:24:34',NULL,NULL,NULL,NULL,NULL,NULL),(99,56,NULL,'visitor','Test Customer','hello1','text',NULL,0,NULL,'2025-11-02 11:25:07',NULL,NULL,NULL,NULL,NULL,NULL),(100,55,NULL,'visitor','Test Customer','hello 2','text',NULL,0,NULL,'2025-11-02 11:25:19',NULL,NULL,NULL,NULL,NULL,NULL),(101,55,3,'agent','Agent','gggg','text',NULL,0,NULL,'2025-11-02 11:25:44',NULL,NULL,NULL,NULL,NULL,NULL),(102,56,3,'agent','Agent','jgk','text',NULL,0,NULL,'2025-11-02 11:25:48',NULL,NULL,NULL,NULL,NULL,NULL),(103,56,NULL,'visitor','Test Customer','nice','text',NULL,0,NULL,'2025-11-02 11:26:08',NULL,NULL,NULL,NULL,NULL,NULL),(104,57,NULL,'visitor','Test Customer','hjh','text',NULL,0,NULL,'2025-11-02 11:33:05',NULL,NULL,NULL,NULL,NULL,NULL),(105,57,NULL,'visitor','Test Customer','cvcvcvcvc','text',NULL,0,NULL,'2025-11-02 11:33:26',NULL,NULL,NULL,NULL,NULL,NULL),(106,57,3,'agent','Agent','bbb','text',NULL,0,NULL,'2025-11-02 11:33:49',NULL,NULL,NULL,NULL,NULL,NULL),(107,58,NULL,'visitor','Test Customer','hi','text',NULL,0,NULL,'2025-11-02 11:50:40',NULL,NULL,NULL,NULL,NULL,NULL),(108,58,NULL,'visitor','Test Customer','CVBCV','text',NULL,0,NULL,'2025-11-02 11:56:06',NULL,NULL,NULL,NULL,NULL,NULL),(109,58,NULL,'visitor','Test Customer','dfdf','text',NULL,0,NULL,'2025-11-02 12:25:43',NULL,NULL,NULL,NULL,NULL,NULL),(110,58,NULL,'visitor','Test Customer','dgdg','text',NULL,0,NULL,'2025-11-02 12:25:50',NULL,NULL,NULL,NULL,NULL,NULL),(111,58,3,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 12:29:42',NULL,NULL,NULL,NULL,NULL,NULL),(112,58,NULL,'visitor','Test Customer','jj','text',NULL,0,NULL,'2025-11-02 12:30:00',NULL,NULL,NULL,NULL,NULL,NULL),(113,59,NULL,'visitor','Test User','Hello, I need help with session persistence testing','text',NULL,0,NULL,'2025-11-02 12:30:48',NULL,NULL,NULL,NULL,NULL,NULL),(114,59,NULL,'system','System','Chat session ended by customer','text',NULL,0,NULL,'2025-11-02 12:30:51',NULL,NULL,NULL,NULL,NULL,NULL),(115,61,NULL,'visitor','Guest','What are your business hours?','text',NULL,0,NULL,'2025-11-02 12:34:08',NULL,NULL,NULL,NULL,NULL,NULL),(116,61,NULL,'visitor','Guest','fjhj','text',NULL,0,NULL,'2025-11-02 12:34:13',NULL,NULL,NULL,NULL,NULL,NULL),(117,61,NULL,'visitor','Guest','hello I using popup','text',NULL,0,NULL,'2025-11-02 12:34:45',NULL,NULL,NULL,NULL,NULL,NULL),(118,61,3,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 12:35:05',NULL,NULL,NULL,NULL,NULL,NULL),(119,61,NULL,'visitor','Guest','okkkk','text',NULL,0,NULL,'2025-11-02 12:35:49',NULL,NULL,NULL,NULL,NULL,NULL),(120,61,3,'agent','Agent','nnoo','text',NULL,0,NULL,'2025-11-02 12:36:03',NULL,NULL,NULL,NULL,NULL,NULL),(121,61,NULL,'visitor','Guest','What are your business hours?','text',NULL,0,NULL,'2025-11-02 12:36:18',NULL,NULL,NULL,NULL,NULL,NULL),(122,63,NULL,'visitor','Guest','What are your business hours?','text',NULL,0,NULL,'2025-11-02 12:36:35',NULL,NULL,NULL,NULL,NULL,NULL),(123,64,NULL,'visitor','Restore Test','Test message for restoration','text',NULL,0,NULL,'2025-11-02 12:43:19',NULL,NULL,NULL,NULL,NULL,NULL),(124,65,NULL,'visitor','Guest','hi','text',NULL,0,NULL,'2025-11-02 12:45:49',NULL,NULL,NULL,NULL,NULL,NULL),(125,65,3,'agent','Agent','how are you','text',NULL,0,NULL,'2025-11-02 12:46:00',NULL,NULL,NULL,NULL,NULL,NULL),(126,65,3,'agent','Agent','gvhg','text',NULL,0,NULL,'2025-11-02 12:46:09',NULL,NULL,NULL,NULL,NULL,NULL),(127,66,NULL,'visitor','Guest','hll','text',NULL,0,NULL,'2025-11-02 12:46:59',NULL,NULL,NULL,NULL,NULL,NULL),(128,67,NULL,'visitor','Guest','hoi','text',NULL,0,NULL,'2025-11-02 12:47:07',NULL,NULL,NULL,NULL,NULL,NULL),(129,68,NULL,'visitor','Guest','hi','text',NULL,0,NULL,'2025-11-02 16:04:41',NULL,NULL,NULL,NULL,NULL,NULL),(130,68,NULL,'visitor','Guest','ok','text',NULL,0,NULL,'2025-11-02 16:05:12',NULL,NULL,NULL,NULL,NULL,NULL),(131,68,NULL,'visitor','Guest','what wah 1','text',NULL,0,NULL,'2025-11-02 16:05:34',NULL,NULL,NULL,NULL,NULL,NULL),(132,68,NULL,'visitor','Guest','wat wah 2','text',NULL,0,NULL,'2025-11-02 16:05:48',NULL,NULL,NULL,NULL,NULL,NULL),(133,68,2,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 16:08:02',NULL,NULL,NULL,NULL,NULL,NULL),(134,68,2,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 16:08:18',NULL,NULL,NULL,NULL,NULL,NULL),(135,68,2,'agent','Agent','ok ','text',NULL,0,NULL,'2025-11-02 16:08:24',NULL,NULL,NULL,NULL,NULL,NULL),(136,68,2,'agent','Agent','ok ','text',NULL,0,NULL,'2025-11-02 16:08:36',NULL,NULL,NULL,NULL,NULL,NULL),(137,68,NULL,'visitor','Guest','hi','text',NULL,0,NULL,'2025-11-02 16:23:39',NULL,NULL,NULL,NULL,NULL,NULL),(138,68,NULL,'visitor','Guest','1','text',NULL,0,NULL,'2025-11-02 16:24:01',NULL,NULL,NULL,NULL,NULL,NULL),(139,68,NULL,'visitor','Guest','2','text',NULL,0,NULL,'2025-11-02 16:24:02',NULL,NULL,NULL,NULL,NULL,NULL),(140,68,NULL,'visitor','Guest','3','text',NULL,0,NULL,'2025-11-02 16:24:03',NULL,NULL,NULL,NULL,NULL,NULL),(141,68,2,'agent','Agent','1','text',NULL,0,NULL,'2025-11-02 16:24:17',NULL,NULL,NULL,NULL,NULL,NULL),(142,68,2,'agent','Agent','man1','text',NULL,0,NULL,'2025-11-02 16:24:35',NULL,NULL,NULL,NULL,NULL,NULL),(143,68,2,'agent','Agent','mnaan3','text',NULL,0,NULL,'2025-11-02 16:24:56',NULL,NULL,NULL,NULL,NULL,NULL),(144,68,NULL,'visitor','Guest','sun','text',NULL,0,NULL,'2025-11-02 16:25:23',NULL,NULL,NULL,NULL,NULL,NULL),(145,68,NULL,'visitor','Guest','wok1','text',NULL,0,NULL,'2025-11-02 16:26:06',NULL,NULL,NULL,NULL,NULL,NULL),(146,68,3,'agent','Agent','wrk2','text',NULL,0,NULL,'2025-11-02 16:26:30',NULL,NULL,NULL,NULL,NULL,NULL),(147,68,2,'agent','Agent','ss','text',NULL,0,NULL,'2025-11-02 16:27:16',NULL,NULL,NULL,NULL,NULL,NULL),(148,68,NULL,'visitor','Guest','HELLOW','text',NULL,0,NULL,'2025-11-02 16:41:22',NULL,NULL,NULL,NULL,NULL,NULL),(149,68,3,'agent','Agent','HELLOW','text',NULL,0,NULL,'2025-11-02 16:41:48',NULL,NULL,NULL,NULL,NULL,NULL),(150,68,3,'agent','Agent','OK','text',NULL,0,NULL,'2025-11-02 16:42:26',NULL,NULL,NULL,NULL,NULL,NULL),(151,68,3,'agent','Agent','FFF','text',NULL,0,NULL,'2025-11-02 16:42:34',NULL,NULL,NULL,NULL,NULL,NULL),(152,68,2,'agent','Agent','HG','text',NULL,0,NULL,'2025-11-02 16:43:08',NULL,NULL,NULL,NULL,NULL,NULL),(153,68,2,'agent','Agent','HHH','text',NULL,0,NULL,'2025-11-02 16:43:44',NULL,NULL,NULL,NULL,NULL,NULL),(154,68,2,'agent','Agent','CVCVC','text',NULL,0,NULL,'2025-11-02 16:43:50',NULL,NULL,NULL,NULL,NULL,NULL),(155,68,2,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 16:46:19',NULL,NULL,NULL,NULL,NULL,NULL),(156,68,2,'agent','Agent','hello','text',NULL,0,NULL,'2025-11-02 16:53:38',NULL,NULL,NULL,NULL,NULL,NULL),(157,68,NULL,'visitor','Guest','user 1','text',NULL,0,NULL,'2025-11-02 16:53:53',NULL,NULL,NULL,NULL,NULL,NULL),(158,68,2,'agent','Agent','sun ','text',NULL,0,NULL,'2025-11-02 16:54:24',NULL,NULL,NULL,NULL,NULL,NULL),(159,69,NULL,'visitor','Guest','new 1','text',NULL,0,NULL,'2025-11-02 16:58:54',NULL,NULL,NULL,NULL,NULL,NULL),(160,69,3,'agent','Agent','new 1 resp','text',NULL,0,NULL,'2025-11-02 16:59:25',NULL,NULL,NULL,NULL,NULL,NULL),(161,69,3,'agent','Agent','new 1 resp2','text',NULL,0,NULL,'2025-11-02 16:59:58',NULL,NULL,NULL,NULL,NULL,NULL),(162,69,3,'agent','Agent','new 1 resp3','text',NULL,0,NULL,'2025-11-02 17:00:17',NULL,NULL,NULL,NULL,NULL,NULL),(163,69,2,'agent','Agent','kjk','text',NULL,0,NULL,'2025-11-02 17:00:33',NULL,NULL,NULL,NULL,NULL,NULL),(164,69,3,'agent','Agent','manager','text',NULL,0,NULL,'2025-11-02 17:01:14',NULL,NULL,NULL,NULL,NULL,NULL),(165,68,NULL,'system','System','Chat transferred to general-queue team','text',NULL,0,NULL,'2025-11-02 17:18:17',NULL,NULL,NULL,NULL,NULL,NULL),(166,68,NULL,'system','System','Chat transferred to general-queue team','text',NULL,0,NULL,'2025-11-02 17:18:52',NULL,NULL,NULL,NULL,NULL,NULL),(167,68,NULL,'system','System','Chat transferred to general-queue team','text',NULL,0,NULL,'2025-11-02 17:19:04',NULL,NULL,NULL,NULL,NULL,NULL),(168,68,NULL,'system','System','Chat transferred to general-queue team','text',NULL,0,NULL,'2025-11-02 17:19:12',NULL,NULL,NULL,NULL,NULL,NULL),(169,69,NULL,'visitor','Guest','end','text',NULL,0,NULL,'2025-11-02 18:17:10',NULL,NULL,NULL,NULL,NULL,NULL),(170,68,NULL,'visitor','Guest','n','text',NULL,0,NULL,'2025-11-02 19:03:19',NULL,NULL,NULL,NULL,NULL,NULL),(171,70,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-02 22:21:57',NULL,NULL,NULL,NULL,NULL,NULL),(172,70,NULL,'visitor','Demo User','what is your name','text',NULL,0,NULL,'2025-11-02 22:22:17',NULL,NULL,NULL,NULL,NULL,NULL),(173,70,2,'agent','Agent','surya','text',NULL,0,NULL,'2025-11-02 22:22:29',NULL,NULL,NULL,NULL,NULL,NULL),(174,70,2,'agent','Agent','surya','text',NULL,0,NULL,'2025-11-02 22:22:41',NULL,NULL,NULL,NULL,NULL,NULL),(175,71,2,'agent','Agent','hello','text',NULL,0,NULL,'2025-11-02 23:48:14',NULL,NULL,NULL,NULL,NULL,NULL),(176,71,NULL,'visitor','Demo User','what can you do','text',NULL,0,NULL,'2025-11-02 23:48:41',NULL,NULL,NULL,NULL,NULL,NULL),(177,71,NULL,'visitor','Demo User','ok','text',NULL,0,NULL,'2025-11-02 23:49:31',NULL,NULL,NULL,NULL,NULL,NULL),(178,71,2,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 23:49:42',NULL,NULL,NULL,NULL,NULL,NULL),(179,71,NULL,'visitor','Demo User','isthe agent in house','text',NULL,0,NULL,'2025-11-02 23:50:02',NULL,NULL,NULL,NULL,NULL,NULL),(180,71,2,'agent','Agent','no','text',NULL,0,NULL,'2025-11-02 23:50:12',NULL,NULL,NULL,NULL,NULL,NULL),(181,71,2,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-02 23:50:18',NULL,NULL,NULL,NULL,NULL,NULL),(182,71,NULL,'visitor','Demo User','there','text',NULL,0,NULL,'2025-11-02 23:50:40',NULL,NULL,NULL,NULL,NULL,NULL),(183,71,2,'agent','Agent','yes','text',NULL,0,NULL,'2025-11-02 23:50:57',NULL,NULL,NULL,NULL,NULL,NULL),(184,71,2,'agent','Agent','hojo','text',NULL,0,NULL,'2025-11-02 23:51:26',NULL,NULL,NULL,NULL,NULL,NULL),(185,71,2,'agent','Agent','hbk','text',NULL,0,NULL,'2025-11-02 23:51:36',NULL,NULL,NULL,NULL,NULL,NULL),(186,73,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 00:12:42',NULL,NULL,NULL,NULL,NULL,NULL),(187,73,NULL,'visitor','Demo User','Sorry, I encountered an error. Please try again or contact support.','text',NULL,0,NULL,'2025-11-03 00:12:50',NULL,NULL,NULL,NULL,NULL,NULL),(188,73,NULL,'visitor','Demo User','what is your business hours','text',NULL,0,NULL,'2025-11-03 00:13:04',NULL,NULL,NULL,NULL,NULL,NULL),(189,73,NULL,'visitor','Demo User','onnect to agent','text',NULL,0,NULL,'2025-11-03 00:13:16',NULL,NULL,NULL,NULL,NULL,NULL),(190,73,NULL,'system','AI Assistant','I\'d like to connect you with one of our specialists who can better assist you.','text',NULL,0,NULL,'2025-11-03 00:13:16',NULL,NULL,NULL,NULL,NULL,NULL),(191,73,NULL,'visitor','Demo User','ok','text',NULL,0,NULL,'2025-11-03 00:13:26',NULL,NULL,NULL,NULL,NULL,NULL),(192,73,2,'agent','Agent','hi','text',NULL,0,NULL,'2025-11-03 00:13:50',NULL,NULL,NULL,NULL,NULL,NULL),(193,73,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 00:14:04',NULL,NULL,NULL,NULL,NULL,NULL),(194,74,NULL,'visitor','Demo User','ok','text',NULL,0,NULL,'2025-11-03 09:50:57',NULL,NULL,NULL,NULL,NULL,NULL),(195,74,NULL,'visitor','Demo User','handover to agent','text',NULL,0,NULL,'2025-11-03 09:51:10',NULL,NULL,NULL,NULL,NULL,NULL),(196,74,NULL,'system','AI Assistant','I\'d like to connect you with one of our specialists who can better assist you.','text',NULL,0,NULL,'2025-11-03 09:51:10',NULL,NULL,NULL,NULL,NULL,NULL),(197,74,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 09:51:22',NULL,NULL,NULL,NULL,NULL,NULL),(198,74,3,'agent','Agent','hi','text',NULL,0,NULL,'2025-11-03 10:03:39',NULL,NULL,NULL,NULL,NULL,NULL),(199,74,2,'agent','Agent','hi','text',NULL,0,NULL,'2025-11-03 10:06:17',NULL,NULL,NULL,NULL,NULL,NULL),(200,75,NULL,'visitor','Demo User','connect to agent','text',NULL,0,NULL,'2025-11-03 10:06:28',NULL,NULL,NULL,NULL,NULL,NULL),(201,75,NULL,'system','AI Assistant','I\'d like to connect you with one of our specialists who can better assist you.','text',NULL,0,NULL,'2025-11-03 10:06:28',NULL,NULL,NULL,NULL,NULL,NULL),(202,75,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 10:06:44',NULL,NULL,NULL,NULL,NULL,NULL),(203,75,NULL,'visitor','Demo User','1223','text',NULL,0,NULL,'2025-11-03 10:07:04',NULL,NULL,NULL,NULL,NULL,NULL),(204,75,2,'agent','Agent','hi','text',NULL,0,NULL,'2025-11-03 10:07:13',NULL,NULL,NULL,NULL,NULL,NULL),(205,75,2,'agent','Agent','ok','text',NULL,0,NULL,'2025-11-03 10:07:35',NULL,NULL,NULL,NULL,NULL,NULL),(206,85,NULL,'visitor','Demo User','ho','text',NULL,0,NULL,'2025-11-03 18:02:00',NULL,NULL,NULL,NULL,NULL,NULL),(207,85,NULL,'visitor','Demo User','how can you help','text',NULL,0,NULL,'2025-11-03 18:02:14',NULL,NULL,NULL,NULL,NULL,NULL),(208,86,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 18:18:37',NULL,NULL,NULL,NULL,NULL,NULL),(209,86,NULL,'visitor','Demo User','hello ','text',NULL,0,NULL,'2025-11-03 18:18:44',NULL,NULL,NULL,NULL,NULL,NULL),(210,86,NULL,'visitor','Demo User','how are you ','text',NULL,0,NULL,'2025-11-03 18:19:04',NULL,NULL,NULL,NULL,NULL,NULL),(211,87,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 18:28:09',NULL,NULL,NULL,NULL,NULL,NULL),(212,87,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 18:28:38',NULL,NULL,NULL,NULL,NULL,NULL),(213,87,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 18:32:01',NULL,NULL,NULL,NULL,NULL,NULL),(214,87,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 18:32:09',NULL,NULL,NULL,NULL,NULL,NULL),(215,87,NULL,'visitor','Demo User','there?','text',NULL,0,NULL,'2025-11-03 18:32:44',NULL,NULL,NULL,NULL,NULL,NULL),(216,88,NULL,'visitor','Demo User','helo','text',NULL,0,NULL,'2025-11-03 18:38:34',NULL,NULL,NULL,NULL,NULL,NULL),(217,88,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 18:38:53',NULL,NULL,NULL,NULL,NULL,NULL),(218,89,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 18:44:33',NULL,NULL,NULL,NULL,NULL,NULL),(219,89,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 18:44:53',NULL,NULL,NULL,NULL,NULL,NULL),(220,90,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 18:59:11',NULL,NULL,NULL,NULL,NULL,NULL),(221,90,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 18:59:14',NULL,NULL,NULL,NULL,NULL,NULL),(222,90,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 18:59:26',NULL,NULL,NULL,NULL,NULL,NULL),(223,91,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 19:13:11',NULL,NULL,NULL,NULL,NULL,NULL),(224,91,NULL,'bot','AI Assistant','I\'m sorry, I\'m having trouble understanding. Could you rephrase that?','text',NULL,0,NULL,'2025-11-03 19:13:11',NULL,NULL,NULL,NULL,NULL,NULL),(225,91,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 19:13:21',NULL,NULL,NULL,NULL,NULL,NULL),(226,91,NULL,'bot','AI Assistant','I\'m sorry, I\'m having trouble understanding. Could you rephrase that?','text',NULL,0,NULL,'2025-11-03 19:13:21',NULL,NULL,NULL,NULL,NULL,NULL),(227,91,NULL,'visitor','Demo User','what can you do','text',NULL,0,NULL,'2025-11-03 19:13:34',NULL,NULL,NULL,NULL,NULL,NULL),(228,91,NULL,'bot','AI Assistant','I\'m sorry, I\'m having trouble understanding. Could you rephrase that?','text',NULL,0,NULL,'2025-11-03 19:13:34',NULL,NULL,NULL,NULL,NULL,NULL),(229,91,NULL,'visitor','Demo User','my name is surya','text',NULL,0,NULL,'2025-11-03 19:13:51',NULL,NULL,NULL,NULL,NULL,NULL),(230,91,NULL,'bot','AI Assistant','I\'m sorry, I\'m having trouble understanding. Could you rephrase that?','text',NULL,0,NULL,'2025-11-03 19:13:52',NULL,NULL,NULL,NULL,NULL,NULL),(231,92,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 19:19:42',NULL,NULL,NULL,NULL,NULL,NULL),(232,92,NULL,'bot','AI Assistant','I\'m sorry, I\'m having trouble understanding. Could you rephrase that?','text',NULL,0,NULL,'2025-11-03 19:19:43',NULL,NULL,NULL,NULL,NULL,NULL),(233,92,NULL,'visitor','Demo User','hello','text',NULL,0,NULL,'2025-11-03 19:19:52',NULL,NULL,NULL,NULL,NULL,NULL),(234,92,NULL,'bot','AI Assistant','I\'m sorry, I\'m having trouble understanding. Could you rephrase that?','text',NULL,0,NULL,'2025-11-03 19:19:52',NULL,NULL,NULL,NULL,NULL,NULL),(235,92,NULL,'visitor','Demo User','what can you do','text',NULL,0,NULL,'2025-11-03 19:20:08',NULL,NULL,NULL,NULL,NULL,NULL),(236,92,NULL,'bot','AI Assistant','I\'m sorry, I\'m having trouble understanding. Could you rephrase that?','text',NULL,0,NULL,'2025-11-03 19:20:08',NULL,NULL,NULL,NULL,NULL,NULL),(237,93,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 19:32:22',NULL,NULL,NULL,NULL,NULL,NULL),(238,93,NULL,'bot','AI Assistant','Hi there! How can I help you today?\n','text',NULL,0,NULL,'2025-11-03 19:32:23',NULL,NULL,NULL,NULL,NULL,NULL),(239,93,NULL,'visitor','Demo User','what can you do','text',NULL,0,NULL,'2025-11-03 19:32:37',NULL,NULL,NULL,NULL,NULL,NULL),(240,93,NULL,'bot','AI Assistant','I can answer questions related to order cancellations, contact information for support, and how to track your order. Do you have any questions about those topics?\n','text',NULL,0,NULL,'2025-11-03 19:32:38',NULL,NULL,NULL,NULL,NULL,NULL),(241,93,NULL,'visitor','Demo User','no','text',NULL,0,NULL,'2025-11-03 19:34:58',NULL,NULL,NULL,NULL,NULL,NULL),(242,93,NULL,'bot','AI Assistant','Okay, is there anything else I can help you with?\n','text',NULL,0,NULL,'2025-11-03 19:35:04',NULL,NULL,NULL,NULL,NULL,NULL),(243,93,NULL,'visitor','Demo User','yes','text',NULL,0,NULL,'2025-11-03 21:33:43',NULL,NULL,NULL,NULL,NULL,NULL),(244,93,NULL,'bot','AI Assistant','Okay, what is your question?\n','text',NULL,0,NULL,'2025-11-03 21:33:43',NULL,NULL,NULL,NULL,NULL,NULL),(245,93,NULL,'visitor','Demo User','who is president of america','text',NULL,0,NULL,'2025-11-03 21:34:00',NULL,NULL,NULL,NULL,NULL,NULL),(246,93,NULL,'bot','AI Assistant','I am sorry, I am unable to answer questions outside of my knowledge base. I can assist you with questions related to order cancellations, contact information for support, and how to track your order.\n\nWould you like me to connect you with a human agent who can answer that question?\n','text',NULL,0,NULL,'2025-11-03 21:34:01',NULL,NULL,NULL,NULL,NULL,NULL),(247,94,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 21:36:36',NULL,NULL,NULL,NULL,NULL,NULL),(248,94,NULL,'bot','AI Assistant','Hi there! How can I help you today?\n','text',NULL,0,NULL,'2025-11-03 21:36:37',NULL,NULL,NULL,NULL,NULL,NULL),(249,94,NULL,'visitor','Demo User','transfer to agent','text',NULL,0,NULL,'2025-11-03 21:37:12',NULL,NULL,NULL,NULL,NULL,NULL),(250,94,NULL,'system','AI Assistant','I\'d like to connect you with one of our specialists who can better assist you.','text',NULL,0,NULL,'2025-11-03 21:37:12',NULL,NULL,NULL,NULL,NULL,NULL),(251,94,NULL,'visitor','Demo User','Hi agent ananya','text',NULL,0,NULL,'2025-11-03 21:37:37',NULL,NULL,NULL,NULL,NULL,NULL),(252,94,2,'agent','Agent','hello tamudu','text',NULL,0,NULL,'2025-11-03 21:37:47',NULL,NULL,NULL,NULL,NULL,NULL),(253,94,NULL,'visitor','Demo User','kulasha ae na','text',NULL,0,NULL,'2025-11-03 21:38:03',NULL,NULL,NULL,NULL,NULL,NULL),(254,94,2,'agent','Agent','ha','text',NULL,0,NULL,'2025-11-03 21:38:11',NULL,NULL,NULL,NULL,NULL,NULL),(255,94,NULL,'visitor','Demo User','manchidi','text',NULL,0,NULL,'2025-11-03 21:38:21',NULL,NULL,NULL,NULL,NULL,NULL),(256,94,2,'agent','Agent','manchidi','text',NULL,0,NULL,'2025-11-03 21:38:28',NULL,NULL,NULL,NULL,NULL,NULL),(257,95,NULL,'visitor','Demo User','hi','text',NULL,0,NULL,'2025-11-03 21:40:08',NULL,NULL,NULL,NULL,NULL,NULL),(258,95,NULL,'bot','AI Assistant','Hi there! How can I help you today?\n','text',NULL,0,NULL,'2025-11-03 21:40:09',NULL,NULL,NULL,NULL,NULL,NULL),(259,96,NULL,'visitor','Demo User','helllo','text',NULL,0,NULL,'2025-11-03 21:56:12',NULL,NULL,NULL,NULL,NULL,NULL),(260,96,NULL,'bot','AI Assistant','Hello! How can I help you today?\n','text',NULL,0,NULL,'2025-11-03 21:56:13',NULL,NULL,NULL,NULL,NULL,NULL),(261,96,NULL,'visitor','Demo User','order shipment','text',NULL,0,NULL,'2025-11-03 21:56:24',NULL,NULL,NULL,NULL,NULL,NULL),(262,96,NULL,'bot','AI Assistant','I can help with that! Could you please provide me with your order number or tracking number so I can look up the shipment details for you?\n','text',NULL,0,NULL,'2025-11-03 21:56:25',NULL,NULL,NULL,NULL,NULL,NULL),(263,96,NULL,'visitor','Demo User','ok','text',NULL,0,NULL,'2025-11-03 21:56:34',NULL,NULL,NULL,NULL,NULL,NULL),(264,96,NULL,'bot','AI Assistant','Great! I\'m ready when you are. Please provide the order number or tracking number so I can assist you with your shipment details.\n','text',NULL,0,NULL,'2025-11-03 21:56:34',NULL,NULL,NULL,NULL,NULL,NULL),(265,96,NULL,'visitor','Demo User','transfer to agent','text',NULL,0,NULL,'2025-11-03 21:56:49',NULL,NULL,NULL,NULL,NULL,NULL),(266,96,NULL,'system','AI Assistant','I\'d like to connect you with one of our specialists who can better assist you.','text',NULL,0,NULL,'2025-11-03 21:56:49',NULL,NULL,NULL,NULL,NULL,NULL),(267,96,NULL,'visitor','Demo User','hi ','text',NULL,0,NULL,'2025-11-03 21:56:59',NULL,NULL,NULL,NULL,NULL,NULL),(268,96,2,'agent','Agent','hi andi','text',NULL,0,NULL,'2025-11-03 21:57:16',NULL,NULL,NULL,NULL,NULL,NULL),(269,96,2,'agent','Agent','tinnara','text',NULL,0,NULL,'2025-11-03 21:57:19',NULL,NULL,NULL,NULL,NULL,NULL),(270,96,NULL,'visitor','Demo User','tinesam andi','text',NULL,0,NULL,'2025-11-03 21:57:27',NULL,NULL,NULL,NULL,NULL,NULL),(271,96,2,'agent','Agent','iyte padukondi inka','text',NULL,0,NULL,'2025-11-03 21:57:41',NULL,NULL,NULL,NULL,NULL,NULL),(272,98,NULL,'visitor','Demo User','order cancel','text',NULL,0,NULL,'2025-11-03 22:42:38',NULL,NULL,NULL,NULL,NULL,NULL),(273,98,NULL,'bot','AI Assistant','I can help with that! To cancel your order, please provide the order number.\n','text',NULL,0,NULL,'2025-11-03 22:42:40',NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `chat_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_sessions`
--

DROP TABLE IF EXISTS `chat_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_sessions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `widget_id` bigint NOT NULL,
  `session_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `visitor_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visitor_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visitor_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visitor_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `referrer_url` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_url` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visitor_ip` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `visitor_user_agent` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `assigned_agent_id` bigint DEFAULT NULL,
  `queue_position` int DEFAULT NULL,
  `waiting_time` int NOT NULL DEFAULT '0',
  `rating` int DEFAULT NULL,
  `feedback` text COLLATE utf8mb4_unicode_ci,
  `started_at` timestamp NULL DEFAULT NULL,
  `ended_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `assigned_to_id` bigint DEFAULT NULL,
  `assigned_team` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_response_time` int DEFAULT NULL,
  `queued_at` timestamp NULL DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `rating_comment` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `message_count` int DEFAULT '0',
  `channel_connection_id` bigint DEFAULT NULL COMMENT 'Which channel this conversation came from',
  `website_id` bigint DEFAULT NULL COMMENT 'Which website this conversation belongs to',
  `channel_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'web' COMMENT 'web, whatsapp, facebook, etc.',
  `channel_user_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'User ID from channel (WhatsApp number, FB ID, etc.)',
  `channel_username` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Display name from channel',
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_key` (`session_key`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_widget_id` (`widget_id`),
  KEY `idx_session_key` (`session_key`),
  KEY `idx_status` (`status`),
  KEY `idx_assigned_agent_id` (`assigned_agent_id`),
  KEY `idx_started_at` (`started_at`),
  KEY `idx_channel_connection` (`channel_connection_id`),
  KEY `idx_website` (`website_id`),
  KEY `idx_channel_type` (`channel_type`),
  KEY `idx_sessions_website_channel` (`website_id`,`channel_type`,`status`),
  KEY `idx_sessions_agent_status` (`assigned_agent_id`,`status`),
  KEY `idx_sessions_created` (`created_at` DESC),
  CONSTRAINT `chat_sessions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_sessions_ibfk_2` FOREIGN KEY (`widget_id`) REFERENCES `chat_widgets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_sessions_ibfk_3` FOREIGN KEY (`assigned_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chat_sessions_ibfk_4` FOREIGN KEY (`channel_connection_id`) REFERENCES `channel_connections` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chat_sessions_ibfk_5` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=99 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_sessions`
--

LOCK TABLES `chat_sessions` WRITE;
/*!40000 ALTER TABLE `chat_sessions` DISABLE KEYS */;
INSERT INTO `chat_sessions` VALUES (1,'demo-tenant',1,'session-1762024638656293830',NULL,'Test User','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 19:17:19','2025-11-01 19:17:19',NULL,NULL,NULL,'2025-11-01 19:17:19',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(2,'demo-tenant',1,'session-1762024770467955190',NULL,'Test User','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 19:19:30','2025-11-01 19:19:30',NULL,NULL,NULL,'2025-11-01 19:19:30',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(3,'demo-tenant',1,'session-1762024822427751744',NULL,'Test User','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 19:20:22','2025-11-01 19:20:22',NULL,NULL,NULL,'2025-11-01 19:20:22',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(4,'demo-tenant',1,'session-1762024928222708895',NULL,'Test User','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 19:22:08','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 19:22:08',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(5,'demo-tenant',1,'session-1762027744816905938',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 20:09:05','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 20:09:05',NULL,NULL,NULL,6,NULL,NULL,'web',NULL,NULL),(6,'demo-tenant',1,'session-1762028597846879539',NULL,'Test Customer','test@customer.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 20:23:18','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 20:23:18',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(7,'demo-tenant',1,'session-1762035025601443242',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 22:10:26','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 22:10:26',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(8,'demo-tenant',1,'session-1762036247499473470',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 22:30:47','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 22:30:47',NULL,NULL,NULL,6,NULL,NULL,'web',NULL,NULL),(9,'demo-tenant',1,'session-1762037352864405876',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 22:49:13','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 22:49:13',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(10,'demo-tenant',1,'session-1762039769629178408',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:29:30','2025-11-01 23:29:30',NULL,NULL,NULL,'2025-11-01 23:29:30',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(11,'demo-tenant',1,'session-1762039773030259295',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:29:33','2025-11-01 23:29:33',NULL,NULL,NULL,'2025-11-01 23:29:33',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(12,'demo-tenant',1,'session-1762039786263432330',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:29:46','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 23:29:46',NULL,NULL,NULL,4,NULL,NULL,'web',NULL,NULL),(13,'demo-tenant',1,'session-1762039857779990753',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:30:58','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 23:30:58',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(14,'demo-tenant',1,'session-1762039875475173244',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:31:15','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 23:31:15',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(15,'demo-tenant',1,'session-1762040690448616929',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:44:50','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-01 23:44:50',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(16,'demo-tenant',1,'session-1762040906829029119',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:48:27','2025-11-01 23:48:27',NULL,NULL,NULL,'2025-11-01 23:48:27',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(17,'demo-tenant',1,'session-1762040910423591068',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:48:30','2025-11-01 23:48:30',NULL,NULL,NULL,'2025-11-01 23:48:30',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(18,'demo-tenant',1,'session-1762040918542324994',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:48:39','2025-11-01 23:48:39',NULL,NULL,NULL,'2025-11-01 23:48:39',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(19,'demo-tenant',1,'session-1762041014944613696',NULL,'Test','test@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:50:15','2025-11-01 23:50:15',NULL,NULL,NULL,'2025-11-01 23:50:15',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(20,'demo-tenant',1,'session-1762041391293015103',NULL,'Test','test@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:56:31','2025-11-01 23:56:31',NULL,NULL,NULL,'2025-11-01 23:56:31',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(21,'demo-tenant',1,'session-1762041434445258353',NULL,'Test','test@test.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-01 23:57:14','2025-11-01 23:57:14',NULL,NULL,NULL,'2025-11-01 23:57:14',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(22,'demo-tenant',1,'session-1762041916668225260',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 00:05:17','2025-11-02 00:05:17',NULL,NULL,NULL,'2025-11-02 00:05:17',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(23,'demo-tenant',1,'session-1762041940429948084',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 00:05:40','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 00:05:40',NULL,NULL,NULL,5,NULL,NULL,'web',NULL,NULL),(24,'demo-tenant',1,'session-1762042511360667457',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 00:15:11','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 00:15:11',NULL,NULL,NULL,3,NULL,NULL,'web',NULL,NULL),(25,'demo-tenant',1,'session-1762043242882764987',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 00:27:23','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 00:27:23',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(26,'demo-tenant',1,'session-1762043859540628899',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 00:37:40','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 00:37:40',NULL,NULL,NULL,3,NULL,NULL,'web',NULL,NULL),(27,'demo-tenant',1,'session-1762044728851409739',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 00:52:09','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 00:52:09',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(28,'demo-tenant',1,'session-1762044807851438657',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 00:53:28','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 00:53:28',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(29,'demo-tenant',1,'session-1762045178910996243',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 00:59:39','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 00:59:39',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(30,'demo-tenant',1,'session-1762045772783153908',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:09:33','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 01:09:33',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(31,'demo-tenant',1,'session-1762045823861417884',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:10:24','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 01:10:24',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(32,'demo-tenant',1,'session-1762045847253278735',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:10:47','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 01:10:47',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(33,'demo-tenant',1,'session-1762046160345540986',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:16:00','2025-11-02 01:16:00',NULL,NULL,NULL,'2025-11-02 01:16:00',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(34,'demo-tenant',1,'session-1762046165507030304',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:16:06','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 01:16:06',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(35,'demo-tenant',1,'session-1762046669217184627',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:24:29','2025-11-02 01:24:29',NULL,NULL,NULL,'2025-11-02 01:24:29',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(36,'demo-tenant',1,'session-1762046672320003247',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:24:32','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 01:24:32',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(37,'demo-tenant',1,'session-1762046917994016857',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:28:38','2025-11-02 18:34:14',2,NULL,NULL,'2025-11-02 01:28:38',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(38,'demo-tenant',1,'session-1762047330380713120',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:35:30','2025-11-02 01:35:30',NULL,NULL,NULL,'2025-11-02 01:35:30',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(39,'demo-tenant',1,'session-1762047333430905671',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:35:33','2025-11-02 18:34:19',2,NULL,NULL,'2025-11-02 01:35:33',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(40,'demo-tenant',1,'session-1762047612703475883',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:40:13','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 01:40:13',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(41,'demo-tenant',1,'session-1762048442286888489',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 01:54:02','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 01:54:02',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(42,'demo-tenant',1,'session-1762049296323172486',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 02:08:16','2025-11-02 02:08:16',NULL,NULL,NULL,'2025-11-02 02:08:16',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(43,'demo-tenant',1,'session-1762049296546176728',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 02:08:17','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 02:08:17',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(44,'demo-tenant',1,'session-1762049660939447015',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 02:14:21','2025-11-02 11:30:50',NULL,NULL,NULL,'2025-11-02 02:14:21',NULL,NULL,NULL,8,NULL,NULL,'web',NULL,NULL),(45,'demo-tenant',1,'session-1762049806593315062',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 02:16:47','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 02:16:47',NULL,NULL,NULL,3,NULL,NULL,'web',NULL,NULL),(46,'demo-tenant',1,'session-1762050667924397946',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 02:31:08','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 02:31:08',NULL,NULL,NULL,6,NULL,NULL,'web',NULL,NULL),(47,'demo-tenant',1,'session-1762051452627945481',NULL,'Test Customer','test@handover.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 02:44:13','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 02:44:13',NULL,NULL,NULL,6,NULL,NULL,'web',NULL,NULL),(48,'demo-tenant',1,'session-1762052885183656224',NULL,'Test AI','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 03:08:05','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 03:08:05',NULL,NULL,NULL,5,NULL,NULL,'web',NULL,NULL),(49,'demo-tenant',1,'session-1762056207257128414',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 04:03:27','2025-11-02 11:06:21',3,NULL,NULL,'2025-11-02 04:03:27',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(50,'demo-tenant',1,'session-1762056210356023930',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 04:03:30','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 04:03:30',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(51,'demo-tenant',1,'session-1762057029349389397',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 04:17:09','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 04:17:09',NULL,NULL,NULL,1,NULL,NULL,'web',NULL,NULL),(52,'demo-tenant',1,'session-1762057864607019285',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 04:31:05','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 04:31:05',NULL,NULL,NULL,2,NULL,NULL,'web',NULL,NULL),(53,'demo-tenant',1,'session-1762078471144205166',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 10:14:31','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 10:14:31',NULL,NULL,NULL,5,NULL,NULL,'web',NULL,NULL),(54,'demo-tenant',1,'session-1762080667337074392',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 10:51:07','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 10:51:07',NULL,NULL,NULL,3,NULL,NULL,'web',NULL,NULL),(55,'demo-tenant',1,'session-1762081141309474036',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 10:59:01','2025-11-02 11:30:50',3,NULL,NULL,'2025-11-02 10:59:01',NULL,NULL,NULL,3,NULL,NULL,'web',NULL,NULL),(56,'demo-tenant',1,'session-1762082668474066786',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 11:24:28','2025-11-02 11:30:50',1,NULL,NULL,'2025-11-02 11:24:28',NULL,NULL,NULL,4,NULL,NULL,'web',NULL,NULL),(57,'demo-tenant',1,'session-1762083180007164288',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 11:33:00','2025-11-02 11:33:00',2,NULL,NULL,'2025-11-02 11:33:00',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(58,'demo-tenant',1,'session-1762084237677401788',NULL,'Test Customer','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 11:50:38','2025-11-02 11:50:38',4,NULL,NULL,'2025-11-02 11:50:38',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(59,'demo-tenant',1,'session-1762086646443096145',NULL,'Test User','test@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'ended',NULL,NULL,0,NULL,NULL,NULL,'2025-11-02 12:30:51','2025-11-02 12:30:46','2025-11-02 12:30:51',1,NULL,NULL,'2025-11-02 12:30:46',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(60,'demo-tenant',1,'session-1762086847365044142',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 12:34:07','2025-11-02 12:34:07',1,NULL,NULL,'2025-11-02 12:34:07',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(61,'demo-tenant',1,'session-1762086847581575829',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 12:34:08','2025-11-02 12:34:08',2,NULL,NULL,'2025-11-02 12:34:08',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(62,'demo-tenant',1,'session-1762086995172823595',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 12:36:35','2025-11-02 12:36:35',4,NULL,NULL,'2025-11-02 12:36:35',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(63,'demo-tenant',1,'session-1762086995172809035',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 12:36:35','2025-11-02 12:36:35',4,NULL,NULL,'2025-11-02 12:36:35',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(64,'demo-tenant',1,'session-1762087398688217608',NULL,'Restore Test','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 12:43:19','2025-11-02 12:43:19',1,NULL,NULL,'2025-11-02 12:43:19',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(65,'demo-tenant',1,'session-1762087545376165979',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 12:45:45','2025-11-02 12:45:45',2,NULL,NULL,'2025-11-02 12:45:45',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(66,'demo-tenant',1,'session-1762087616332799727',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 12:46:56','2025-11-02 12:46:56',4,NULL,NULL,'2025-11-02 12:46:56',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(67,'demo-tenant',1,'session-1762087624929080589',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 12:47:05','2025-11-02 12:47:05',1,NULL,NULL,'2025-11-02 12:47:05',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(68,'demo-tenant',1,'session-1762099478889426039',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 16:04:39','2025-11-02 17:19:19',2,NULL,NULL,'2025-11-02 16:04:39',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(69,'demo-tenant',1,'session-1762102730773055270',NULL,'Guest','',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 16:58:51','2025-11-02 16:58:51',4,NULL,NULL,'2025-11-02 16:58:51',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(70,'demo-tenant',1,'session-1762122111121332620',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 22:21:51','2025-11-02 22:21:51',1,NULL,NULL,'2025-11-02 22:21:51',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(71,'demo-tenant',1,'session-1762127263125669973',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-02 23:47:43','2025-11-02 23:47:43',3,NULL,NULL,'2025-11-02 23:47:43',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(72,'demo-tenant',1,'session-1762128579887890405',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 00:09:40','2025-11-03 00:09:40',4,NULL,NULL,'2025-11-03 00:09:40',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(73,'demo-tenant',1,'session-1762128672943176734',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 00:11:13','2025-11-03 00:11:13',NULL,NULL,NULL,'2025-11-03 00:11:13',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(74,'demo-tenant',1,'session-1762163440154792870',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 09:50:40','2025-11-03 09:50:40',NULL,NULL,NULL,'2025-11-03 09:50:40',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(75,'demo-tenant',1,'session-1762164307672609419',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 10:05:08','2025-11-03 10:05:08',NULL,NULL,NULL,'2025-11-03 10:05:08',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(76,'demo-tenant',1,'session-1762174752889807781',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 12:59:13','2025-11-03 12:59:13',NULL,NULL,NULL,'2025-11-03 12:59:13',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(77,'demo-tenant',1,'session-1762175541192707202',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 13:12:21','2025-11-03 13:12:21',NULL,NULL,NULL,'2025-11-03 13:12:21',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(78,'demo-tenant',1,'session-1762176342035918728',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 13:25:42','2025-11-03 13:25:42',NULL,NULL,NULL,'2025-11-03 13:25:42',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(79,'demo-tenant',1,'session-1762177524844232534',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 13:45:25','2025-11-03 13:45:25',NULL,NULL,NULL,'2025-11-03 13:45:25',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(80,'demo-tenant',1,'session-1762177687392820594',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 13:48:07','2025-11-03 13:48:07',NULL,NULL,NULL,'2025-11-03 13:48:07',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(81,'demo-tenant',1,'session-1762177772445572190',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 13:49:32','2025-11-03 13:49:32',NULL,NULL,NULL,'2025-11-03 13:49:32',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(82,'demo-tenant',1,'session-1762179172298028459',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 14:12:52','2025-11-03 14:12:52',NULL,NULL,NULL,'2025-11-03 14:12:52',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(83,'demo-tenant',1,'session-1762179185293525690',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 14:13:05','2025-11-03 14:13:05',NULL,NULL,NULL,'2025-11-03 14:13:05',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(84,'demo-tenant',1,'session-1762192661385253249',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'queued',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 17:57:41','2025-11-03 17:57:41',NULL,NULL,NULL,'2025-11-03 17:57:41',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(85,'demo-tenant',1,'session-1762192919313234023',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 18:01:59','2025-11-03 18:42:43',NULL,NULL,NULL,'2025-11-03 18:01:59',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(86,'demo-tenant',1,'session-1762193917009541943',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 18:18:37','2025-11-03 18:42:43',NULL,NULL,NULL,'2025-11-03 18:18:37',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(87,'demo-tenant',1,'session-1762194488766036111',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 18:28:09','2025-11-03 18:42:43',NULL,NULL,NULL,'2025-11-03 18:28:09',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(88,'demo-tenant',1,'session-1762195114124873055',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 18:38:34','2025-11-03 18:42:43',NULL,NULL,NULL,'2025-11-03 18:38:34',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(89,'demo-tenant',1,'session-1762195472861778705',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 18:44:33','2025-11-03 18:49:27',NULL,NULL,NULL,'2025-11-03 18:44:33',NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(90,'demo-tenant',1,'session-1762196350626949074',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 18:59:11','2025-11-03 18:59:11',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(91,'demo-tenant',1,'session-1762197190273426835',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 19:13:10','2025-11-03 19:13:10',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(92,'demo-tenant',1,'session-1762197582267263799',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 19:19:42','2025-11-03 19:19:42',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(93,'demo-tenant',1,'session-1762198342198176861',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 19:32:22','2025-11-03 19:32:22',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(94,'demo-tenant',1,'session-1762205796135693759',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 21:36:36','2025-11-03 22:08:24',2,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(95,'demo-tenant',1,'session-1762206008235061843',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 21:40:08','2025-11-03 22:08:20',2,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(96,'demo-tenant',1,'session-1762206971398385259',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 21:56:11','2025-11-03 22:08:17',2,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(97,'demo-tenant',1,'session-1762209421259568075',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 22:37:01','2025-11-03 22:37:01',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL),(98,'demo-tenant',1,'session-1762209747658246350',NULL,'Demo User','demo@example.com',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'active',NULL,NULL,0,NULL,NULL,NULL,NULL,'2025-11-03 22:42:28','2025-11-05 00:00:05',2,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,'web',NULL,NULL);
/*!40000 ALTER TABLE `chat_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_transfers`
--

DROP TABLE IF EXISTS `chat_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_transfers` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `session_id` bigint NOT NULL,
  `from_agent_id` bigint DEFAULT NULL,
  `to_agent_id` bigint DEFAULT NULL,
  `to_team` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reason` text COLLATE utf8mb4_unicode_ci,
  `transferred_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_from_agent_id` (`from_agent_id`),
  KEY `idx_to_agent_id` (`to_agent_id`),
  KEY `idx_transferred_at` (`transferred_at`),
  CONSTRAINT `chat_transfers_ibfk_1` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `chat_transfers_ibfk_2` FOREIGN KEY (`from_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `chat_transfers_ibfk_3` FOREIGN KEY (`to_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_transfers`
--

LOCK TABLES `chat_transfers` WRITE;
/*!40000 ALTER TABLE `chat_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_widgets`
--

DROP TABLE IF EXISTS `chat_widgets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_widgets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `widget_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enabled` tinyint(1) NOT NULL DEFAULT '1',
  `primary_color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `welcome_message` text COLLATE utf8mb4_unicode_ci,
  `offline_message` text COLLATE utf8mb4_unicode_ci,
  `position` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'bottom-right',
  `team_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'Support Team',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allowed_domains` json DEFAULT NULL,
  `settings` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_enabled` tinyint(1) DEFAULT '1',
  `secondary_color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#FFFFFF',
  `widget_position` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'bottom-right',
  `placeholder_text` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT 'Type your message...',
  `show_agent_typing` tinyint(1) DEFAULT '1',
  `show_read_receipts` tinyint(1) DEFAULT '1',
  `allow_file_upload` tinyint(1) DEFAULT '1',
  `allow_emojis` tinyint(1) DEFAULT '1',
  `require_email` tinyint(1) DEFAULT '0',
  `require_name` tinyint(1) DEFAULT '1',
  `default_team` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_assignee` bigint DEFAULT NULL,
  `auto_assign` tinyint(1) DEFAULT '1',
  `business_hours_enabled` tinyint(1) DEFAULT '0',
  `business_hours` json DEFAULT NULL,
  `ip_whitelist` text COLLATE utf8mb4_unicode_ci,
  `metadata` json DEFAULT NULL,
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `website_id` bigint DEFAULT NULL,
  `ai_agent_profile_id` bigint DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `widget_key` (`widget_key`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_widget_key` (`widget_key`),
  KEY `idx_enabled` (`enabled`),
  KEY `fk_widget_website` (`website_id`),
  KEY `fk_widget_ai_profile` (`ai_agent_profile_id`),
  CONSTRAINT `chat_widgets_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_widget_ai_profile` FOREIGN KEY (`ai_agent_profile_id`) REFERENCES `ai_agent_config` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_widget_website` FOREIGN KEY (`website_id`) REFERENCES `websites` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_widgets`
--

LOCK TABLES `chat_widgets` WRITE;
/*!40000 ALTER TABLE `chat_widgets` DISABLE KEYS */;
INSERT INTO `chat_widgets` VALUES (1,'demo-tenant',' Soham Default Public Widget','default-widget',1,'#4F46E5','Chat with us','We typically reply instantly','Hi! How can I help you today?','We\'re currently offline. Leave us a message!','bottom-right','Support Team',NULL,NULL,'{\"company_name\": \"Demo Company\", \"enable_emoji\": true, \"enable_rating\": true, \"quick_replies\": [], \"require_email\": false, \"pre_chat_fields\": [], \"proactive_delay\": 10, \"show_agent_name\": true, \"greeting_message\": \"Hi there! How can we help you today?\", \"allow_file_upload\": false, \"proactive_message\": \"Need help? We are here to assist you\", \"show_agent_avatar\": true, \"show_agent_typing\": true, \"show_unread_count\": true, \"showcase_products\": [], \"enable_file_upload\": true, \"show_read_receipts\": true, \"enable_pre_chat_form\": true, \"enable_quick_replies\": false, \"enable_read_receipts\": true, \"enable_proactive_chat\": false, \"enable_product_showcase\": false, \"enable_typing_indicator\": true}','2025-11-01 18:55:03','2025-11-04 22:56:40',1,'#FFFFFF','bottom-right','Type your message...',1,1,1,1,0,1,NULL,NULL,1,0,NULL,NULL,'{\"team_name\": \"Support Team\", \"company_name\": \"soham\", \"enable_emoji\": true, \"enable_sound\": true, \"enable_rating\": true, \"quick_replies\": \"[\\\"How can I help?\\\",\\\"Tell me more\\\",\\\"Contact sales\\\"]\", \"track_referrer\": true, \"pre_chat_fields\": \"[]\", \"proactive_delay\": 10, \"show_agent_name\": true, \"track_page_views\": true, \"proactive_message\": \"Need help? We\'re here to assist you!\", \"show_agent_avatar\": true, \"show_chat_history\": true, \"show_unread_count\": true, \"showcase_products\": \"[]\", \"lead_capture_delay\": 30, \"track_visitor_info\": true, \"enable_lead_capture\": false, \"enable_pre_chat_form\": true, \"enable_quick_replies\": false, \"enable_smart_replies\": false, \"lead_capture_trigger\": \"on_exit\", \"enable_ai_suggestions\": false, \"enable_proactive_chat\": false, \"enable_chat_transcript\": true, \"enable_product_showcase\": false, \"enable_typing_indicator\": true, \"enable_sentiment_analysis\": false, \"enable_satisfaction_survey\": true}',NULL,NULL,NULL),(2,'demo-tenant','Auto Widget Success - Default Widget','widget_demo-tenant_9',1,'#3B82F6','Chat Support','We\'re here to help!','Hello! How can we help you today?','We\'re currently offline. Please leave a message.','bottom-right','Support Team',NULL,NULL,NULL,'2025-11-04 19:14:20','2025-11-04 19:14:20',1,'#FFFFFF','bottom-right','Type your message...',1,1,1,1,0,1,NULL,NULL,1,0,NULL,NULL,NULL,NULL,9,NULL),(3,'demo-tenant','soham.top - Default Widget','widget_demo-tenant_10',1,'#3B82F6','Chat Support','We\'re here to help!','Hello! How can we help you today?','We\'re currently offline. Please leave a message.','bottom-right','Support Team',NULL,NULL,NULL,'2025-11-04 22:20:31','2025-11-04 22:20:31',1,'#FFFFFF','bottom-right','Type your message...',1,1,1,1,0,1,NULL,NULL,1,0,NULL,NULL,NULL,NULL,10,NULL);
/*!40000 ALTER TABLE `chat_widgets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contacts`
--

DROP TABLE IF EXISTS `contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tags` json DEFAULT NULL,
  `custom_fields` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_email` (`email`),
  KEY `idx_phone` (`phone`),
  KEY `idx_name` (`name`),
  CONSTRAINT `contacts_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contacts`
--

LOCK TABLES `contacts` WRITE;
/*!40000 ALTER TABLE `contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation_tags`
--

DROP TABLE IF EXISTS `conversation_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversation_tags` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(7) COLLATE utf8mb4_unicode_ci DEFAULT '#6B7280',
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usage_count` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_name` (`tenant_id`,`name`),
  KEY `idx_active` (`tenant_id`,`is_active`),
  CONSTRAINT `conversation_tags_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation_tags`
--

LOCK TABLES `conversation_tags` WRITE;
/*!40000 ALTER TABLE `conversation_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversation_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `customer_id` bigint DEFAULT NULL,
  `customer_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `customer_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `channel` enum('web','whatsapp','facebook','instagram','twitter','sms','telegram') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'web',
  `external_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('queued','bot','agent','closed','resolved') COLLATE utf8mb4_unicode_ci DEFAULT 'bot',
  `assigned_agent_id` bigint DEFAULT NULL,
  `assigned_queue_id` bigint DEFAULT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `bot_confidence` float DEFAULT '1',
  `bot_message_count` int DEFAULT '0',
  `handoff_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `handoff_triggered_by` enum('bot','customer','rule','timeout','agent') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci DEFAULT 'medium',
  `tags` json DEFAULT NULL,
  `customer_context` json DEFAULT NULL,
  `started_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `assigned_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `first_response_at` timestamp NULL DEFAULT NULL,
  `last_message_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolution_time` int DEFAULT NULL,
  `customer_rating` tinyint DEFAULT NULL,
  `customer_feedback` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_status` (`tenant_id`,`status`),
  KEY `idx_agent` (`assigned_agent_id`),
  KEY `idx_channel` (`channel`,`status`),
  KEY `idx_external_id` (`channel`,`external_id`),
  KEY `idx_customer` (`customer_id`),
  KEY `idx_last_message` (`last_message_at`),
  KEY `assigned_queue_id` (`assigned_queue_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `conversations_ibfk_3` FOREIGN KEY (`assigned_agent_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `conversations_ibfk_4` FOREIGN KEY (`assigned_queue_id`) REFERENCES `queues` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dids`
--

DROP TABLE IF EXISTS `dids`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dids` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `friendly_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `route_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route_target` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route_queue` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `route_user_id` bigint DEFAULT NULL,
  `route_extension` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `capabilities` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `number` (`number`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_number` (`number`),
  KEY `idx_status` (`status`),
  KEY `idx_route_type` (`route_type`),
  KEY `route_user_id` (`route_user_id`),
  CONSTRAINT `dids_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dids_ibfk_2` FOREIGN KEY (`route_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dids`
--

LOCK TABLES `dids` WRITE;
/*!40000 ALTER TABLE `dids` DISABLE KEYS */;
/*!40000 ALTER TABLE `dids` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `handoff_rules`
--

DROP TABLE IF EXISTS `handoff_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `handoff_rules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `trigger_type` enum('keyword','intent','sentiment','timeout','confidence','message_count','manual','no_answer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `trigger_value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trigger_operator` enum('equals','contains','less_than','greater_than','between') COLLATE utf8mb4_unicode_ci DEFAULT 'contains',
  `priority` int DEFAULT '0',
  `target_queue_id` bigint DEFAULT NULL,
  `message_template` text COLLATE utf8mb4_unicode_ci,
  `notify_agent` tinyint(1) DEFAULT '1',
  `is_active` tinyint(1) DEFAULT '1',
  `execution_count` int DEFAULT '0',
  `last_executed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_active` (`tenant_id`,`is_active`),
  KEY `idx_priority` (`priority` DESC),
  KEY `target_queue_id` (`target_queue_id`),
  CONSTRAINT `handoff_rules_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `handoff_rules_ibfk_2` FOREIGN KEY (`target_queue_id`) REFERENCES `queues` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `handoff_rules`
--

LOCK TABLES `handoff_rules` WRITE;
/*!40000 ALTER TABLE `handoff_rules` DISABLE KEYS */;
INSERT INTO `handoff_rules` VALUES (1,'demo-tenant','Customer Requests Human',NULL,'keyword','agent,human,person,representative,speak to someone','contains',100,NULL,'Of course! Let me connect you with one of our team members who can assist you personally.',1,1,5,'2025-11-03 21:56:49','2025-10-31 23:08:05','2025-11-03 21:56:49'),(2,'demo-tenant','Low Confidence Response',NULL,'confidence','0.5','contains',90,NULL,'I want to make sure you get the best help. Let me connect you with a specialist.',1,1,0,NULL,'2025-10-31 23:08:05','2025-10-31 23:08:05'),(3,'demo-tenant','Negative Sentiment',NULL,'sentiment','-0.6','contains',80,NULL,'I understand your frustration. Let me connect you with someone who can help resolve this immediately.',1,1,0,NULL,'2025-10-31 23:08:05','2025-10-31 23:08:05'),(4,'demo-tenant','Too Many Messages',NULL,'message_count','10','contains',70,NULL,'Let me connect you with a human agent who can provide more detailed assistance.',1,1,0,NULL,'2025-10-31 23:08:05','2025-10-31 23:08:05');
/*!40000 ALTER TABLE `handoff_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ivr_menus`
--

DROP TABLE IF EXISTS `ivr_menus`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ivr_menus` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `greeting_audio_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `greeting_text` text COLLATE utf8mb4_unicode_ci,
  `timeout` int NOT NULL DEFAULT '5',
  `max_attempts` int NOT NULL DEFAULT '3',
  `invalid_audio_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timeout_audio_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `ivr_menus_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_menus`
--

LOCK TABLES `ivr_menus` WRITE;
/*!40000 ALTER TABLE `ivr_menus` DISABLE KEYS */;
/*!40000 ALTER TABLE `ivr_menus` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ivr_options`
--

DROP TABLE IF EXISTS `ivr_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ivr_options` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ivr_menu_id` bigint NOT NULL,
  `digit` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_data` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ivr_menu_id` (`ivr_menu_id`),
  KEY `idx_digit` (`digit`),
  KEY `idx_sort_order` (`sort_order`),
  CONSTRAINT `ivr_options_ibfk_1` FOREIGN KEY (`ivr_menu_id`) REFERENCES `ivr_menus` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ivr_options`
--

LOCK TABLES `ivr_options` WRITE;
/*!40000 ALTER TABLE `ivr_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `ivr_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knowledge_base`
--

DROP TABLE IF EXISTS `knowledge_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledge_base` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subcategory` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `answer` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `keywords` text COLLATE utf8mb4_unicode_ci,
  `embedding` json DEFAULT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT 'en',
  `source_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_public` tinyint(1) DEFAULT '1',
  `usage_count` int DEFAULT '0',
  `helpful_count` int DEFAULT '0',
  `not_helpful_count` int DEFAULT '0',
  `last_used_at` timestamp NULL DEFAULT NULL,
  `priority` int DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `updated_by` bigint DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tags` json DEFAULT NULL COMMENT 'Array of tags for filtering',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_category` (`tenant_id`,`category`),
  KEY `idx_active` (`tenant_id`,`is_active`),
  KEY `idx_usage` (`usage_count` DESC),
  KEY `created_by` (`created_by`),
  KEY `updated_by` (`updated_by`),
  FULLTEXT KEY `idx_question_answer` (`question`,`answer`,`keywords`),
  CONSTRAINT `knowledge_base_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `knowledge_base_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `knowledge_base_ibfk_3` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knowledge_base`
--

LOCK TABLES `knowledge_base` WRITE;
/*!40000 ALTER TABLE `knowledge_base` DISABLE KEYS */;
INSERT INTO `knowledge_base` VALUES (3,'demo-tenant','Shipping',NULL,'Standard Shipping Time','How long does shipping take?','We offer free shipping on orders over $50. Standard shipping takes 3-5 business days. Express shipping is available for $10 and takes 1-2 business days.','shipping, delivery, free shipping, express, time, days',NULL,'en',NULL,1,1,0,0,0,NULL,0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"ecommerce\", \"shipping\"]'),(4,'demo-tenant','Shipping',NULL,'International Shipping','Do you ship internationally?','Yes, we ship to over 50 countries worldwide. International shipping takes 7-14 business days and costs vary by location. Customs fees may apply.','international, worldwide, global, shipping, countries',NULL,'en',NULL,1,1,1,0,0,'2025-11-03 21:33:43',0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"ecommerce\", \"shipping\"]'),(5,'demo-tenant','Returns',NULL,'Return Policy','What is your return policy?','We accept returns within 30 days of purchase. Items must be unused and in original packaging with tags attached. Refund will be processed within 5-7 business days after we receive the item.','return, refund, money back, exchange, 30 days',NULL,'en',NULL,1,1,0,0,0,NULL,0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"ecommerce\", \"returns\", \"support\"]'),(6,'demo-tenant','Returns',NULL,'Return Process','How do I return an item?','To initiate a return: 1) Log into your account and go to Order History, 2) Select the order and click Return Item, 3) Print the prepaid return label, 4) Pack the item securely and drop it off at any carrier location.','return process, how to return, return steps, return label',NULL,'en',NULL,1,1,0,0,0,NULL,0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"ecommerce\", \"returns\", \"support\"]'),(7,'demo-tenant','Support',NULL,'Business Hours','What are your business hours?','Our customer support team is available Monday-Friday 9am-5pm EST. Weekend support is available via email and we respond within 24 hours. Live chat is available during business hours.','hours, open, time, weekend, support hours, availability',NULL,'en',NULL,1,1,0,0,0,NULL,0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"support\", \"contact\"]'),(8,'demo-tenant','Support',NULL,'Contact Methods','How can I contact support?','You can reach us through: Live chat (Mon-Fri 9am-5pm EST), Email: support@example.com (24hr response), Phone: 1-800-123-4567 (Mon-Fri 9am-5pm EST), or visit our Help Center.','contact, support, phone, email, chat, help',NULL,'en',NULL,1,1,1,0,0,'2025-11-03 19:32:38',0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"support\", \"contact\"]'),(9,'demo-tenant','Orders',NULL,'Track Order','How do I track my order?','You can track your order by: 1) Logging into your account and visiting Order History, 2) Clicking on the order number, 3) Viewing the tracking number and carrier information. You will also receive tracking updates via email.','track, tracking, order status, shipment, where is my order',NULL,'en',NULL,1,1,1,0,0,'2025-11-03 19:32:38',0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"technical\", \"troubleshooting\", \"support\"]'),(10,'demo-tenant','Orders',NULL,'Cancel Order','Can I cancel my order?','Orders can be cancelled within 1 hour of placement. After that, the order enters processing and cannot be cancelled. If your order has shipped, you will need to initiate a return once you receive it.','cancel, cancel order, stop order, change order',NULL,'en',NULL,1,1,1,0,0,'2025-11-03 19:32:38',0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:48','[\"ecommerce\", \"orders\"]'),(11,'demo-tenant','Products',NULL,'Product Warranty','Do your products have a warranty?','All products come with a 1-year manufacturer warranty covering defects in materials and workmanship. Extended warranty options are available at checkout. Warranty does not cover normal wear and tear or damage from misuse.','warranty, guarantee, defect, broken, repair, replacement',NULL,'en',NULL,1,1,0,0,0,NULL,0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"technical\", \"troubleshooting\", \"support\"]'),(12,'demo-tenant','Billing',NULL,'Payment Methods','What payment methods do you accept?','We accept all major credit cards (Visa, Mastercard, Amex, Discover), PayPal, Apple Pay, Google Pay, and shop gift cards. All transactions are secured with SSL encryption.','payment, credit card, paypal, apple pay, google pay, how to pay',NULL,'en',NULL,1,1,0,0,0,NULL,0,NULL,2,'2025-11-01 16:14:07','2025-11-04 00:38:30','[\"ecommerce\", \"payment\"]');
/*!40000 ALTER TABLE `knowledge_base` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knowledge_base_documents`
--

DROP TABLE IF EXISTS `knowledge_base_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `knowledge_base_documents` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `entries_created` int DEFAULT '0',
  `uploaded_by` bigint NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_category` (`category`),
  KEY `idx_uploaded_by` (`uploaded_by`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `knowledge_base_documents_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `knowledge_base_documents_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knowledge_base_documents`
--

LOCK TABLES `knowledge_base_documents` WRITE;
/*!40000 ALTER TABLE `knowledge_base_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `knowledge_base_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `conversation_id` bigint NOT NULL,
  `sender_type` enum('customer','agent','bot','system') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sender_id` bigint DEFAULT NULL,
  `sender_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_type` enum('text','image','video','audio','file','location','template','quick_reply') COLLATE utf8mb4_unicode_ci DEFAULT 'text',
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_mime_type` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_size` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `is_internal_note` tinyint(1) DEFAULT '0',
  `intent` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sentiment` float DEFAULT NULL,
  `entities` json DEFAULT NULL,
  `confidence` float DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_conversation` (`conversation_id`,`sent_at`),
  KEY `idx_unread` (`conversation_id`,`is_read`),
  KEY `idx_sender` (`sender_type`,`sender_id`),
  KEY `idx_intent` (`intent`),
  KEY `sender_id` (`sender_id`),
  FULLTEXT KEY `idx_content` (`content`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `type` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `data` json DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notifications_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ps_aors`
--

DROP TABLE IF EXISTS `ps_aors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ps_aors` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contact` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_expiration` int DEFAULT NULL,
  `mailboxes` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_contacts` int DEFAULT NULL,
  `minimum_expiration` int DEFAULT NULL,
  `remove_existing` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualify_frequency` int DEFAULT NULL,
  `authenticate_qualify` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maximum_expiration` int DEFAULT NULL,
  `outbound_proxy` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `support_path` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualify_timeout` decimal(4,2) DEFAULT NULL,
  `voicemail_extension` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `remove_unavailable` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ps_aors`
--

LOCK TABLES `ps_aors` WRITE;
/*!40000 ALTER TABLE `ps_aors` DISABLE KEYS */;
INSERT INTO `ps_aors` VALUES ('agent100',NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `ps_aors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ps_auths`
--

DROP TABLE IF EXISTS `ps_auths`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ps_auths` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nonce_lifetime` int DEFAULT NULL,
  `md5_cred` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `realm` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `username` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ps_auths`
--

LOCK TABLES `ps_auths` WRITE;
/*!40000 ALTER TABLE `ps_auths` DISABLE KEYS */;
INSERT INTO `ps_auths` VALUES ('agent100-auth','userpass',NULL,NULL,'agent100pass',NULL,'agent100');
/*!40000 ALTER TABLE `ps_auths` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ps_contacts`
--

DROP TABLE IF EXISTS `ps_contacts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ps_contacts` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uri` varchar(511) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expiration_time` bigint DEFAULT NULL,
  `qualify_frequency` int DEFAULT NULL,
  `outbound_proxy` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `path` text COLLATE utf8mb4_unicode_ci,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qualify_timeout` decimal(4,2) DEFAULT NULL,
  `reg_server` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `authenticate_qualify` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `via_addr` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `via_port` int DEFAULT NULL,
  `call_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `prune_on_boot` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ps_contacts`
--

LOCK TABLES `ps_contacts` WRITE;
/*!40000 ALTER TABLE `ps_contacts` DISABLE KEYS */;
/*!40000 ALTER TABLE `ps_contacts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ps_endpoints`
--

DROP TABLE IF EXISTS `ps_endpoints`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ps_endpoints` (
  `id` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transport` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aors` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `auth` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `context` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disallow` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allow` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direct_media` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `connected_line_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direct_media_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direct_media_glare_mitigation` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disable_direct_media_on_nat` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtmf_mode` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `external_media_address` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `force_rport` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ice_support` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `identify_by` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mailboxes` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `moh_suggest` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `outbound_auth` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `outbound_proxy` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rewrite_contact` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rtp_ipv6` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rtp_symmetric` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `send_diversion` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `send_pai` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `send_rpid` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timers_min_se` int DEFAULT NULL,
  `timers` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timers_sess_expires` int DEFAULT NULL,
  `callerid` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `callerid_privacy` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `callerid_tag` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `100rel` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `aggregate_mwi` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trust_id_inbound` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trust_id_outbound` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `use_ptime` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `use_avpf` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_encryption` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `inband_progress` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `call_group` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pickup_group` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `named_call_group` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `named_pickup_group` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_state_busy_at` int DEFAULT NULL,
  `fax_detect` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `t38_udptl` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `t38_udptl_ec` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `t38_udptl_maxdatagram` int DEFAULT NULL,
  `t38_udptl_nat` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `t38_udptl_ipv6` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tone_zone` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `one_touch_recording` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_on_feature` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_off_feature` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rtp_engine` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allow_transfer` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allow_subscribe` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdp_owner` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sdp_session` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tos_audio` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tos_video` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cos_audio` int DEFAULT NULL,
  `cos_video` int DEFAULT NULL,
  `sub_min_expiry` int DEFAULT NULL,
  `from_domain` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `from_user` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mwi_from_user` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_verify` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_rekey` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_cert_file` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_private_key` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_cipher` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_ca_file` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_ca_path` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_setup` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `srtp_tag_32` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `media_address` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `redirect_method` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `set_var` text COLLATE utf8mb4_unicode_ci,
  `cos` int DEFAULT NULL,
  `message_context` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `accountcode` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `preferred_codec_only` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rtp_keepalive` int DEFAULT NULL,
  `rtp_timeout` int DEFAULT NULL,
  `rtp_timeout_hold` int DEFAULT NULL,
  `bind_rtp_to_media_address` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voicemail_extension` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mwi_subscribe_replaces_unsolicited` int DEFAULT NULL,
  `deny` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `permit` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `acl` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_deny` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_permit` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_acl` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `subscribe_context` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fax_detect_timeout` int DEFAULT NULL,
  `contact_user` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `rpid_immediate` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ignore_183_without_sdp` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `max_audio_streams` int DEFAULT NULL,
  `max_video_streams` int DEFAULT NULL,
  `bundle` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `webrtc` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dtls_fingerprint` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `incoming_call_offer_pref` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `outgoing_call_offer_pref` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stir_shaken` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `send_history_info` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `allow_unauthenticated_options` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ps_endpoints`
--

LOCK TABLES `ps_endpoints` WRITE;
/*!40000 ALTER TABLE `ps_endpoints` DISABLE KEYS */;
INSERT INTO `ps_endpoints` VALUES ('agent100','transport-udp','agent100','agent100-auth','from-internal','all','ulaw,alaw',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `ps_endpoints` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queue_members`
--

DROP TABLE IF EXISTS `queue_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queue_members` (
  `uniqueid` int NOT NULL AUTO_INCREMENT,
  `queue_name` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `interface` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `membername` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `state_interface` varchar(128) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `penalty` int DEFAULT NULL,
  `paused` int DEFAULT NULL,
  `wrapuptime` int DEFAULT NULL,
  PRIMARY KEY (`uniqueid`),
  KEY `idx_queue` (`queue_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queue_members`
--

LOCK TABLES `queue_members` WRITE;
/*!40000 ALTER TABLE `queue_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `queue_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `queues`
--

DROP TABLE IF EXISTS `queues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `queues` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `display_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `strategy` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ringall',
  `timeout` int NOT NULL DEFAULT '30',
  `retry` int NOT NULL DEFAULT '5',
  `max_wait_time` int NOT NULL DEFAULT '300',
  `announce_frequency` int NOT NULL DEFAULT '0',
  `announce_position` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'no',
  `music_on_hold` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_name` (`tenant_id`,`name`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `queues_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `queues`
--

LOCK TABLES `queues` WRITE;
/*!40000 ALTER TABLE `queues` DISABLE KEYS */;
/*!40000 ALTER TABLE `queues` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quick_replies`
--

DROP TABLE IF EXISTS `quick_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quick_replies` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `shortcut` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_global` tinyint(1) DEFAULT '0',
  `created_by` bigint DEFAULT NULL,
  `usage_count` int DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_shortcut` (`tenant_id`,`shortcut`),
  KEY `idx_category` (`tenant_id`,`category`),
  KEY `idx_usage` (`usage_count` DESC),
  KEY `created_by` (`created_by`),
  CONSTRAINT `quick_replies_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `quick_replies_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quick_replies`
--

LOCK TABLES `quick_replies` WRITE;
/*!40000 ALTER TABLE `quick_replies` DISABLE KEYS */;
/*!40000 ALTER TABLE `quick_replies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recordings`
--

DROP TABLE IF EXISTS `recordings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recordings` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cdr_id` bigint DEFAULT NULL,
  `unique_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `duration` int DEFAULT NULL,
  `format` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'wav',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_cdr_id` (`cdr_id`),
  KEY `idx_unique_id` (`unique_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `recordings_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recordings_ibfk_2` FOREIGN KEY (`cdr_id`) REFERENCES `cdrs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recordings`
--

LOCK TABLES `recordings` WRITE;
/*!40000 ALTER TABLE `recordings` DISABLE KEYS */;
/*!40000 ALTER TABLE `recordings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedules`
--

DROP TABLE IF EXISTS `schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedules` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `timezone` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'UTC',
  `schedule_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'business_hours',
  `rules` json NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_schedule_type` (`schedule_type`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedules`
--

LOCK TABLES `schedules` WRITE;
/*!40000 ALTER TABLE `schedules` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_messages`
--

DROP TABLE IF EXISTS `sms_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sms_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message_sid` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direction` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `from_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `to_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `num_segments` int NOT NULL DEFAULT '1',
  `price` decimal(10,4) DEFAULT NULL,
  `price_unit` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_code` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `user_id` bigint DEFAULT NULL,
  `contact_id` bigint DEFAULT NULL,
  `sent_at` timestamp NULL DEFAULT NULL,
  `delivered_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_sid` (`message_sid`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_message_sid` (`message_sid`),
  KEY `idx_direction` (`direction`),
  KEY `idx_from_number` (`from_number`),
  KEY `idx_to_number` (`to_number`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_contact_id` (`contact_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `sms_messages_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sms_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `sms_messages_ibfk_3` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_messages`
--

LOCK TABLES `sms_messages` WRITE;
/*!40000 ALTER TABLE `sms_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `speed_dials`
--

DROP TABLE IF EXISTS `speed_dials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `speed_dials` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint NOT NULL,
  `position` int NOT NULL,
  `label` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_position` (`user_id`,`position`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `speed_dials_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `speed_dials_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `speed_dials`
--

LOCK TABLES `speed_dials` WRITE;
/*!40000 ALTER TABLE `speed_dials` DISABLE KEYS */;
/*!40000 ALTER TABLE `speed_dials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `survey_responses`
--

DROP TABLE IF EXISTS `survey_responses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `survey_responses` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `survey_id` bigint NOT NULL,
  `cdr_id` bigint DEFAULT NULL,
  `responses` json NOT NULL,
  `overall_rating` int DEFAULT NULL,
  `completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_survey_id` (`survey_id`),
  KEY `idx_cdr_id` (`cdr_id`),
  KEY `idx_overall_rating` (`overall_rating`),
  KEY `idx_completed_at` (`completed_at`),
  CONSTRAINT `survey_responses_ibfk_1` FOREIGN KEY (`survey_id`) REFERENCES `call_surveys` (`id`) ON DELETE CASCADE,
  CONSTRAINT `survey_responses_ibfk_2` FOREIGN KEY (`cdr_id`) REFERENCES `cdrs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `survey_responses`
--

LOCK TABLES `survey_responses` WRITE;
/*!40000 ALTER TABLE `survey_responses` DISABLE KEYS */;
/*!40000 ALTER TABLE `survey_responses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tenants` (
  `id` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','suspended','trial','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `max_agents` int DEFAULT '10',
  `max_dids` int DEFAULT '5',
  `max_concurrent_calls` int DEFAULT '10',
  `features` json DEFAULT NULL COMMENT '{"webrtc":true,"sms":true,"recording":true,"queue":true}',
  `settings` json DEFAULT NULL COMMENT 'Tenant-specific settings',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `domain_mode` enum('single','multiple') COLLATE utf8mb4_unicode_ci DEFAULT 'multiple',
  `max_websites` int DEFAULT NULL COMMENT 'NULL = unlimited',
  PRIMARY KEY (`id`),
  UNIQUE KEY `domain` (`domain`),
  KEY `idx_status` (`status`),
  KEY `idx_domain` (`domain`),
  KEY `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES ('demo-tenant','Demo Tenant','demo.local','active',10,5,10,NULL,'{}','2025-10-31 22:40:06','2025-11-04 00:20:17','multiple',10);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_messages`
--

DROP TABLE IF EXISTS `ticket_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ticket_id` bigint NOT NULL,
  `user_id` bigint DEFAULT NULL,
  `sender_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sender_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_internal` tinyint(1) NOT NULL DEFAULT '0',
  `is_html` tinyint(1) NOT NULL DEFAULT '0',
  `attachment_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_id` (`ticket_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_is_internal` (`is_internal`),
  CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_messages_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tickets` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ticket_number` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'open',
  `priority` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'normal',
  `category` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `source` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requester_id` bigint DEFAULT NULL,
  `requester_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `requester_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `assigned_to_id` bigint DEFAULT NULL,
  `assigned_team` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `due_date` timestamp NULL DEFAULT NULL,
  `resolved_at` timestamp NULL DEFAULT NULL,
  `closed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_ticket_number` (`tenant_id`,`ticket_number`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_priority` (`priority`),
  KEY `idx_requester_id` (`requester_id`),
  KEY `idx_assigned_to_id` (`assigned_to_id`),
  KEY `idx_due_date` (`due_date`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `tickets_ibfk_3` FOREIGN KEY (`assigned_to_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_roles` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'agent',
  `extension` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_tenant` (`user_id`,`tenant_id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_role` (`role`),
  KEY `idx_extension` (`extension`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_ibfk_2` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1,'demo-tenant','admin',NULL,1,'2025-11-01 16:22:33','2025-11-01 16:22:33'),(2,2,'demo-tenant','manager',NULL,1,'2025-11-01 16:22:33','2025-11-01 16:22:33'),(3,3,'demo-tenant','agent',NULL,1,'2025-11-01 16:22:33','2025-11-01 16:22:33'),(4,4,'demo-tenant','agent',NULL,1,'2025-11-01 16:22:33','2025-11-01 16:22:33');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `username` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `avatar_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `email_verified` tinyint(1) DEFAULT '0',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `avatar` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `timezone` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `language` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_email` (`email`),
  UNIQUE KEY `idx_username` (`username`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','admin@callcenter.com','$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG','Admin','User','+1234567890','active',NULL,'2025-11-01 16:22:33','2025-11-01 16:36:17',0,NULL,NULL,NULL,NULL,NULL),(2,'manager','manager@callcenter.com','$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG','Manager','User','+1234567891','active',NULL,'2025-11-01 16:22:33','2025-11-01 16:36:17',0,NULL,NULL,NULL,NULL,NULL),(3,'agent1','agent1@callcenter.com','$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG','Agent','One','+1234567892','active',NULL,'2025-11-01 16:22:33','2025-11-01 16:36:17',0,NULL,NULL,NULL,NULL,NULL),(4,'agent2','agent2@callcenter.com','$2a$10$MjIueE.4Gir0ClC2xbkZ.eucCbkgChImalUF0asK3gTz.FQ7./qbG','Agent','Two','+1234567893','active',NULL,'2025-11-01 16:22:33','2025-11-01 16:36:17',0,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voicemail_messages`
--

DROP TABLE IF EXISTS `voicemail_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voicemail_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mailbox` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `context` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `message_number` int NOT NULL,
  `caller_id` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duration` int NOT NULL DEFAULT '0',
  `flag` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message_date` timestamp NOT NULL,
  `recording_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `transcription` text COLLATE utf8mb4_unicode_ci,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_mailbox` (`mailbox`),
  KEY `idx_context` (`context`),
  KEY `idx_message_date` (`message_date`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `voicemail_messages_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voicemail_messages`
--

LOCK TABLES `voicemail_messages` WRITE;
/*!40000 ALTER TABLE `voicemail_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `voicemail_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `websites`
--

DROP TABLE IF EXISTS `websites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `websites` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `domain` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_active` (`tenant_id`,`is_active`),
  CONSTRAINT `websites_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `websites`
--

LOCK TABLES `websites` WRITE;
/*!40000 ALTER TABLE `websites` DISABLE KEYS */;
INSERT INTO `websites` VALUES (1,'demo-tenant','E-commerce Store','shop.democompany.com','Main online store for product sales',1,'2025-11-04 00:20:17','2025-11-04 00:20:17'),(2,'demo-tenant','Support Portal','support.democompany.com','Customer support and help center',1,'2025-11-04 00:20:17','2025-11-04 00:20:17'),(3,'demo-tenant','Marketing Site','www.democompany.com','Main marketing website',1,'2025-11-04 00:20:17','2025-11-04 00:20:17'),(4,'demo-tenant','Blog Platform','blog.democompany.com','Updated: Company blog, news, and articles',1,'2025-11-04 10:21:23','2025-11-04 10:42:32'),(5,'demo-tenant','Updated Test Portal','test.example.com','Updated description for test portal',1,'2025-11-04 10:57:03','2025-11-04 10:57:03'),(6,'demo-tenant','Test Auto Widget Site','test-widget.example.com','Testing automatic widget creation',1,'2025-11-04 19:04:03','2025-11-04 19:04:03'),(7,'demo-tenant','Auto Widget Test 2','auto-widget2.example.com','Second test',1,'2025-11-04 19:04:57','2025-11-04 19:04:57'),(9,'demo-tenant','Auto Widget Success','success.example.com','Final test with correct schema',1,'2025-11-04 19:14:20','2025-11-04 19:14:20'),(10,'demo-tenant','soham.top','soham.top','',1,'2025-11-04 22:20:31','2025-11-04 22:20:31');
/*!40000 ALTER TABLE `websites` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-05  0:40:10
