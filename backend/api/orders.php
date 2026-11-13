<?php
require __DIR__ . '/_bootstrap.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        $adminMode = ($_GET['scope'] ?? '') === 'admin';
        $auth = $adminMode ? require_admin($supabase) : require_user($supabase);
        if ($adminMode) {
            respond($supabase->request('POST', 'rpc/admin_list_orders', [
                'p_admin_token' => $auth['token'],
            ]));
        }
        $query = 'select=id,auth_user_id,order_no,customer_name,phone,address,city,pincode,payment_method,payment_reference,total,status,payment_status,tracking_number,carrier,created_at,order_items(product_name,material,unit_price,quantity,products(category,image_url))&order=created_at.desc';
        respond($supabase->request('GET', 'orders', null, $query, $auth['token']));
    }

    if ($method === 'POST') {
        $auth = require_user($supabase);
        $input = json_input();
        $payload = [
            'customer_name' => trim((string)($input['customer_name'] ?? '')),
            'phone' => trim((string)($input['phone'] ?? '')),
            'address' => trim((string)($input['address'] ?? '')),
            'city' => trim((string)($input['city'] ?? '')),
            'pincode' => trim((string)($input['pincode'] ?? '')),
            'payment_method' => trim((string)($input['payment_method'] ?? '')),
            'payment_reference' => trim((string)($input['payment_reference'] ?? '')),
            'items' => $input['items'] ?? null,
        ];
        respond($supabase->request('POST', 'rpc/create_order', ['p_payload' => $payload], '', $auth['token']), 201);
    }

    if ($method !== 'PATCH') {
        request_method('GET', 'POST', 'PATCH');
    }

    $input = json_input();
    $action = (string)($input['action'] ?? '');
    if ($action === 'cancel') {
        $auth = require_user($supabase);
        $orderId = (string)($input['order_id'] ?? '');
        if (!preg_match('/^[0-9a-f-]{36}$/i', $orderId)) {
            respond(['message' => 'A valid order ID is required.'], 422);
        }
        respond($supabase->request('POST', 'rpc/cancel_my_order', ['p_order_id' => $orderId], '', $auth['token']));
    }

    $admin = require_admin($supabase);
    if ($action === 'status') {
        respond($supabase->request('POST', 'rpc/admin_set_order_status', [
            'p_admin_token' => $admin['token'],
            'p_order_id' => (string)($input['order_id'] ?? ''),
            'p_status' => trim((string)($input['status'] ?? '')),
        ]));
    }
    if ($action === 'details') {
        respond($supabase->request('POST', 'rpc/admin_set_order_details', [
            'p_admin_token' => $admin['token'],
            'p_order_id' => (string)($input['order_id'] ?? ''),
            'p_status' => trim((string)($input['status'] ?? '')),
            'p_payment_status' => trim((string)($input['payment_status'] ?? '')),
            'p_tracking_number' => trim((string)($input['tracking_number'] ?? '')),
            'p_carrier' => trim((string)($input['carrier'] ?? '')),
        ]));
    }
    if ($action === 'bulk-status') {
        $ids = $input['order_ids'] ?? [];
        if (!is_array($ids) || count($ids) > 500) {
            respond(['message' => 'Provide a valid list of up to 500 order IDs.'], 422);
        }
        respond($supabase->request('POST', 'rpc/admin_set_orders_status', [
            'p_admin_token' => $admin['token'],
            'p_order_ids' => array_values($ids),
            'p_status' => trim((string)($input['status'] ?? '')),
        ]));
    }
    respond(['message' => 'Unknown order action.'], 400);
} catch (Throwable $error) {
    respond_error($error);
}
