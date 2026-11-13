<?php
require __DIR__ . '/_bootstrap.php';

try {
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method === 'GET') {
        $rows = $supabase->request('GET', 'products', null, 'select=id,name,category,material,description,price,image_url,stock,attributes&order=id.asc');
        respond($rows);
    }

    $admin = require_admin($supabase);
    if ($method === 'POST') {
        $input = json_input();
        $id = filter_var($input['id'] ?? null, FILTER_VALIDATE_INT);
        $name = trim((string)($input['name'] ?? ''));
        $price = filter_var($input['price'] ?? null, FILTER_VALIDATE_FLOAT);
        if ($id === false || $id === null || $id < 1 || $name === '' || $price === false || $price < 2000 || $price > 20000) {
            respond(['message' => 'A valid product ID, name, and price between 2,000 and 20,000 are required.'], 422);
        }
        $stock = $input['stock'] ?? null;
        if ($stock !== null && (filter_var($stock, FILTER_VALIDATE_INT) === false || (int)$stock < 0)) {
            respond(['message' => 'Stock must be a non-negative whole number or empty.'], 422);
        }
        $attributes = $input['attributes'] ?? [];
        if (!is_array($attributes)) {
            respond(['message' => 'Product attributes must be a list.'], 422);
        }
        $payload = [
            'id' => $id,
            'name' => $name,
            'category' => trim((string)($input['category'] ?? '')),
            'material' => trim((string)($input['material'] ?? '')),
            'description' => trim((string)($input['description'] ?? '')),
            'price' => $price,
            'image_url' => trim((string)($input['image_url'] ?? '')),
            'stock' => $stock === null ? null : (int)$stock,
            'attributes' => $attributes,
        ];
        $row = $supabase->request('POST', 'rpc/admin_save_product', [
            'p_admin_token' => $admin['token'],
            'p_product' => $payload,
        ]);
        respond($row);
    }

    if ($method === 'DELETE') {
        $id = trim((string)($_GET['id'] ?? ''));
        if (!preg_match('/^[1-9][0-9]*$/', $id)) {
            respond(['message' => 'A valid product ID is required.'], 422);
        }
        $result = $supabase->request('POST', 'rpc/admin_delete_product', [
            'p_admin_token' => $admin['token'],
            'p_product_id' => (int)$id,
        ]);
        respond(['success' => true, 'data' => $result]);
    }

    request_method('GET', 'POST', 'DELETE');
} catch (Throwable $error) {
    respond_error($error);
}
