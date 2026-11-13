<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('Vary: Origin');

$config = require __DIR__ . '/../config/config.php';
require_once __DIR__ . '/../lib/SupabaseClient.php';

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && $config['app_origin'] !== '' && rtrim($origin, '/') !== $config['app_origin']) {
    respond(['message' => 'This origin is not allowed.'], 403);
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || trim($raw) === '') {
        return [];
    }
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        respond(['message' => 'Request body must be a JSON object.'], 400);
    }
    return $data;
}

function respond($data, int $status = 200): void {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function request_method(string ...$allowed): void {
    if (!in_array($_SERVER['REQUEST_METHOD'] ?? '', $allowed, true)) {
        header('Allow: ' . implode(', ', $allowed));
        respond(['message' => 'Method not allowed.'], 405);
    }
}

function bearer_token(): ?string {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    $authorization = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer\s+(.+)$/i', trim((string)$authorization), $matches)
        ? trim($matches[1])
        : null;
}

function require_user(SupabaseClient $client): array {
    $token = bearer_token();
    if ($token === null) {
        respond(['message' => 'Please sign in to continue.'], 401);
    }
    try {
        $user = $client->auth('GET', 'user', null, $token);
    } catch (SupabaseException $error) {
        respond(['message' => 'Your session is invalid or expired. Please sign in again.'], 401);
    }
    if (!isset($user['id'])) {
        respond(['message' => 'Could not verify the signed-in user.'], 401);
    }
    return ['id' => $user['id'], 'token' => $token, 'user' => $user];
}

function start_admin_session(): void {
    if (session_status() === PHP_SESSION_ACTIVE) {
        return;
    }
    session_name('elegance_admin');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function require_admin(SupabaseClient $client): array {
    start_admin_session();
    $adminToken = $_SESSION['admin_token'] ?? null;
    if (!is_string($adminToken) || $adminToken === '') {
        respond(['message' => 'Administrator sign-in is required.'], 401);
    }
    return ['id' => 'admin', 'token' => $adminToken];
}

function respond_error(Throwable $error): never {
    if ($error instanceof SupabaseException) {
        respond(['message' => $error->getMessage()], $error->httpStatus);
    }
    if ($error instanceof SupabaseUnavailableException) {
        error_log('Elegance Jewellery Supabase connection error: ' . $error->getMessage());
        respond(['message' => 'Could not reach Supabase. Check your connection and try again.'], 503);
    }
    error_log('Elegance Jewellery backend error: ' . $error->getMessage());
    respond(['message' => 'The request could not be completed. Please try again.'], 500);
}

try {
    $supabase = new SupabaseClient($config);
} catch (Throwable $error) {
    error_log('Elegance Jewellery backend configuration error: ' . $error->getMessage());
    respond(['message' => 'The database backend is not configured. Add SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY to the root .env file.'], 503);
}
