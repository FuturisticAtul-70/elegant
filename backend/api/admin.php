<?php
require __DIR__ . '/_bootstrap.php';

try {
    request_method('GET');
    $resource = (string)($_GET['resource'] ?? '');
    if ($resource === 'profile') {
        $admin = require_user($supabase);
        $rows = $supabase->request(
            'GET',
            'profiles',
            null,
            'select=id,name,email,phone,is_admin&id=eq.' . rawurlencode((string)$admin['id']) . '&limit=1',
            $admin['token']
        );
        respond($rows[0] ?? []);
    }
    $admin = require_admin($supabase);
    if ($resource === 'customers') {
        respond($supabase->request('POST', 'rpc/admin_list_customers', [
            'p_admin_token' => $admin['token'],
        ]));
    }
    if ($resource === 'contact-requests') {
        respond($supabase->request('POST', 'rpc/admin_list_contact_requests', [
            'p_admin_token' => $admin['token'],
        ]));
    }
    respond(['message' => 'Unknown admin resource.'], 400);
} catch (Throwable $error) {
    respond_error($error);
}
