<?php
require __DIR__ . '/_bootstrap.php';

request_method('POST');
$input = json_input();
$action = (string)($input['action'] ?? '');
$token = bearer_token();

try {
    switch ($action) {
        case 'signup':
            $identifier = $input['identifier'] ?? [];
            $field = ($identifier['type'] ?? '') === 'phone' ? 'phone' : 'email';
            $value = trim((string)($identifier['value'] ?? ''));
            $password = (string)($input['password'] ?? '');
            $name = trim((string)($input['name'] ?? ''));
            if ($value === '' || strlen($password) < 6 || strlen($name) < 2) {
                respond(['message' => 'Enter valid account details and a password of at least 6 characters.'], 422);
            }
            if ($field === 'email') {
                $settings = $supabase->auth('GET', 'settings');
                if (($settings['mailer_autoconfirm'] ?? false) !== true) {
                    respond([
                        'message' => 'Email confirmation is enabled in this Supabase project. Disable Confirm email under Authentication > Sign In / Providers > Email before creating an account without email verification. No signup email was sent.',
                    ], 409);
                }
            }
            $result = $supabase->auth('POST', 'signup', [
                $field => $value,
                'password' => $password,
                'data' => ['full_name' => $name, 'name' => $name],
            ]);
            break;
        case 'signin':
            $identifier = $input['identifier'] ?? [];
            $field = ($identifier['type'] ?? '') === 'phone' ? 'phone' : 'email';
            $value = trim((string)($identifier['value'] ?? ''));
            $password = (string)($input['password'] ?? '');
            if ($value === '' || $password === '') {
                respond(['message' => 'Enter your email or phone number and password.'], 422);
            }
            $result = $supabase->auth('POST', 'token?grant_type=password', [
                $field => $value,
                'password' => $password,
            ]);
            break;
        case 'verify':
            $identifier = $input['identifier'] ?? [];
            $field = ($identifier['type'] ?? '') === 'phone' ? 'phone' : 'email';
            if ($field !== 'phone') {
                respond(['message' => 'Email verification is disabled for this website.'], 400);
            }
            $result = $supabase->auth('POST', 'verify', [
                'type' => 'signup',
                $field => trim((string)($identifier['value'] ?? '')),
                'token' => trim((string)($input['token'] ?? '')),
            ]);
            break;
        case 'resend':
            $identifier = $input['identifier'] ?? [];
            $field = ($identifier['type'] ?? '') === 'phone' ? 'phone' : 'email';
            if ($field !== 'phone') {
                respond(['message' => 'Email verification is disabled for this website.'], 400);
            }
            $result = $supabase->auth('POST', 'resend', [
                'type' => 'signup',
                $field => trim((string)($identifier['value'] ?? '')),
            ]);
            break;
        case 'refresh':
            $refreshToken = trim((string)($input['refresh_token'] ?? ''));
            if ($refreshToken === '') {
                respond(['message' => 'The refresh token is missing. Please sign in again.'], 401);
            }
            $result = $supabase->auth('POST', 'token?grant_type=refresh_token', ['refresh_token' => $refreshToken]);
            break;
        case 'user':
            if ($token === null) {
                respond(['message' => 'Please sign in to continue.'], 401);
            }
            $result = $supabase->auth('GET', 'user', null, $token);
            break;
        case 'logout':
            if ($token === null) {
                respond(['message' => 'Please sign in to continue.'], 401);
            }
            $result = $supabase->auth('POST', 'logout', [], $token);
            break;
        case 'settings':
            $result = $supabase->auth('GET', 'settings');
            break;
        default:
            respond(['message' => 'Unknown authentication action.'], 400);
    }
    respond($result);
} catch (Throwable $error) {
    respond_error($error);
}
