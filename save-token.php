<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);
$token = $data['token'] ?? '';

if (empty($token)) {
    echo json_encode(['success' => false, 'error' => 'No token provided']);
    exit;
}

// In a real application, save to database
// For this example, we'll save to a text file
$tokensFile = 'tokens.txt';

// Read existing tokens
$existingTokens = [];
if (file_exists($tokensFile)) {
    $existingTokens = file($tokensFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
}

// Add new token if not already exists
if (!in_array($token, $existingTokens)) {
    file_put_contents($tokensFile, $token . PHP_EOL, FILE_APPEND);
    echo json_encode(['success' => true, 'message' => 'Token saved successfully']);
} else {
    echo json_encode(['success' => true, 'message' => 'Token already exists']);
}
?>
