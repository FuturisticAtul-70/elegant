<?php
require __DIR__ . '/_bootstrap.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'POST') {
        $input = json_input();
        respond($supabase->request('POST', 'rpc/create_custom_design_request', ['p_payload' => $input]), 201);
    }
    if ($method === 'GET') {
        $admin = require_admin($supabase);
        respond($supabase->request('POST', 'rpc/admin_list_custom_design_requests', [
            'p_admin_token' => $admin['token'],
        ]));
    }
    if ($method === 'PATCH') {
        $admin = require_admin($supabase);
        $input = json_input();
        $id = (string)($input['id'] ?? '');
        $status = trim((string)($input['status'] ?? ''));
        if (!preg_match('/^[0-9a-f-]{36}$/i', $id) || !in_array($status, ['New', 'Contacted', 'In Progress', 'Completed', 'Cancelled'], true)) {
            respond(['message' => 'A valid request ID and status are required.'], 422);
        }
        respond($supabase->request('POST', 'rpc/admin_set_custom_design_status', [
            'p_admin_token' => $admin['token'],
            'p_request_id' => $id,
            'p_status' => $status,
        ]));
    }
    request_method('GET', 'POST', 'PATCH');
} catch (Throwable $error) {
    respond_error($error);
}
