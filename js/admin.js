// Admin login and dashboard logic.
// ===== Professional Admin Dashboard =====
(function () {
  const adminOv = $('adminOv');

  let adminEditId = null,
      adminImageData = '',
      adminImageCleared = false,
      adminProductSearch = '',
      adminProductCategory = 'All',
      adminOrderTab = 'All',
      adminOrderSearch = '',
      adminOrderFilter = 'All',
      adminInvSearch = '',
      adminInvFilter = 'All',
      adminCustomerSearch = '',
      adminCustomers = [];
  let orderRefreshTimer = null,
      orderRefreshInProgress = false;
  const selectedOrders = new Set();
  function adminProducts() {
    return store.get('ej_admin_products') || [];
  }
  function saveAdminProducts(a) {
    try {
      localStorage.setItem('ej_admin_products', JSON.stringify(a));
      return true;
    } catch (e) {
      say('Storage is full. Use a smaller product photo or remove an old product photo.');
      return false;
    }
  }
  function productPayload(product) {
    return {
      id: Number(product.id),
      name: product.name,
      category: product.cat,
      material: product.mat,
      description: product.desc || '',
      price: Number(product.price),
      image_url: product.img || '',
      stock: product.stock === undefined || product.stock === '' ? null : Number(product.stock),
      attributes: [
        ...(product.attrs || []).filter(attribute => !Array.isArray(attribute) || attribute[0] !== 'Image fit'),
        ...(product.fit === 'contain' ? [['Image fit', 'contain']] : [])
      ]
    };
  }
  function placeholder(name) {
    return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="700" height="700"><rect width="100%" height="100%" fill="#f5efe6"/><text x="50%" y="48%" dominant-baseline="middle" text-anchor="middle" font-family="Georgia" font-size="32" fill="#8b6a45">' + name.replace(/[<>&]/g, '') + '</text><text x="50%" y="55%" dominant-baseline="middle" text-anchor="middle" font-family="Arial" font-size="16" fill="#9b8a78">Elegance Jewellery</text></svg>');
  }
  function esc(s) {
    return String(s ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
  }

  function statusClass(s) {
    return 'status-' + String(s || 'pending').toLowerCase().replace(/\s+/g, '-');
  }

  function orderStatus(o) {
    return o.status || 'Pending';
  }

  function paymentLabel(o) {
    return o.paymentStatus || ((o.pay === 'UPI') ? 'Paid' : 'Waiting payment');
  }

  function money2(n) {
    return money(+n || 0);
  }

  function csvEscape(v) {
    return '"' + String(v ?? '').replace(/"/g, '""') + '"';
  }

  function downloadCsv(name, rows) {
    const csv = rows.map(r => r.map(csvEscape).join(',')).join('\n'),
          a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = name;
    a.click();
  }

  function syncProducts() {
    const saved = adminProducts();
    saved.forEach(sp => {
      const i = PRODUCTS.findIndex(p => String(p.id) === String(sp.id));
      if (i < 0) PRODUCTS.push(sp);
      else PRODUCTS[i] = Object.assign({}, PRODUCTS[i], sp);
    });
    PRODUCTS.forEach(product => {
      product.price = cataloguePrice(product.price, product.id);
    });
    const prices = PRODUCTS.map(p => +p.price || 0).filter(Boolean);
    MAXP = Math.min(MAX_PRODUCT_PRICE, Math.max(500, Math.ceil(Math.max.apply(null, prices) / 500) * 500));
    if (typeof sMax !== 'undefined' && sMax > MAXP) sMax = MAXP;
    if (typeof renderStore === 'function') renderStore();
  }
  function openAdminLogin() {
    $('lgOv').classList.remove('open');
    $('lgErr').textContent = '';
    $('adminErr').textContent = '';
    $('adminUser').value = '';
    $('adminPass').value = '';
    $('adminLoginOv').classList.add('open');
    setTimeout(() => $('adminUser').focus(), 150);
  }

  function backCustomer() {
    $('adminLoginOv').classList.remove('open');
    openLg();
  }

  function adminIsIn() {
    return localStorage.getItem('ej_admin_session') === '1';
  }

  function openDashboard() {
    if (!adminIsIn()) return;
    closeLg();
    adminOv.classList.add('open');
    showAdminPage('dashboard');
    renderAdmin();
    refreshAdminOrders().catch(error => {
      console.error('Unable to load Supabase orders in the admin dashboard.', error);
      say('Admin orders could not be loaded. Check your admin account and database setup.');
    });
    refreshAdminData().catch(error => {
      console.error('Unable to load Supabase admin data.', error);
      say(error.message || 'Admin customer and custom request data could not be loaded.');
    });
    if (!orderRefreshTimer) {
      orderRefreshTimer = setInterval(() => {
        if (!adminIsIn() || orderRefreshInProgress) return;
        refreshAdminOrders().catch(error => {
          console.error('Unable to refresh Supabase orders in the admin dashboard.', error);
        });
        refreshAdminData().catch(error => {
          console.error('Unable to refresh Supabase customer and custom request data.', error);
        });
      }, 10000);
    }
  }

  async function adminLogout() {
    try {
      await EJDatabase.adminSignOut();
    } catch (error) {
      console.error('Unable to end the administrator session.', error);
    }
    localStorage.removeItem('ej_admin_session');
    if (orderRefreshTimer) {
      clearInterval(orderRefreshTimer);
      orderRefreshTimer = null;
    }
    adminOv.classList.remove('open');
    resetProductForm();
    say('Admin logged out');
  }
  function imageFileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
      if (file.size > 12 * 1024 * 1024) return reject(new Error('Photo is too large. Choose an image under 12 MB.'));
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const max = 1100,
                scale = Math.min(1, max / Math.max(img.width, img.height)),
                w = Math.max(1, Math.round(img.width * scale)),
                h = Math.max(1, Math.round(img.height * scale)),
                c = document.createElement('canvas');
          c.width = w;
          c.height = h;
          const ctx = c.getContext('2d');
          ctx.fillStyle = '#fff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          let q = .82,
              data = c.toDataURL('image/jpeg', q);
          while (data.length > 900000 && q > .5) {
            q -= .06;
            data = c.toDataURL('image/jpeg', q);
          }
          if (data.length > 950000) return reject(new Error('Photo is still too large after optimization. Please choose a smaller image.'));
          resolve(data);
        };
        img.onerror = () => reject(new Error('This image format could not be processed.'));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function setAdminImage(src, meta) {
    adminImageData = src || '';
    adminImageCleared = !src;
    if (src) {
      $('adImgPreview').src = src;
      $('adImgPreview').style.display = 'block';
      $('adImgEmpty').style.display = 'none';
      $('adImgFile').closest('.admin-upload-box').classList.add('has-image');
      $('adImgMeta').textContent = meta || 'Photo selected';
    } else {
      $('adImgPreview').removeAttribute('src');
      $('adImgPreview').style.display = 'none';
      $('adImgEmpty').style.display = 'flex';
      $('adImgFile').closest('.admin-upload-box').classList.remove('has-image');
      $('adImgMeta').textContent = meta || 'No product photo';
    }
  }

  async function refreshAdminData() {
    const [customers, requests] = await Promise.all([
      EJDatabase.loadAdminCustomers(),
      EJDatabase.loadAdminCustomRequests()
    ]);
    adminCustomers = customers.map(customer => ({
      id: customer.id,
      name: customer.name || customer.email || customer.phone || 'Customer',
      email: customer.email || '',
      phone: customer.phone || '',
      createdAt: customer.created_at ? new Date(customer.created_at).getTime() : 0
    }));
    store.set('ej_custom_requests', requests.map(request => ({
      id: request.id,
      ts: request.created_at ? new Date(request.created_at).getTime() : 0,
      name: request.name,
      phone: request.phone,
      type: request.jewellery_type,
      material: request.material,
      occasion: request.occasion,
      style: request.preferred_style,
      budget: request.budget || '',
      date: request.needed_by || '',
      referenceUrl: request.reference_url || '',
      message: request.message,
      status: request.status
    })));
    if (adminIsIn() && adminOv.classList.contains('open')) renderAdmin();
  }

  function clearAdminImage(mark = true) {
    adminImageData = '';
    adminImageCleared = mark;
    $('adImgFile').value = '';
    setAdminImage('', mark ? 'Photo will be removed' : 'No new photo selected');
  }

  // --- upload handlers (file picker, remove button, drag & drop) ---
  $('adImgFile').addEventListener('change', async e => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    try {
      const data = await imageFileToDataUrl(f);
      setAdminImage(data, f.name + ' · optimized');
    } catch (err) {
      clearAdminImage(false);
      $('adImgMeta').textContent = err.message;
      say(err.message);
    }
  });

  $('adImgRemove').onclick = () => clearAdminImage(true);

  const uploadBox = $('adImgFile').closest('.admin-upload-box');
  ['dragenter', 'dragover'].forEach(ev => uploadBox.addEventListener(ev, e => {
    e.preventDefault();
    uploadBox.style.borderColor = '#7182f8';
  }));
  ['dragleave', 'drop'].forEach(ev => uploadBox.addEventListener(ev, e => {
    e.preventDefault();
    uploadBox.style.borderColor = '';
  }));
  uploadBox.addEventListener('drop', async e => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!f) return;
    try {
      const data = await imageFileToDataUrl(f);
      setAdminImage(data, f.name + ' · optimized');
    } catch (err) {
      $('adImgMeta').textContent = err.message;
      say(err.message);
    }
  });

  function renderAdminProducts() {
    const rows = $('adProductRows'),
          q = adminProductSearch.toLowerCase().trim();
    rows.innerHTML = '';
    const list = PRODUCTS.filter(p => {
      const cat = adminProductCategory === 'All' || p.cat === adminProductCategory,
            text = (p.name + ' ' + p.cat + ' ' + p.mat + ' ' + (p.desc || '')).toLowerCase();
      return cat && (!q || text.includes(q));
    });
    $('adProductCount').textContent = list.length + ' product' + (list.length === 1 ? '' : 's');
    if (!list.length) {
      rows.innerHTML = '<tr><td colspan="7" class="admin-empty">No jewellery matches your search or category filter.</td></tr>';
      return;
    }
    list.forEach(p => {
      const stock = (p.stock === undefined || p.stock === null || p.stock === '') ? '—' : String(p.stock),
            stockClass = stock === '—' ? '' : (+stock <= 0 ? 'out' : (+stock <= 5 ? 'low' : 'ok')),
            tr = document.createElement('tr');
      tr.innerHTML = '<td><img class="admin-thumb" src="' + esc(p.img || placeholder(p.name)) + '" alt=""></td>'
        + '<td><span class="admin-name">' + esc(p.name) + '</span><br><small>' + esc(p.desc || '') + '</small></td>'
        + '<td>' + esc(p.cat) + '</td>'
        + '<td>' + esc(p.mat) + '</td>'
        + '<td>' + money2(p.price) + '</td>'
        + '<td><span class="admin-stock ' + stockClass + '">' + stock + '</span></td>'
        + '<td><div class="admin-actions"><button type="button" data-edit="' + p.id + '">Edit</button><button type="button" data-stock="' + p.id + '">Stock</button><button type="button" class="danger" data-del="' + p.id + '">Delete</button></div></td>';
      tr.querySelector('[data-edit]').onclick = () => editProduct(p.id);
      tr.querySelector('[data-stock]').onclick = () => {
        showAdminPage('inventory');
        setTimeout(() => {
          const el = document.querySelector('[data-inv-id="' + p.id + '"]');
          if (el) {
            el.focus();
            el.select();
          }
        }, 80);
      };
      tr.querySelector('[data-del]').onclick = () => deleteProduct(p.id).catch(error => {
        console.error('Unable to delete product from Supabase.', error);
        say(error.message || 'Unable to delete this product.');
      });
      rows.appendChild(tr);
    });
  }

  function resetProductForm() {
    adminEditId = null;
    clearAdminImage(false);
    $('adProductId').value = '';
    $('adProductForm').reset();
    $('adSaveProduct').textContent = 'Add Jewellery';
    $('adCancelEdit').style.display = 'none';
    $('adFit').value = 'cover';
    $('adCat').value = 'Rings';
    $('adMat').value = 'Gold';
  }

  function editProduct(id) {
    const p = PRODUCTS.find(x => String(x.id) === String(id));
    if (!p) return;
    showAdminPage('jewellery');
    adminEditId = p.id;
    $('adProductId').value = p.id;
    $('adName').value = p.name || '';
    $('adCat').value = p.cat || 'Rings';
    $('adMat').value = p.mat || 'Gold';
    $('adPrice').value = p.price || '';
    $('adStock').value = p.stock === undefined ? '' : p.stock;
    $('adFit').value = p.fit === 'contain' ? 'contain' : 'cover';
    $('adDesc').value = p.desc || '';
    const a = p.attrs || [],
          val = k => {
            const x = a.find(v => v[0] === k);
            return x ? x[1] : '';
          };
    $('adFinish').value = val('Finish');
    $('adStone').value = val('Stone');
    $('adDesign').value = val('Design');
    $('adOccasion').value = val('Occasion');
    $('adCare').value = val('Care');
    setAdminImage(p.img || '', p.img ? 'Current product photo' : 'No product photo');
    $('adSaveProduct').textContent = 'Save Changes';
    $('adCancelEdit').style.display = 'block';
    document.getElementById('adPageJewellery').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function deleteProduct(id) {
    const p = PRODUCTS.find(x => String(x.id) === String(id));
    if (!p) return;
    if (!confirm('Delete "' + p.name + '"? This will remove it from the jewellery catalogue.')) return;
    await EJDatabase.deleteProduct(id);
    const i = PRODUCTS.findIndex(x => String(x.id) === String(id));
    if (i >= 0) PRODUCTS.splice(i, 1);
    saveAdminProducts(adminProducts().filter(x => String(x.id) !== String(id)));
    cart = cart.filter(c => String(c.id) !== String(id));
    saveCart();
    updateCartUI();
    resetProductForm();
    renderAdmin();
    renderStore();
    say('Jewellery deleted');
  }

  $('adProductSearch').addEventListener('input', e => {
    adminProductSearch = e.target.value;
    renderAdminProducts();
  });
  $('adProductFilter').addEventListener('change', e => {
    adminProductCategory = e.target.value;
    renderAdminProducts();
  });

  $('adProductForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = $('adName').value.trim(),
          cat = $('adCat').value,
          mat = $('adMat').value,
          price = Number($('adPrice').value),
          stockRaw = $('adStock').value.trim(),
          stock = stockRaw === '' ? undefined : Math.max(0, Number(stockRaw)),
          fit = $('adFit').value,
          desc = $('adDesc').value.trim();
    if (!name || !price || price < MIN_PRODUCT_PRICE || price > MAX_PRODUCT_PRICE) {
      say('Enter a valid product name and a price between ₹2,000 and ₹20,000.');
      return;
    }
    const attrs = [
      ['Finish', $('adFinish').value.trim()],
      ['Stone', $('adStone').value.trim()],
      ['Design', $('adDesign').value.trim()],
      ['Occasion', $('adOccasion').value.trim()],
      ['Care', $('adCare').value.trim()]
    ].filter(x => x[1]);

    const saveButton = $('adSaveProduct');
    saveButton.disabled = true;
    try {
    if (adminEditId !== null) {
      // --- update existing product ---
      const p = PRODUCTS.find(x => String(x.id) === String(adminEditId));
      if (!p) return;
      const updated = {
        ...p,
        name,
        cat,
        mat,
        price,
        fit,
        desc: desc || p.desc || '',
        attrs: attrs.length ? attrs : (p.attrs || [['Material', mat], ['Category', cat], ['Care', 'Store safely and avoid perfume & water']])
      };
      if (stockRaw === '') delete updated.stock;
      else updated.stock = stock;
      if (adminImageData) updated.img = adminImageData;
      else if (adminImageCleared) updated.img = placeholder(name);
      await EJDatabase.saveProduct(productPayload(updated));
      Object.assign(p, updated);
      const a = adminProducts(),
            i = a.findIndex(x => String(x.id) === String(p.id));
      if (i >= 0) a[i] = p;
      else a.push(p);
      saveAdminProducts(a);
      say('Jewellery updated');
    } else {
      // --- add new product ---
      const p = {
        id: Date.now(),
        name, cat, mat, price, fit,
        desc: desc || 'Beautifully crafted jewellery from Elegance Jewellery.',
        attrs: attrs.length ? attrs : [['Material', mat], ['Category', cat], ['Care', 'Store safely and avoid perfume & water']],
        img: adminImageData || placeholder(name)
      };
      if (stockRaw !== '') p.stock = stock;
      await EJDatabase.saveProduct(productPayload(p));
      PRODUCTS.push(p);
      const a = adminProducts();
      a.push(p);
      saveAdminProducts(a);
      say('Jewellery added');
    }
    resetProductForm();
    syncProducts();
    renderAdmin();
    showAdminPage('jewellery');
    } catch (error) {
      console.error('Unable to save product to Supabase.', error);
      say(error.message || 'Unable to save this product.');
    } finally {
      saveButton.disabled = false;
    }
  });

  $('adCancelEdit').onclick = resetProductForm;
  function getOrders() {
    return (store.get('ej_orders') || []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
  }

  async function refreshAdminOrders() {
    if (orderRefreshInProgress) return;
    orderRefreshInProgress = true;
    try {
      const rows = await EJDatabase.loadAdminOrders(),
            saved = store.get('ej_orders') || [],
            remote = rows.map(order => {
              const previous = saved.find(item => item.id === order.id || item.no === order.order_no) || {};
              return {
                ...previous,
                id: order.id,
                uid: order.auth_user_id || previous.uid,
                no: order.order_no,
                ts: new Date(order.created_at).getTime(),
                name: order.customer_name,
                ph: order.phone,
                addr: order.address,
                city: order.city,
                pin: order.pincode,
                pay: order.payment_method,
                utr: order.payment_reference || '',
                total: Number(order.total),
                status: order.status,
                paymentStatus: order.payment_status || 'Waiting payment',
                tracking: order.tracking_number || '',
                carrier: order.carrier || '',
                items: (order.order_items || []).map(item => ({
                  name: item.product_name,
                  cat: item.products?.category || '',
                  mat: item.material || '',
                  price: Number(item.unit_price),
                  qty: Number(item.quantity)
                }))
              };
            }),
            remoteNumbers = new Set(remote.map(order => order.no)),
            localOnly = saved.filter(order => !order.id && !remoteNumbers.has(order.no));
      store.set('ej_orders', [...remote, ...localOnly]);
      if (adminIsIn() && adminOv.classList.contains('open')) renderAdmin();
    } finally {
      orderRefreshInProgress = false;
    }
  }

  function orderMatchesTab(o) {
    const st = orderStatus(o);
    if (adminOrderTab === 'All') return true;
    if (adminOrderTab === 'New') return !o.status || ['Placed', 'Pending'].includes(st);
    return st === adminOrderTab;
  }

  function renderOrderTabs(orders) {
    $('adTabAll').textContent = orders.length;
    $('adTabNew').textContent = orders.filter(o => !o.status || ['Placed', 'Pending'].includes(o.status)).length;
    $('adTabPending').textContent = orders.filter(o => o.status === 'Pending').length;
    $('adTabDelivered').textContent = orders.filter(o => o.status === 'Delivered').length;
    document.querySelectorAll('.admin-order-tab').forEach(b => b.classList.toggle('active', b.dataset.orderTab === adminOrderTab));
  }

  function renderAdminOrders() {
    const box = $('adOrderCards'),
          orders = getOrders();
    renderOrderTabs(orders);
    const q = adminOrderSearch.toLowerCase().trim();
    const filtered = orders.filter(o => {
      const items = (o.items || []).map(i => i.name).join(' '),
            text = ((o.no || '') + ' ' + (o.name || '') + ' ' + (o.ph || '') + ' ' + items).toLowerCase();
      return orderMatchesTab(o) && (!q || text.includes(q)) && (adminOrderFilter === 'All' || orderStatus(o) === adminOrderFilter);
    });
    box.innerHTML = '';
    if (!filtered.length) {
      box.innerHTML = '<div class="admin-empty" style="padding:45px">No booked orders match the selected filter.</div>';
      return;
    }
    filtered.forEach(o => {
      const st = orderStatus(o),
            pay = paymentLabel(o),
            items = o.items || [],
            first = items[0],
            truncated = items.length > 1 ? '<div class="admin-order-more">More ' + (items.length - 1) + ' item' + (items.length - 1 === 1 ? '' : 's') + '</div>' : '';
      const checked = selectedOrders.has(o.no) ? 'checked' : '';
      const card = document.createElement('article');
      card.className = 'admin-order-card';
      card.innerHTML = '<div class="admin-order-main">'
        + '<div class="admin-order-top">'
        +   '<div class="admin-order-left">'
        +     '<input class="admin-check ad-order-check" type="checkbox" ' + checked + ' data-no="' + esc(o.no || '') + '">'
        +     '<div>'
        +       '<div class="admin-order-number">Order ' + esc(o.no || '—') + ' <span class="admin-status ' + (pay === 'Paid' ? 'status-paid' : 'status-wait') + '">' + esc(pay) + '</span></div>'
        +       '<div class="admin-order-date">▣ ' + (o.ts ? new Date(o.ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' at ' + new Date(o.ts).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : 'Date not available') + ' &nbsp; | &nbsp; ' + esc(o.name || 'Customer') + '</div>'
        +     '</div>'
        +   '</div>'
        +   '<div class="admin-order-total">' + money2(o.total) + '</div>'
        + '</div>'
        + '<div class="admin-order-meta"><span>● ' + esc(o.ph || 'No phone') + '</span><span>Shipping: ' + esc(o.tracking || 'Not assigned') + '</span><span class="admin-status ' + statusClass(st) + '">' + esc(st) + '</span></div>'
        + (first ? '<div class="admin-order-product"><img src="' + esc(PRODUCTS.find(p => p.name === first.name)?.img || placeholder(first.name)) + '" alt=""><div><b>' + esc(first.name) + '</b><small>SKU: ' + esc(first.sku || first.id || '—') + ' &nbsp; · &nbsp; Quantity: ' + esc(first.qty || 1) + '</small></div></div>' : '')
        + truncated
        + '</div>'
        + '<div class="admin-order-footer">'
        +   '<button class="admin-order-action" data-more="' + esc(o.no || '') + '">⋮</button>'
        +   '<button class="admin-order-action" data-print="' + esc(o.no || '') + '">▣ Print</button>'
        +   '<select class="admin-select ad-order-status" data-status="' + esc(o.no || '') + '">' + ['Placed', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(x => '<option ' + (x === st ? 'selected' : '') + '>' + x + '</option>').join('') + '</select>'
        +   '<button class="admin-order-action primary" data-view="' + esc(o.no || '') + '">View Details</button>'
        + '</div>';
      card.querySelector('.ad-order-check').onchange = e => {
        if (e.target.checked) selectedOrders.add(o.no);
        else selectedOrders.delete(o.no);
      };
      card.querySelector('[data-status]').onchange = e => updateOrderStatus(o.no, e.target.value);
      card.querySelector('[data-view]').onclick = () => openOrderDetails(o.no);
      card.querySelector('[data-more]').onclick = () => openOrderDetails(o.no);
      card.querySelector('[data-print]').onclick = () => printAdminOrder(o.no);
      box.appendChild(card);
    });
  }

  async function updateOrderStatus(no, status) {
    const all = store.get('ej_orders') || [],
          o = all.find(x => x.no === no);
    if (!o) return;
    try {
      if (!o.id) throw new Error('This order is not stored in Supabase and cannot be updated here.');
      await EJDatabase.setAdminOrderStatus(o.id, status);
      o.status = status;
      store.set('ej_orders', all);
      say('Order ' + no + ' updated to ' + status);
      renderAdmin();
    } catch (error) {
      console.error('Unable to update Supabase order status.', error);
      say(error.message || 'Unable to update order status.');
      renderAdmin();
    }
  }

  function openOrderDetails(no) {
    const o = getOrders().find(x => x.no === no);
    if (!o) return;
    $('adDetailTitle').textContent = 'Order ' + (o.no || '');
    const items = (o.items || []).map(i => '<div class="admin-detail-item"><img src="' + esc(PRODUCTS.find(p => p.name === i.name)?.img || placeholder(i.name)) + '" alt=""><div style="flex:1"><b style="font:600 12px Roboto;color:#303a4b">' + esc(i.name) + '</b><small style="display:block;font:400 10px Roboto;color:#8b94a5;margin-top:3px">' + esc(i.mat || '') + ' · Qty ' + esc(i.qty || 1) + ' · ' + money2(i.price) + '</small></div><strong style="font:700 12px Roboto;color:#273143">' + money2((+i.price || 0) * (+i.qty || 0)) + '</strong></div>').join('');
    $('adDetailBody').innerHTML = '<div class="admin-detail-grid">'
      + '<div class="admin-detail-field"><span>Customer</span><b>' + esc(o.name || '—') + '</b></div>'
      + '<div class="admin-detail-field"><span>Phone</span><b>+91 ' + esc(o.ph || '—') + '</b></div>'
      + '<div class="admin-detail-field"><span>Delivery Address</span><b>' + esc(o.addr || '—') + ', ' + esc(o.city || '') + ' - ' + esc(o.pin || '') + '</b></div>'
      + '<div class="admin-detail-field"><span>Payment</span><b>' + esc(o.pay || '—') + (o.utr ? ' · ' + esc(o.utr) : '') + '</b></div>'
      + '<div class="admin-detail-field"><span>Order Total</span><b>' + money2(o.total) + '</b></div>'
      + '<div class="admin-detail-field"><span>Booked On</span><b>' + (o.ts ? new Date(o.ts).toLocaleString('en-IN') : '—') + '</b></div>'
      + '</div>'
      + '<div class="admin-detail-items">' + items + '</div>'
      + '<div class="admin-detail-actions">'
      +   '<select id="adDetailStatus">' + ['Placed', 'Pending', 'Confirmed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'].map(x => '<option ' + (x === orderStatus(o) ? 'selected' : '') + '>' + x + '</option>').join('') + '</select>'
      +   '<select id="adDetailPayment"><option ' + (paymentLabel(o) === 'Paid' ? 'selected' : '') + '>Paid</option><option ' + (paymentLabel(o) !== 'Paid' ? 'selected' : '') + '>Waiting payment</option></select>'
      +   '<input id="adDetailTracking" placeholder="Shipping / tracking number" value="' + esc(o.tracking || '') + '">'
      +   '<input id="adDetailCarrier" placeholder="Courier / carrier" value="' + esc(o.carrier || '') + '">'
      +   '<button class="admin-btn primary" id="adSaveOrderDetail" type="button">Save Order</button>'
      +   '<button class="admin-btn" id="adDetailInvoice" type="button">View Invoice</button>'
      +   '<button class="admin-btn green" id="adDetailWhatsApp" type="button">WhatsApp Customer</button>'
      + '</div>';
    $('adOrderModal').classList.add('open');
    $('adSaveOrderDetail').onclick = async () => {
      const all = store.get('ej_orders') || [],
            x = all.find(v => v.no === no);
      if (x) {
        const saveButton = $('adSaveOrderDetail');
        saveButton.disabled = true;
        try {
          if (!x.id) throw new Error('This order is not stored in Supabase and cannot be updated here.');
          const status = $('adDetailStatus').value;
          const saved = await EJDatabase.setAdminOrderDetails(x.id, {
            status,
            payment_status: $('adDetailPayment').value,
            tracking_number: $('adDetailTracking').value.trim(),
            carrier: $('adDetailCarrier').value.trim()
          });
          x.paymentStatus = saved.payment_status;
          x.tracking = saved.tracking_number || '';
          x.carrier = saved.carrier || '';
          x.status = status;
          store.set('ej_orders', all);
          $('adOrderModal').classList.remove('open');
          renderAdmin();
          say('Order details saved');
        } catch (error) {
          console.error('Unable to save admin order details.', error);
          say(error.message || 'Unable to save order details.');
        } finally {
          saveButton.disabled = false;
        }
      }
    };
    $('adDetailInvoice').onclick = () => {
      lastOrder = o;
      showInvoice(o, false);
    };
    $('adDetailWhatsApp').onclick = () => window.open('https://wa.me/' + (String(o.ph || '').replace(/\D/g, '')), '_blank');
  }

  function printAdminOrder(no) {
    const o = getOrders().find(x => x.no === no);
    if (!o) return;
    lastOrder = o;
    showInvoice(o, false);
    setTimeout(() => window.print(), 350);
  }

  function renderCustomers() {
    const customers = new Map();
    adminCustomers.forEach(profile => customers.set(profile.id, {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      orders: [],
      lastOrder: profile.createdAt
    }));
    getOrders().forEach(order => {
      const key = order.uid || order.ph || order.name || order.no;
      if (!key) return;
      let customer = customers.get(key);
      if (!customer) {
        customer = { name: order.name || 'Customer', email: '', phone: order.ph || '', orders: [], lastOrder: 0 };
        customers.set(key, customer);
      }
      customer.orders.push(order);
      customer.lastOrder = Math.max(customer.lastOrder, Number(order.ts) || 0);
    });

    const query = adminCustomerSearch.toLowerCase().trim();
    const rows = [...customers.values()]
      .filter(customer => !query || (customer.name + ' ' + customer.phone + ' ' + customer.email).toLowerCase().includes(query))
      .sort((a, b) => b.lastOrder - a.lastOrder);
    $('adCustomerCount').textContent = rows.length + (rows.length === 1 ? ' customer' : ' customers');
    $('adCustomerRows').innerHTML = rows.map(customer => {
      const paidOrders = customer.orders.filter(order => order.status !== 'Cancelled');
      const spent = paidOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
      const lastOrder = customer.lastOrder
        ? new Date(customer.lastOrder).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
      return '<tr><td><b>' + esc(customer.name) + '</b></td><td>' + esc(customer.email || customer.phone || '—') + '</td><td>'
        + customer.orders.length + '</td><td>' + money2(spent) + '</td><td>' + lastOrder + '</td></tr>';
    }).join('') || '<tr><td colspan="5" class="admin-empty">No customers found.</td></tr>';
  }

  /* =====================================================================
     8. DASHBOARD + REPORTS
     ===================================================================== */
  function renderDashboard() {
    const orders = getOrders(),
          activeOrders = orders.filter(o => orderStatus(o) !== 'Cancelled'),
          custom = store.get('ej_custom_requests') || [],
          sales = activeOrders.reduce((sum, o) => sum + (+o.total || 0), 0);
    $('adStatProducts').textContent = PRODUCTS.length;
    $('adStatUsers').textContent = adminCustomers.length;
    $('adStatOrders').textContent = orders.length;
    $('adStatSales').textContent = money2(sales);
    $('adStatCustom').textContent = custom.length;
    $('adStatOrderNote').textContent = (orders.filter(o => orderStatus(o) === 'Pending').length) + ' pending';

    const recent = $('adRecentOrders');
    recent.innerHTML = orders.slice(0, 5).map(o => '<div class="admin-mini-row"><div class="admin-mini-main"><div class="admin-mini-icon" style="width:38px;height:38px;border-radius:9px;background:#eef2ff;display:grid;place-items:center;color:#536dfc">▣</div><div><b>' + esc(o.no || 'Order') + ' · ' + esc(o.name || 'Customer') + '</b><span>' + orderStatus(o) + ' · ' + (o.ts ? new Date(o.ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '—') + '</span></div></div><div class="admin-mini-price">' + money2(o.total) + '</div></div>').join('') || '<div class="admin-empty">No orders yet.</div>';

    // last 7 days sales chart
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push(d);
    };
    const vals = days.map(d => activeOrders.filter(o => {
            const x = new Date(o.ts || 0);
            return x.toDateString() === d.toDateString();
          }).reduce((a, o) => a + (+o.total || 0), 0)),
          mx = Math.max(1, ...vals);
    $('adChart').innerHTML = vals.map(v => '<div class="admin-bar" style="height:' + Math.max(10, Math.round(v / mx * 145)) + 'px"><b>' + money2(v) + '</b></div>').join('');
    $('adChartLabels').innerHTML = days.map(d => d.toLocaleDateString('en-IN', { weekday: 'short' })).join('</div><div>')
      ? days.map(d => '<div>' + d.toLocaleDateString('en-IN', { weekday: 'short' }) + '</div>').join('')
      : '';
  }

  function renderReports() {
    const orders = getOrders(),
          valid = orders.filter(o => orderStatus(o) !== 'Cancelled'),
          avg = valid.length ? valid.reduce((a, o) => a + (+o.total || 0), 0) / valid.length : 0;
    $('adAvgOrder').textContent = money2(avg);
    $('adDelivered').textContent = orders.filter(o => orderStatus(o) === 'Delivered').length;
    $('adPending').textContent = orders.filter(o => ['Pending', 'Confirmed', 'Processing', 'Shipped'].includes(orderStatus(o))).length;
    $('adCancelled').textContent = orders.filter(o => orderStatus(o) === 'Cancelled').length;

    const prod = {},
          cats = {};
    orders.forEach(o => (o.items || []).forEach(i => {
      const q = +i.qty || 0;
      prod[i.name] = (prod[i.name] || 0) + q;
      cats[i.cat] = (cats[i.cat] || 0) + q;
    }));
    const top = Object.entries(prod).sort((a, b) => b[1] - a[1]).slice(0, 6),
          cat = Object.entries(cats).sort((a, b) => b[1] - a[1]),
          mx = Math.max(1, ...top.map(x => x[1])),
          cmx = Math.max(1, ...cat.map(x => x[1]));
    $('adTopCategory').textContent = cat[0]?.[0] || '—';
    $('adTopProducts').innerHTML = top.map(x => '<div class="admin-bar-row"><span title="' + esc(x[0]) + '">' + esc(x[0]).slice(0, 16) + '</span><div class="admin-bar-track"><div class="admin-bar-fill" style="width:' + (x[1] / mx * 100) + '%"></div></div><b>' + x[1] + '</b></div>').join('') || '<div class="admin-empty">No sales data yet.</div>';
    $('adCategoryReport').innerHTML = cat.map(x => '<div class="admin-bar-row"><span>' + esc(x[0]) + '</span><div class="admin-bar-track"><div class="admin-bar-fill" style="width:' + (x[1] / cmx * 100) + '%"></div></div><b>' + x[1] + '</b></div>').join('') || '<div class="admin-empty">No category data yet.</div>';
  }


  /* =====================================================================
     9. CUSTOM DESIGN REQUESTS
     ===================================================================== */
  function renderAdminCustom() {
    const rows = $('adCustomRows'),
          list = store.get('ej_custom_requests') || [];
    if (!list.length) {
      rows.innerHTML = '<tr><td colspan="10" class="admin-empty">No custom design requests yet.</td></tr>';
      return;
    }
    rows.innerHTML = list.slice().reverse().map(x => {
      const ref = x.referenceUrl ? '<a href="' + esc(x.referenceUrl) + '" target="_blank" rel="noopener noreferrer" class="admin-link">Open Link ↗</a>' : '—';
      const contact = '<a href="https://wa.me/91' + esc(String(x.phone || '').replace(/\D/g, '')) + '" target="_blank" rel="noopener noreferrer" class="admin-link">WhatsApp</a>';
      return '<tr>'
        + '<td>' + esc(x.ts ? new Date(x.ts).toLocaleDateString('en-IN') : '—') + '</td>'
        + '<td><b>' + esc(x.name || '—') + '</b><br><small>+91 ' + esc(x.phone || '—') + '</small></td>'
        + '<td>' + esc(x.type || '—') + '<br><small>' + esc(x.material || '') + '</small></td>'
        + '<td>' + esc(x.occasion || '—') + '</td>'
        + '<td>' + esc(x.style || '—') + '</td>'
        + '<td>' + esc(x.budget || '—') + '</td>'
        + '<td>' + esc(x.date || '—') + '</td>'
        + '<td>' + ref + '</td>'
        + '<td style="max-width:260px;white-space:normal">' + esc(x.message || '—') + '</td>'
        + '<td><select class="admin-select" data-custom-status="' + esc(x.id) + '">' + ['New', 'Contacted', 'In Progress', 'Completed', 'Cancelled'].map(status => '<option' + (status === (x.status || 'New') ? ' selected' : '') + '>' + status + '</option>').join('') + '</select></td>'
        + '<td>' + contact + '</td>'
        + '</tr>';
    }).join('');
    rows.querySelectorAll('[data-custom-status]').forEach(select => {
      select.onchange = async () => {
        const request = list.find(item => String(item.id) === select.dataset.customStatus);
        if (!request) return;
        select.disabled = true;
        try {
          await EJDatabase.setAdminCustomRequestStatus(request.id, select.value);
          request.status = select.value;
          store.set('ej_custom_requests', list);
          say('Custom design request updated');
        } catch (error) {
          console.error('Unable to update custom design request.', error);
          say(error.message || 'Unable to update this custom design request.');
          renderAdminCustom();
        } finally {
          select.disabled = false;
        }
      };
    });
  }
  function renderAdmin() {
    renderDashboard();
    renderAdminProducts();
    renderAdminOrders();
    renderCustomers();
    renderAdminCustom();
    renderReports();
  }
  const pageMeta = {
    dashboard: ['Dashboard', 'Store overview and recent activity'],
    jewellery: ['Jewellery', 'Catalogue management and product details'],
    orders: ['Orders', 'Booked orders, payments and fulfilment'],
    customers: ['Customers', 'Customer accounts and order history'],
    custom: ['Custom Requests', 'Custom jewellery enquiries and follow-up'],
    reports: ['Reports', 'Sales and product performance']
  };

  function showAdminPage(page) {
    document.querySelectorAll('.admin-page').forEach(x => x.classList.remove('active'));
    const el = $('adPage' + page.charAt(0).toUpperCase() + page.slice(1));
    if (el) el.classList.add('active');
    document.querySelectorAll('#adminNav button').forEach(b => b.classList.toggle('active', b.dataset.page === page));
    $('adminPageTitle').textContent = pageMeta[page][0];
    $('adminPageSub').textContent = pageMeta[page][1];
    $('adminSide').classList.remove('open');
    if (page === 'orders') renderAdminOrders();
  }

  document.querySelectorAll('#adminNav button').forEach(b => b.onclick = () => showAdminPage(b.dataset.page));
  document.querySelectorAll('[data-go]').forEach(b => b.onclick = () => showAdminPage(b.dataset.go));
  $('adminMenuBtn').onclick = () => $('adminSide').classList.toggle('open');
  $('adminQuickAdd').onclick = () => {
    showAdminPage('jewellery');
    resetProductForm();
    setTimeout(() => $('adName').focus(), 80);
  };

  document.querySelectorAll('.admin-order-tab').forEach(b => b.onclick = () => {
    adminOrderTab = b.dataset.orderTab;
    renderAdminOrders();
  });
  $('adOrderSearch').addEventListener('input', e => {
    adminOrderSearch = e.target.value;
    renderAdminOrders();
  });
  $('adOrderFilter').addEventListener('change', e => {
    adminOrderFilter = e.target.value;
    renderAdminOrders();
  });
  $('adCustomerSearch').addEventListener('input', e => {
    adminCustomerSearch = e.target.value;
    renderCustomers();
  });

  function exportOrders(list = getOrders()) {
    downloadCsv('elegance-orders.csv', [
      ['Order', 'Date', 'Customer', 'Phone', 'Total', 'Payment', 'Status', 'Tracking'],
      ...list.map(o => [o.no, o.ts ? new Date(o.ts).toLocaleString('en-IN') : '', o.name, o.ph, o.total, o.pay, paymentLabel(o), orderStatus(o), o.tracking || ''])
    ]);
  }

  $('adExportOrders').onclick = () => exportOrders();

  $('adExportSelected').onclick = () => {
    const l = getOrders().filter(o => selectedOrders.has(o.no));
    if (!l.length) return say('Select at least one order.');
    exportOrders(l);
  };

  $('adminExportAll').onclick = () => {
    downloadCsv('elegance-jewellery-products.csv', [
      ['ID', 'Name', 'Category', 'Material', 'Price', 'Stock'],
      ...PRODUCTS.map(p => [p.id, p.name, p.cat, p.mat, p.price, p.stock ?? ''])
    ]);
    exportOrders();
    say('Products and orders exported');
  };

  $('adSelectAll').onchange = e => {
    const visible = getOrders().filter(o => orderMatchesTab(o) && (adminOrderFilter === 'All' || orderStatus(o) === adminOrderFilter));
    visible.forEach(o => e.target.checked ? selectedOrders.add(o.no) : selectedOrders.delete(o.no));
    renderAdminOrders();
  };

  $('adPrintSelected').onclick = () => {
    const o = getOrders().find(x => selectedOrders.has(x.no));
    if (!o) return say('Select at least one order.');
    printAdminOrder(o.no);
  };

  $('adBulkStatus').onchange = e => {
    const l = [...selectedOrders],
          st = e.target.value;
    if (!st) return;
    if (!l.length) {
      e.target.value = '';
      return say('Select at least one order.');
    }
    e.target.value = '';
    const all = store.get('ej_orders') || [],
          selected = all.filter(o => l.includes(o.no)),
          remoteIds = selected.filter(o => o.id).map(o => o.id);
    if (selected.length !== remoteIds.length) {
      e.target.value = '';
      return say('One or more selected orders are not stored in Supabase and cannot be updated.');
    }
    e.target.disabled = true;
    EJDatabase.setAdminOrdersStatus(remoteIds, st).then(() => {
      selected.forEach(o => { o.status = st });
      store.set('ej_orders', all);
      renderAdmin();
      say('Selected orders updated to ' + st);
    }).catch(error => {
      console.error('Unable to update selected Supabase orders.', error);
      say(error.message || 'Unable to update selected orders.');
      renderAdmin();
    }).finally(() => { e.target.disabled = false });
  };

  // --- order details modal close ---
  $('adDetailClose').onclick = () => $('adOrderModal').classList.remove('open');
  $('adOrderModal').addEventListener('mousedown', e => {
    if (e.target === $('adOrderModal')) $('adOrderModal').classList.remove('open');
  });

  $('adminOpen').onclick = () => openAdminLogin();
  $('adminBack').onclick = backCustomer;
  $('adminLoginX').onclick = () => $('adminLoginOv').classList.remove('open');
  $('adminLoginOv').addEventListener('mousedown', e => {
    if (e.target === $('adminLoginOv')) $('adminLoginOv').classList.remove('open');
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') $('adminLoginOv').classList.remove('open');
  });
  $('adminEye').onclick = () => {
    const i = $('adminPass'),
          h = i.type === 'password';
    i.type = h ? 'text' : 'password';
    $('adminEye').textContent = h ? 'Hide' : 'Show';
  };
  $('adminGo').onclick = async () => {
    const u = $('adminUser').value.trim(),
          p = $('adminPass').value;
    $('adminErr').textContent = '';
    if (!u || p.length < 8) {
      $('adminErr').textContent = 'Enter your administrator username and password.';
      return;
    }
    $('adminGo').disabled = true;
    try {
      await EJDatabase.adminSignIn(u, p);
      localStorage.setItem('ej_admin_session', '1');
      $('adminUser').value = '';
      $('adminPass').value = '';
      $('adminLoginOv').classList.remove('open');
      openDashboard();
    } catch (error) {
      console.error('Unable to sign in to the administrator dashboard.', error);
      $('adminErr').textContent = error.message || 'Administrator sign-in failed.';
    } finally {
      $('adminGo').disabled = false;
    }
  };
  $('adminPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') $('adminGo').click();
  });
  $('adminLogout').onclick = adminLogout;

  syncProducts();
})();