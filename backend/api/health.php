<?php
require __DIR__ . '/_bootstrap.php';
try {
    $supabase->request('GET', 'products', null, 'select=id&limit=1');
} catch (Throwable $error) {
    error_log('Elegance Jewellery database connection check failed: ' . $error->getMessage());
    respond(['success' => false, 'message' => 'Could not connect to Supabase. Check the root .env settings and network.'], 503);
}

try {
    $supabase->request('POST', 'rpc/create_contact_request', ['p_payload' => []]);
    respond(['success' => false, 'message' => 'The contact validation unexpectedly accepted an empty request.'], 500);
} catch (SupabaseException $error) {
    if ($error->httpStatus === 404) {
        respond([
            'success' => false,
            'message' => 'Supabase is reachable, but the latest database schema is missing. Run database/supabase_schema.sql in the Supabase SQL Editor.',
        ], 503);
    }
    if ($error->httpStatus !== 400 || !str_contains(strtolower($error->getMessage()), 'check')) {
        error_log('Elegance Jewellery schema check failed: ' . $error->getMessage());
        respond(['success' => false, 'message' => 'The Supabase database schema could not be verified.'], 503);
    }
} catch (Throwable $error) {
    error_log('Elegance Jewellery schema check could not reach Supabase: ' . $error->getMessage());
    respond(['success' => false, 'message' => 'Could not verify the current Supabase schema. Please retry the health check.'], 503);
}

try {
    $adminSessionCheck = $supabase->request('POST', 'rpc/admin_validate_session', ['p_admin_token' => '']);
    if (!array_key_exists('authenticated', $adminSessionCheck)) {
        respond(['success' => false, 'message' => 'The Supabase administrator schema could not be verified.'], 503);
    }
} catch (SupabaseException $error) {
    error_log('Elegance Jewellery administrator schema check failed: ' . $error->getMessage());
    respond([
        'success' => false,
        'message' => 'Supabase is missing administrator-session functions. Run the latest database/supabase_schema.sql in the Supabase SQL Editor.',
    ], 503);
} catch (Throwable $error) {
    error_log('Elegance Jewellery administrator schema check could not reach Supabase: ' . $error->getMessage());
    respond(['success' => false, 'message' => 'Could not verify the administrator schema. Please retry the health check.'], 503);
}

respond(['success' => true, 'message' => 'PHP backend, Supabase connection, and current database schema are working.']);
