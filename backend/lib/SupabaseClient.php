<?php
declare(strict_types=1);

final class SupabaseException extends RuntimeException {
    public function __construct(string $message, public readonly int $httpStatus) {
        parent::__construct($message);
    }
}

final class SupabaseUnavailableException extends RuntimeException {}

final class SupabaseClient {
    private string $url;
    private string $publishableKey;

    public function __construct(array $config) {
        $this->url = rtrim($config['supabase_url'] ?? '', '/');
        $this->publishableKey = $config['supabase_publishable_key'] ?? '';
        if ($this->url === '' || $this->publishableKey === '') {
            throw new RuntimeException('Supabase configuration is missing. Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in the root .env file.');
        }
    }

    public function request(
        string $method,
        string $resource,
        ?array $data = null,
        string $query = '',
        ?string $accessToken = null,
        string $prefer = 'return=representation'
    ): array {
        $path = str_starts_with($resource, '/') ? $resource : '/rest/v1/' . $resource;
        $url = $this->url . $path . ($query === '' ? '' : (str_contains($path, '?') ? '&' : '?') . $query);
        $headers = [
            'apikey: ' . $this->publishableKey,
            'Accept: application/json',
            'Content-Type: application/json',
            'Prefer: ' . $prefer,
        ];
        if ($accessToken !== null && $accessToken !== '') {
            $headers[] = 'Authorization: Bearer ' . $accessToken;
        }
        return $this->send($url, $method, $headers, $data);
    }

    public function auth(
        string $method,
        string $path,
        ?array $data = null,
        ?string $accessToken = null
    ): array {
        $headers = [
            'apikey: ' . $this->publishableKey,
            'Accept: application/json',
            'Content-Type: application/json',
        ];
        if ($accessToken !== null && $accessToken !== '') {
            $headers[] = 'Authorization: Bearer ' . $accessToken;
        }
        return $this->send($this->url . '/auth/v1/' . ltrim($path, '/'), $method, $headers, $data);
    }

    private function send(string $url, string $method, array $headers, ?array $data): array {
        $handle = curl_init($url);
        if ($handle === false) {
            throw new RuntimeException('Could not initialize the Supabase request.');
        }

        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => strtoupper($method),
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 20,
            CURLOPT_CONNECTTIMEOUT => 8,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ];
        if ($data !== null) {
            $json = json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
            if ($json === false) {
                curl_close($handle);
                throw new RuntimeException('Could not encode the Supabase request.');
            }
            $options[CURLOPT_POSTFIELDS] = $json;
        }
        curl_setopt_array($handle, $options);
        $body = curl_exec($handle);
        $status = (int)curl_getinfo($handle, CURLINFO_HTTP_CODE);
        $error = curl_error($handle);
        curl_close($handle);

        if ($body === false) {
            throw new SupabaseUnavailableException('Supabase request failed: ' . ($error ?: 'network error'));
        }
        if ($body === '') {
            $decoded = null;
        } else {
            $decoded = json_decode($body, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new RuntimeException('Supabase returned an invalid response.');
            }
        }
        if ($status < 200 || $status >= 300) {
            $message = is_array($decoded)
                ? ($decoded['msg'] ?? $decoded['message'] ?? $decoded['error_description'] ?? $decoded['error'] ?? null)
                : null;
            throw new SupabaseException(is_string($message) ? $message : 'Supabase returned HTTP ' . $status . '.', $status);
        }
        return is_array($decoded) ? $decoded : [];
    }
}
