<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

$title = $data['title'] ?? 'Default Title';
$message = $data['message'] ?? 'Default Message';
$specificToken = $data['deviceToken'] ?? null;

// Firebase Server Key (Get from Firebase Console > Project Settings > Cloud Messaging)
$serverKey = 'BCS5MgDiA9DOzT_CI12agRMwNRtU6wehijEVEkjY77LMRnv6Fh9mlGocJ87k_5w862iwomMSx1xRGJFRH9W3s_8';

// Read stored tokens
$tokensFile = 'tokens.txt';
$tokens = [];

if (file_exists($tokensFile)) {
    $tokens = file($tokensFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
}

if (empty($tokens) && empty($specificToken)) {
    echo json_encode(['success' => false, 'error' => 'No device tokens available']);
    exit;
}

// Prepare notification payload
$notification = [
    'title' => $title,
    'body' => $message,
    'icon' => 'firebase-logo.png',
    'click_action' => https://duty-m.vercel.app/' // Change to your URL
];

// Send to specific token or all tokens
if ($specificToken) {
    $tokenList = [$specificToken];
} else {
    $tokenList = $tokens;
}

$successCount = 0;
$errorCount = 0;

foreach ($tokenList as $token) {
    $fields = [
        'to' => $token,
        'notification' => $notification,
        'data' => [
            'title' => $title,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ];

    $headers = [
        'Authorization: key=' . $serverKey,
        'Content-Type: application/json'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://fcm.googleapis.com/fcm/send');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($fields));
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    if ($httpCode == 200) {
        $resultData = json_decode($result, true);
        if ($resultData['success'] ?? 0 == 1) {
            $successCount++;
        } else {
            $errorCount++;
            // Remove invalid token
            if (strpos($result, 'InvalidRegistration') !== false || 
                strpos($result, 'NotRegistered') !== false) {
                removeToken($token);
            }
        }
    } else {
        $errorCount++;
    }
    
    curl_close($ch);
}

echo json_encode([
    'success' => true,
    'message' => "Sent $successCount notifications successfully, $errorCount failed"
]);

function removeToken($tokenToRemove) {
    $tokensFile = 'tokens.txt';
    if (file_exists($tokensFile)) {
        $tokens = file($tokensFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        $tokens = array_diff($tokens, [$tokenToRemove]);
        file_put_contents($tokensFile, implode(PHP_EOL, $tokens) . PHP_EOL);
    }
}
?>
