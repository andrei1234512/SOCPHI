<?php
// phishing_scans.php
error_log("=== phishing_scans.php called ===");
error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("POST data: " . print_r($_POST, true));

// Replace these with your database credentials
$host = "localhost";
$db   = "privashield_db";
$user = "root";
$pass = "";
$charset = "utf8mb4";

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
];

try {
    $pdo = new PDO($dsn, $user, $pass, $options);
    error_log("Database connection successful.");
} catch (\PDOException $e) {
    error_log("DB Connection failed: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    die(json_encode(['status' => 'error', 'message' => 'Database connection failed.', 'details' => $e->getMessage()]));
}

// Get POST data
$scan_type = isset($_POST['scan_type']) ? $_POST['scan_type'] : null;
$content = isset($_POST['content']) ? $_POST['content'] : null;
$risk_level = isset($_POST['risk_level']) ? $_POST['risk_level'] : null;
$user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;

error_log("Parsed data: scan_type=$scan_type, content_length=" . strlen($content ?? '') . ", risk_level=$risk_level, user_id=$user_id");

if (empty($scan_type) || empty($content) || empty($risk_level)) {
    error_log("Invalid input data: scan_type=$scan_type, content=" . ($content ? 'set' : 'null') . ", risk_level=$risk_level");
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Invalid input data.', 'received' => ['scan_type' => $scan_type, 'content_length' => strlen($content ?? ''), 'risk_level' => $risk_level]]);
    exit;
}

// Validate scan_type and risk_level
$valid_scan_types = ['email', 'url'];
$valid_risk_levels = ['low', 'medium', 'high'];

if (!in_array($scan_type, $valid_scan_types)) {
    error_log("Invalid scan_type: $scan_type");
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Invalid scan_type. Must be email or url.']);
    exit;
}

if (!in_array($risk_level, $valid_risk_levels)) {
    error_log("Invalid risk_level: $risk_level");
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Invalid risk_level. Must be low, medium, or high.']);
    exit;
}

try {
    // Insert the phishing scan record
    $stmt = $pdo->prepare("INSERT INTO phishing_scans (user_id, scan_type, content, risk_level) VALUES (?, ?, ?, ?)");
    error_log("Executing query: INSERT INTO phishing_scans (user_id, scan_type, content, risk_level) VALUES (?, ?, *, ?)");
    $stmt->execute([$user_id, $scan_type, $content, $risk_level]);

    error_log("Phishing scan saved successfully: scan_type=$scan_type, risk_level=$risk_level");
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'message' => 'Phishing scan saved successfully.', 'data' => ['scan_type' => $scan_type, 'risk_level' => $risk_level]]);
} catch (\PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Failed to save phishing scan.', 'details' => $e->getMessage()]);
}
