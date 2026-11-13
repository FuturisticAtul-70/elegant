// All database and authentication requests go through the same-origin PHP API.
window.EJDatabase = (() => {
  const authStorageKey = 'ej_supabase_session';
  const apiBase = new URL('./backend/api/', window.location.href);
  let refreshingSession = null;

  function readAuthSession() {
    try {
      const session = JSON.parse(localStorage.getItem(authStorageKey) || 'null');
      return session && session.access_token && session.refresh_token ? session : null;
    } catch (error) {
      throw new Error('Unable to read the saved sign-in session from this browser.');
    }
  }

  function saveAuthSession(session) {
    if (!session || !session.access_token || !session.refresh_token || !session.user) {
      throw new Error('Supabase did not return a complete sign-in session.');
    }
    const normalized = {
      ...session,
      expires_at: session.expires_at || Math.floor(Date.now() / 1000) + Number(session.expires_in || 3600)
    };
    try {
      localStorage.setItem(authStorageKey, JSON.stringify(normalized));
      localStorage.setItem('ej_session', JSON.stringify({
        id: normalized.user.id,
        name: normalized.user.user_metadata?.full_name || normalized.user.user_metadata?.name || normalized.user.email || normalized.user.phone,
        email: normalized.user.email || '',
        phone: normalized.user.phone || ''
      }));
    } catch (error) {
      throw new Error('Could not securely save your sign-in session in this browser.');
    }
    return normalized;
  }

  async function postAuth(action, body = {}, accessToken = null) {
    const response = await fetch(new URL('auth.php', apiBase), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {})
      },
      body: JSON.stringify({ ...body, action })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data && data.message || `Authentication failed (${response.status}).`);
    }
    return data;
  }

  async function refreshSession(session) {
    if (!refreshingSession) {
      refreshingSession = postAuth('refresh', { refresh_token: session.refresh_token })
        .then(saveAuthSession)
        .finally(() => { refreshingSession = null });
    }
    return refreshingSession;
  }

  async function currentSession() {
    let session = readAuthSession();
    if (session && session.expires_at <= Math.floor(Date.now() / 1000) + 60) {
      session = await refreshSession(session);
    }
    return session;
  }

  async function api(endpoint, options = {}) {
    const session = options.authenticated === false ? null : await currentSession();
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    if (session) headers.Authorization = 'Bearer ' + session.access_token;
    const response = await fetch(new URL(endpoint, apiBase), {
      method: options.method || 'GET',
      headers,
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      throw new Error('The PHP backend returned an invalid response.');
    }
    if (!response.ok) {
      throw new Error(data && data.message || `Backend request failed (${response.status}).`);
    }
    return data;
  }

  async function adminApi(endpoint, options = {}) {
    const response = await fetch(new URL(endpoint, apiBase), {
      method: options.method || 'GET',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) })
    });
    const text = await response.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      throw new Error('The PHP backend returned an invalid response.');
    }
    if (!response.ok) {
      throw new Error(data && data.message || `Administrator request failed (${response.status}).`);
    }
    return data;
  }

  async function adminAuth(action, body = {}) {
    const response = await fetch(new URL('admin-auth.php', apiBase), {
      method: action === 'status' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      ...(action === 'status' ? {} : { body: JSON.stringify({ ...body, action }) })
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(data && data.message || `Administrator authentication failed (${response.status}).`);
    }
    return data;
  }

  async function restoreAuthCallback() {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');
    if (!accessToken || !refreshToken) return null;
    const user = await postAuth('user', {}, accessToken);
    const session = saveAuthSession({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: Number(params.get('expires_in') || 3600),
      expires_at: Number(params.get('expires_at')) || undefined,
      token_type: params.get('token_type') || 'bearer',
      user
    });
    window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
    return session;
  }

  async function ensurePhoneAuthEnabled(identifier) {
    if (identifier.type !== 'phone') return;
    const settings = await postAuth('settings');
    if (settings.external?.phone !== true) {
      throw new Error('Phone sign-in is disabled in this Supabase project. Use email or enable Phone Auth and configure an SMS provider.');
    }
  }

  return {
    loadProducts() {
      return api('products.php', { authenticated: false });
    },
    saveProduct(product) {
      return adminApi('products.php', { method: 'POST', body: product });
    },
    deleteProduct(id) {
      return adminApi('products.php?id=' + encodeURIComponent(id), { method: 'DELETE' });
    },
    createOrder(payload) {
      return api('orders.php', { method: 'POST', body: payload });
    },
    createCustomDesignRequest(payload) {
      return api('custom-design.php', { method: 'POST', body: payload, authenticated: false });
    },
    createContactRequest(payload) {
      return api('contact.php', { method: 'POST', body: payload, authenticated: false });
    },
    async signUp(identifier, password, name) {
      await ensurePhoneAuthEnabled(identifier);
      const data = await postAuth('signup', { identifier, password, name });
      if (data.access_token && data.refresh_token) {
        return { session: saveAuthSession(data), needsConfirmation: false };
      }
      const user = data.user || data;
      if (identifier.type === 'email' && Array.isArray(user.identities) && user.identities.length === 0) {
        throw new Error('An account with this email already exists. Try logging in instead.');
      }
      if (!user.id) {
        throw new Error('Supabase did not create an account. Please check your details and try again.');
      }
      if (identifier.type === 'email') {
        throw new Error('Email confirmation is still enabled in Supabase. Disable Confirm email under Authentication > Sign In / Providers > Email to allow signup without email verification.');
      }
      return { user, needsConfirmation: true };
    },
    async signIn(identifier, password) {
      await ensurePhoneAuthEnabled(identifier);
      return saveAuthSession(await postAuth('signin', { identifier, password }));
    },
    async isAdmin() {
      const profile = await api('admin.php?resource=profile');
      return profile.is_admin === true;
    },
    adminSignIn(username, password) {
      return adminAuth('login', { username, password });
    },
    adminSignOut() {
      return adminAuth('logout');
    },
    validateAdminSession() {
      return adminAuth('status');
    },
    async verifySignUp(identifier, token) {
      await ensurePhoneAuthEnabled(identifier);
      return saveAuthSession(await postAuth('verify', { identifier, token }));
    },
    async resendSignUp(identifier) {
      await ensurePhoneAuthEnabled(identifier);
      return postAuth('resend', { identifier });
    },
    async restoreSession() {
      const callbackSession = await restoreAuthCallback();
      if (callbackSession) return callbackSession;
      const session = await currentSession();
      if (!session) return null;
      const user = await postAuth('user', {}, session.access_token);
      return saveAuthSession({ ...session, user });
    },
    async signOut() {
      const session = readAuthSession();
      try {
        if (session) await postAuth('logout', {}, session.access_token);
      } finally {
        localStorage.removeItem(authStorageKey);
        localStorage.removeItem('ej_session');
      }
    },
    clearAuthSession() {
      localStorage.removeItem(authStorageKey);
      localStorage.removeItem('ej_session');
    },
    loadMyOrders() {
      return api('orders.php');
    },
    cancelOrder(orderId) {
      return api('orders.php', { method: 'PATCH', body: { action: 'cancel', order_id: orderId } });
    },
    loadAdminOrders() {
      return adminApi('orders.php?scope=admin');
    },
    setAdminOrderStatus(orderId, status) {
      return adminApi('orders.php', { method: 'PATCH', body: { action: 'status', order_id: orderId, status } });
    },
    setAdminOrderDetails(orderId, details) {
      return adminApi('orders.php', {
        method: 'PATCH',
        body: { action: 'details', order_id: orderId, ...details }
      });
    },
    setAdminOrdersStatus(orderIds, status) {
      return adminApi('orders.php', { method: 'PATCH', body: { action: 'bulk-status', order_ids: orderIds, status } });
    },
    loadAdminCustomers() {
      return adminApi('admin.php?resource=customers');
    },
    loadAdminCustomRequests() {
      return adminApi('custom-design.php');
    },
    setAdminCustomRequestStatus(id, status) {
      return adminApi('custom-design.php', { method: 'PATCH', body: { id, status } });
    }
  };
})();
