<?php
// secure_vault.php
error_log("=== secure_vault.php called ===");
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
$encrypted_data = isset($_POST['encrypted_data']) ? $_POST['encrypted_data'] : null;
$user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;

error_log("Parsed data: encrypted_data_length=" . strlen($encrypted_data ?? '') . ", user_id=$user_id");

if (empty($encrypted_data)) {
    error_log("Invalid input data: encrypted_data is empty");
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Invalid input data. Encrypted data required.']);
    exit;
}

try {
    // Insert the encrypted data record
    $stmt = $pdo->prepare("INSERT INTO secure_vault (user_id, encrypted_data) VALUES (?, ?)");
    error_log("Executing query: INSERT INTO secure_vault (user_id, encrypted_data) VALUES (?, *)");
    $stmt->execute([$user_id, $encrypted_data]);

    error_log("Encrypted data saved successfully");
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'message' => 'Encrypted data saved successfully.']);
} catch (\PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Failed to save encrypted data.', 'details' => $e->getMessage()]);
}
