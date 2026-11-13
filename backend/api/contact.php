<?php
require __DIR__ . '/_bootstrap.php';

request_method('POST');
try {
    $input = json_input();
    respond($supabase->request('POST', 'rpc/create_contact_request', ['p_payload' => $input]), 201);
} catch (Throwable $error) {
    respond_error($error);
}
