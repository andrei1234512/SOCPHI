<?php
// quiz_results.php
error_log("=== quiz_results.php called ===");
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
$score = isset($_POST['score']) ? $_POST['score'] : null;
$percentage = isset($_POST['percentage']) ? $_POST['percentage'] : null;
$user_id = isset($_POST['user_id']) ? $_POST['user_id'] : null;

error_log("Parsed data: score=$score, percentage=$percentage, user_id=$user_id");

if (is_null($score) || is_null($percentage)) {
    error_log("Invalid input data: score=$score, percentage=$percentage");
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Invalid input data.', 'received' => ['score' => $score, 'percentage' => $percentage]]);
    exit;
}

$score = intval($score);
$percentage = doubleval($percentage);

error_log("After conversion: score=$score, percentage=$percentage");

try {
    // Insert the quiz result record
    $stmt = $pdo->prepare("INSERT INTO quiz_results (user_id, score, percentage) VALUES (?, ?, ?)");
    error_log("Executing query: INSERT INTO quiz_results (user_id, score, percentage) VALUES (?, ?, ?)");
    $stmt->execute([$user_id, $score, $percentage]);

    error_log("Quiz result saved successfully: score=$score, percentage=$percentage");
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'success', 'message' => 'Quiz result saved successfully.', 'data' => ['score' => $score, 'percentage' => $percentage]]);
} catch (\PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Failed to save quiz result.', 'details' => $e->getMessage()]);
}
