<?php
require __DIR__ . '/_bootstrap.php';

start_admin_session();

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        $token = $_SESSION['admin_token'] ?? '';
        $valid = $token !== '' && $supabase->request(
            'POST',
            'rpc/admin_validate_session',
            ['p_admin_token' => $token]
        )['authenticated'] === true;
        if (!$valid) {
            unset($_SESSION['admin_token']);
        }
        respond(['authenticated' => $valid]);
    }

    request_method('POST');
    $input = json_input();
    $action = (string)($input['action'] ?? '');

    if ($action === 'login') {
        $username = trim((string)($input['username'] ?? ''));
        $password = (string)($input['password'] ?? '');
        if ($username === '' || strlen($username) > 80 || strlen($password) < 8 || strlen($password) > 256) {
            respond(['message' => 'Enter a valid administrator username and password.'], 422);
        }
        $result = $supabase->request('POST', 'rpc/admin_sign_in', [
            'p_username' => $username,
            'p_password' => $password,
        ]);
        if (isset($result['error'])) {
            respond(['message' => $result['error']], 401);
        }
        if (empty($result['token'])) {
            throw new RuntimeException('Supabase did not return an administrator session.');
        }
        session_regenerate_id(true);
        $_SESSION['admin_token'] = $result['token'];
        respond(['authenticated' => true, 'expires_at' => $result['expires_at'] ?? null]);
    }

    if ($action === 'logout') {
        $token = $_SESSION['admin_token'] ?? '';
        try {
            if ($token !== '') {
                $supabase->request('POST', 'rpc/admin_sign_out', ['p_admin_token' => $token]);
            }
        } finally {
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                $params = session_get_cookie_params();
                setcookie(session_name(), '', [
                    'expires' => time() - 42000,
                    'path' => $params['path'],
                    'domain' => $params['domain'],
                    'secure' => $params['secure'],
                    'httponly' => $params['httponly'],
                    'samesite' => $params['samesite'] ?? 'Strict',
                ]);
            }
            session_destroy();
        }
        respond(['authenticated' => false]);
    }

    respond(['message' => 'Unknown administrator authentication action.'], 400);
} catch (Throwable $error) {
    respond_error($error);
}
