<?php
$requestPath = rawurldecode(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/');
if (preg_match('~(?:^|/)\.[^/]*~', $requestPath) || str_contains($requestPath, "\0")) {
    http_response_code(404);
    exit;
}

$documentRoot = realpath(dirname(__DIR__));
$requestPath = $requestPath === '/' ? '/index.html' : $requestPath;
$requestedFile = realpath($documentRoot . DIRECTORY_SEPARATOR . ltrim($requestPath, '/'));
if ($requestedFile !== false && str_starts_with($requestedFile, $documentRoot . DIRECTORY_SEPARATOR) && is_file($requestedFile)) {
    return false;
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo 'Not Found';
