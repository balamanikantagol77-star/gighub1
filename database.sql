-- ============================================================================
-- SMART LOCAL - DATABASE SCHEMA & SEED DATA
-- Database Name: `smart-local`
-- Designed for MySQL 8.0+ / MariaDB 10.3+ on Shared Hosting (e.g., InfinityFree)
-- ============================================================================

-- Note for InfinityFree / Shared Hosting:
-- If your host assigns a prefixed database name (e.g. `epiz_12345678_smart_local`),
-- replace `smart-local` with your exact assigned database name below.
CREATE DATABASE IF NOT EXISTS `smart-local` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `smart-local`;

-- Disable foreign key checks during table setup
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------------------------------------------------------
-- 1. USERS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('student', 'recruiter', 'admin') NOT NULL DEFAULT 'student',
  `status` ENUM('active', 'pending', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` DATETIME NULL,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 2. STUDENT PROFILES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `student_profiles`;
CREATE TABLE `student_profiles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `full_name` VARCHAR(120) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `city` VARCHAR(100) NOT NULL,
  `locality` VARCHAR(150) NULL,
  `college` VARCHAR(200) NULL,
  `course` VARCHAR(150) NULL,
  `graduation_year` INT UNSIGNED NULL,
  `skills` TEXT NULL COMMENT 'Comma-separated skill tags',
  `preferred_role` VARCHAR(150) NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `bio` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_student_city` (`city`),
  CONSTRAINT `fk_student_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 3. RECRUITER PROFILES
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `recruiter_profiles`;
CREATE TABLE `recruiter_profiles` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL UNIQUE,
  `recruiter_name` VARCHAR(120) NOT NULL,
  `company_name` VARCHAR(180) NOT NULL,
  `website` VARCHAR(255) NULL,
  `phone` VARCHAR(30) NULL,
  `location` VARCHAR(150) NOT NULL,
  `description` TEXT NULL,
  `verification_status` ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
  `verification_notes` TEXT NULL,
  `verified_at` DATETIME NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_recruiter_company` (`company_name`),
  INDEX `idx_recruiter_verification` (`verification_status`),
  CONSTRAINT `fk_recruiter_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 4. JOBS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `jobs`;
CREATE TABLE `jobs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `recruiter_id` INT UNSIGNED NULL COMMENT 'Null if imported via external feed',
  `title` VARCHAR(200) NOT NULL,
  `description` MEDIUMTEXT NOT NULL,
  `responsibilities` TEXT NULL,
  `qualifications` TEXT NULL,
  `category` VARCHAR(100) NOT NULL,
  `skills` VARCHAR(500) NOT NULL COMMENT 'Comma-separated required skills',
  `job_type` ENUM('internship', 'part-time', 'freelance', 'remote', 'project', 'full-time') NOT NULL DEFAULT 'internship',
  `work_arrangement` ENUM('on-site', 'remote', 'hybrid') NOT NULL DEFAULT 'on-site',
  `city` VARCHAR(100) NOT NULL,
  `locality` VARCHAR(150) NULL,
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `salary_min` DECIMAL(10, 2) NULL DEFAULT 0.00,
  `salary_max` DECIMAL(10, 2) NULL DEFAULT 0.00,
  `stipend_type` ENUM('fixed', 'range', 'unpaid', 'performance') DEFAULT 'fixed',
  `duration` VARCHAR(100) NULL COMMENT 'e.g., 3 Months, 6 Months',
  `openings` INT UNSIGNED DEFAULT 1,
  `application_deadline` DATE NULL,
  `source` VARCHAR(100) NOT NULL DEFAULT 'recruiter' COMMENT 'recruiter, api_feed, national_portal, etc.',
  `external_url` VARCHAR(255) NULL,
  `moderation_status` ENUM('pending', 'approved', 'rejected', 'expired') NOT NULL DEFAULT 'pending',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `is_verified` TINYINT(1) NOT NULL DEFAULT 0,
  `views_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_jobs_city` (`city`),
  INDEX `idx_jobs_category` (`category`),
  INDEX `idx_jobs_type` (`job_type`),
  INDEX `idx_jobs_moderation` (`moderation_status`),
  INDEX `idx_jobs_deadline` (`application_deadline`),
  INDEX `idx_jobs_featured` (`is_featured`),
  CONSTRAINT `fk_jobs_recruiter` FOREIGN KEY (`recruiter_id`) REFERENCES `recruiter_profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 5. JOB SOURCES (For external feeds / authorized APIs)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_sources`;
CREATE TABLE `job_sources` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `source_name` VARCHAR(150) NOT NULL,
  `source_type` ENUM('api', 'rss_feed', 'json_feed', 'partner') NOT NULL DEFAULT 'json_feed',
  `feed_url` VARCHAR(255) NOT NULL,
  `api_key_ref` VARCHAR(100) NULL COMMENT 'Masked identifier for credentials',
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 1,
  `last_import_at` DATETIME NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 6. JOB IMPORT LOGS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_import_logs`;
CREATE TABLE `job_import_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `source_id` INT UNSIGNED NULL,
  `started_at` DATETIME NOT NULL,
  `completed_at` DATETIME NULL,
  `status` ENUM('success', 'partial', 'failed') NOT NULL DEFAULT 'success',
  `imported_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `duplicate_count` INT UNSIGNED NOT NULL DEFAULT 0,
  `error_summary` TEXT NULL,
  CONSTRAINT `fk_import_source` FOREIGN KEY (`source_id`) REFERENCES `job_sources` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 7. APPLICATIONS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `applications`;
CREATE TABLE `applications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT UNSIGNED NOT NULL,
  `student_id` INT UNSIGNED NOT NULL,
  `resume_id` INT UNSIGNED NULL,
  `cover_letter` TEXT NULL,
  `status` ENUM('applied', 'under_review', 'shortlisted', 'interviewed', 'hired', 'rejected', 'withdrawn') NOT NULL DEFAULT 'applied',
  `applied_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_job_student` (`job_id`, `student_id`),
  INDEX `idx_app_student` (`student_id`),
  INDEX `idx_app_status` (`status`),
  CONSTRAINT `fk_app_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_app_student` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 8. APPLICATION STATUS HISTORY (Audit Trail)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `application_status_history`;
CREATE TABLE `application_status_history` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `application_id` INT UNSIGNED NOT NULL,
  `previous_status` VARCHAR(50) NULL,
  `new_status` VARCHAR(50) NOT NULL,
  `actor_id` INT UNSIGNED NOT NULL,
  `note` TEXT NULL,
  `changed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_status_app` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 9. SAVED JOBS (Bookmarks)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `saved_jobs`;
CREATE TABLE `saved_jobs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `job_id` INT UNSIGNED NOT NULL,
  `saved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_saved_student_job` (`student_id`, `job_id`),
  CONSTRAINT `fk_saved_student` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_saved_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 10. RESUMES (Uploaded files)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `resumes`;
CREATE TABLE `resumes` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `file_path` VARCHAR(255) NOT NULL,
  `original_filename` VARCHAR(200) NOT NULL,
  `file_size` INT UNSIGNED NOT NULL DEFAULT 0,
  `mime_type` VARCHAR(100) NOT NULL,
  `extracted_text` MEDIUMTEXT NULL,
  `analysis_status` ENUM('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_resume_student` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 11. RESUME ANALYSIS RESULTS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `resume_analysis`;
CREATE TABLE `resume_analysis` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `resume_id` INT UNSIGNED NOT NULL UNIQUE,
  `analysis_mode` ENUM('rule_based', 'ai') NOT NULL DEFAULT 'rule_based',
  `completeness_score` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `detected_skills` TEXT NULL,
  `missing_skills` TEXT NULL,
  `recommendations` TEXT NULL,
  `job_category_matches` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_analysis_resume` FOREIGN KEY (`resume_id`) REFERENCES `resumes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 12. RESUME BUILDER DOCUMENTS (Interactive web builder)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `resume_builder_documents`;
CREATE TABLE `resume_builder_documents` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(150) NOT NULL DEFAULT 'My College Resume',
  `resume_data` LONGTEXT NOT NULL COMMENT 'JSON structured resume content',
  `template_name` VARCHAR(50) NOT NULL DEFAULT 'modern_clean',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_builder_student` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 13. SUBSCRIPTION PLANS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `subscription_plans`;
CREATE TABLE `subscription_plans` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `duration_days` INT UNSIGNED NOT NULL DEFAULT 30,
  `features` TEXT NOT NULL COMMENT 'Comma or newline delimited feature points',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `display_order` TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 14. SUBSCRIPTIONS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT UNSIGNED NOT NULL,
  `plan_id` INT UNSIGNED NOT NULL,
  `status` ENUM('active', 'expired', 'cancelled') NOT NULL DEFAULT 'active',
  `starts_at` DATETIME NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_subs_student` (`student_id`),
  INDEX `idx_subs_status` (`status`),
  CONSTRAINT `fk_subs_student` FOREIGN KEY (`student_id`) REFERENCES `student_profiles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_subs_plan` FOREIGN KEY (`plan_id`) REFERENCES `subscription_plans` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 15. PAYMENTS TABLE
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `payments`;
CREATE TABLE `payments` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `subscription_id` INT UNSIGNED NULL,
  `gateway` VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  `order_id` VARCHAR(100) NOT NULL,
  `transaction_id` VARCHAR(100) NULL,
  `amount` DECIMAL(10, 2) NOT NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'INR',
  `status` ENUM('pending', 'completed', 'failed', 'refunded') NOT NULL DEFAULT 'pending',
  `signature` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_payments_user` (`user_id`),
  INDEX `idx_payments_order` (`order_id`),
  CONSTRAINT `fk_pay_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pay_sub` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 16. NOTIFICATIONS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `title` VARCHAR(180) NOT NULL,
  `message` TEXT NOT NULL,
  `type` VARCHAR(50) NOT NULL DEFAULT 'info',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0,
  `link_url` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_notif_user` (`user_id`, `is_read`),
  CONSTRAINT `fk_notif_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 17. JOB REPORTS (Safety & Moderation)
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `job_reports`;
CREATE TABLE `job_reports` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `job_id` INT UNSIGNED NOT NULL,
  `reporter_id` INT UNSIGNED NOT NULL,
  `reason` VARCHAR(150) NOT NULL,
  `details` TEXT NULL,
  `status` ENUM('pending', 'investigating', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  `resolution_note` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` DATETIME NULL,
  INDEX `idx_report_job` (`job_id`),
  CONSTRAINT `fk_report_job` FOREIGN KEY (`job_id`) REFERENCES `jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_report_user` FOREIGN KEY (`reporter_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 18. PLATFORM SETTINGS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `platform_settings`;
CREATE TABLE `platform_settings` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 19. ADMIN AUDIT LOGS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `admin_audit_logs`;
CREATE TABLE `admin_audit_logs` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT UNSIGNED NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL,
  `entity_id` INT UNSIGNED NULL,
  `details` TEXT NULL,
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_admin` (`admin_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- 20. PASSWORD RESET TOKENS
-- ----------------------------------------------------------------------------
DROP TABLE IF EXISTS `password_reset_tokens`;
CREATE TABLE `password_reset_tokens` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT UNSIGNED NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_reset_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- SEED DATA (Default Settings, Plans, Sample Jobs, Categories)
-- ============================================================================

-- Default Platform Settings
INSERT INTO `platform_settings` (`setting_key`, `setting_value`) VALUES
('site_name', 'Smart Local'),
('site_tagline', 'Your Skills. Your City. Your Next Opportunity.'),
('contact_email', 'support@smartlocal.in'),
('contact_phone', '+91 98765 43210'),
('default_city', 'Bengaluru'),
('currency_symbol', '₹'),
('currency_code', 'INR'),
('job_moderation_required', '1'),
('auto_expire_days', '45'),
('max_resume_size_mb', '4'),
('allowed_resume_types', 'pdf,docx'),
('razorpay_key_id', 'rzp_test_placeholder_key'),
('razorpay_key_secret', 'rzp_test_placeholder_secret'),
('ai_analysis_enabled', '0'),
('gemini_api_key', ''),
('maintenance_mode', '0');

-- Subscription Plans (Tailored for College Students)
INSERT INTO `subscription_plans` (`name`, `code`, `price`, `currency`, `duration_days`, `features`, `is_active`, `display_order`) VALUES
('Free Student', 'free', 0.00, 'INR', 365, 'Browse and search all verified listings\nApply up to 10 opportunities/month\nSave up to 5 favorite listings\nCreate 1 web-builder resume\nStandard rule-based skill match\nEmail & dashboard notifications', 1, 1),
('Smart Plus Monthly', 'plus_monthly', 49.00, 'INR', 30, 'Unlimited job applications\nUnlimited saved favorites\nAdvanced skill-gap analysis & recommendations\nAI-assisted resume optimizer & score\nExport high-res PDF resumes\nPriority recruiter spotlight\nInstant matching alerts', 1, 2),
('Smart Plus Quarterly', 'plus_quarterly', 129.00, 'INR', 90, 'All Smart Plus Monthly features\n3 Months uninterrupted premium access\n₹43/month effective student rate\nInterview preparation checklist\nResume review priority queue', 1, 3),
('Smart Plus Annual', 'plus_annual', 399.00, 'INR', 365, 'All Smart Plus Monthly features\nFull 12 Months career guidance access\nBest value for undergraduate freshers\nDirect recruiter messaging access (when available)\nFree Certificate of Skill Proficiency', 1, 4);

-- External Job Sources for Ingestion
INSERT INTO `job_sources` (`source_name`, `source_type`, `feed_url`, `api_key_ref`, `is_enabled`, `last_import_at`) VALUES
('National Apprenticeship Portal Feed', 'json_feed', 'https://api.smartlocal.internal/feeds/national-apprenticeship.json', 'SEC_REF_NATS', 1, NOW()),
('Authorized Tech Gigs & College Projects', 'api', 'https://api.smartlocal.internal/feeds/college-gigs.json', 'SEC_REF_GIGS', 1, NOW());

-- Realistic Sample Jobs for Demonstration and Testing
INSERT INTO `jobs` (`recruiter_id`, `title`, `description`, `responsibilities`, `qualifications`, `category`, `skills`, `job_type`, `work_arrangement`, `city`, `locality`, `latitude`, `longitude`, `salary_min`, `salary_max`, `stipend_type`, `duration`, `openings`, `application_deadline`, `source`, `moderation_status`, `is_featured`, `is_verified`, `views_count`) VALUES
(NULL, 'Frontend Developer Intern (React & Tailwind)', 
'Join an energetic startup building educational tech platforms for students. You will work alongside senior software engineers to develop responsive UI components, integrate REST APIs, and optimize user flows.',
'Build responsive web screens using React and CSS\nCollaborate with UI designers\nParticipate in weekly sprint reviews and code refactoring',
'Enrolled in B.Tech/BCA/B.Sc Computer Science or relevant degree\nFamiliarity with HTML, CSS, JavaScript, and Git',
'Software Development', 'React, JavaScript, HTML5, CSS3, Tailwind CSS, Git', 'internship', 'hybrid', 'Bengaluru', 'Koramangala', 12.9352, 77.6245, 12000.00, 18000.00, 'range', '3 Months', 3, DATE_ADD(CURRENT_DATE, INTERVAL 30 DAY), 'recruiter', 'approved', 1, 1, 142),

(NULL, 'Junior Data Analyst Trainee',
'Looking for an enthusiastic fresher with strong analytical mindset to assist in data cleaning, exploratory data analysis, dashboard creation in Power BI, and SQL reporting.',
'Analyze daily performance datasets\nDraft weekly insights reports for marketing\nClean and transform CSV/Excel files using Python and SQL',
'Degree in Statistics, Mathematics, Engineering or Commerce with strong Excel skills\nBasic knowledge of SQL queries',
'Data Science & Analytics', 'SQL, Python, Excel, Power BI, Statistics', 'internship', 'on-site', 'Hyderabad', 'HITEC City', 17.4435, 78.3772, 10000.00, 15000.00, 'range', '6 Months', 2, DATE_ADD(CURRENT_DATE, INTERVAL 25 DAY), 'recruiter', 'approved', 1, 1, 98),

(NULL, 'UI/UX Design Freelance Gig for Campus App',
'Short-term freelance gig to redesign our campus community mobile application. Work closely with product leads to create Figma wireframes, interactive prototypes, and design tokens.',
'Conduct quick student interviews for usability\nDeliver Figma component libraries\nCreate clickable prototypes for testing',
'Strong portfolio demonstrating UI design principles, typography, and color systems\nProficiency in Figma',
'Design & Creative', 'Figma, UI Design, Wireframing, User Research, Prototyping', 'freelance', 'remote', 'Pune', 'Shivajinagar', 18.5314, 73.8446, 8000.00, 12000.00, 'fixed', '4 Weeks', 1, DATE_ADD(CURRENT_DATE, INTERVAL 15 DAY), 'recruiter', 'approved', 0, 1, 76),

(NULL, 'Local Content & Social Media Associate',
'Part-time role for local college students in Mumbai to capture campus stories, curate Instagram reels, write short blog posts, and assist in college community workshops.',
'Create 3 short-form videos per week\nCover college tech fests and networking meetups\nEngage with student queries on social channels',
'Strong communication in English and Hindi\nCreative storytelling and reel editing skills',
'Marketing & Content', 'Content Writing, Social Media, Video Editing, Canva, Communication', 'part-time', 'hybrid', 'Mumbai', 'Bandra West', 19.0596, 72.8295, 6000.00, 9000.00, 'range', 'Ongoing', 2, DATE_ADD(CURRENT_DATE, INTERVAL 40 DAY), 'recruiter', 'approved', 0, 1, 54),

(NULL, 'Campus IoT Smart Energy Monitoring Project',
'College project collaboration opportunity mentored by industry hardware engineers. Build sensor-based energy consumption trackers using ESP32, MQTT protocols, and a dashboard.',
'Program ESP32 microcontrollers with Arduino C++\nSet up MQTT broker and API endpoints\nAssemble prototype breadboards and test accuracy',
'Knowledge of C/C++, basic electronics, and Arduino IDE\nPassionate about Internet of Things and smart energy',
'College Projects', 'C++, Arduino, ESP32, IoT, MQTT, Electronics', 'project', 'on-site', 'Delhi', 'Connaught Place', 28.6315, 77.2167, 5000.00, 5000.00, 'fixed', '2 Months', 4, DATE_ADD(CURRENT_DATE, INTERVAL 20 DAY), 'recruiter', 'approved', 1, 0, 89),

(NULL, 'Remote Python Backend Trainee',
'Full remote internship for fresh graduates. Develop RESTful APIs using FastAPI or Django, connect PostgreSQL databases, and write unit tests.',
'Write clean and modular Python code\nBuild database migrations and API schemas\nIntegrate third-party services and write documentation',
'Good grasp of Python 3, Object-Oriented Programming, and basic relational databases\nFamiliar with Git',
'Software Development', 'Python, FastAPI, Django, PostgreSQL, REST APIs, Git', 'internship', 'remote', 'Bengaluru', 'Remote', 12.9716, 77.5946, 15000.00, 20000.00, 'range', '4 Months', 2, DATE_ADD(CURRENT_DATE, INTERVAL 35 DAY), 'recruiter', 'approved', 1, 1, 180);

-- Default Super Administrator Seed
-- Login ID: admin@smartlocal.in
-- Password: Admin@SmartLocal2026!
INSERT INTO `users` (`id`, `email`, `password_hash`, `role`, `status`) VALUES
(1, 'admin@smartlocal.in', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'active')
ON DUPLICATE KEY UPDATE `role` = 'admin', `status` = 'active';
