<?php
// save_password.php
error_log("=== save_password.php called ===");
error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("POST data: " . print_r($_POST, true));

// Replace these with your database credentials
$host = "localhost";
$db   = "privashield_db"; // Updated database name
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
$password = isset($_POST['password']) ? $_POST['password'] : null;
$length   = isset($_POST['length']) ? $_POST['length'] : null;
$score    = isset($_POST['score']) ? $_POST['score'] : null;

error_log("Parsed data: password=" . ($password ? 'set' : 'null') . ", length=$length, score=$score");

if (empty($password) || is_null($length) || is_null($score)) {
    error_log("Invalid input data: password=" . ($password ? $password : 'null') . ", length=$length, score=$score");
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Invalid input data.', 'received' => ['password' => $password, 'length' => $length, 'score' => $score]]);
    exit;
}

$length = intval($length);
$score = intval($score);

error_log("After conversion: length=$length, score=$score");

try {
    // Hash the password before storing
    $hash = password_hash($password, PASSWORD_DEFAULT);
    error_log("Password hashed successfully.");

    // Ensure the table name is correct
    $stmt = $pdo->prepare("INSERT INTO password_check (password_hash, length, score) VALUES (?, ?, ?)");
    error_log("Executing query: INSERT INTO password_check (password_hash, length, score) VALUES (?, *, *)");
    $stmt->execute([$hash, $length, $score]);

    error_log("Password saved successfully: " . json_encode(['password_length' => strlen($password), 'length' => $length, 'score' => $score]));
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'message' => 'Password saved successfully.', 'data' => ['length' => $length, 'score' => $score]]);
} catch (\PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Failed to save password.', 'details' => $e->getMessage()]);
}