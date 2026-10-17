<?php
/**
 * SMART LOCAL - Smart Internship, Local Job & Gig Discovery Platform
 * File: index.php
 * Architecture: Core PHP 8+, MySQL PDO, Bootstrap 5, Vanilla JS / Fetch AJAX
 * Suitable for: InfinityFree Shared Hosting & Local LAMP/WAMP/XAMPP
 */

// Strict error reporting for development, friendly error handler for production
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Start secure session
if (session_status() === PHP_SESSION_NONE) {
    // Shared hosting cookie parameter hardening
    $cookieParams = session_get_cookie_params();
    $isHttps = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443);
    session_set_cookie_params([
        'lifetime' => 86400 * 7,
        'path' => '/',
        'domain' => $cookieParams['domain'],
        'secure' => $isHttps,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
    session_start();
}

// Generate CSRF token if missing
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// ============================================================================
// DATABASE CONNECTION CONFIGURATION
// ============================================================================
// On InfinityFree: Replace these with credentials from your hosting cPanel
$db_host = getenv('DB_HOST') ?: '127.0.0.1';
$db_port = getenv('DB_PORT') ?: '3306';
$db_name = getenv('DB_NAME') ?: 'smart-local';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') ?: '';

$pdo = null;
$db_error = null;

try {
    $dsn = "mysql:host={$db_host};port={$db_port};dbname={$db_name};charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
} catch (PDOException $e) {
    $db_error = "Database Connection Notice: " . htmlspecialchars($e->getMessage());
}

// ============================================================================
// HELPER FUNCTIONS & MIDDLEWARE
// ============================================================================

function e($str) {
    return htmlspecialchars((string)($str ?? ''), ENT_QUOTES, 'UTF-8');
}

function verify_csrf() {
    $token = $_POST['csrf_token'] ?? $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        die("Security Error: CSRF token validation failed. Please refresh the page and try again.");
    }
}

function is_logged_in() {
    return !empty($_SESSION['user_id']);
}

function current_user_role() {
    return $_SESSION['user_role'] ?? null;
}

function require_auth($role = null) {
    if (!is_logged_in()) {
        header("Location: index.php?page=login&msg=login_required");
        exit;
    }
    if ($role && current_user_role() !== $role) {
        header("Location: index.php?page=unauthorized");
        exit;
    }
}

function get_setting($pdo, $key, $default = '') {
    if (!$pdo) return $default;
    try {
        $stmt = $pdo->prepare("SELECT setting_value FROM platform_settings WHERE setting_key = ? LIMIT 1");
        $stmt->execute([$key]);
        $val = $stmt->fetchColumn();
        return $val !== false ? $val : $default;
    } catch (Exception $e) {
        return $default;
    }
}

function add_notification($pdo, $user_id, $title, $message, $type = 'info', $link = null) {
    if (!$pdo || !$user_id) return false;
    try {
        $stmt = $pdo->prepare("INSERT INTO notifications (user_id, title, message, type, link_url) VALUES (?, ?, ?, ?, ?)");
        return $stmt->execute([$user_id, $title, $message, $type, $link]);
    } catch (Exception $e) {
        return false;
    }
}

function calculate_match_percentage($user_skills_str, $job_skills_str) {
    if (empty($user_skills_str) || empty($job_skills_str)) return 0;
    
    $user_skills = array_filter(array_map('trim', array_map('strtolower', explode(',', $user_skills_str))));
    $job_skills = array_filter(array_map('trim', array_map('strtolower', explode(',', $job_skills_str))));
    
    if (empty($job_skills)) return 50;
    
    $matched = 0;
    foreach ($job_skills as $js) {
        foreach ($user_skills as $us) {
            if ($js === $us || str_contains($us, $js) || str_contains($js, $us)) {
                $matched++;
                break;
            }
        }
    }
    
    $percent = round(($matched / count($job_skills)) * 100);
    return min(100, max(15, (int)$percent));
}

// Haversine formula for distance between 2 sets of lat/lon
function get_distance_km($lat1, $lon1, $lat2, $lon2) {
    if (!$lat1 || !$lon1 || !$lat2 || !$lon2) return null;
    $earth_radius = 6371;
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    $a = sin($dLat/2) * sin($dLat/2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon/2) * sin($dLon/2);
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    return round($earth_radius * $c, 1);
}

// Current logged in user details helper
$current_user = null;
$student_profile = null;
$recruiter_profile = null;
$unread_notifs_count = 0;

if ($pdo && is_logged_in()) {
    $stmt = $pdo->prepare("SELECT id, email, role, status FROM users WHERE id = ? LIMIT 1");
    $stmt->execute([$_SESSION['user_id']]);
    $current_user = $stmt->fetch();
    
    if ($current_user) {
        if ($current_user['role'] === 'student') {
            $stmt = $pdo->prepare("SELECT * FROM student_profiles WHERE user_id = ? LIMIT 1");
            $stmt->execute([$current_user['id']]);
            $student_profile = $stmt->fetch();
        } elseif ($current_user['role'] === 'recruiter') {
            $stmt = $pdo->prepare("SELECT * FROM recruiter_profiles WHERE user_id = ? LIMIT 1");
            $stmt->execute([$current_user['id']]);
            $recruiter_profile = $stmt->fetch();
        }
        
        // Notifications count
        $stmt = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
        $stmt->execute([$current_user['id']]);
        $unread_notifs_count = (int)$stmt->fetchColumn();
    }
}

// Active subscription check for students
$has_active_plus = false;
$active_subscription = null;
if ($pdo && $student_profile) {
    $stmt = $pdo->prepare("SELECT s.*, p.name as plan_name, p.code as plan_code 
                           FROM subscriptions s 
                           JOIN subscription_plans p ON s.plan_id = p.id 
                           WHERE s.student_id = ? AND s.status = 'active' AND s.expires_at >= NOW() 
                           ORDER BY s.id DESC LIMIT 1");
    $stmt->execute([$student_profile['id']]);
    $active_subscription = $stmt->fetch();
    if ($active_subscription && $active_subscription['plan_code'] !== 'free') {
        $has_active_plus = true;
    }
}

// ============================================================================
// AJAX / ACTION ROUTER
// ============================================================================
$action = $_GET['action'] ?? null;

if ($action && $pdo) {
    header('Content-Type: application/json; charset=utf-8');

    // 1. Toggle Bookmark / Saved Job
    if ($action === 'toggle_save_job') {
        verify_csrf();
        if (!$student_profile) {
            echo json_encode(['success' => false, 'message' => 'Please log in as a student to save jobs.']);
            exit;
        }
        $job_id = (int)($_POST['job_id'] ?? 0);
        $stmt = $pdo->prepare("SELECT id FROM saved_jobs WHERE student_id = ? AND job_id = ?");
        $stmt->execute([$student_profile['id'], $job_id]);
        $existing = $stmt->fetch();
        
        if ($existing) {
            $del = $pdo->prepare("DELETE FROM saved_jobs WHERE id = ?");
            $del->execute([$existing['id']]);
            echo json_encode(['success' => true, 'saved' => false, 'message' => 'Removed from saved jobs.']);
        } else {
            $ins = $pdo->prepare("INSERT INTO saved_jobs (student_id, job_id) VALUES (?, ?)");
            $ins->execute([$student_profile['id'], $job_id]);
            echo json_encode(['success' => true, 'saved' => true, 'message' => 'Saved to your favorites!']);
        }
        exit;
    }

    // 2. Mark Notification as Read
    if ($action === 'mark_notification') {
        verify_csrf();
        $notif_id = (int)($_POST['id'] ?? 0);
        if ($current_user) {
            $stmt = $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?");
            $stmt->execute([$notif_id, $current_user['id']]);
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false]);
        }
        exit;
    }

    // 3. Save Resume Builder JSON Document
    if ($action === 'save_resume_builder') {
        verify_csrf();
        if (!$student_profile) {
            echo json_encode(['success' => false, 'message' => 'Student authentication required.']);
            exit;
        }
        $title = trim($_POST['title'] ?? 'My College Resume');
        $template = trim($_POST['template_name'] ?? 'modern_clean');
        $resume_data = $_POST['resume_data'] ?? '{}';

        // Check if document exists
        $stmt = $pdo->prepare("SELECT id FROM resume_builder_documents WHERE student_id = ? LIMIT 1");
        $stmt->execute([$student_profile['id']]);
        $existing = $stmt->fetch();

        if ($existing) {
            $stmt = $pdo->prepare("UPDATE resume_builder_documents SET title = ?, resume_data = ?, template_name = ? WHERE id = ?");
            $stmt->execute([$title, $resume_data, $template, $existing['id']]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO resume_builder_documents (student_id, title, resume_data, template_name) VALUES (?, ?, ?, ?)");
            $stmt->execute([$student_profile['id'], $title, $resume_data, $template]);
        }
        echo json_encode(['success' => true, 'message' => 'Resume draft saved successfully!']);
        exit;
    }

    // 4. Submit Job Scam Report
    if ($action === 'report_job') {
        verify_csrf();
        if (!$current_user) {
            echo json_encode(['success' => false, 'message' => 'Please log in to report listings.']);
            exit;
        }
        $job_id = (int)($_POST['job_id'] ?? 0);
        $reason = trim($_POST['reason'] ?? 'Suspicious Listing');
        $details = trim($_POST['details'] ?? '');

        $stmt = $pdo->prepare("INSERT INTO job_reports (job_id, reporter_id, reason, details) VALUES (?, ?, ?, ?)");
        $stmt->execute([$job_id, $current_user['id'], $reason, $details]);
        echo json_encode(['success' => true, 'message' => 'Thank you for reporting. Our moderation team will review this listing shortly.']);
        exit;
    }
}

// ============================================================================
// POST FORM CONTROLLERS (Auth, Job Posting, Applications, Checkout)
// ============================================================================
$msg = $_GET['msg'] ?? null;
$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && $pdo) {
    $form_action = $_POST['form_action'] ?? '';

    // A. Student Registration
    if ($form_action === 'register_student') {
        verify_csrf();
        $email = trim(filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL));
        $password = $_POST['password'] ?? '';
        $full_name = trim($_POST['full_name'] ?? '');
        $city = trim($_POST['city'] ?? '');
        $locality = trim($_POST['locality'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $college = trim($_POST['college'] ?? '');
        $course = trim($_POST['course'] ?? '');
        $grad_year = !empty($_POST['graduation_year']) ? (int)$_POST['graduation_year'] : null;
        $skills = trim($_POST['skills'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = "Please provide a valid email address.";
        } elseif (strlen($password) < 6) {
            $error = "Password must be at least 6 characters long.";
        } elseif (empty($full_name) || empty($city)) {
            $error = "Full Name and City are required fields.";
        } else {
            // Check if user exists
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $error = "An account with this email address already exists. Please log in.";
            } else {
                $pdo->beginTransaction();
                try {
                    $hash = password_hash($password, PASSWORD_DEFAULT);
                    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, 'student', 'active')");
                    $stmt->execute([$email, $hash]);
                    $user_id = $pdo->lastInsertId();

                    $stmt = $pdo->prepare("INSERT INTO student_profiles (user_id, full_name, phone, city, locality, college, course, graduation_year, skills) 
                                           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->execute([$user_id, $full_name, $phone, $city, $locality, $college, $course, $grad_year, $skills]);
                    $student_id = $pdo->lastInsertId();

                    // Assign Free Student Plan automatically
                    $stmtPlan = $pdo->prepare("SELECT id FROM subscription_plans WHERE code = 'free' LIMIT 1");
                    $stmtPlan->execute();
                    $free_plan = $stmtPlan->fetch();
                    if ($free_plan) {
                        $stmtSub = $pdo->prepare("INSERT INTO subscriptions (student_id, plan_id, status, starts_at, expires_at) 
                                                  VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 365 DAY))");
                        $stmtSub->execute([$student_id, $free_plan['id']]);
                    }

                    // Welcome Notification
                    add_notification($pdo, $user_id, "Welcome to Smart Local!", "Discover internships and local jobs near {$city}. Complete your profile to get 100% matched.", 'success', 'index.php?page=student-dashboard');

                    $pdo->commit();

                    // Log in user
                    session_regenerate_id(true);
                    $_SESSION['user_id'] = $user_id;
                    $_SESSION['user_role'] = 'student';
                    $_SESSION['user_name'] = $full_name;

                    header("Location: index.php?page=student-dashboard&msg=welcome");
                    exit;
                } catch (Exception $e) {
                    $pdo->rollBack();
                    $error = "Registration failed. " . $e->getMessage();
                }
            }
        }
    }

    // B. Recruiter Registration
    if ($form_action === 'register_recruiter') {
        verify_csrf();
        $email = trim(filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL));
        $password = $_POST['password'] ?? '';
        $recruiter_name = trim($_POST['recruiter_name'] ?? '');
        $company_name = trim($_POST['company_name'] ?? '');
        $website = trim($_POST['website'] ?? '');
        $location = trim($_POST['location'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $description = trim($_POST['description'] ?? '');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $error = "Please provide a valid company email address.";
        } elseif (strlen($password) < 6) {
            $error = "Password must be at least 6 characters long.";
        } elseif (empty($recruiter_name) || empty($company_name) || empty($location)) {
            $error = "Recruiter Name, Company Name, and Location are mandatory.";
        } else {
            $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
            $stmt->execute([$email]);
            if ($stmt->fetch()) {
                $error = "An account with this email already exists.";
            } else {
                $pdo->beginTransaction();
                try {
                    $hash = password_hash($password, PASSWORD_DEFAULT);
                    // Recruiter starts in 'active' account status but recruiter_profile verification_status is 'pending'
                    $stmt = $pdo->prepare("INSERT INTO users (email, password_hash, role, status) VALUES (?, ?, 'recruiter', 'active')");
                    $stmt->execute([$email, $hash]);
                    $user_id = $pdo->lastInsertId();

                    $stmt = $pdo->prepare("INSERT INTO recruiter_profiles (user_id, recruiter_name, company_name, website, phone, location, description, verification_status) 
                                           VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')");
                    $stmt->execute([$user_id, $recruiter_name, $company_name, $website, $phone, $location, $description]);

                    // Admin notification
                    add_notification($pdo, $user_id, "Recruiter Application Received", "Your company profile is under verification by our moderation team.", 'info', 'index.php?page=recruiter-dashboard');

                    $pdo->commit();

                    session_regenerate_id(true);
                    $_SESSION['user_id'] = $user_id;
                    $_SESSION['user_role'] = 'recruiter';
                    $_SESSION['user_name'] = $recruiter_name;

                    header("Location: index.php?page=recruiter-dashboard&msg=recruiter_pending");
                    exit;
                } catch (Exception $e) {
                    $pdo->rollBack();
                    $error = "Recruiter registration failed: " . $e->getMessage();
                }
            }
        }
    }

    // C. User Login
    if ($form_action === 'login') {
        verify_csrf();
        $email = trim(filter_var($_POST['email'] ?? '', FILTER_SANITIZE_EMAIL));
        $password = $_POST['password'] ?? '';

        if (empty($email) || empty($password)) {
            $error = "Please enter your email and password.";
        } else {
            $stmt = $pdo->prepare("SELECT id, email, password_hash, role, status FROM users WHERE email = ? LIMIT 1");
            $stmt->execute([$email]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password_hash'])) {
                if ($user['status'] === 'suspended') {
                    $error = "This account has been suspended by administration. Please contact support.";
                } else {
                    session_regenerate_id(true);
                    $_SESSION['user_id'] = $user['id'];
                    $_SESSION['user_role'] = $user['role'];

                    // Update last login
                    $stmtUpd = $pdo->prepare("UPDATE users SET last_login_at = NOW() WHERE id = ?");
                    $stmtUpd->execute([$user['id']]);

                    if ($user['role'] === 'student') {
                        header("Location: index.php?page=student-dashboard");
                    } elseif ($user['role'] === 'recruiter') {
                        header("Location: index.php?page=recruiter-dashboard");
                    } elseif ($user['role'] === 'admin') {
                        header("Location: admin.php");
                    } else {
                        header("Location: index.php");
                    }
                    exit;
                }
            } else {
                $error = "Invalid email or password credentials.";
            }
        }
    }

    // D. Recruiter: Post New Opportunity
    if ($form_action === 'post_job') {
        verify_csrf();
        require_auth('recruiter');

        if (!$recruiter_profile) {
            $error = "Recruiter profile missing.";
        } else {
            $title = trim($_POST['title'] ?? '');
            $category = trim($_POST['category'] ?? '');
            $job_type = trim($_POST['job_type'] ?? 'internship');
            $work_arrangement = trim($_POST['work_arrangement'] ?? 'on-site');
            $city = trim($_POST['city'] ?? '');
            $locality = trim($_POST['locality'] ?? '');
            $skills = trim($_POST['skills'] ?? '');
            $description = trim($_POST['description'] ?? '');
            $responsibilities = trim($_POST['responsibilities'] ?? '');
            $qualifications = trim($_POST['qualifications'] ?? '');
            $salary_min = floatval($_POST['salary_min'] ?? 0);
            $salary_max = floatval($_POST['salary_max'] ?? 0);
            $stipend_type = trim($_POST['stipend_type'] ?? 'fixed');
            $duration = trim($_POST['duration'] ?? '');
            $openings = max(1, (int)($_POST['openings'] ?? 1));
            $deadline = !empty($_POST['application_deadline']) ? $_POST['application_deadline'] : null;

            if (empty($title) || empty($category) || empty($city) || empty($skills) || empty($description)) {
                $error = "Job Title, Category, City, Skills, and Description are required.";
            } else {
                // Check if moderation required
                $mod_req = get_setting($pdo, 'job_moderation_required', '1');
                $status = ($mod_req === '1') ? 'pending' : 'approved';
                $is_verified = ($recruiter_profile['verification_status'] === 'verified') ? 1 : 0;

                $stmt = $pdo->prepare("INSERT INTO jobs (recruiter_id, title, description, responsibilities, qualifications, category, skills, job_type, work_arrangement, city, locality, salary_min, salary_max, stipend_type, duration, openings, application_deadline, source, moderation_status, is_verified) 
                                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'recruiter', ?, ?)");
                $stmt->execute([
                    $recruiter_profile['id'], $title, $description, $responsibilities, $qualifications, $category,
                    $skills, $job_type, $work_arrangement, $city, $locality, $salary_min, $salary_max, $stipend_type,
                    $duration, $openings, $deadline, $status, $is_verified
                ]);

                add_notification($pdo, $current_user['id'], "Job Posted", "Your listing '{$title}' was submitted. " . ($status === 'pending' ? 'Pending admin approval.' : 'Now live!'), 'success', 'index.php?page=recruiter-dashboard');

                header("Location: index.php?page=recruiter-dashboard&msg=job_posted");
                exit;
            }
        }
    }

    // E. Student: Submit Job Application
    if ($form_action === 'apply_job') {
        verify_csrf();
        require_auth('student');

        $job_id = (int)($_POST['job_id'] ?? 0);
        $cover_letter = trim($_POST['cover_letter'] ?? '');

        // Verify job is valid and active
        $stmtJob = $pdo->prepare("SELECT j.*, rp.user_id as recruiter_user_id FROM jobs j LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.id WHERE j.id = ? AND j.moderation_status = 'approved'");
        $stmtJob->execute([$job_id]);
        $job = $stmtJob->fetch();

        if (!$job) {
            $error = "Opportunity not found or no longer accepting applications.";
        } else {
            // Check if already applied
            $stmtCheck = $pdo->prepare("SELECT id FROM applications WHERE job_id = ? AND student_id = ?");
            $stmtCheck->execute([$job_id, $student_profile['id']]);
            if ($stmtCheck->fetch()) {
                $error = "You have already submitted an application for this opportunity.";
            } else {
                // Find student's latest uploaded resume
                $stmtRes = $pdo->prepare("SELECT id FROM resumes WHERE student_id = ? ORDER BY id DESC LIMIT 1");
                $stmtRes->execute([$student_profile['id']]);
                $resume = $stmtRes->fetch();
                $resume_id = $resume ? $resume['id'] : null;

                $pdo->beginTransaction();
                try {
                    $stmt = $pdo->prepare("INSERT INTO applications (job_id, student_id, resume_id, cover_letter, status) VALUES (?, ?, ?, ?, 'applied')");
                    $stmt->execute([$job_id, $student_profile['id'], $resume_id, $cover_letter]);
                    $app_id = $pdo->lastInsertId();

                    // Status History
                    $stmtHist = $pdo->prepare("INSERT INTO application_status_history (application_id, previous_status, new_status, actor_id, note) VALUES (?, NULL, 'applied', ?, 'Application submitted by student')");
                    $stmtHist->execute([$app_id, $current_user['id']]);

                    // Recruiter notification if posted by local recruiter
                    if (!empty($job['recruiter_user_id'])) {
                        add_notification($pdo, $job['recruiter_user_id'], "New Applicant!", "{$student_profile['full_name']} applied for '{$job['title']}'", 'info', 'index.php?page=recruiter-dashboard');
                    }

                    // Student notification
                    add_notification($pdo, $current_user['id'], "Application Submitted", "Your application for '{$job['title']}' has been received.", 'success', 'index.php?page=applications');

                    $pdo->commit();
                    header("Location: index.php?page=applications&msg=applied_success");
                    exit;
                } catch (Exception $e) {
                    $pdo->rollBack();
                    $error = "Application submission error: " . $e->getMessage();
                }
            }
        }
    }

    // F. Student: Withdraw Application
    if ($form_action === 'withdraw_application') {
        verify_csrf();
        require_auth('student');
        $app_id = (int)($_POST['application_id'] ?? 0);

        $stmt = $pdo->prepare("SELECT id, status FROM applications WHERE id = ? AND student_id = ?");
        $stmt->execute([$app_id, $student_profile['id']]);
        $app = $stmt->fetch();

        if ($app && !in_array($app['status'], ['hired', 'rejected', 'withdrawn'])) {
            $pdo->beginTransaction();
            $upd = $pdo->prepare("UPDATE applications SET status = 'withdrawn' WHERE id = ?");
            $upd->execute([$app['id']]);

            $stmtHist = $pdo->prepare("INSERT INTO application_status_history (application_id, previous_status, new_status, actor_id, note) VALUES (?, ?, 'withdrawn', ?, 'Withdrawn by student')");
            $stmtHist->execute([$app['id'], $app['status'], $current_user['id']]);
            $pdo->commit();

            header("Location: index.php?page=applications&msg=withdrawn");
            exit;
        } else {
            $error = "Application cannot be withdrawn in its current state.";
        }
    }

    // G. Recruiter: Update Application Status
    if ($form_action === 'update_application_status') {
        verify_csrf();
        require_auth('recruiter');

        $app_id = (int)($_POST['application_id'] ?? 0);
        $new_status = trim($_POST['status'] ?? '');
        $note = trim($_POST['note'] ?? '');

        $allowed_statuses = ['under_review', 'shortlisted', 'interviewed', 'hired', 'rejected'];
        if (!in_array($new_status, $allowed_statuses)) {
            $error = "Invalid status update specified.";
        } else {
            // Verify recruiter owns the job
            $stmt = $pdo->prepare("SELECT a.id, a.status, a.student_id, sp.user_id as student_user_id, j.title as job_title 
                                   FROM applications a 
                                   JOIN jobs j ON a.job_id = j.id 
                                   JOIN student_profiles sp ON a.student_id = sp.id
                                   WHERE a.id = ? AND j.recruiter_id = ?");
            $stmt->execute([$app_id, $recruiter_profile['id']]);
            $app = $stmt->fetch();

            if (!$app) {
                $error = "Unauthorized to update this application.";
            } else {
                $pdo->beginTransaction();
                $upd = $pdo->prepare("UPDATE applications SET status = ? WHERE id = ?");
                $upd->execute([$new_status, $app['id']]);

                $stmtHist = $pdo->prepare("INSERT INTO application_status_history (application_id, previous_status, new_status, actor_id, note) VALUES (?, ?, ?, ?, ?)");
                $stmtHist->execute([$app['id'], $app['status'], $new_status, $current_user['id'], $note]);

                // Notify student
                $readable_status = ucwords(str_replace('_', ' ', $new_status));
                add_notification($pdo, $app['student_user_id'], "Application Update: {$readable_status}", "Your application status for '{$app['job_title']}' was updated to {$readable_status}.", 'info', 'index.php?page=applications');

                $pdo->commit();
                header("Location: index.php?page=recruiter-dashboard&msg=status_updated");
                exit;
            }
        }
    }

    // H. Student: Upload Resume File & Rule-Based Analysis
    if ($form_action === 'upload_resume') {
        verify_csrf();
        require_auth('student');

        if (!isset($_FILES['resume_file']) || $_FILES['resume_file']['error'] !== UPLOAD_ERR_OK) {
            $error = "Please choose a valid resume file (PDF or DOCX).";
        } else {
            $file = $_FILES['resume_file'];
            $max_mb = (int)get_setting($pdo, 'max_resume_size_mb', '4');
            $max_bytes = $max_mb * 1024 * 1024;
            $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

            if (!in_array($ext, ['pdf', 'docx', 'txt'])) {
                $error = "Only PDF and DOCX files are permitted for security.";
            } elseif ($file['size'] > $max_bytes) {
                $error = "File exceeds the allowed limit of {$max_mb} MB.";
            } else {
                // Ensure upload folder exists with non-executable permissions
                $upload_dir = __DIR__ . '/uploads/resumes/';
                if (!is_dir($upload_dir)) {
                    @mkdir($upload_dir, 0755, true);
                    // Add .htaccess to block direct script execution in uploads
                    @file_put_contents($upload_dir . '.htaccess', "Options -ExecCGI\nRemoveHandler .php .phtml .php3 .php4 .php5 .php7 .phps\n<FilesMatch \"\.(php|php5|phtml)$\">\nOrder Deny,Allow\nDeny from all\n</FilesMatch>");
                }

                $safe_filename = 'resume_' . $student_profile['id'] . '_' . bin2hex(random_bytes(8)) . '.' . $ext;
                $target_path = $upload_dir . $safe_filename;

                if (move_uploaded_file($file['tmp_name'], $target_path)) {
                    // Extract text (basic rule-based text extraction)
                    $extracted_text = "";
                    if ($ext === 'txt') {
                        $extracted_text = file_get_contents($target_path);
                    } elseif ($ext === 'pdf') {
                        // Fast portable PDF text extractor in pure PHP (no external dependencies required)
                        $content = @file_get_contents($target_path);
                        if ($content) {
                            // Extract stream content
                            preg_match_all('/stream\s*(.*?)\s*endstream/s', $content, $matches);
                            foreach ($matches[1] as $stream) {
                                $decompressed = @gzuncompress($stream);
                                if ($decompressed !== false) {
                                    $stream = $decompressed;
                                }
                                if (preg_match_all('/\((.*?)\)\s*Tj/s', $stream, $text_matches)) {
                                    $extracted_text .= implode(' ', $text_matches[1]) . ' ';
                                }
                            }
                        }
                    }
                    if (empty(trim($extracted_text))) {
                        // Fallback text if binary parser could not decompress streams
                        $extracted_text = "Skills: " . ($student_profile['skills'] ?? '') . "\nEducation: " . ($student_profile['college'] ?? '') . " " . ($student_profile['course'] ?? '');
                    }

                    // Store resume record
                    $stmt = $pdo->prepare("INSERT INTO resumes (student_id, file_path, original_filename, file_size, mime_type, extracted_text, analysis_status) 
                                           VALUES (?, ?, ?, ?, ?, ?, 'completed')");
                    $stmt->execute([$student_profile['id'], 'uploads/resumes/' . $safe_filename, $file['name'], $file['size'], $file['type'], $extracted_text]);
                    $resume_id = $pdo->lastInsertId();

                    // Perform Comprehensive Rule-Based Analysis
                    $skills_catalog = [
                        'Python', 'JavaScript', 'React', 'Node.js', 'SQL', 'MySQL', 'PHP', 'HTML5', 'CSS3', 'Tailwind CSS',
                        'Bootstrap', 'Git', 'GitHub', 'C++', 'Java', 'Docker', 'AWS', 'Figma', 'UI/UX', 'Excel',
                        'Power BI', 'Machine Learning', 'Data Analysis', 'FastAPI', 'Django', 'Arduino', 'IoT',
                        'Problem Solving', 'Communication', 'Teamwork', 'Agile', 'Scrum'
                    ];

                    $detected = [];
                    $combined_text = strtolower($extracted_text . ' ' . ($student_profile['skills'] ?? ''));
                    foreach ($skills_catalog as $sk) {
                        if (str_contains($combined_text, strtolower($sk))) {
                            $detected[] = $sk;
                        }
                    }

                    // Score calculation
                    $score = 40;
                    if (count($detected) >= 3) $score += 25;
                    if (count($detected) >= 6) $score += 15;
                    if (!empty($student_profile['college'])) $score += 10;
                    if (!empty($student_profile['course'])) $score += 10;
                    $score = min(98, $score);

                    $missing_skills = array_slice(array_diff(['Git', 'React', 'SQL', 'Python', 'Communication', 'Problem Solving'], $detected), 0, 3);
                    $recs = "Add measurable metrics (e.g., 'improved query speed by 25%'). Include links to live GitHub repositories or Figma portfolios. Ensure clear dates on all college project entries.";

                    $stmtAn = $pdo->prepare("INSERT INTO resume_analysis (resume_id, analysis_mode, completeness_score, detected_skills, missing_skills, recommendations, job_category_matches) 
                                             VALUES (?, 'rule_based', ?, ?, ?, ?, 'Software Development, Web Design, Data Analytics')");
                    $stmtAn->execute([$resume_id, $score, implode(', ', $detected), implode(', ', $missing_skills), $recs]);

                    add_notification($pdo, $current_user['id'], "Resume Analysis Ready", "Your uploaded resume scored {$score}/100. Review detected skills and suggestions.", 'success', 'index.php?page=resume-analyzer');

                    header("Location: index.php?page=resume-analyzer&msg=resume_uploaded");
                    exit;
                } else {
                    $error = "Failed to store uploaded file. Please ensure server directory permissions allow writing.";
                }
            }
        }
    }

    // I. Verified Payment Simulation / Razorpay Webhook Callback
    if ($form_action === 'verify_payment') {
        verify_csrf();
        require_auth('student');

        $plan_id = (int)($_POST['plan_id'] ?? 0);
        $razorpay_payment_id = trim($_POST['razorpay_payment_id'] ?? '');
        $razorpay_order_id = trim($_POST['razorpay_order_id'] ?? '');
        $razorpay_signature = trim($_POST['razorpay_signature'] ?? '');

        $stmtPlan = $pdo->prepare("SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1");
        $stmtPlan->execute([$plan_id]);
        $plan = $stmtPlan->fetch();

        if (!$plan) {
            $error = "Invalid subscription plan selected.";
        } else {
            // Check gateway config
            $key_secret = get_setting($pdo, 'razorpay_key_secret', '');
            $is_verified = false;

            // Real HMAC verification if secret configured and non-empty
            if (!empty($key_secret) && $key_secret !== 'rzp_test_placeholder_secret' && !empty($razorpay_signature)) {
                $expected_sig = hash_hmac('sha256', $razorpay_order_id . '|' . $razorpay_payment_id, $key_secret);
                if (hash_equals($expected_sig, $razorpay_signature)) {
                    $is_verified = true;
                }
            } else {
                // Test mode fallback simulation for developer preview on shared hosting
                $is_verified = true;
            }

            if ($is_verified) {
                $pdo->beginTransaction();
                try {
                    $order_id = !empty($razorpay_order_id) ? $razorpay_order_id : 'ORD_' . strtoupper(bin2hex(random_bytes(6)));
                    $txn_id = !empty($razorpay_payment_id) ? $razorpay_payment_id : 'PAY_' . strtoupper(bin2hex(random_bytes(6)));

                    // Deactivate existing subscriptions
                    $stmtDeact = $pdo->prepare("UPDATE subscriptions SET status = 'cancelled' WHERE student_id = ? AND status = 'active'");
                    $stmtDeact->execute([$student_profile['id']]);

                    // Insert new active subscription
                    $days = (int)$plan['duration_days'];
                    $stmtSub = $pdo->prepare("INSERT INTO subscriptions (student_id, plan_id, status, starts_at, expires_at) 
                                              VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL ? DAY))");
                    $stmtSub->execute([$student_profile['id'], $plan['id'], $days]);
                    $sub_id = $pdo->lastInsertId();

                    // Record Payment Transaction
                    $stmtPay = $pdo->prepare("INSERT INTO payments (user_id, subscription_id, gateway, order_id, transaction_id, amount, currency, status, signature) 
                                              VALUES (?, ?, 'razorpay', ?, ?, ?, 'INR', 'completed', ?)");
                    $stmtPay->execute([$current_user['id'], $sub_id, $order_id, $txn_id, $plan['price'], $razorpay_signature]);

                    add_notification($pdo, $current_user['id'], "Subscription Activated!", "You are now on {$plan['name']}! Enjoy unlimited applications and advanced AI tools.", 'success', 'index.php?page=student-dashboard');

                    $pdo->commit();
                    header("Location: index.php?page=student-dashboard&msg=payment_success");
                    exit;
                } catch (Exception $e) {
                    $pdo->rollBack();
                    $error = "Transaction processing error: " . $e->getMessage();
                }
            } else {
                $error = "Payment signature verification failed. Premium upgrade was aborted.";
            }
        }
    }
}

// Logout router
$page = $_GET['page'] ?? 'home';
if ($page === 'logout') {
    $_SESSION = [];
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params["path"], $params["domain"], $params["secure"], $params["httponly"]);
    }
    session_destroy();
    header("Location: index.php?msg=logged_out");
    exit;
}

// Platform settings for view
$site_name = get_setting($pdo, 'site_name', 'Smart Local');
$site_tagline = get_setting($pdo, 'site_tagline', 'Your Skills. Your City. Your Next Opportunity.');
$currency = get_setting($pdo, 'currency_symbol', '₹');
$razorpay_key_id = get_setting($pdo, 'razorpay_key_id', 'rzp_test_placeholder_key');
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= e($site_name) ?> — <?= e($site_tagline) ?></title>
    <meta name="description" content="Discover legitimate internships, local part-time jobs, freelance gigs, and college project collaborations for students and freshers.">
    
    <!-- Bootstrap 5 CSS & Bootstrap Icons -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        :root {
            --brand-navy: #0f172a;
            --brand-blue: #2563eb;
            --brand-teal: #0d9488;
            --brand-light: #f8fafc;
            --brand-border: #e2e8f0;
        }
        body {
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
            background-color: var(--brand-light);
            color: #1e293b;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
        }
        .navbar-brand {
            font-weight: 800;
            letter-spacing: -0.5px;
            color: var(--brand-navy) !important;
        }
        .btn-brand-primary {
            background-color: var(--brand-blue);
            color: #ffffff;
            font-weight: 600;
            border: none;
            padding: 0.6rem 1.25rem;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
        }
        .btn-brand-primary:hover {
            background-color: #1d4ed8;
            color: #ffffff;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.25);
        }
        .btn-brand-teal {
            background-color: var(--brand-teal);
            color: #ffffff;
            font-weight: 600;
            border: none;
            padding: 0.6rem 1.25rem;
            border-radius: 0.5rem;
        }
        .btn-brand-teal:hover {
            background-color: #0f766e;
            color: #ffffff;
        }
        .hero-banner {
            background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%);
            color: #ffffff;
            padding: 4.5rem 0 5rem 0;
            position: relative;
            overflow: hidden;
        }
        .card-opportunity {
            border: 1px solid var(--brand-border);
            border-radius: 1rem;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
            background: #ffffff;
        }
        .card-opportunity:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 24px -10px rgba(15, 23, 42, 0.12);
            border-color: #cbd5e1;
        }
        .badge-verified {
            background-color: #ecfdf5;
            color: #059669;
            border: 1px solid #a7f3d0;
            font-weight: 600;
        }
        .badge-match {
            background-color: #eff6ff;
            color: #2563eb;
            font-weight: 700;
            border: 1px solid #bfdbfe;
        }
        .resume-print-area {
            background: #ffffff;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            border-radius: 0.5rem;
        }
        @media print {
            body * { visibility: hidden; }
            .resume-print-area, .resume-print-area * { visibility: visible; }
            .resume-print-area { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>

<!-- TOP NOTIFICATION BANNER / ERROR ALERTS -->
<?php if ($db_error): ?>
    <div class="bg-amber-100 border-bottom border-warning p-3 text-center no-print">
        <div class="container">
            <span class="badge bg-warning text-dark me-2">Setup Notice</span>
            <strong><?= e($db_error) ?></strong>
            <p class="small text-muted mb-0 mt-1">If deploying to InfinityFree, import <code>database.sql</code> via phpMyAdmin and verify your DB credentials at the top of <code>index.php</code>.</p>
        </div>
    </div>
<?php endif; ?>

<?php if ($error): ?>
    <div class="alert alert-danger alert-dismissible fade show m-3 no-print" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2"></i> <?= e($error) ?>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>

<?php if ($msg === 'applied_success'): ?>
    <div class="alert alert-success alert-dismissible fade show m-3 no-print" role="alert">
        <i class="bi bi-check-circle-fill me-2"></i> Your application was successfully submitted to the recruiter!
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php elseif ($msg === 'payment_success'): ?>
    <div class="alert alert-success alert-dismissible fade show m-3 no-print" role="alert">
        <i class="bi bi-patch-check-fill me-2"></i> Payment verified! Your Smart Plus subscription is now active.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php elseif ($msg === 'job_posted'): ?>
    <div class="alert alert-info alert-dismissible fade show m-3 no-print" role="alert">
        <i class="bi bi-clock-history me-2"></i> Opportunity submitted for review. It will be published as soon as verified.
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
<?php endif; ?>

<!-- ======================================================================== -->
<!-- NAVIGATION BAR                                                           -->
<!-- ======================================================================== -->
<nav class="navbar navbar-expand-lg bg-white border-bottom sticky-top no-print py-2">
    <div class="container">
        <a class="navbar-brand d-flex align-items-center gap-2" href="index.php">
            <div class="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
                <i class="bi bi-briefcase-fill"></i>
            </div>
            <span><?= e($site_name) ?></span>
        </a>

        <button class="navbar-toggler" type="button" data-bs-navigation data-bs-toggle="collapse" data-bs-target="#navMain">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navMain">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
                <li class="nav-item">
                    <a class="nav-link <?= ($page === 'home') ? 'active fw-bold text-primary' : '' ?>" href="index.php">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page === 'jobs') ? 'active fw-bold text-primary' : '' ?>" href="index.php?page=jobs">Find Jobs</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="index.php?page=jobs&type=internship">Internships</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="index.php?page=jobs&type=freelance">Local Gigs</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page === 'resume-builder') ? 'active fw-bold text-primary' : '' ?>" href="index.php?page=resume-builder">Resume Builder</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page === 'pricing') ? 'active fw-bold text-primary' : '' ?>" href="index.php?page=pricing">Pricing</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= ($page === 'about') ? 'active fw-bold text-primary' : '' ?>" href="index.php?page=about">About Us</a>
                </li>
            </ul>

            <div class="d-flex align-items-center gap-2">
                <?php if (is_logged_in()): ?>
                    <!-- Notifications Dropdown -->
                    <div class="dropdown me-2">
                        <button class="btn btn-outline-secondary position-relative rounded-circle p-2" data-bs-toggle="dropdown" title="Notifications">
                            <i class="bi bi-bell"></i>
                            <?php if ($unread_notifs_count > 0): ?>
                                <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                    <?= $unread_notifs_count ?>
                                </span>
                            <?php endif; ?>
                        </button>
                        <div class="dropdown-menu dropdown-menu-end shadow-sm p-2" style="width: 320px; max-height: 380px; overflow-y: auto;">
                            <h6 class="dropdown-header px-2 text-uppercase fw-bold text-muted small">Notifications</h6>
                            <?php
                            $notifs = [];
                            if ($pdo) {
                                $stmtN = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 8");
                                $stmtN->execute([$current_user['id']]);
                                $notifs = $stmtN->fetchAll();
                            }
                            ?>
                            <?php if (empty($notifs)): ?>
                                <div class="text-center p-3 text-muted small">No notifications yet.</div>
                            <?php else: ?>
                                <?php foreach ($notifs as $n): ?>
                                    <div class="p-2 border-bottom small <?= $n['is_read'] ? 'text-muted' : 'bg-light rounded' ?>">
                                        <div class="fw-bold"><?= e($n['title']) ?></div>
                                        <div><?= e($n['message']) ?></div>
                                        <div class="text-muted text-end" style="font-size: 0.75rem;"><?= date('M d, H:i', strtotime($n['created_at'])) ?></div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                    </div>

                    <!-- User Dashboard Menu -->
                    <div class="dropdown">
                        <button class="btn btn-outline-dark dropdown-toggle d-flex align-items-center gap-2" data-bs-toggle="dropdown">
                            <i class="bi bi-person-circle text-primary"></i>
                            <span><?= e($_SESSION['user_name'] ?? 'Dashboard') ?></span>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end shadow-sm">
                            <?php if (current_user_role() === 'student'): ?>
                                <li><a class="dropdown-item" href="index.php?page=student-dashboard"><i class="bi bi-speedometer2 me-2"></i> Student Dashboard</a></li>
                                <li><a class="dropdown-item" href="index.php?page=applications"><i class="bi bi-file-earmark-check me-2"></i> My Applications</a></li>
                                <li><a class="dropdown-item" href="index.php?page=saved-jobs"><i class="bi bi-bookmark-heart me-2"></i> Saved Jobs</a></li>
                                <li><a class="dropdown-item" href="index.php?page=resume-analyzer"><i class="bi bi-graph-up-arrow me-2"></i> Resume Analyzer</a></li>
                            <?php elseif (current_user_role() === 'recruiter'): ?>
                                <li><a class="dropdown-item" href="index.php?page=recruiter-dashboard"><i class="bi bi-building me-2"></i> Recruiter Portal</a></li>
                                <li><a class="dropdown-item" href="index.php?page=post-job"><i class="bi bi-plus-circle me-2"></i> Post New Job</a></li>
                            <?php elseif (current_user_role() === 'admin'): ?>
                                <li><a class="dropdown-item" href="admin.php"><i class="bi bi-shield-lock me-2"></i> Admin Panel</a></li>
                            <?php endif; ?>
                            <li><hr class="dropdown-divider"></li>
                            <li><a class="dropdown-item text-danger" href="index.php?page=logout"><i class="bi bi-box-arrow-right me-2"></i> Logout</a></li>
                        </ul>
                    </div>
                <?php else: ?>
                    <a href="index.php?page=login" class="btn btn-outline-primary fw-medium px-3">Login</a>
                    <a href="index.php?page=register" class="btn btn-brand-primary">Get Started</a>
                <?php endif; ?>
            </div>
        </div>
    </div>
</nav>

<!-- ======================================================================== -->
<!-- ROUTE DISPATCHER                                                         -->
<!-- ======================================================================== -->
<main class="flex-grow-1">
<?php
switch ($page) {

    // ------------------------------------------------------------------------
    // 1. HOMEPAGE
    // ------------------------------------------------------------------------
    case 'home':
        ?>
        <!-- HERO SECTION -->
        <section class="hero-banner">
            <div class="container py-4">
                <div class="row align-items-center g-5">
                    <div class="col-lg-7">
                        <div class="badge bg-white text-primary px-3 py-2 rounded-pill mb-3 fw-semibold shadow-sm">
                            <i class="bi bi-shield-check text-success me-1"></i> Verified Local & Remote Opportunities
                        </div>
                        <h1 class="display-4 fw-extrabold text-white mb-3" style="letter-spacing: -1px; line-height: 1.15;">
                            Find Opportunities That Match Your Skills and Your Location.
                        </h1>
                        <p class="lead text-slate-200 text-white-50 mb-4 fs-5">
                            Smart Local connects college students and freshers with legitimate internships, neighborhood part-time jobs, freelance gigs, and campus project collaborations.
                        </p>

                        <!-- SEARCH BAR -->
                        <form action="index.php" method="GET" class="bg-white p-2 rounded-4 shadow-lg text-dark mb-4">
                            <input type="hidden" name="page" value="jobs">
                            <div class="row g-2 align-items-center">
                                <div class="col-md-5">
                                    <div class="input-group">
                                        <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-search"></i></span>
                                        <input type="text" name="q" class="form-control border-0 shadow-none ps-0" placeholder="Job title, skills (e.g. React, Python)">
                                    </div>
                                </div>
                                <div class="col-md-4 border-start-md">
                                    <div class="input-group">
                                        <span class="input-group-text bg-transparent border-0 text-muted"><i class="bi bi-geo-alt"></i></span>
                                        <input type="text" name="city" class="form-control border-0 shadow-none ps-0" placeholder="City or Locality (e.g. Bengaluru)">
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <button type="submit" class="btn btn-brand-primary w-100 py-2">
                                        Find Opportunities
                                    </button>
                                </div>
                            </div>
                        </form>

                        <div class="d-flex flex-wrap gap-3">
                            <a href="index.php?page=jobs" class="btn btn-light px-4 py-2 fw-semibold text-primary">Explore All Jobs</a>
                            <a href="index.php?page=resume-builder" class="btn btn-outline-light px-4 py-2 fw-semibold">Build Free Resume</a>
                        </div>
                    </div>

                    <div class="col-lg-5 d-none d-lg-block">
                        <div class="bg-white p-4 rounded-4 shadow-lg text-dark border">
                            <div class="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                                <span class="fw-bold text-primary"><i class="bi bi-stars me-1"></i> Live Career Insights</span>
                                <span class="badge bg-success-subtle text-success">Verified Platform</span>
                            </div>
                            <div class="p-3 bg-light rounded-3 mb-3">
                                <div class="d-flex justify-content-between text-muted small mb-1">
                                    <span>Average Fresher Stipend</span>
                                    <span class="fw-bold text-dark">₹12,000 / mo</span>
                                </div>
                                <div class="progress" style="height: 6px;">
                                    <div class="progress-bar bg-success" style="width: 75%"></div>
                                </div>
                            </div>
                            <div class="p-3 bg-light rounded-3 mb-3">
                                <div class="d-flex justify-content-between text-muted small mb-1">
                                    <span>Top Skill Demand</span>
                                    <span class="fw-bold text-primary">Web Dev & Data</span>
                                </div>
                                <div class="d-flex gap-1 flex-wrap mt-2">
                                    <span class="badge bg-white border text-dark">React</span>
                                    <span class="badge bg-white border text-dark">Python</span>
                                    <span class="badge bg-white border text-dark">SQL</span>
                                    <span class="badge bg-white border text-dark">Figma</span>
                                </div>
                            </div>
                            <div class="small text-muted text-center">
                                <i class="bi bi-shield-lock me-1 text-teal"></i> Recruiter verification & transparent reporting
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- QUICK CATEGORY CARDS -->
        <section class="py-5 bg-white border-bottom">
            <div class="container">
                <div class="text-center mb-4">
                    <h2 class="fw-bold">Explore Opportunities by Category</h2>
                    <p class="text-muted">Targeted paths designed for college schedules and emerging skillsets</p>
                </div>
                <div class="row g-4">
                    <?php
                    $categories = [
                        ['title' => 'Internships', 'icon' => 'bi-laptop', 'color' => 'primary', 'desc' => 'Gain real-world experience during summer or semester gaps.', 'type' => 'internship'],
                        ['title' => 'Part-time Jobs', 'icon' => 'bi-clock-history', 'color' => 'success', 'desc' => 'Flexible local hours that fit alongside your college lectures.', 'type' => 'part-time'],
                        ['title' => 'Freelance Gigs', 'icon' => 'bi-palette', 'color' => 'warning', 'desc' => 'Project-based contracts for coders, designers, and writers.', 'type' => 'freelance'],
                        ['title' => 'Remote Work', 'icon' => 'bi-house-heart', 'color' => 'info', 'desc' => 'Work for pan-India startups from your dorm or home.', 'type' => 'remote'],
                        ['title' => 'College Projects', 'icon' => 'bi-cpu', 'color' => 'danger', 'desc' => 'Collaborate on funded research and campus capstones.', 'type' => 'project'],
                        ['title' => 'Entry-level Jobs', 'icon' => 'bi-mortarboard', 'color' => 'dark', 'desc' => 'Full-time roles tailored specifically for final-year graduates.', 'type' => 'full-time'],
                    ];
                    foreach ($categories as $cat):
                    ?>
                    <div class="col-md-4 col-sm-6">
                        <a href="index.php?page=jobs&type=<?= $cat['type'] ?>" class="text-decoration-none">
                            <div class="p-4 border rounded-4 h-100 bg-white card-opportunity">
                                <div class="d-inline-flex p-3 rounded-3 bg-<?= $cat['color'] ?>-subtle text-<?= $cat['color'] ?> mb-3 fs-3">
                                    <i class="bi <?= $cat['icon'] ?>"></i>
                                </div>
                                <h5 class="fw-bold text-dark mb-2"><?= $cat['title'] ?></h5>
                                <p class="text-muted small mb-0"><?= $cat['desc'] ?></p>
                            </div>
                        </a>
                    </div>
                    <?php endforeach; ?>
                </div>
            </div>
        </section>

        <!-- RECOMMENDED OPPORTUNITIES -->
        <section class="py-5 bg-light">
            <div class="container">
                <div class="d-flex justify-content-between align-items-end mb-4">
                    <div>
                        <h2 class="fw-bold mb-1">Recommended Opportunities</h2>
                        <p class="text-muted mb-0">Legitimate postings hand-checked for student safety and fair stipends</p>
                    </div>
                    <a href="index.php?page=jobs" class="btn btn-outline-primary fw-semibold">View All <i class="bi bi-arrow-right"></i></a>
                </div>

                <div class="row g-4">
                    <?php
                    $featured_jobs = [];
                    if ($pdo) {
                        $stmt = $pdo->query("SELECT j.*, rp.company_name, rp.verification_status 
                                            FROM jobs j 
                                            LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.id 
                                            WHERE j.moderation_status = 'approved' 
                                            ORDER BY j.is_featured DESC, j.id DESC LIMIT 6");
                        $featured_jobs = $stmt->fetchAll();
                    }
                    ?>
                    <?php if (empty($featured_jobs)): ?>
                        <div class="col-12 text-center py-5">
                            <i class="bi bi-inbox text-muted display-4"></i>
                            <h5 class="mt-3 text-muted">No active listings available right now.</h5>
                            <p class="small text-muted">Check back soon or explore our resume builder.</p>
                        </div>
                    <?php else: ?>
                        <?php foreach ($featured_jobs as $job): 
                            $match = 0;
                            if ($student_profile) {
                                $match = calculate_match_percentage($student_profile['skills'] ?? '', $job['skills']);
                            }
                        ?>
                        <div class="col-md-6 col-lg-4">
                            <div class="card card-opportunity h-100 p-4 d-flex flex-column justify-content-between">
                                <div>
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                        <span class="badge bg-primary-subtle text-primary text-uppercase"><?= e(str_replace('_', ' ', $job['job_type'])) ?></span>
                                        <?php if ($match > 0): ?>
                                            <span class="badge badge-match"><i class="bi bi-stars"></i> <?= $match ?>% Match</span>
                                        <?php endif; ?>
                                    </div>
                                    <h5 class="fw-bold text-dark mb-1">
                                        <a href="index.php?page=job-detail&id=<?= $job['id'] ?>" class="text-dark text-decoration-none">
                                            <?= e($job['title']) ?>
                                        </a>
                                    </h5>
                                    <div class="text-muted small mb-2 d-flex align-items-center gap-1">
                                        <i class="bi bi-building"></i> <?= e($job['company_name'] ?? 'Authorized Partner') ?>
                                        <?php if ($job['is_verified'] || ($job['verification_status'] ?? '') === 'verified'): ?>
                                            <i class="bi bi-patch-check-fill text-success" title="Verified Recruiter"></i>
                                        <?php endif; ?>
                                    </div>

                                    <div class="d-flex flex-wrap gap-2 text-muted small mb-3">
                                        <span><i class="bi bi-geo-alt"></i> <?= e($job['city']) ?> (<?= e($job['work_arrangement']) ?>)</span>
                                        <span><i class="bi bi-cash-stack"></i> 
                                            <?= $currency ?><?= number_format($job['salary_min']) ?> - <?= number_format($job['salary_max']) ?>
                                        </span>
                                    </div>

                                    <!-- Required Skills Tags -->
                                    <div class="d-flex flex-wrap gap-1 mb-3">
                                        <?php 
                                        $skills_list = array_slice(explode(',', $job['skills']), 0, 4);
                                        foreach ($skills_list as $sk): 
                                        ?>
                                            <span class="badge bg-light text-dark border"><?= e(trim($sk)) ?></span>
                                        <?php endforeach; ?>
                                    </div>
                                </div>

                                <div class="border-top pt-3 d-flex justify-content-between align-items-center">
                                    <span class="small text-muted">Deadline: <?= $job['application_deadline'] ? date('M d', strtotime($job['application_deadline'])) : 'Open' ?></span>
                                    <a href="index.php?page=job-detail&id=<?= $job['id'] ?>" class="btn btn-sm btn-brand-primary">
                                        View Details
                                    </a>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </section>

        <!-- HOW SMART LOCAL WORKS -->
        <section class="py-5 bg-white">
            <div class="container">
                <div class="text-center mb-5">
                    <h2 class="fw-bold">How Smart Local Works</h2>
                    <p class="text-muted">A clear, transparent path to kickstart your professional career</p>
                </div>
                <div class="row g-4 text-center">
                    <div class="col-md-3">
                        <div class="p-3">
                            <div class="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                                <i class="bi bi-person-plus-fill fs-3"></i>
                            </div>
                            <h5 class="fw-bold">1. Create Profile</h5>
                            <p class="text-muted small">Sign up with your college, degree, and city to find opportunities in your neighborhood.</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3">
                            <div class="bg-success-subtle text-success rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                                <i class="bi bi-file-earmark-code-fill fs-3"></i>
                            </div>
                            <h5 class="fw-bold">2. Build or Upload Resume</h5>
                            <p class="text-muted small">Use our interactive web builder or upload your PDF to receive skill-gap feedback.</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3">
                            <div class="bg-warning-subtle text-warning rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                                <i class="bi bi-search-heart-fill fs-3"></i>
                            </div>
                            <h5 class="fw-bold">3. Discover & Match</h5>
                            <p class="text-muted small">Our algorithm highlights listings where your skills closely match recruiter requirements.</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="p-3">
                            <div class="bg-info-subtle text-info rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
                                <i class="bi bi-check2-circle fs-3"></i>
                            </div>
                            <h5 class="fw-bold">4. Apply & Track</h5>
                            <p class="text-muted small">Submit 1-click applications and track your status from Under Review to Hired.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- TRUST & SAFETY SECTION -->
        <section class="py-5 bg-slate-900 text-white" style="background-color: #0f172a;">
            <div class="container">
                <div class="row align-items-center g-5">
                    <div class="col-lg-6">
                        <span class="badge bg-emerald-500 bg-success text-white mb-3">Campus Integrity First</span>
                        <h2 class="fw-bold text-white mb-3">Genuine Opportunities, Rigorous Scam Defense</h2>
                        <p class="text-white-50">
                            We know that college students are frequently targeted by scam job listings demanding security deposits or unpaid tasks. Smart Local enforces recruiter profile checks, community reporting, and continuous moderation.
                        </p>
                        <ul class="list-unstyled text-white-50 d-flex flex-column gap-2">
                            <li><i class="bi bi-check-circle-fill text-success me-2"></i> No listing may ask students for application or training fees.</li>
                            <li><i class="bi bi-check-circle-fill text-success me-2"></i> Recruiter business credentials and official domains are verified.</li>
                            <li><i class="bi bi-check-circle-fill text-success me-2"></i> 1-Click student reporting triggers instant administrative review.</li>
                        </ul>
                    </div>
                    <div class="col-lg-6">
                        <div class="p-4 bg-white text-dark rounded-4 shadow">
                            <h5 class="fw-bold mb-3"><i class="bi bi-flag-fill text-danger me-2"></i> Have you spotted a suspicious listing?</h5>
                            <p class="text-muted small">Every job card includes a "Report Listing" link. If a recruiter requests money or behaves inappropriately, our moderation team acts within 24 hours.</p>
                            <a href="index.php?page=about#safety" class="btn btn-outline-dark btn-sm">Read Our Safety Guidelines</a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 2. FIND JOBS & FILTER
    // ------------------------------------------------------------------------
    case 'jobs':
        $search_q = trim($_GET['q'] ?? '');
        $search_city = trim($_GET['city'] ?? '');
        $filter_type = trim($_GET['type'] ?? '');
        $filter_arrangement = trim($_GET['arrangement'] ?? '');
        $sort_by = trim($_GET['sort'] ?? 'newest');

        // Dynamic Query Builder
        $where = ["j.moderation_status = 'approved'"];
        $params = [];

        if (!empty($search_q)) {
            $where[] = "(j.title LIKE ? OR j.skills LIKE ? OR j.description LIKE ?)";
            $params[] = "%{$search_q}%";
            $params[] = "%{$search_q}%";
            $params[] = "%{$search_q}%";
        }
        if (!empty($search_city)) {
            $where[] = "(j.city LIKE ? OR j.locality LIKE ?)";
            $params[] = "%{$search_city}%";
            $params[] = "%{$search_city}%";
        }
        if (!empty($filter_type)) {
            $where[] = "j.job_type = ?";
            $params[] = $filter_type;
        }
        if (!empty($filter_arrangement)) {
            $where[] = "j.work_arrangement = ?";
            $params[] = $filter_arrangement;
        }

        // Sorting
        $orderBy = "j.is_featured DESC, j.id DESC";
        if ($sort_by === 'stipend') {
            $orderBy = "j.salary_max DESC";
        } elseif ($sort_by === 'deadline') {
            $orderBy = "j.application_deadline ASC";
        }

        $jobs_list = [];
        if ($pdo) {
            $sql = "SELECT j.*, rp.company_name, rp.verification_status 
                    FROM jobs j 
                    LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.id 
                    WHERE " . implode(' AND ', $where) . " 
                    ORDER BY {$orderBy} LIMIT 50";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $jobs_list = $stmt->fetchAll();
        }
        ?>
        <div class="container py-4">
            <!-- Search & Filter Bar -->
            <div class="card p-4 rounded-4 shadow-sm border-0 mb-4">
                <form action="index.php" method="GET">
                    <input type="hidden" name="page" value="jobs">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold">Keywords or Skills</label>
                            <input type="text" name="q" value="<?= e($search_q) ?>" class="form-control" placeholder="e.g. React, Python, Data Entry">
                        </div>
                        <div class="col-md-3">
                            <label class="form-label small fw-semibold">City or Locality</label>
                            <input type="text" name="city" value="<?= e($search_city) ?>" class="form-control" placeholder="e.g. Bengaluru, Pune">
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small fw-semibold">Job Type</label>
                            <select name="type" class="form-select">
                                <option value="">All Types</option>
                                <option value="internship" <?= ($filter_type === 'internship') ? 'selected' : '' ?>>Internship</option>
                                <option value="part-time" <?= ($filter_type === 'part-time') ? 'selected' : '' ?>>Part-Time</option>
                                <option value="freelance" <?= ($filter_type === 'freelance') ? 'selected' : '' ?>>Freelance</option>
                                <option value="remote" <?= ($filter_type === 'remote') ? 'selected' : '' ?>>Remote</option>
                                <option value="project" <?= ($filter_type === 'project') ? 'selected' : '' ?>>College Project</option>
                                <option value="full-time" <?= ($filter_type === 'full-time') ? 'selected' : '' ?>>Full-Time</option>
                            </select>
                        </div>
                        <div class="col-md-2">
                            <label class="form-label small fw-semibold">Arrangement</label>
                            <select name="arrangement" class="form-select">
                                <option value="">Any</option>
                                <option value="on-site" <?= ($filter_arrangement === 'on-site') ? 'selected' : '' ?>>On-site</option>
                                <option value="remote" <?= ($filter_arrangement === 'remote') ? 'selected' : '' ?>>Remote</option>
                                <option value="hybrid" <?= ($filter_arrangement === 'hybrid') ? 'selected' : '' ?>>Hybrid</option>
                            </select>
                        </div>
                        <div class="col-md-1 d-flex align-items-end">
                            <button type="submit" class="btn btn-brand-primary w-100"><i class="bi bi-funnel"></i></button>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Header count & sort -->
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">Showing <?= count($jobs_list) ?> Opportunities</h5>
                <div class="d-flex align-items-center gap-2">
                    <span class="small text-muted">Sort:</span>
                    <a href="index.php?page=jobs&sort=newest&q=<?= urlencode($search_q) ?>&city=<?= urlencode($search_city) ?>&type=<?= urlencode($filter_type) ?>" class="btn btn-sm <?= ($sort_by === 'newest') ? 'btn-primary' : 'btn-light border' ?>">Newest</a>
                    <a href="index.php?page=jobs&sort=stipend&q=<?= urlencode($search_q) ?>&city=<?= urlencode($search_city) ?>&type=<?= urlencode($filter_type) ?>" class="btn btn-sm <?= ($sort_by === 'stipend') ? 'btn-primary' : 'btn-light border' ?>">Highest Pay</a>
                </div>
            </div>

            <!-- Job Cards Grid -->
            <div class="row g-4">
                <?php if (empty($jobs_list)): ?>
                    <div class="col-12 text-center py-5 bg-white rounded-4 border">
                        <i class="bi bi-search text-muted display-4"></i>
                        <h5 class="mt-3">No matching opportunities found.</h5>
                        <p class="text-muted small">Try broadening your search keywords or removing the city filter.</p>
                        <a href="index.php?page=jobs" class="btn btn-outline-primary btn-sm">Clear Filters</a>
                    </div>
                <?php else: ?>
                    <?php foreach ($jobs_list as $job): 
                        $match = 0;
                        if ($student_profile) {
                            $match = calculate_match_percentage($student_profile['skills'] ?? '', $job['skills']);
                        }
                    ?>
                    <div class="col-md-6">
                        <div class="card card-opportunity p-4 h-100 d-flex flex-column justify-content-between">
                            <div>
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                    <span class="badge bg-primary-subtle text-primary text-uppercase"><?= e(str_replace('_', ' ', $job['job_type'])) ?></span>
                                    <div class="d-flex gap-2">
                                        <?php if ($match > 0): ?>
                                            <span class="badge badge-match"><i class="bi bi-stars"></i> <?= $match ?>% Match</span>
                                        <?php endif; ?>
                                        <?php if ($student_profile): ?>
                                            <button type="button" class="btn btn-sm btn-outline-secondary py-0 px-2 save-btn" data-job-id="<?= $job['id'] ?>" title="Save / Bookmark">
                                                <i class="bi bi-bookmark"></i>
                                            </button>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <h5 class="fw-bold mb-1">
                                    <a href="index.php?page=job-detail&id=<?= $job['id'] ?>" class="text-dark text-decoration-none">
                                        <?= e($job['title']) ?>
                                    </a>
                                </h5>
                                <div class="text-muted small mb-2 d-flex align-items-center gap-1">
                                    <i class="bi bi-building"></i> <?= e($job['company_name'] ?? 'Authorized Partner') ?>
                                    <?php if ($job['is_verified'] || ($job['verification_status'] ?? '') === 'verified'): ?>
                                        <i class="bi bi-patch-check-fill text-success" title="Verified Recruiter"></i>
                                    <?php endif; ?>
                                </div>

                                <div class="d-flex flex-wrap gap-3 text-muted small mb-3">
                                    <span><i class="bi bi-geo-alt"></i> <?= e($job['city']) ?> (<?= e($job['work_arrangement']) ?>)</span>
                                    <span><i class="bi bi-cash-stack"></i> 
                                        <?= $currency ?><?= number_format($job['salary_min']) ?> - <?= number_format($job['salary_max']) ?> / mo
                                    </span>
                                </div>

                                <p class="text-muted small mb-3">
                                    <?= e(substr($job['description'], 0, 140)) ?>...
                                </p>

                                <div class="d-flex flex-wrap gap-1 mb-3">
                                    <?php 
                                    $sks = explode(',', $job['skills']);
                                    foreach ($sks as $sk): 
                                    ?>
                                        <span class="badge bg-light text-dark border"><?= e(trim($sk)) ?></span>
                                    <?php endforeach; ?>
                                </div>
                            </div>

                            <div class="border-top pt-3 d-flex justify-content-between align-items-center">
                                <span class="small text-muted">Posted: <?= date('M d', strtotime($job['created_at'])) ?></span>
                                <a href="index.php?page=job-detail&id=<?= $job['id'] ?>" class="btn btn-brand-primary btn-sm">
                                    View & Apply
                                </a>
                            </div>
                        </div>
                    </div>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 3. JOB DETAIL & APPLICATION MODAL
    // ------------------------------------------------------------------------
    case 'job-detail':
        $job_id = (int)($_GET['id'] ?? 0);
        $job = null;
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT j.*, rp.company_name, rp.website, rp.location as company_location, rp.description as company_desc, rp.verification_status 
                                   FROM jobs j 
                                   LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.id 
                                   WHERE j.id = ?");
            $stmt->execute([$job_id]);
            $job = $stmt->fetch();

            // Increment views count
            if ($job) {
                $pdo->prepare("UPDATE jobs SET views_count = views_count + 1 WHERE id = ?")->execute([$job_id]);
            }
        }

        if (!$job):
            echo "<div class='container py-5 text-center'><h4>Opportunity not found or expired.</h4><a href='index.php?page=jobs' class='btn btn-primary mt-3'>Back to Jobs</a></div>";
            break;
        endif;

        // Check if student applied
        $has_applied = false;
        if ($student_profile) {
            $stmtApp = $pdo->prepare("SELECT id, status FROM applications WHERE job_id = ? AND student_id = ?");
            $stmtApp->execute([$job['id'], $student_profile['id']]);
            $app_record = $stmtApp->fetch();
            if ($app_record) $has_applied = true;
        }

        $match = 0;
        if ($student_profile) {
            $match = calculate_match_percentage($student_profile['skills'] ?? '', $job['skills']);
        }
        ?>
        <div class="container py-4">
            <nav aria-label="breadcrumb" class="mb-3">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item"><a href="index.php?page=jobs">Jobs</a></li>
                    <li class="breadcrumb-item active"><?= e($job['title']) ?></li>
                </ol>
            </nav>

            <div class="row g-4">
                <div class="col-lg-8">
                    <div class="card p-4 rounded-4 border-0 shadow-sm mb-4">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <span class="badge bg-primary-subtle text-primary text-uppercase"><?= e(str_replace('_', ' ', $job['job_type'])) ?></span>
                            <?php if ($match > 0): ?>
                                <span class="badge badge-match fs-6"><i class="bi bi-stars"></i> <?= $match ?>% Skill Compatibility</span>
                            <?php endif; ?>
                        </div>

                        <h2 class="fw-bold text-dark mb-1"><?= e($job['title']) ?></h2>
                        <h5 class="text-primary fw-semibold mb-3">
                            <?= e($job['company_name'] ?? 'Authorized Partner') ?>
                            <?php if ($job['is_verified'] || ($job['verification_status'] ?? '') === 'verified'): ?>
                                <span class="badge badge-verified ms-1"><i class="bi bi-patch-check-fill"></i> Verified Recruiter</span>
                            <?php endif; ?>
                        </h5>

                        <div class="row g-3 p-3 bg-light rounded-3 mb-4">
                            <div class="col-sm-4">
                                <span class="text-muted small d-block">Location</span>
                                <strong class="text-dark"><i class="bi bi-geo-alt text-primary"></i> <?= e($job['city']) ?> (<?= e($job['work_arrangement']) ?>)</strong>
                            </div>
                            <div class="col-sm-4">
                                <span class="text-muted small d-block">Stipend / Salary</span>
                                <strong class="text-dark"><i class="bi bi-cash-stack text-success"></i> <?= $currency ?><?= number_format($job['salary_min']) ?> - <?= number_format($job['salary_max']) ?></strong>
                            </div>
                            <div class="col-sm-4">
                                <span class="text-muted small d-block">Application Deadline</span>
                                <strong class="text-dark"><i class="bi bi-calendar-event text-danger"></i> <?= $job['application_deadline'] ? date('M d, Y', strtotime($job['application_deadline'])) : 'Open' ?></strong>
                            </div>
                        </div>

                        <h5 class="fw-bold mt-2">Opportunity Overview</h5>
                        <p class="text-muted" style="white-space: pre-line;"><?= e($job['description']) ?></p>

                        <?php if (!empty($job['responsibilities'])): ?>
                            <h5 class="fw-bold mt-4">Key Responsibilities</h5>
                            <p class="text-muted" style="white-space: pre-line;"><?= e($job['responsibilities']) ?></p>
                        <?php endif; ?>

                        <?php if (!empty($job['qualifications'])): ?>
                            <h5 class="fw-bold mt-4">Qualifications & Requirements</h5>
                            <p class="text-muted" style="white-space: pre-line;"><?= e($job['qualifications']) ?></p>
                        <?php endif; ?>

                        <h5 class="fw-bold mt-4">Required Skills</h5>
                        <div class="d-flex flex-wrap gap-2 mb-4">
                            <?php foreach (explode(',', $job['skills']) as $sk): ?>
                                <span class="badge bg-light text-dark border p-2 px-3 fs-6"><?= e(trim($sk)) ?></span>
                            <?php endforeach; ?>
                        </div>

                        <hr>
                        <div class="d-flex justify-content-between align-items-center">
                            <button type="button" class="btn btn-outline-danger btn-sm" data-bs-toggle="modal" data-bs-target="#reportModal">
                                <i class="bi bi-flag"></i> Report this listing
                            </button>
                            <span class="text-muted small">Views: <?= (int)$job['views_count'] ?></span>
                        </div>
                    </div>
                </div>

                <!-- SIDEBAR ACTION -->
                <div class="col-lg-4">
                    <div class="card p-4 rounded-4 border-0 shadow-sm sticky-top" style="top: 80px;">
                        <h5 class="fw-bold mb-3">Apply to Opportunity</h5>
                        <?php if (!is_logged_in()): ?>
                            <div class="p-3 bg-light rounded-3 text-center mb-3">
                                <p class="text-muted small mb-3">Log in as a student to apply directly with your resume.</p>
                                <a href="index.php?page=login" class="btn btn-brand-primary w-100">Log In to Apply</a>
                            </div>
                        <?php elseif (current_user_role() !== 'student'): ?>
                            <div class="alert alert-warning small">
                                You are signed in as a Recruiter/Admin. Only student accounts can submit job applications.
                            </div>
                        <?php elseif ($has_applied): ?>
                            <div class="alert alert-success d-flex align-items-center gap-2">
                                <i class="bi bi-check-circle-fill fs-4"></i>
                                <div>
                                    <strong>Application Submitted!</strong>
                                    <div class="small">Status: <span class="badge bg-primary"><?= e($app_record['status']) ?></span></div>
                                </div>
                            </div>
                            <a href="index.php?page=applications" class="btn btn-outline-primary w-100">View Application History</a>
                        <?php else: ?>
                            <form action="index.php" method="POST">
                                <input type="hidden" name="form_action" value="apply_job">
                                <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                                <input type="hidden" name="job_id" value="<?= $job['id'] ?>">

                                <div class="mb-3">
                                    <label class="form-label small fw-semibold">Short Note / Cover Letter (Optional)</label>
                                    <textarea name="cover_letter" rows="4" class="form-control" placeholder="Introduce yourself and describe why you are excited for this role..."></textarea>
                                </div>

                                <div class="p-3 bg-light rounded-3 mb-3">
                                    <div class="small text-muted mb-1">Attached Resume:</div>
                                    <strong class="small text-dark">
                                        <i class="bi bi-file-earmark-pdf text-danger"></i> Profile Resume / Web Builder Draft
                                    </strong>
                                </div>

                                <button type="submit" class="btn btn-brand-primary w-100 py-2">
                                    Submit Application
                                </button>
                            </form>
                        <?php endif; ?>

                        <!-- Recruiter Card -->
                        <div class="border-top pt-3 mt-4">
                            <h6 class="fw-bold mb-1">About the Hiring Company</h6>
                            <p class="text-muted small mb-2"><?= e($job['company_desc'] ?? 'Verified campus hiring employer.') ?></p>
                            <?php if (!empty($job['website'])): ?>
                                <a href="<?= e($job['website']) ?>" target="_blank" rel="noopener" class="small text-primary text-decoration-none">
                                    <i class="bi bi-globe"></i> Visit Website
                                </a>
                            <?php endif; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- REPORT MODAL -->
        <div class="modal fade" id="reportModal" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title fw-bold"><i class="bi bi-shield-exclamation text-danger me-2"></i> Report Suspicious Listing</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <p class="text-muted small">Help keep Smart Local safe. Reports are anonymous to the employer and reviewed promptly.</p>
                        <form id="reportForm">
                            <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                            <input type="hidden" name="job_id" value="<?= $job['id'] ?>">
                            <div class="mb-3">
                                <label class="form-label small fw-semibold">Reason for Report</label>
                                <select name="reason" class="form-select" required>
                                    <option value="Demanding Payment or Fees">Demanding Payment or Registration Fees</option>
                                    <option value="Fake / Non-existent Company">Fake / Non-existent Company</option>
                                    <option value="Misleading Stipend or Job Description">Misleading Stipend or Job Description</option>
                                    <option value="Spam / Advertisements">Spam / Advertisements</option>
                                    <option value="Other Safety Violation">Other Safety Violation</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label small fw-semibold">Additional Details</label>
                                <textarea name="details" rows="3" class="form-control" placeholder="Provide any context or communications..."></textarea>
                            </div>
                            <button type="submit" class="btn btn-danger w-100">Submit Report</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 4. RESUME BUILDER (Interactive Web Builder & PDF-Ready Layout)
    // ------------------------------------------------------------------------
    case 'resume-builder':
        $saved_resume = null;
        if ($student_profile && $pdo) {
            $stmt = $pdo->prepare("SELECT * FROM resume_builder_documents WHERE student_id = ? LIMIT 1");
            $stmt->execute([$student_profile['id']]);
            $saved_resume = $stmt->fetch();
        }
        $r_data = $saved_resume ? json_decode($saved_resume['resume_data'], true) : [];
        ?>
        <div class="container py-4">
            <div class="d-flex justify-content-between align-items-center mb-4 no-print">
                <div>
                    <h2 class="fw-bold mb-1">Interactive Resume Builder</h2>
                    <p class="text-muted mb-0">Craft an ATS-friendly, clean college resume in minutes. Print or save as PDF.</p>
                </div>
                <div class="d-flex gap-2">
                    <button type="button" class="btn btn-outline-primary" onclick="window.print()">
                        <i class="bi bi-printer"></i> Print / Save as PDF
                    </button>
                    <?php if ($student_profile): ?>
                        <button type="button" class="btn btn-brand-primary" id="saveDraftBtn">
                            <i class="bi bi-cloud-arrow-up"></i> Save Draft
                        </button>
                    <?php else: ?>
                        <a href="index.php?page=login" class="btn btn-outline-dark">Log In to Save</a>
                    <?php endif; ?>
                </div>
            </div>

            <div class="row g-4">
                <!-- FORM INPUTS (Hidden in Print) -->
                <div class="col-lg-5 no-print">
                    <div class="card p-4 rounded-4 border-0 shadow-sm">
                        <h5 class="fw-bold mb-3 border-bottom pb-2">Edit Resume Information</h5>

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Full Name</label>
                            <input type="text" id="rb_name" class="form-control" value="<?= e($r_data['name'] ?? ($student_profile['full_name'] ?? 'Alex Johnson')) ?>">
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Email</label>
                                <input type="email" id="rb_email" class="form-control" value="<?= e($r_data['email'] ?? ($current_user['email'] ?? 'alex.johnson@college.edu')) ?>">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Phone</label>
                                <input type="text" id="rb_phone" class="form-control" value="<?= e($r_data['phone'] ?? ($student_profile['phone'] ?? '+91 98765 01234')) ?>">
                            </div>
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">City</label>
                                <input type="text" id="rb_city" class="form-control" value="<?= e($r_data['city'] ?? ($student_profile['city'] ?? 'Bengaluru')) ?>">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">LinkedIn / GitHub</label>
                                <input type="text" id="rb_links" class="form-control" value="<?= e($r_data['links'] ?? 'github.com/alex-dev') ?>">
                            </div>
                        </div>

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Career Objective / Summary</label>
                            <textarea id="rb_summary" rows="3" class="form-control"><?= e($r_data['summary'] ?? 'Motivated Computer Science undergraduate with hands-on experience building web apps using React and Python. Seeking a software internship to contribute to agile teams.') ?></textarea>
                        </div>

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Education</label>
                            <textarea id="rb_education" rows="2" class="form-control" placeholder="e.g. B.Tech Computer Science, National Institute of Tech (2022 - 2026) - CGPA: 8.7"><?= e($r_data['education'] ?? 'B.Tech in Computer Science & Engineering, Bengaluru Tech University (2022 - 2026) | CGPA: 8.8/10') ?></textarea>
                        </div>

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Technical & Soft Skills</label>
                            <input type="text" id="rb_skills" class="form-control" value="<?= e($r_data['skills'] ?? 'JavaScript, React, Node.js, Python, SQL, Git, Problem Solving') ?>">
                        </div>

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Key Projects</label>
                            <textarea id="rb_projects" rows="4" class="form-control" placeholder="Project Title - Description - Tools used"><?= e($r_data['projects'] ?? "• Campus Book Exchange: Built full-stack platform using React & Node.js serving 400+ students.\n• IoT Smart Weather Monitor: Designed ESP32 sensor system with real-time MQTT data pipeline.") ?></textarea>
                        </div>

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Certifications & Achievements</label>
                            <textarea id="rb_achievements" rows="2" class="form-control"><?= e($r_data['achievements'] ?? '• 1st Place, College Annual Hackathon 2025\n• Meta Certified Front-End Developer Coursera Specialization') ?></textarea>
                        </div>
                    </div>
                </div>

                <!-- LIVE ATS RESUME PREVIEW -->
                <div class="col-lg-7">
                    <div class="resume-print-area p-5 border">
                        <div class="border-bottom pb-3 mb-4 text-center">
                            <h2 class="fw-bold text-dark mb-1" id="pv_name">Alex Johnson</h2>
                            <div class="text-muted small" id="pv_contact">
                                Bengaluru • alex.johnson@college.edu • +91 98765 01234 • github.com/alex-dev
                            </div>
                        </div>

                        <div class="mb-4">
                            <h6 class="text-uppercase fw-bold text-primary border-bottom pb-1">Professional Summary</h6>
                            <p class="small text-muted mb-0" id="pv_summary">
                                Motivated Computer Science undergraduate with hands-on experience building web apps using React and Python. Seeking a software internship to contribute to agile teams.
                            </p>
                        </div>

                        <div class="mb-4">
                            <h6 class="text-uppercase fw-bold text-primary border-bottom pb-1">Education</h6>
                            <p class="small text-dark mb-0" id="pv_education" style="white-space: pre-line;">
                                B.Tech in Computer Science & Engineering, Bengaluru Tech University (2022 - 2026) | CGPA: 8.8/10
                            </p>
                        </div>

                        <div class="mb-4">
                            <h6 class="text-uppercase fw-bold text-primary border-bottom pb-1">Skills</h6>
                            <p class="small text-dark mb-0" id="pv_skills">
                                JavaScript, React, Node.js, Python, SQL, Git, Problem Solving
                            </p>
                        </div>

                        <div class="mb-4">
                            <h6 class="text-uppercase fw-bold text-primary border-bottom pb-1">Projects</h6>
                            <div class="small text-dark" id="pv_projects" style="white-space: pre-line;">
                                • Campus Book Exchange: Built full-stack platform using React & Node.js serving 400+ students.
                                • IoT Smart Weather Monitor: Designed ESP32 sensor system with real-time MQTT data pipeline.
                            </div>
                        </div>

                        <div>
                            <h6 class="text-uppercase fw-bold text-primary border-bottom pb-1">Certifications & Achievements</h6>
                            <div class="small text-dark" id="pv_achievements" style="white-space: pre-line;">
                                • 1st Place, College Annual Hackathon 2025
                                • Meta Certified Front-End Developer Coursera Specialization
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script>
        document.addEventListener('DOMContentLoaded', () => {
            const syncPreview = () => {
                document.getElementById('pv_name').textContent = document.getElementById('rb_name').value || 'Your Name';
                document.getElementById('pv_contact').textContent = [
                    document.getElementById('rb_city').value,
                    document.getElementById('rb_email').value,
                    document.getElementById('rb_phone').value,
                    document.getElementById('rb_links').value
                ].filter(Boolean).join(' • ');
                document.getElementById('pv_summary').textContent = document.getElementById('rb_summary').value;
                document.getElementById('pv_education').textContent = document.getElementById('rb_education').value;
                document.getElementById('pv_skills').textContent = document.getElementById('rb_skills').value;
                document.getElementById('pv_projects').textContent = document.getElementById('rb_projects').value;
                document.getElementById('pv_achievements').textContent = document.getElementById('rb_achievements').value;
            };

            ['rb_name','rb_email','rb_phone','rb_city','rb_links','rb_summary','rb_education','rb_skills','rb_projects','rb_achievements'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.addEventListener('input', syncPreview);
            });
            syncPreview();

            // Save Draft AJAX
            const saveBtn = document.getElementById('saveDraftBtn');
            if (saveBtn) {
                saveBtn.addEventListener('click', async () => {
                    const payload = {
                        name: document.getElementById('rb_name').value,
                        email: document.getElementById('rb_email').value,
                        phone: document.getElementById('rb_phone').value,
                        city: document.getElementById('rb_city').value,
                        links: document.getElementById('rb_links').value,
                        summary: document.getElementById('rb_summary').value,
                        education: document.getElementById('rb_education').value,
                        skills: document.getElementById('rb_skills').value,
                        projects: document.getElementById('rb_projects').value,
                        achievements: document.getElementById('rb_achievements').value
                    };

                    const formData = new FormData();
                    formData.append('csrf_token', '<?= e($_SESSION['csrf_token'] ?? '') ?>');
                    formData.append('title', 'Draft Resume');
                    formData.append('resume_data', JSON.stringify(payload));

                    try {
                        const res = await fetch('index.php?action=save_resume_builder', {
                            method: 'POST',
                            body: formData
                        });
                        const data = await res.json();
                        alert(data.message || 'Saved!');
                    } catch (err) {
                        alert('Could not save draft to server.');
                    }
                });
            }
        });
        </script>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 5. RESUME ANALYZER (Skill Gap & Completeness)
    // ------------------------------------------------------------------------
    case 'resume-analyzer':
        require_auth('student');
        $analysis = null;
        $resume_record = null;
        if ($student_profile && $pdo) {
            $stmt = $pdo->prepare("SELECT r.*, ra.completeness_score, ra.detected_skills, ra.missing_skills, ra.recommendations 
                                   FROM resumes r 
                                   LEFT JOIN resume_analysis ra ON r.id = ra.resume_id 
                                   WHERE r.student_id = ? 
                                   ORDER BY r.id DESC LIMIT 1");
            $stmt->execute([$student_profile['id']]);
            $resume_record = $stmt->fetch();
        }
        ?>
        <div class="container py-4">
            <div class="row g-4">
                <div class="col-lg-5">
                    <div class="card p-4 rounded-4 border-0 shadow-sm">
                        <h4 class="fw-bold mb-2">Upload Resume for Analysis</h4>
                        <p class="text-muted small mb-4">Upload your PDF or DOCX resume to detect technical keywords, compute an ATS score, and receive targeted improvement suggestions.</p>

                        <form action="index.php" method="POST" enctype="multipart/form-data">
                            <input type="hidden" name="form_action" value="upload_resume">
                            <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">

                            <div class="mb-3">
                                <label class="form-label small fw-semibold">Select Resume Document (PDF / DOCX)</label>
                                <input type="file" name="resume_file" class="form-control" accept=".pdf,.docx,.txt" required>
                                <div class="form-text small">Max size: <?= (int)get_setting($pdo, 'max_resume_size_mb', '4') ?> MB</div>
                            </div>

                            <button type="submit" class="btn btn-brand-primary w-100 py-2">
                                <i class="bi bi-cpu"></i> Analyze Resume
                            </button>
                        </form>
                    </div>
                </div>

                <div class="col-lg-7">
                    <?php if (!$resume_record): ?>
                        <div class="card p-5 rounded-4 border text-center bg-white">
                            <i class="bi bi-file-earmark-arrow-up text-muted display-4"></i>
                            <h5 class="mt-3">No Resume Analyzed Yet</h5>
                            <p class="text-muted small">Upload your resume on the left to unlock your score, detected skill catalog, and personalized job recommendations.</p>
                        </div>
                    <?php else: ?>
                        <div class="card p-4 rounded-4 border-0 shadow-sm bg-white">
                            <div class="d-flex justify-content-between align-items-center border-bottom pb-3 mb-3">
                                <div>
                                    <h5 class="fw-bold mb-0">Analysis Report</h5>
                                    <span class="small text-muted"><i class="bi bi-file-earmark-check"></i> <?= e($resume_record['original_filename']) ?></span>
                                </div>
                                <span class="badge bg-success-subtle text-success fs-6">Rule-Based Evaluator</span>
                            </div>

                            <div class="row g-3 mb-4 text-center">
                                <div class="col-sm-4">
                                    <div class="p-3 bg-light rounded-3">
                                        <div class="display-6 fw-bold text-primary"><?= (int)$resume_record['completeness_score'] ?>%</div>
                                        <div class="small text-muted">Completeness Score</div>
                                    </div>
                                </div>
                                <div class="col-sm-4">
                                    <div class="p-3 bg-light rounded-3">
                                        <div class="display-6 fw-bold text-success">
                                            <?= count(array_filter(explode(',', $resume_record['detected_skills'] ?? ''))) ?>
                                        </div>
                                        <div class="small text-muted">Skills Detected</div>
                                    </div>
                                </div>
                                <div class="col-sm-4">
                                    <div class="p-3 bg-light rounded-3">
                                        <div class="display-6 fw-bold text-danger">
                                            <?= count(array_filter(explode(',', $resume_record['missing_skills'] ?? ''))) ?>
                                        </div>
                                        <div class="small text-muted">Skills to Add</div>
                                    </div>
                                </div>
                            </div>

                            <h6 class="fw-bold text-dark mb-2">Detected Technical & Soft Skills</h6>
                            <div class="d-flex flex-wrap gap-1 mb-3">
                                <?php foreach (explode(',', $resume_record['detected_skills'] ?? '') as $sk): if (trim($sk)): ?>
                                    <span class="badge bg-primary-subtle text-primary border border-primary-subtle"><?= e(trim($sk)) ?></span>
                                <?php endif; endforeach; ?>
                            </div>

                            <h6 class="fw-bold text-dark mb-2">Recommended Skills to Gain</h6>
                            <div class="d-flex flex-wrap gap-1 mb-3">
                                <?php foreach (explode(',', $resume_record['missing_skills'] ?? '') as $sk): if (trim($sk)): ?>
                                    <span class="badge bg-danger-subtle text-danger border border-danger-subtle"><?= e(trim($sk)) ?></span>
                                <?php endif; endforeach; ?>
                            </div>

                            <h6 class="fw-bold text-dark mb-2">Formatting & Content Suggestions</h6>
                            <div class="p-3 bg-light rounded-3 small text-muted">
                                <?= e($resume_record['recommendations'] ?? 'Ensure project descriptions have clear metric impact.') ?>
                            </div>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 6. PRICING & SUBSCRIPTIONS
    // ------------------------------------------------------------------------
    case 'pricing':
        $plans = [];
        if ($pdo) {
            $stmt = $pdo->query("SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY display_order ASC");
            $plans = $stmt->fetchAll();
        }
        ?>
        <div class="container py-5">
            <div class="text-center max-w-2xl mx-auto mb-5">
                <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-bold mb-2">Affordable Student Access</span>
                <h1 class="display-5 fw-bold">Simple, Honest Pricing For College Budgets</h1>
                <p class="lead text-muted">Browse jobs and submit basic applications free forever. Upgrade to Smart Plus for prioritized visibility and skill-gap intelligence.</p>
            </div>

            <div class="row g-4 justify-content-center">
                <?php foreach ($plans as $plan): 
                    $is_plus = ($plan['code'] !== 'free');
                ?>
                <div class="col-lg-3 col-md-6">
                    <div class="card h-100 p-4 rounded-4 border <?= $is_plus ? 'border-primary shadow-lg' : 'shadow-sm' ?> d-flex flex-column justify-content-between">
                        <div>
                            <?php if ($plan['code'] === 'plus_monthly'): ?>
                                <span class="badge bg-primary text-white mb-2">Most Popular</span>
                            <?php elseif ($plan['code'] === 'plus_annual'): ?>
                                <span class="badge bg-success text-white mb-2">Best Value</span>
                            <?php endif; ?>

                            <h4 class="fw-bold text-dark"><?= e($plan['name']) ?></h4>
                            <div class="my-3">
                                <span class="display-6 fw-bold"><?= $currency ?><?= number_format($plan['price']) ?></span>
                                <span class="text-muted small">/ <?= $plan['duration_days'] ?> Days</span>
                            </div>

                            <hr>
                            <ul class="list-unstyled d-flex flex-column gap-2 small text-muted mb-4">
                                <?php foreach (explode("\n", $plan['features']) as $feat): if (trim($feat)): ?>
                                    <li class="d-flex align-items-center gap-2">
                                        <i class="bi bi-check-circle-fill text-success"></i> <?= e(trim($feat)) ?>
                                    </li>
                                <?php endif; endforeach; ?>
                            </ul>
                        </div>

                        <div>
                            <?php if ($plan['code'] === 'free'): ?>
                                <button class="btn btn-outline-dark w-100 disabled" disabled>Included by Default</button>
                            <?php else: ?>
                                <?php if (!is_logged_in()): ?>
                                    <a href="index.php?page=login" class="btn btn-brand-primary w-100">Log In to Upgrade</a>
                                <?php elseif ($has_active_plus): ?>
                                    <button class="btn btn-success w-100" disabled><i class="bi bi-patch-check"></i> Active Plan</button>
                                <?php else: ?>
                                    <a href="index.php?page=checkout&plan_id=<?= $plan['id'] ?>" class="btn btn-brand-primary w-100">
                                        Select <?= e($plan['name']) ?>
                                    </a>
                                <?php endif; ?>
                        </div>
                    </div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 7. CHECKOUT & PAYMENT INTEGRATION (Razorpay Simulator & Live Gateway)
    // ------------------------------------------------------------------------
    case 'checkout':
        require_auth('student');
        $plan_id = (int)($_GET['plan_id'] ?? 0);
        $plan = null;
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT * FROM subscription_plans WHERE id = ? AND is_active = 1");
            $stmt->execute([$plan_id]);
            $plan = $stmt->fetch();
        }

        if (!$plan || $plan['code'] === 'free') {
            header("Location: index.php?page=pricing");
            exit;
        }
        ?>
        <div class="container py-5" style="max-width: 600px;">
            <div class="card p-4 rounded-4 border-0 shadow-lg">
                <h4 class="fw-bold mb-3 border-bottom pb-2">Order Checkout</h4>
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div>
                        <h5 class="fw-bold mb-0"><?= e($plan['name']) ?></h5>
                        <span class="text-muted small"><?= $plan['duration_days'] ?> Days Full Access</span>
                    </div>
                    <span class="fs-4 fw-bold text-primary"><?= $currency ?><?= number_format($plan['price']) ?></span>
                </div>

                <div class="p-3 bg-light rounded-3 small text-muted mb-4">
                    <i class="bi bi-shield-check text-success me-1"></i> Transparent Indian Rupee payment via Razorpay secure gateway or local simulator. No recurring auto-debit without notice.
                </div>

                <!-- VERIFY PAYMENT FORM (SUBMITS TO SERVER-SIDE SIGNATURE VERIFICATION) -->
                <form id="paymentForm" action="index.php" method="POST">
                    <input type="hidden" name="form_action" value="verify_payment">
                    <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                    <input type="hidden" name="plan_id" value="<?= $plan['id'] ?>">
                    <input type="hidden" name="razorpay_payment_id" id="razorpay_payment_id" value="">
                    <input type="hidden" name="razorpay_order_id" id="razorpay_order_id" value="">
                    <input type="hidden" name="razorpay_signature" id="razorpay_signature" value="">

                    <button type="button" id="payBtn" class="btn btn-brand-primary w-100 py-3 fs-6">
                        Pay <?= $currency ?><?= number_format($plan['price']) ?> Securely
                    </button>
                </form>
            </div>
        </div>

        <!-- RAZORPAY SCRIPT -->
        <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
        <script>
        document.getElementById('payBtn').addEventListener('click', function(e) {
            e.preventDefault();

            const keyId = '<?= e($razorpay_key_id) ?>';
            const amountInPaise = <?= (int)($plan['price'] * 100) ?>;

            // If real key supplied, launch Razorpay modal
            if (keyId && keyId !== 'rzp_test_placeholder_key') {
                const options = {
                    key: keyId,
                    amount: amountInPaise,
                    currency: "INR",
                    name: "Smart Local",
                    description: "<?= e($plan['name']) ?> Upgrade",
                    handler: function (response) {
                        document.getElementById('razorpay_payment_id').value = response.razorpay_payment_id;
                        document.getElementById('razorpay_order_id').value = response.razorpay_order_id || 'ORD_RZP_' + Date.now();
                        document.getElementById('razorpay_signature').value = response.razorpay_signature || 'SIG_' + Date.now();
                        document.getElementById('paymentForm').submit();
                    },
                    prefill: {
                        name: "<?= e($student_profile['full_name'] ?? '') ?>",
                        email: "<?= e($current_user['email'] ?? '') ?>"
                    },
                    theme: {
                        color: "#2563eb"
                    }
                };
                const rzp1 = new Razorpay(options);
                rzp1.open();
            } else {
                // Test Mode Sandbox Simulator for Shared Hosting testing without live API keys
                if (confirm("Test Mode Notice:\nRazorpay credentials are currently in sandbox mode. Would you like to simulate a successful verified test payment of ₹<?= number_format($plan['price']) ?>?")) {
                    document.getElementById('razorpay_payment_id').value = 'pay_sandbox_' + Math.random().toString(36).substr(2, 9);
                    document.getElementById('razorpay_order_id').value = 'order_sandbox_' + Math.random().toString(36).substr(2, 9);
                    document.getElementById('razorpay_signature').value = 'sandbox_verified_signature';
                    document.getElementById('paymentForm').submit();
                }
            }
        });
        </script>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 8. STUDENT DASHBOARD
    // ------------------------------------------------------------------------
    case 'student-dashboard':
        require_auth('student');

        // Application stats
        $stats = ['total' => 0, 'under_review' => 0, 'shortlisted' => 0, 'hired' => 0];
        $recent_apps = [];
        $saved_list = [];

        if ($pdo) {
            $stmt = $pdo->prepare("SELECT status, COUNT(*) as cnt FROM applications WHERE student_id = ? GROUP BY status");
            $stmt->execute([$student_profile['id']]);
            foreach ($stmt->fetchAll() as $row) {
                $stats['total'] += $row['cnt'];
                if (isset($stats[$row['status']])) $stats[$row['status']] = $row['cnt'];
            }

            // Recent 5 apps
            $stmtA = $pdo->prepare("SELECT a.*, j.title, j.city, rp.company_name 
                                    FROM applications a 
                                    JOIN jobs j ON a.job_id = j.id 
                                    LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.id 
                                    WHERE a.student_id = ? 
                                    ORDER BY a.applied_at DESC LIMIT 5");
            $stmtA->execute([$student_profile['id']]);
            $recent_apps = $stmtA->fetchAll();

            // Saved jobs
            $stmtS = $pdo->prepare("SELECT j.*, rp.company_name 
                                    FROM saved_jobs sj 
                                    JOIN jobs j ON sj.job_id = j.id 
                                    LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.id 
                                    WHERE sj.student_id = ? 
                                    ORDER BY sj.saved_at DESC LIMIT 4");
            $stmtS->execute([$student_profile['id']]);
            $saved_list = $stmtS->fetchAll();
        }
        ?>
        <div class="container py-4">
            <!-- WELCOME HEADER -->
            <div class="card p-4 rounded-4 border-0 shadow-sm mb-4 bg-white">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <h3 class="fw-bold mb-1">Hello, <?= e($student_profile['full_name']) ?>! 👋</h3>
                        <p class="text-muted small mb-0">
                            <?= e($student_profile['college'] ?? 'College Student') ?> • <?= e($student_profile['city']) ?>
                        </p>
                    </div>
                    <div>
                        <?php if ($has_active_plus): ?>
                            <span class="badge bg-primary fs-6 px-3 py-2"><i class="bi bi-patch-check-fill me-1"></i> Smart Plus Active</span>
                        <?php else: ?>
                            <a href="index.php?page=pricing" class="btn btn-outline-primary btn-sm">Upgrade to Smart Plus</a>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

            <!-- STATISTIC CARDS -->
            <div class="row g-3 mb-4 text-center">
                <div class="col-6 col-md-3">
                    <div class="card p-3 rounded-4 border-0 shadow-sm bg-white">
                        <div class="fs-3 fw-bold text-primary"><?= (int)$stats['total'] ?></div>
                        <div class="small text-muted">Applied Opportunities</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card p-3 rounded-4 border-0 shadow-sm bg-white">
                        <div class="fs-3 fw-bold text-warning"><?= (int)$stats['under_review'] ?></div>
                        <div class="small text-muted">Under Review</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card p-3 rounded-4 border-0 shadow-sm bg-white">
                        <div class="fs-3 fw-bold text-info"><?= (int)$stats['shortlisted'] ?></div>
                        <div class="small text-muted">Shortlisted</div>
                    </div>
                </div>
                <div class="col-6 col-md-3">
                    <div class="card p-3 rounded-4 border-0 shadow-sm bg-white">
                        <div class="fs-3 fw-bold text-success"><?= (int)$stats['hired'] ?></div>
                        <div class="small text-muted">Hired / Selected</div>
                    </div>
                </div>
            </div>

            <div class="row g-4">
                <!-- RECENT APPLICATIONS -->
                <div class="col-lg-8">
                    <div class="card p-4 rounded-4 border-0 shadow-sm bg-white mb-4">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h5 class="fw-bold mb-0">Recent Applications</h5>
                            <a href="index.php?page=applications" class="small text-primary text-decoration-none">View All</a>
                        </div>

                        <?php if (empty($recent_apps)): ?>
                            <div class="text-center py-4 text-muted small">
                                You haven't applied to any opportunities yet. <a href="index.php?page=jobs">Browse listings</a>.
                            </div>
                        <?php else: ?>
                            <div class="table-responsive">
                                <table class="table align-middle">
                                    <thead>
                                        <tr class="text-muted small">
                                            <th>Role & Company</th>
                                            <th>Date</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php foreach ($recent_apps as $app): ?>
                                            <tr>
                                                <td>
                                                    <strong><?= e($app['title']) ?></strong>
                                                    <div class="small text-muted"><?= e($app['company_name'] ?? 'Partner') ?> • <?= e($app['city']) ?></div>
                                                </td>
                                                <td class="small text-muted"><?= date('M d, Y', strtotime($app['applied_at'])) ?></td>
                                                <td>
                                                    <span class="badge bg-primary-subtle text-primary text-capitalize">
                                                        <?= e(str_replace('_', ' ', $app['status'])) ?>
                                                    </span>
                                                </td>
                                            </tr>
                                        <?php endforeach; ?>
                                    </tbody>
                                </table>
                            </div>
                        <?php endif; ?>
                    </div>
                </div>

                <!-- SAVED JOBS & QUICK TOOLS -->
                <div class="col-lg-4">
                    <div class="card p-4 rounded-4 border-0 shadow-sm bg-white mb-4">
                        <h6 class="fw-bold mb-3">Quick Career Tools</h6>
                        <div class="d-grid gap-2">
                            <a href="index.php?page=resume-builder" class="btn btn-outline-primary text-start">
                                <i class="bi bi-file-earmark-code me-2"></i> Open Resume Builder
                            </a>
                            <a href="index.php?page=resume-analyzer" class="btn btn-outline-teal text-start">
                                <i class="bi bi-cpu me-2"></i> Check ATS Resume Score
                            </a>
                            <a href="index.php?page=jobs" class="btn btn-brand-primary text-start">
                                <i class="bi bi-search me-2"></i> Find Nearby Jobs
                            </a>
                        </div>
                    </div>

                    <div class="card p-4 rounded-4 border-0 shadow-sm bg-white">
                        <h6 class="fw-bold mb-3">Saved Favorites</h6>
                        <?php if (empty($saved_list)): ?>
                            <div class="text-muted small text-center py-3">No saved listings yet.</div>
                        <?php else: ?>
                            <?php foreach ($saved_list as $sj): ?>
                                <div class="border-bottom pb-2 mb-2">
                                    <a href="index.php?page=job-detail&id=<?= $sj['id'] ?>" class="fw-semibold text-dark text-decoration-none small d-block">
                                        <?= e($sj['title']) ?>
                                    </a>
                                    <div class="small text-muted"><?= e($sj['company_name'] ?? 'Employer') ?> • <?= e($sj['city']) ?></div>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 9. STUDENT APPLICATIONS TRACKING
    // ------------------------------------------------------------------------
    case 'applications':
        require_auth('student');
        $all_apps = [];
        if ($pdo) {
            $stmt = $pdo->prepare("SELECT a.*, j.title, j.city, j.work_arrangement, rp.company_name 
                                   FROM applications a 
                                   JOIN jobs j ON a.job_id = j.id 
                                   LEFT JOIN recruiter_profiles rp ON j.recruiter_id = rp.id 
                                   WHERE a.student_id = ? 
                                   ORDER BY a.applied_at DESC");
            $stmt->execute([$student_profile['id']]);
            $all_apps = $stmt->fetchAll();
        }
        ?>
        <div class="container py-4">
            <h3 class="fw-bold mb-3">My Application Status Tracker</h3>
            <p class="text-muted small mb-4">Track recruiter feedback, interview stages, or withdraw applications whenever needed.</p>

            <div class="card p-4 rounded-4 border-0 shadow-sm bg-white">
                <?php if (empty($all_apps)): ?>
                    <div class="text-center py-5">
                        <i class="bi bi-folder2-open text-muted display-4"></i>
                        <h5 class="mt-3">No applications submitted yet.</h5>
                        <p class="small text-muted">Explore opportunities that fit your college schedule and skills.</p>
                        <a href="index.php?page=jobs" class="btn btn-brand-primary btn-sm">Explore Jobs</a>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr class="text-muted small">
                                    <th>Job Title & Company</th>
                                    <th>Location</th>
                                    <th>Date Applied</th>
                                    <th>Current Status</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($all_apps as $app): ?>
                                    <tr>
                                        <td>
                                            <a href="index.php?page=job-detail&id=<?= $app['job_id'] ?>" class="fw-bold text-dark text-decoration-none">
                                                <?= e($app['title']) ?>
                                            </a>
                                            <div class="small text-muted"><?= e($app['company_name'] ?? 'Partner') ?></div>
                                        </td>
                                        <td class="small"><?= e($app['city']) ?> (<?= e($app['work_arrangement']) ?>)</td>
                                        <td class="small text-muted"><?= date('M d, Y', strtotime($app['applied_at'])) ?></td>
                                        <td>
                                            <?php
                                            $badge_class = 'bg-secondary';
                                            if ($app['status'] === 'shortlisted') $badge_class = 'bg-info text-dark';
                                            elseif ($app['status'] === 'interviewed') $badge_class = 'bg-warning text-dark';
                                            elseif ($app['status'] === 'hired') $badge_class = 'bg-success';
                                            elseif ($app['status'] === 'rejected') $badge_class = 'bg-danger';
                                            elseif ($app['status'] === 'under_review') $badge_class = 'bg-primary';
                                            ?>
                                            <span class="badge <?= $badge_class ?> text-capitalize">
                                                <?= e(str_replace('_', ' ', $app['status'])) ?>
                                            </span>
                                        </td>
                                        <td>
                                            <?php if (!in_array($app['status'], ['hired', 'rejected', 'withdrawn'])): ?>
                                                <form action="index.php" method="POST" onsubmit="return confirm('Are you sure you want to withdraw this application?');">
                                                    <input type="hidden" name="form_action" value="withdraw_application">
                                                    <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                                                    <input type="hidden" name="application_id" value="<?= $app['id'] ?>">
                                                    <button type="submit" class="btn btn-outline-danger btn-sm">Withdraw</button>
                                                </form>
                                            <?php else: ?>
                                                <span class="small text-muted">—</span>
                                            <?php endif; ?>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 10. RECRUITER PORTAL & DASHBOARD
    // ------------------------------------------------------------------------
    case 'recruiter-dashboard':
        require_auth('recruiter');

        $recruiter_jobs = [];
        $recruiter_apps = [];

        if ($pdo) {
            // Recruiter's jobs
            $stmtJ = $pdo->prepare("SELECT * FROM jobs WHERE recruiter_id = ? ORDER BY id DESC");
            $stmtJ->execute([$recruiter_profile['id']]);
            $recruiter_jobs = $stmtJ->fetchAll();

            // Applicants across recruiter's jobs
            $stmtA = $pdo->prepare("SELECT a.*, j.title as job_title, sp.full_name as student_name, sp.college, sp.skills as student_skills, sp.city as student_city 
                                    FROM applications a 
                                    JOIN jobs j ON a.job_id = j.id 
                                    JOIN student_profiles sp ON a.student_id = sp.id 
                                    WHERE j.recruiter_id = ? 
                                    ORDER BY a.applied_at DESC LIMIT 30");
            $stmtA->execute([$recruiter_profile['id']]);
            $recruiter_apps = $stmtA->fetchAll();
        }
        ?>
        <div class="container py-4">
            <div class="card p-4 rounded-4 border-0 shadow-sm bg-white mb-4">
                <div class="d-flex flex-wrap justify-content-between align-items-center gap-3">
                    <div>
                        <h3 class="fw-bold mb-1"><?= e($recruiter_profile['company_name']) ?> — Recruiter Portal</h3>
                        <p class="text-muted small mb-0">Recruiter: <?= e($recruiter_profile['recruiter_name']) ?> • <?= e($recruiter_profile['location']) ?></p>
                    </div>
                    <div class="d-flex gap-2">
                        <?php if ($recruiter_profile['verification_status'] === 'verified'): ?>
                            <span class="badge bg-success fs-6 p-2"><i class="bi bi-patch-check"></i> Verified Employer</span>
                        <?php else: ?>
                            <span class="badge bg-warning text-dark fs-6 p-2"><i class="bi bi-hourglass-split"></i> Verification Pending</span>
                        <?php endif; ?>
                        <a href="index.php?page=post-job" class="btn btn-brand-primary btn-sm">
                            <i class="bi bi-plus-circle me-1"></i> Post Opportunity
                        </a>
                    </div>
                </div>
            </div>

            <!-- APPLICANTS MANAGEMENT TABLE -->
            <div class="card p-4 rounded-4 border-0 shadow-sm bg-white mb-4">
                <h5 class="fw-bold mb-3">Recent Student Applicants</h5>
                <?php if (empty($recruiter_apps)): ?>
                    <div class="text-muted small text-center py-4">No candidates have applied to your active listings yet.</div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr class="text-muted small">
                                    <th>Candidate</th>
                                    <th>Applied For</th>
                                    <th>Skills</th>
                                    <th>Status</th>
                                    <th>Update Stage</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recruiter_apps as $rap): ?>
                                    <tr>
                                        <td>
                                            <strong><?= e($rap['student_name']) ?></strong>
                                            <div class="small text-muted"><?= e($rap['college']) ?> • <?= e($rap['student_city']) ?></div>
                                        </td>
                                        <td class="small fw-semibold"><?= e($rap['job_title']) ?></td>
                                        <td class="small text-muted" style="max-width: 200px;">
                                            <?= e($rap['student_skills']) ?>
                                        </td>
                                        <td>
                                            <span class="badge bg-primary text-capitalize"><?= e(str_replace('_', ' ', $rap['status'])) ?></span>
                                        </td>
                                        <td>
                                            <form action="index.php" method="POST" class="d-flex gap-1 align-items-center">
                                                <input type="hidden" name="form_action" value="update_application_status">
                                                <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">
                                                <input type="hidden" name="application_id" value="<?= $rap['id'] ?>">
                                                <select name="status" class="form-select form-select-sm" style="width: 130px;">
                                                    <option value="under_review" <?= $rap['status'] === 'under_review' ? 'selected' : '' ?>>Reviewing</option>
                                                    <option value="shortlisted" <?= $rap['status'] === 'shortlisted' ? 'selected' : '' ?>>Shortlist</option>
                                                    <option value="interviewed" <?= $rap['status'] === 'interviewed' ? 'selected' : '' ?>>Interview</option>
                                                    <option value="hired" <?= $rap['status'] === 'hired' ? 'selected' : '' ?>>Hire</option>
                                                    <option value="rejected" <?= $rap['status'] === 'rejected' ? 'selected' : '' ?>>Reject</option>
                                                </select>
                                                <button type="submit" class="btn btn-sm btn-dark">Save</button>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>

            <!-- POSTED JOBS TABLE -->
            <div class="card p-4 rounded-4 border-0 shadow-sm bg-white">
                <h5 class="fw-bold mb-3">Your Published Listings</h5>
                <?php if (empty($recruiter_jobs)): ?>
                    <div class="text-muted small text-center py-4">You have not posted any opportunities yet.</div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table align-middle">
                            <thead>
                                <tr class="text-muted small">
                                    <th>Title</th>
                                    <th>Category</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                    <th>Views</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($recruiter_jobs as $rj): ?>
                                    <tr>
                                        <td>
                                            <a href="index.php?page=job-detail&id=<?= $rj['id'] ?>" class="fw-bold text-dark text-decoration-none">
                                                <?= e($rj['title']) ?>
                                            </a>
                                        </td>
                                        <td class="small"><?= e($rj['category']) ?></td>
                                        <td class="small text-uppercase"><?= e($rj['job_type']) ?></td>
                                        <td>
                                            <span class="badge <?= $rj['moderation_status'] === 'approved' ? 'bg-success' : 'bg-warning text-dark' ?>">
                                                <?= e($rj['moderation_status']) ?>
                                            </span>
                                        </td>
                                        <td class="small"><?= (int)$rj['views_count'] ?></td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 11. POST NEW JOB (Recruiter)
    // ------------------------------------------------------------------------
    case 'post-job':
        require_auth('recruiter');
        ?>
        <div class="container py-4" style="max-width: 800px;">
            <div class="card p-4 rounded-4 border-0 shadow-sm bg-white">
                <h4 class="fw-bold mb-1">Post a College Internship or Gig</h4>
                <p class="text-muted small mb-4">Connect directly with students near your work location.</p>

                <form action="index.php" method="POST">
                    <input type="hidden" name="form_action" value="post_job">
                    <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">

                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Job / Internship Title *</label>
                        <input type="text" name="title" class="form-control" placeholder="e.g. React Web Developer Intern" required>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Category *</label>
                            <select name="category" class="form-select" required>
                                <option value="Software Development">Software Development</option>
                                <option value="Data Science & Analytics">Data Science & Analytics</option>
                                <option value="Design & Creative">Design & Creative</option>
                                <option value="Marketing & Content">Marketing & Content</option>
                                <option value="College Projects">College Projects</option>
                                <option value="Operations & Support">Operations & Support</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Opportunity Type *</label>
                            <select name="job_type" class="form-select" required>
                                <option value="internship">Internship</option>
                                <option value="part-time">Part-Time</option>
                                <option value="freelance">Freelance Gig</option>
                                <option value="remote">Remote Work</option>
                                <option value="project">College Project Collaboration</option>
                                <option value="full-time">Full-Time Fresher</option>
                            </select>
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold">Work Arrangement</label>
                            <select name="work_arrangement" class="form-select">
                                <option value="on-site">On-Site</option>
                                <option value="hybrid">Hybrid</option>
                                <option value="remote">Remote</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold">City *</label>
                            <input type="text" name="city" class="form-control" placeholder="e.g. Bengaluru" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label small fw-semibold">Locality / Area</label>
                            <input type="text" name="locality" class="form-control" placeholder="e.g. Koramangala">
                        </div>
                    </div>

                    <div class="row g-3 mb-3">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Min Monthly Stipend (₹)</label>
                            <input type="number" name="salary_min" class="form-control" value="8000" min="0">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Max Monthly Stipend (₹)</label>
                            <input type="number" name="salary_max" class="form-control" value="15000" min="0">
                        </div>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Required Skills (Comma separated) *</label>
                        <input type="text" name="skills" class="form-control" placeholder="e.g. React, JavaScript, CSS, Git" required>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Job Description *</label>
                        <textarea name="description" rows="4" class="form-control" placeholder="Describe the mission, role details, and learning outcomes..." required></textarea>
                    </div>

                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Duration</label>
                            <input type="text" name="duration" class="form-control" placeholder="e.g. 3 Months">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label small fw-semibold">Application Deadline</label>
                            <input type="date" name="application_deadline" class="form-control">
                        </div>
                    </div>

                    <button type="submit" class="btn btn-brand-primary w-100 py-2">
                        Submit Listing for Verification
                    </button>
                </form>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 12. AUTHENTICATION: LOGIN & REGISTER
    // ------------------------------------------------------------------------
    case 'login':
        ?>
        <div class="container py-5" style="max-width: 480px;">
            <div class="card p-4 rounded-4 border-0 shadow-lg bg-white">
                <div class="text-center mb-4">
                    <h3 class="fw-bold">Welcome Back</h3>
                    <p class="text-muted small">Sign in to Smart Local</p>
                </div>

                <form action="index.php" method="POST">
                    <input type="hidden" name="form_action" value="login">
                    <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">

                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Email Address</label>
                        <input type="email" name="email" class="form-control" required autofocus>
                    </div>

                    <div class="mb-3">
                        <label class="form-label small fw-semibold">Password</label>
                        <input type="password" name="password" class="form-control" required>
                    </div>

                    <button type="submit" class="btn btn-brand-primary w-100 py-2 mb-3">
                        Log In
                    </button>
                </form>

                <div class="text-center small text-muted">
                    Don't have an account? <a href="index.php?page=register" class="fw-semibold text-primary">Sign up here</a>
                </div>
            </div>
        </div>
        <?php
        break;

    case 'register':
        $type = $_GET['type'] ?? 'student';
        ?>
        <div class="container py-5" style="max-width: 600px;">
            <div class="card p-4 rounded-4 border-0 shadow-lg bg-white">
                <div class="text-center mb-4">
                    <h3 class="fw-bold">Create Smart Local Account</h3>
                    <div class="btn-group mt-2" role="group">
                        <a href="index.php?page=register&type=student" class="btn btn-sm <?= ($type === 'student') ? 'btn-primary' : 'btn-outline-primary' ?>">I am a Student</a>
                        <a href="index.php?page=register&type=recruiter" class="btn btn-sm <?= ($type === 'recruiter') ? 'btn-primary' : 'btn-outline-primary' ?>">I am a Recruiter</a>
                    </div>
                </div>

                <?php if ($type === 'student'): ?>
                    <form action="index.php" method="POST">
                        <input type="hidden" name="form_action" value="register_student">
                        <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">

                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Full Name *</label>
                            <input type="text" name="full_name" class="form-control" required>
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Email *</label>
                                <input type="email" name="email" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Password *</label>
                                <input type="password" name="password" class="form-control" required minlength="6">
                            </div>
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">City *</label>
                                <input type="text" name="city" class="form-control" placeholder="e.g. Bengaluru" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Locality</label>
                                <input type="text" name="locality" class="form-control" placeholder="e.g. HSR Layout">
                            </div>
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">College / University</label>
                                <input type="text" name="college" class="form-control">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Course & Year</label>
                                <input type="text" name="course" class="form-control" placeholder="e.g. B.Tech CSE 2026">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Skills (Comma-separated)</label>
                            <input type="text" name="skills" class="form-control" placeholder="e.g. Python, React, SQL, Excel">
                        </div>

                        <button type="submit" class="btn btn-brand-primary w-100 py-2 mb-3">
                            Register as Student
                        </button>
                    </form>
                <?php else: ?>
                    <form action="index.php" method="POST">
                        <input type="hidden" name="form_action" value="register_recruiter">
                        <input type="hidden" name="csrf_token" value="<?= e($_SESSION['csrf_token']) ?>">

                        <div class="row g-2 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Recruiter Full Name *</label>
                                <input type="text" name="recruiter_name" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Work Email *</label>
                                <input type="email" name="email" class="form-control" required>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Company Name *</label>
                            <input type="text" name="company_name" class="form-control" required>
                        </div>
                        <div class="row g-2 mb-3">
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Office City / Location *</label>
                                <input type="text" name="location" class="form-control" required>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label small fw-semibold">Website</label>
                                <input type="url" name="website" class="form-control" placeholder="https://example.com">
                            </div>
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Password *</label>
                            <input type="password" name="password" class="form-control" required minlength="6">
                        </div>
                        <div class="mb-3">
                            <label class="form-label small fw-semibold">Company Description</label>
                            <textarea name="description" rows="2" class="form-control" placeholder="Briefly describe your company..."></textarea>
                        </div>

                        <button type="submit" class="btn btn-brand-primary w-100 py-2 mb-3">
                            Register Recruiter Account
                        </button>
                    </form>
                <?php endif; ?>

                <div class="text-center small text-muted">
                    Already registered? <a href="index.php?page=login" class="fw-semibold text-primary">Log in here</a>
                </div>
            </div>
        </div>
        <?php
        break;

    // ------------------------------------------------------------------------
    // 13. ABOUT & SAFETY
    // ------------------------------------------------------------------------
    case 'about':
        ?>
        <div class="container py-5" style="max-width: 800px;">
            <div class="text-center mb-5">
                <h1 class="fw-bold">About Smart Local</h1>
                <p class="lead text-muted">Dedicated to solving the internship discovery bottleneck for Indian college freshers.</p>
            </div>

            <div class="card p-4 rounded-4 border-0 shadow-sm bg-white mb-4">
                <h4 class="fw-bold text-primary mb-3">Our Mission</h4>
                <p class="text-muted">
                    Every year, millions of students across tier-1, tier-2, and tier-3 colleges search for genuine internships and local projects. Many fall victim to unverified platforms charging upfront "training fees" or providing phantom certificates.
                </p>
                <p class="text-muted">
                    <strong>Smart Local</strong> bridges the gap between local verified employers, innovative startups, and eager college students. We provide transparent stipends, distance-based neighborhood matching, and an ATS-grade resume builder without exorbitant fees.
                </p>
            </div>

            <div class="card p-4 rounded-4 border-0 shadow-sm bg-white" id="safety">
                <h4 class="fw-bold text-danger mb-3"><i class="bi bi-shield-check"></i> Student Scam Defense & Rules</h4>
                <ul class="text-muted d-flex flex-column gap-2 mb-0">
                    <li><strong>Zero Upfront Payment:</strong> No employer or recruiter is ever permitted to request security deposits, laptop fees, or examination charges.</li>
                    <li><strong>Verified Company Profiles:</strong> Employers must provide valid websites and phone numbers. Unverified recruiters are audited by admins.</li>
                    <li><strong>Community Moderation:</strong> Students can flag suspicious postings at any time with 1-click reporting.</li>
                </ul>
            </div>
        </div>
        <?php
        break;

    default:
        echo "<div class='container py-5 text-center'><h3>Page Not Found</h3><a href='index.php' class='btn btn-primary mt-3'>Return Home</a></div>";
        break;
}
?>
</main>

<!-- ======================================================================== -->
<!-- FOOTER                                                                   -->
<!-- ======================================================================== -->
<footer class="bg-white border-top py-4 mt-auto no-print">
    <div class="container">
        <div class="row g-4 justify-content-between align-items-center">
            <div class="col-md-6">
                <div class="d-flex align-items-center gap-2 mb-1">
                    <span class="fw-bold text-primary"><?= e($site_name) ?></span>
                    <span class="text-muted">• <?= e($site_tagline) ?></span>
                </div>
                <div class="small text-muted">
                    Contact: <a href="mailto:<?= e(get_setting($pdo, 'contact_email', 'support@smartlocal.in')) ?>" class="text-muted"><?= e(get_setting($pdo, 'contact_email', 'support@smartlocal.in')) ?></a>
                </div>
            </div>
            <div class="col-md-6 text-md-end small text-muted">
                <a href="index.php?page=about" class="text-muted text-decoration-none me-3">About & Trust</a>
                <a href="index.php?page=pricing" class="text-muted text-decoration-none me-3">Student Plans</a>
                <a href="admin.php" class="text-muted text-decoration-none"><i class="bi bi-lock"></i> Admin</a>
            </div>
        </div>
    </div>
</footer>

<!-- Bootstrap 5 Bundle JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

<!-- AJAX SCRIPT FOR BOOKMARKS & REPORTS -->
<script>
document.addEventListener('DOMContentLoaded', () => {
    // 1. Toggle Job Bookmark
    document.querySelectorAll('.save-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const jobId = btn.getAttribute('data-job-id');
            const formData = new FormData();
            formData.append('csrf_token', '<?= e($_SESSION['csrf_token'] ?? '') ?>');
            formData.append('job_id', jobId);

            try {
                const res = await fetch('index.php?action=toggle_save_job', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    if (data.saved) {
                        btn.innerHTML = '<i class="bi bi-bookmark-fill text-primary"></i>';
                    } else {
                        btn.innerHTML = '<i class="bi bi-bookmark"></i>';
                    }
                } else {
                    alert(data.message);
                }
            } catch (err) {
                console.error(err);
            }
        });
    });

    // 2. Submit Job Report Modal Form
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(reportForm);
            try {
                const res = await fetch('index.php?action=report_job', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                alert(data.message);
                const modal = bootstrap.Modal.getInstance(document.getElementById('reportModal'));
                if (modal) modal.hide();
            } catch (err) {
                alert('Could not submit report.');
            }
        });
    }
});
</script>

</body>
</html>
