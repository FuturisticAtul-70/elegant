<?php
declare(strict_types=1);

function load_project_env(): void {
    $envFile = dirname(__DIR__, 2) . '/.env';
    if (!is_file($envFile) || !is_readable($envFile)) {
        return;
    }

    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#') || !str_contains($line, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);
        if ($key === '' || getenv($key) !== false) {
            continue;
        }
        if (strlen($value) >= 2 && (($value[0] === '"' && $value[-1] === '"') || ($value[0] === "'" && $value[-1] === "'"))) {
            $value = substr($value, 1, -1);
        }
        putenv($key . '=' . $value);
    }
}

load_project_env();

function env_value(string $key, string $default = ''): string {
    $value = getenv($key);
    return $value === false || $value === '' ? $default : $value;
}

return [
    'supabase_url' => rtrim(env_value('SUPABASE_URL'), '/'),
    'supabase_publishable_key' => env_value('SUPABASE_PUBLISHABLE_KEY'),
    'app_origin' => rtrim(env_value('APP_ORIGIN'), '/'),
];
