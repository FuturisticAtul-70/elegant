// Storefront, authentication, custom design, shop, cart, checkout and customer orders.
const $ = id => document.getElementById(id);
const esc = t => String(t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const hero = document.querySelector('.hero');

[[1130, 330], [1580, 300], [1000, 620], [1600, 640], [1250, 200], [1520, 820]].forEach(([x, y], i) => {
  const s = document.createElement('div');
  s.className = 'sp';
  s.style.cssText = `left:${(x / 1672 * 100)}%;top:${(y - 110) / 831 * 100}%;animation-delay:${i * .4}s;width:22px;height:22px;z-index:3;background:radial-gradient(circle,#fff 0,rgba(255,240,210,.7) 20%,transparent 65%)`;
  s.style.clipPath = 'polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)';
  hero.appendChild(s);
});

let n = 0;
const col = $('collection'),
      cust = $('custom'),
      contactEl = $('contact'),
      ordersEl = $('orders'),
      storeEl = $('store');
const navLinks = [...document.querySelectorAll('nav>a')];
const ddLink = document.querySelector('nav .dd>a');
const about = $('about'),
      veil = $('veil');
let view = 'home',
    busy = false;

function setActive(a) {
  [...navLinks, ddLink].forEach(x => x && x.classList.remove('active'));
  a && a.classList.add('active');
}

function showView(v) {
  hero.style.display = v === 'home' ? '' : 'none';
  about.classList.toggle('on', v === 'about');
  col.classList.toggle('on', v === 'shop');
  cust.classList.toggle('on', v === 'custom');
  contactEl.classList.toggle('on', v === 'contact');
  ordersEl.classList.toggle('on', v === 'orders');
  storeEl.classList.toggle('on', v === 'store');
  about.classList.remove('show');
  col.classList.remove('show');
  cust.classList.remove('show');
  contactEl.classList.remove('show');
  ordersEl.classList.remove('show');
  storeEl.classList.remove('show');
  hero.classList.remove('enter');
}

function go(v, cat) {
  if (busy) return;
  if (v === view) {
    if (v === 'shop' && cat) setFilter(cat);
    return;
  }
  busy = true;
  view = v;
  if (v === 'shop') filter = cat || 'All';
  veil.className = 'veil in';
  setTimeout(() => {
    showView(v);
    if (v === 'shop') renderShop();
    if (v === 'store') renderStore();
    if (v === 'orders') renderOrders();
    window.scrollTo(0, 0);
    void about.offsetWidth;
    veil.className = 'veil out';
    if (v === 'about') about.classList.add('show');
    else if (v === 'shop') col.classList.add('show');
    else if (v === 'custom') cust.classList.add('show');
    else if (v === 'contact') contactEl.classList.add('show');
    else if (v === 'orders') ordersEl.classList.add('show');
    else if (v === 'store') storeEl.classList.add('show');
    else hero.classList.add('enter');
    setTimeout(() => {
      veil.className = 'veil';
      busy = false;
    }, 720);
  }, 900);
}

// --- navigation handlers ---
navLinks.forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  const t = a.textContent.trim();
  setActive(a);
  if (t === 'Home') go('home');
  else if (t === 'About Us') go('about');
  else if (t === 'Shop') go('store');
  else if (t === 'Custom Design') go('custom');
  else if (t === 'Contact') go('contact');
  else if (t === 'My Orders') goOrders();
}));

ddLink.addEventListener('click', e => {
  e.preventDefault();
  setActive(ddLink);
  go('shop', 'All');
});

document.querySelectorAll('nav .dd li a').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  setActive(ddLink);
  go('shop', a.textContent.trim());
}));

$('shop').onclick = () => {
  setActive(navLinks[2]);
  go('store');
};

document.querySelectorAll('.btn.s').forEach(b => {
  if (/Explore Collection/.test(b.textContent)) b.addEventListener('click', e => {
    e.preventDefault();
    setActive(ddLink);
    go('shop', 'All');
  });
});

$('backHome').onclick = () => {
  setActive(navLinks[0]);
  go('home');
};

;
const CATS = ['All', 'Rings', 'Earrings', 'Necklaces', 'Bracelets', 'Bridal Jewellery'];
let filter = 'All';

function renderFilters() {
  $('filters').innerHTML = '';
  CATS.forEach(c => {
    const cnt = c === 'All' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === c).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = c === filter ? 'on' : '';
    b.innerHTML = c + '<small>' + cnt + '</small>';
    b.onclick = () => setFilter(c);
    $('filters').appendChild(b);
  });
}

function renderGrid() {
  const g = $('pgrid');
  g.innerHTML = '';
  PRODUCTS.filter(p => filter === 'All' || p.cat === filter).forEach((p, i) => {
    const c = document.createElement('article');
    c.className = 'pc';
    c.style.animationDelay = (i * .06) + 's';
    c.innerHTML = '<div class="pimg' + (p.fit === 'contain' ? ' contain' : '') + '"><img loading="lazy" alt="' + esc(p.name) + '" src="' + esc(p.img) + '"><span class="ptag">' + esc(p.cat) + '</span></div><div class="pbody"><h4>' + esc(p.name) + '</h4><button type="button" class="pview">View Details</button></div>';
    c.onclick = () => openP(p.id);
    g.appendChild(c);
  });
}

function renderShop() {
  renderFilters();
  renderGrid();
}

function setFilter(c) {
  filter = c;
  renderShop();
}

// --- product details popup ---
let curP = null;

function openP(id, store) {
  const p = PRODUCTS.find(x => x.id === id);
  curP = p;
  $('pmPic').src = p.img;
  $('pmPic').alt = p.name;
  $('pmImg').classList.toggle('contain', p.fit === 'contain');
  $('pmCat').textContent = p.cat;
  $('pmName').textContent = p.name;
  $('pmDesc').textContent = p.desc;
  const rows = (store ? [['Material', p.mat]].concat(p.spec || [], p.attrs) : p.attrs);
  $('pmAttrs').innerHTML = rows.map(a => '<div><dt>' + esc(a[0]) + '</dt><dd>' + esc(a[1]) + '</dd></div>').join('');
  $('pmPrice').style.display = store ? 'block' : 'none';
  $('pmMat').style.display = store ? 'flex' : 'none';
  $('pmAdd').style.display = store ? '' : 'none';
  $('pmClose').className = store ? 'btn s' : 'btn p';
  $('pmClose').textContent = store ? 'Keep Browsing' : 'Close';
  if (store) {
    $('pmPrice').textContent = money(p.price);
    $('pmMat').innerHTML = '<i class="t-' + esc(p.mat) + '"></i>' + esc(p.mat);
  }
  $('pmOv').classList.add('open');
}

function closeP() {
  $('pmOv').classList.remove('open');
}

$('pmX').onclick = closeP;
$('pmClose').onclick = closeP;
$('pmOv').addEventListener('mousedown', e => {
  if (e.target === $('pmOv')) closeP();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeP();
});

// --- sparkles on the About image ---
[[12, 22], [82, 18], [70, 70], [28, 78], [90, 48]].forEach(([x, y], i) => {
  const d = document.createElement('div');
  d.className = 'sp';
  d.style.cssText = `left:${x}%;top:${y}%;animation-delay:${i * .5}s;width:20px;height:20px;background:radial-gradient(circle,#fff 0,rgba(255,240,210,.7) 20%,transparent 65%);clip-path:polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)`;
  document.querySelector('.a-frame').appendChild(d);
});

const lgOv = $('lgOv'),
      userBtn = $('userBtn');
let mode = 'login',
    authRequestInFlight = false,
    resendRequestInFlight = false;
let pendingSignupIdentifier = null;
let buyNowOriginalCart = null;

const store = {
  get(k) {
    try { return JSON.parse(localStorage.getItem(k)) } catch (e) { return null }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) {}
  },
  del(k) {
    try { localStorage.removeItem(k) } catch (e) {}
  }
};

function normId(v) {
  v = v.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return { type: 'email', key: v.toLowerCase() };
  const d = v.replace(/[\s\-()]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, '');
  if (/^[6-9]\d{9}$/.test(d)) return { type: 'phone', key: d };
  return null;
}

function showErr(m) {
  $('lgErr').textContent = m || '';
}

function authErrorMessage(error) {
  const message = String(error?.message || '');
  if (/email.*rate.?limit|rate.?limit.*email/i.test(message)) {
    return 'Supabase has temporarily limited email sends. This project still requires email confirmation. To stop email verification, disable Confirm email under Authentication > Sign In / Providers > Email. The site will then create accounts without sending signup emails.';
  }
  return message || 'Authentication failed. Please try again.';
}

function setMode(m) {
  mode = m;
  showErr('');
  const sign = m === 'sign';
  const verify = m === 'verify';
  $('tLogin').classList.toggle('on', !sign);
  $('tSign').classList.toggle('on', sign);
  document.querySelector('.lg-tabs').classList.toggle('lg-hide', verify);
  $('rowName').classList.toggle('lg-hide', !sign || verify);
  $('lgId').classList.toggle('lg-hide', verify);
  $('rowPw').classList.toggle('lg-hide', verify);
  $('rowPw2').classList.toggle('lg-hide', !sign || verify);
  $('rowCode').classList.toggle('lg-hide', !verify);
  $('lgResend').classList.toggle('lg-hide', !verify);
  $('lgCancelVerify').classList.toggle('lg-hide', !verify);
  $('lgTitle').textContent = verify ? 'Confirm Your Account' : sign ? 'Create Account' : 'Welcome Back';
  $('lgSub').textContent = verify ? 'Enter the confirmation code sent to ' + pendingSignupIdentifier?.display : sign ? 'Join Elegance Jewellery' : 'Login to your Elegance account';
  $('lgCodeHelp').textContent = 'Enter the SMS code. Phone sign-in requires an SMS provider enabled in Supabase.';
  $('lgGo').textContent = verify ? 'Confirm Account' : sign ? 'Sign Up' : 'Login';
  $('lgPw').autocomplete = sign ? 'new-password' : 'current-password';
  $('lgNote').classList.toggle('lg-hide', verify);
  $('lgNote').innerHTML = sign ? 'Already have an account? <a id="lgSwitch">Login</a>' : 'New here? <a id="lgSwitch">Create an account</a>';
  if (!verify) $('lgSwitch').onclick = () => setMode(sign ? 'login' : 'sign');
}

function refreshUser() {
  const u = store.get('ej_session');
  const no = $('navOrders');
  if (no) no.style.display = u ? '' : 'none';
  userBtn.classList.toggle('in', !!u);
  userBtn.title = u ? ('Hi, ' + u.name) : 'Login';
  $('lgForm').classList.toggle('lg-hide', !!u);
  $('lgUser').classList.toggle('lg-hide', !u);
  if (u) {
    $('lgTitle').textContent = 'Hello!';
    $('lgSub').textContent = 'You are logged in';
    $('lgWho').textContent = u.name;
  } else setMode(mode);
}

function openLg() {
  refreshUser();
  lgOv.classList.add('open');
  if (!store.get('ej_session')) setTimeout(() => $('lgId').focus(), 350);
}

function closeLg(fromAuth) {
  lgOv.classList.remove('open');
  if (!fromAuth && pendingCheckout && buyNowOriginalCart !== null) {
    pendingCheckout = false;
    restoreBuyNowCart();
  }
}

function say(m) {
  const t = $('toast');
  t.textContent = m;
  t.classList.add('show');
  setTimeout(() => {
    t.classList.remove('show');
    t.textContent = 'Added to your cart';
  }, 1900);
}

userBtn.onclick = openLg;
$('lgX').onclick = closeLg;
lgOv.addEventListener('mousedown', e => {
  if (e.target === lgOv) closeLg();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeLg();
});
$('tLogin').onclick = () => setMode('login');
$('tSign').onclick = () => setMode('sign');

document.querySelectorAll('.lg-eye').forEach(b => b.onclick = () => {
  const i = $(b.dataset.for);
  const h = i.type === 'password';
  i.type = h ? 'text' : 'password';
  b.textContent = h ? 'Hide' : 'Show';
});
function authIdentifier() {
  const parsed = normId($('lgId').value);
  return parsed && {
    type: parsed.type,
    value: parsed.type === 'phone' ? '+91' + parsed.key : parsed.key,
    display: parsed.type === 'phone' ? '+91 ' + parsed.key : parsed.key
  };
}

function catalogueStock(stock, productId) {
  const isSeedProduct = Number.isInteger(Number(productId)) && Number(productId) >= 1 && Number(productId) <= 17;
  return isSeedProduct && Number(stock) === 0 ? null : stock;
}

async function submitLg() {
  if (authRequestInFlight) return;
  authRequestInFlight = true;
  try {
    await processLgSubmission();
  } finally {
    authRequestInFlight = false;
  }
}

async function processLgSubmission() {
  showErr('');
  if (mode === 'verify') {
    const token = $('lgCode').value.trim();
    if (!pendingSignupIdentifier) return showErr('Please start signing up again to request a new confirmation code.');
    if (!/^\d{6}$/.test(token)) return showErr('Enter the 6-digit confirmation code.');
    $('lgGo').disabled = true;
    try {
      await EJDatabase.verifySignUp(pendingSignupIdentifier, token);
      pendingSignupIdentifier = null;
      $('lgCode').value = '';
      ['lgId', 'lgPw', 'lgPw2', 'lgName'].forEach(i => $(i).value = '');
      refreshUser();
      setTimeout(() => { closeLg(true); afterLogin() }, 500);
      say('Your account is confirmed. Welcome!');
    } catch (error) {
      console.error('Unable to confirm Supabase account.', error);
      showErr(error.message);
    } finally {
      $('lgGo').disabled = false;
    }
    return;
  }
  const id = authIdentifier(),
        pw = $('lgPw').value;
  if (!id) return showErr('Enter a valid email or 10-digit mobile number.');
  if (pw.length < 6) return showErr('Password must be at least 6 characters.');
  $('lgGo').disabled = true;
  if (mode === 'sign') {
    const name = $('lgName').value.trim();
    if (name.length < 2) {
      $('lgGo').disabled = false;
      return showErr('Please enter your name.');
    }
    if (pw !== $('lgPw2').value) {
      $('lgGo').disabled = false;
      return showErr('Passwords do not match.');
    }
    try {
      const result = await EJDatabase.signUp(id, pw, name);
      if (result.needsConfirmation) {
        pendingSignupIdentifier = id;
        $('lgCode').value = '';
        setMode('verify');
        showErr('A confirmation SMS was sent. Enter its code to confirm your phone.');
      } else {
        refreshUser();
        setTimeout(() => { closeLg(true); afterLogin() }, 500);
        say('Account created. Welcome, ' + name + '!');
        ['lgId', 'lgPw', 'lgPw2', 'lgName'].forEach(i => $(i).value = '');
      }
    } catch (error) {
      console.error('Unable to create Supabase account.', error);
      showErr(authErrorMessage(error));
    } finally {
      $('lgGo').disabled = false;
    }
  } else {
    try {
      const session = await EJDatabase.signIn(id, pw);
      store.set('ej_session', {
        id: session.user.id,
        name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || session.user.phone,
        email: session.user.email || '',
        phone: session.user.phone || ''
      });
      refreshUser();
      setTimeout(() => { closeLg(true); afterLogin() }, 500);
      say('Welcome back, ' + store.get('ej_session').name + '!');
      ['lgId', 'lgPw', 'lgPw2', 'lgName'].forEach(i => $(i).value = '');
    } catch (error) {
      console.error('Unable to sign in to Supabase.', error);
      showErr(error.message);
    } finally {
      $('lgGo').disabled = false;
    }
  }
}

$('lgGo').onclick = submitLg;
lgOv.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !$('lgForm').classList.contains('lg-hide') && !$('lgGo').disabled) submitLg();
});
$('lgOut').onclick = () => {
  $('lgOut').disabled = true;
  EJDatabase.signOut().then(() => {
    refreshUser();
    setMode('login');
    closeLg();
    say('You have been logged out');
    if (view === 'orders') {
      setActive(navLinks[0]);
      go('home');
    }
  }).catch(error => {
    console.error('Unable to sign out from Supabase.', error);
    refreshUser();
    setMode('login');
    closeLg();
    say('Signed out locally; Supabase could not confirm sign-out.');
  }).finally(() => { $('lgOut').disabled = false });
};
if (!store.get('ej_supabase_session')) store.del('ej_session');
EJDatabase.restoreSession().then(session => {
  if (session) {
    store.set('ej_session', {
      id: session.user.id,
      name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email || session.user.phone,
      email: session.user.email || '',
      phone: session.user.phone || ''
    });
  } else store.del('ej_session');
  refreshUser();
}).catch(error => {
  console.error('Unable to restore Supabase sign-in session.', error);
  EJDatabase.clearAuthSession();
  showErr('Your session expired. Please sign in again.');
  refreshUser();
});

$('lgResendLink').onclick = async () => {
  if (!pendingSignupIdentifier) return showErr('Please start signing up again to request a new confirmation code.');
  if (resendRequestInFlight) return;
  resendRequestInFlight = true;
  $('lgResendLink').classList.add('lg-hide');
  try {
    await EJDatabase.resendSignUp(pendingSignupIdentifier);
    showErr('A new confirmation code has been sent.');
  } catch (error) {
    console.error('Unable to resend Supabase confirmation code.', error);
    showErr(authErrorMessage(error));
  } finally {
    window.setTimeout(() => {
      resendRequestInFlight = false;
      if (mode === 'verify' && pendingSignupIdentifier) $('lgResendLink').classList.remove('lg-hide');
    }, 60000);
  }
};
$('lgCancelVerifyLink').onclick = () => {
  pendingSignupIdentifier = null;
  $('lgCode').value = '';
  setMode('login');
};

const WA_NUM = '917009638561';
const TYPES = ['Ring', 'Necklace', 'Earrings', 'Bracelet', 'Full Set', 'Bridal Set', 'Other'];
const MATS = ['Gold', 'Silver', 'Diamond', 'Platinum', 'Rose Gold', 'Other'];

function buildChips(id, list) {
  const box = $(id);
  const multi = box.dataset.multi === '1';
  list.forEach(t => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip';
    b.textContent = t;
    b.setAttribute('aria-pressed', 'false');
    b.onclick = () => {
      if (!multi) box.querySelectorAll('.chip').forEach(x => {
        if (x !== b) {
          x.classList.remove('on');
          x.setAttribute('aria-pressed', 'false');
        }
      });
      b.classList.toggle('on');
      b.setAttribute('aria-pressed', b.classList.contains('on'));
    };
    box.appendChild(b);
  });
}

buildChips('cuType', TYPES);
buildChips('cuMat', MATS);
const chosen = id => [...$(id).querySelectorAll('.chip.on')].map(x => x.textContent);
let lastWa = '';
buildChips('cuOccasion', ['Wedding', 'Engagement', 'Gift', 'Daily Wear', 'Other']);
buildChips('cuStyle', ['Traditional', 'Modern', 'Minimal', 'Bridal', 'Custom']);

$('cuForm').addEventListener('submit', async e => {
  e.preventDefault();
  const err = m => { $('cuErr').textContent = m };
  err('');
  const name = $('cuName').value.trim(),
        ph = normId($('cuPh').value),
        types = chosen('cuType'),
        mats = chosen('cuMat');
  const occasion = chosen('cuOccasion'),
        style = chosen('cuStyle'),
        msg = $('cuMsg').value.trim();
  const refUrl = $('cuRefUrl').value.trim(),
        bud = $('cuBud').value.trim(),
        dt = $('cuDate').value;

  if (name.length < 2) return err('Please enter your name.');
  if (!ph || ph.type !== 'phone') return err('Please enter a valid 10-digit mobile number.');
  if (!types.length) return err('Please choose the type of jewellery.');
  if (!mats.length) return err('Please choose at least one material.');
  if (!occasion.length) return err('Please choose an occasion.');
  if (!style.length) return err('Please choose a preferred style.');
  if (msg.length < 10) return err('Please write a short message about the design you need.');
  if (refUrl) {
    try {
      const u = new URL(refUrl);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch (x) {
      return err('Please enter a valid reference web link starting with http:// or https://.');
    }
  }

  const submitButton = e.submitter;
  if (submitButton) submitButton.disabled = true;
  try {
    const savedRequestId = await EJDatabase.createCustomDesignRequest({
      name,
      phone: ph.key,
      type: types.join(', '),
      material: mats.join(', '),
      occasion: occasion[0],
      style: style[0],
      budget: bud,
      date: dt || null,
      referenceUrl: refUrl,
      message: msg
    });
    const customHistory = store.get('ej_custom_requests') || [];
    customHistory.push({
      id: savedRequestId || Date.now(),
      ts: Date.now(),
      name,
      phone: ph.key,
      type: types.join(', '),
      material: mats.join(', '),
      occasion: occasion[0],
      style: style[0],
      budget: bud,
      date: dt,
      message: msg,
      status: 'New',
      referenceUrl: refUrl
    });
    store.set('ej_custom_requests', customHistory);
  } catch (error) {
    console.error('Unable to save custom design request to Supabase.', error);
    err('We could not save your request. Please try again. ' + error.message);
    if (submitButton) submitButton.disabled = false;
    return;
  }
  if (submitButton) submitButton.disabled = false;

  const lines = ['*Custom Jewellery Request* - Elegance Jewellery', '',
    '*Name:* ' + name,
    '*Mobile:* +91 ' + ph.key,
    '*Jewellery type:* ' + types.join(', '),
    '*Material:* ' + mats.join(', '),
    '*Occasion:* ' + occasion[0],
    '*Preferred style:* ' + style[0]];
  if (bud) lines.push('*Budget:* ' + bud);
  if (dt) lines.push('*Needed by:* ' + new Date(dt + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }));
  if (refUrl) lines.push('*Reference design:* ' + refUrl);
  lines.push('', '*Message:*', msg);
  lastWa = 'https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(lines.join('\n'));
  window.open(lastWa, '_blank');
  showDone('link');
});

function showDone(mode) {
  $('cuForm').style.display = 'none';
  $('cuDone').classList.add('on');
  $('cuDH').textContent = 'Request Ready!';
  $('cuDP').textContent = 'We opened WhatsApp with your custom jewellery request.';
  $('cuDL').innerHTML = '<li>Review the pre-filled request in the <b>Elegance Jewellery</b> WhatsApp chat (+91 70096 38561).</li><li>Press <b>Send</b> to submit your request.</li>' + (($('cuRefUrl').value.trim()) ? '<li>Your reference design web link is included in the message. The admin can open it directly.</li>' : '');
  $('cuAgain').textContent = 'Open WhatsApp Again';
  $('cuPhoto').style.display = 'none';
  $('cuBoth').style.display = 'none';
}

$('cuNew').onclick = () => {
  $('cuDone').classList.remove('on');
  $('cuForm').style.display = '';
  $('cuForm').reset();
  document.querySelectorAll('#cuType .chip.on,#cuMat .chip.on,#cuOccasion .chip.on,#cuStyle .chip.on').forEach(x => {
    x.classList.remove('on');
    x.setAttribute('aria-pressed', 'false');
  });
  $('cuErr').textContent = '';
};

$('ctaCustom').onclick = () => {
  setActive(navLinks.find(a => a.textContent.trim() === 'Custom Design'));
  go('custom');
};


// Product prices are curated per item in data.js and mirrored to the database migration.
const MIN_PRODUCT_PRICE = 2000;
const MAX_PRODUCT_PRICE = 20000;
const CURATED_SEED_PRICES = {
  1: 12499, 2: 18999, 3: 6999, 4: 9499, 5: 14999, 6: 8999,
  7: 17999, 8: 19999, 9: 15999, 10: 18499, 11: 7999, 12: 3499,
  13: 5999, 14: 13999, 15: 19499, 16: 18999, 17: 12999
};
const LEGACY_SEED_PRICES = {
  1: 32999, 2: 58999, 3: 6999, 4: 18999, 5: 28999, 6: 12499,
  7: 46999, 8: 118999, 9: 23499, 10: 36999, 11: 10999, 12: 3499,
  13: 8499, 14: 21999, 15: 24999, 16: 44499, 17: 19499
};
function cataloguePrice(price, productId) {
  const id = Number(productId),
        value = Number(price),
        legacyPrice = LEGACY_SEED_PRICES[id];
  if (CURATED_SEED_PRICES[id] && (value === legacyPrice || (legacyPrice > MAX_PRODUCT_PRICE && value === MAX_PRODUCT_PRICE))) {
    return CURATED_SEED_PRICES[id];
  }
  return Math.max(MIN_PRODUCT_PRICE, Math.min(value || MIN_PRODUCT_PRICE, MAX_PRODUCT_PRICE));
}
PRODUCTS.forEach(product => {
  product.price = cataloguePrice(product.price, product.id);
});

const money = v => '\u20B9' + v.toLocaleString('en-IN');
const TIERS = ['Platinum', 'Diamond', 'Gold', 'Silver'],
      RANK = { Platinum: 4, Diamond: 3, Gold: 2, Silver: 1 };
let MAXP = Math.ceil(Math.max(...PRODUCTS.map(p => p.price)) / 500) * 500;
let sCat = 'All',
    sMats = new Set(),
    sMax = MAXP,
    sSort = 'featured',
    sQ = '';

// --- search: synonyms + matching ---
const SYN = {
  bangle: 'bracelet', kada: 'bracelet', kangan: 'bracelet',
  chain: 'necklace', pendant: 'necklace', haar: 'necklace', mangalsutra: 'necklace', choker: 'necklace',
  jhumka: 'earring', jhumki: 'earring', stud: 'earring', tops: 'earring', bali: 'earring',
  anklet: 'bracelet',
  bride: 'bridal', wedding: 'bridal',
  engagement: 'ring', solitaire: 'ring',
  diamonds: 'diamond', platinum: 'platinum'
};
const norm = t => t.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).map(w => {
  w = SYN[w] || w;
  return w.length > 3 ? w.replace(/(es|s)$/, '') : w;
});
const hay = p => ' ' + (p.name + ' ' + p.cat + ' ' + p.mat + ' ' + p.desc + ' ' + (p.attrs || []).map(a => a[1]).join(' ')).toLowerCase().replace(/[^a-z0-9]+/g, ' ');
const nameHay = p => ' ' + (p.name + ' ' + p.cat + ' ' + p.mat).toLowerCase().replace(/[^a-z0-9]+/g, ' ');
const qMatch = p => {
  const t = norm(sQ);
  if (!t.length) return true;
  const h = hay(p);
  return t.every(w => h.includes(' ' + w));
};
const qScore = p => {
  const t = norm(sQ);
  const h = nameHay(p);
  return t.every(w => h.includes(' ' + w)) ? 0 : 1;
};

// --- icons ---
const EYE = '<svg viewBox="0 0 24 24"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const BAG = '<svg viewBox="0 0 24 24"><path d="M3 4h3l2.4 11.5h10.200L21 7H7"/><circle cx="10" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/></svg>';

// --- rendering ---
function renderCategoryTabs() {
  const tabs = $('stCategoryTabs');
  tabs.innerHTML = '';
  CATS.forEach(c => {
    const n = c === 'All' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === c).length;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'st-category-tab' + (c === sCat ? ' on' : '');
    b.setAttribute('aria-pressed', c === sCat ? 'true' : 'false');
    b.innerHTML = '<span>' + c + '</span><small>' + n + '</small>';
    b.onclick = () => {
      sCat = c;
      renderStore(true);
    };
    tabs.appendChild(b);
  });
  const r = $('stRange');
  r.max = MAXP;
  r.value = Math.min(sMax, MAXP);
  $('stRv').textContent = money(Math.min(sMax, MAXP));
  const mat = $('stMatFilter');
  mat.value = sMats.size ? [...sMats][0] : 'All';
}

function renderStoreGrid(animate) {
  let list = PRODUCTS.filter(p => (sCat === 'All' || p.cat === sCat) && (!sMats.size || sMats.has(p.mat)) && p.price <= sMax && qMatch(p));
  if (sQ && sSort === 'featured') list.sort((x, y) => qScore(x) - qScore(y));
  if (sSort === 'high') list.sort((a, b) => b.price - a.price);
  else if (sSort === 'low') list.sort((a, b) => a.price - b.price);
  else if (sSort === 'tier') list.sort((a, b) => RANK[b.mat] - RANK[a.mat] || b.price - a.price);

  $('stCount').innerHTML = 'Showing <b>' + list.length + '</b> piece' + (list.length === 1 ? '' : 's') + (sQ ? '<em class="st-q">\u201c' + sQ.replace(/</g, '&lt;') + '\u201d <button type="button" id="stQx" aria-label="Clear search">&times;</button></em>' : '');
  if ($('stQx')) $('stQx').onclick = () => {
    sQ = '';
    renderStoreGrid();
  };

  const g = $('stGrid');
  g.innerHTML = '';
  if (!list.length) {
    g.innerHTML = '<div class="st-empty">' + (sQ ? 'No pieces found for \u201c' + sQ.replace(/</g, '&lt;') + '\u201d. Try another word, like ring, gold or diamond.' : 'No pieces match these filters.') + '</div>';
    return;
  }
  list.forEach((p, i) => {
    const c = document.createElement('article');
    c.className = 'sc';
    c.style.animationDelay = (i * .05) + 's';
    c.innerHTML = '<div class="sc-img' + (p.fit === 'contain' ? ' contain' : '') + '"><img loading="lazy" alt="' + esc(p.name) + '" src="' + esc(p.img) + '"><span class="sc-rib t-' + esc(p.mat) + '">' + esc(p.mat) + '</span></div><button type="button" class="sc-eye" aria-label="Quick view">' + EYE + '</button><div class="sc-body"><div class="sc-cat">' + esc(p.cat) + '</div><h4>' + esc(p.name) + '</h4><div class="sc-price">' + money(p.price) + '</div><button type="button" class="sc-add">' + BAG + 'Add to Cart</button><button type="button" class="sc-buy">Buy Now</button></div>';
    c.querySelector('.sc-img').onclick = () => openP(p.id, true);
    c.querySelector('.sc-eye').onclick = () => openP(p.id, true);
    c.querySelector('.sc-add').onclick = () => addCart(p.id, c.querySelector('.sc-img img'));
    c.querySelector('.sc-buy').onclick = () => buyNow(p.id);
    g.appendChild(c);
  });
}

function renderStore() {
  renderCategoryTabs();
  renderStoreGrid();
}

// --- filter controls ---
$('stRange').oninput = e => {
  sMax = +e.target.value;
  $('stRv').textContent = money(sMax);
  renderStoreGrid();
};
$('stMatFilter').onchange = e => {
  sMats.clear();
  if (e.target.value !== 'All') sMats.add(e.target.value);
  renderStoreGrid();
};
$('stSort').onchange = e => {
  sSort = e.target.value;
  renderStoreGrid();
};
$('stReset').onclick = () => {
  sQ = '';
  sCat = 'All';
  sMats.clear();
  sMax = MAXP;
  sSort = 'featured';
  $('stSort').value = 'featured';
  $('stMatFilter').value = 'All';
  renderStore();
};

let cart = [];
try { cart = JSON.parse(localStorage.getItem('ej_cart')) || [] } catch (e) { cart = [] }
cart = cart.filter(c => PRODUCTS.some(p => p.id === c.id));

function saveCart() {
  try { localStorage.setItem('ej_cart', JSON.stringify(cart)) } catch (e) {}
}

const cartQty = () => cart.reduce((a, c) => a + c.qty, 0);

function updateCartUI() {
  $('cnt').textContent = cartQty();
  const L = $('cdList');
  if (!cart.length) {
    L.innerHTML = '<div class="cd-empty">Your cart is empty<br><a class="btn p" id="cdShop">Continue Shopping</a></div>';
    $('cdF').style.display = 'none';
    $('cdShop').onclick = () => {
      closeCart();
      if (view !== 'store') {
        setActive(navLinks[2]);
        go('store');
      }
    };
    return;
  }
  $('cdF').style.display = '';
  L.innerHTML = '';
  let tot = 0;
  cart.forEach(c => {
    const p = PRODUCTS.find(x => x.id === c.id);
    tot += p.price * c.qty;
    const d = document.createElement('div');
    d.className = 'cd-it';
    d.innerHTML = '<img alt="" src="' + esc(p.img) + '"><div><h6>' + esc(p.name) + '</h6><small>' + esc(p.mat) + ' &middot; ' + esc(p.cat) + '</small><div class="cd-q"><button type="button" data-a="-">&minus;</button><span>' + c.qty + '</span><button type="button" data-a="+">+</button></div></div><div class="cd-p">' + money(p.price * c.qty) + '<button type="button" data-a="x">Remove</button></div>';
    d.querySelectorAll('button').forEach(b => b.onclick = () => {
      const a = b.dataset.a,
            p = PRODUCTS.find(x => x.id === c.id),
            limit = (p && (p.stock !== undefined && p.stock !== null && p.stock !== '') ? Math.max(0, Number(p.stock)) : Infinity);
      if (a === '+') {
        if (c.qty < limit) c.qty++;
        else say('Maximum available quantity reached.');
      } else if (a === '-') c.qty--;
      else c.qty = 0;
      cart = cart.filter(x => x.qty > 0);
      saveCart();
      updateCartUI();
    });
    L.appendChild(d);
  });
  $('cdTot').textContent = money(tot);
}

function animateProductToCart(image) {
  const cartIcon = document.querySelector('.cart svg');
  if (!image || !cartIcon) return;

  const imageRect = image.getBoundingClientRect(),
        cartRect = cartIcon.getBoundingClientRect();
  if (!imageRect.width || !imageRect.height || !cartRect.width || !cartRect.height) return;

  const flyer = image.cloneNode(false),
        reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches,
        duration = reducedMotion ? 500 : 900,
        startX = imageRect.left + imageRect.width / 2,
        startY = imageRect.top + imageRect.height / 2,
        endX = cartRect.left + cartRect.width / 2,
        endY = cartRect.top + cartRect.height / 2;
  flyer.className = 'cart-flyer';
  flyer.removeAttribute('loading');
  flyer.removeAttribute('id');
  flyer.setAttribute('aria-hidden', 'true');
  flyer.style.cssText = `position:fixed;z-index:2000;pointer-events:none;left:${imageRect.left}px;top:${imageRect.top}px;width:${imageRect.width}px;height:${imageRect.height}px;object-fit:cover;border:2px solid rgba(232,193,138,.9);border-radius:16px;box-shadow:0 12px 35px rgba(0,0,0,.5),0 0 24px rgba(232,193,138,.65);transform-origin:center center;will-change:transform,opacity`;
  document.body.appendChild(flyer);

  const translateX = endX - startX,
        translateY = endY - startY,
        scaleX = Math.min(28 / imageRect.width, 1),
        scaleY = Math.min(28 / imageRect.height, 1);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (!flyer.isConnected) return;
    const animation = flyer.animate([
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(${translateX * 0.55}px, ${translateY * 0.55}px) scale(.62) rotate(-8deg)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY}) rotate(8deg)`, opacity: 0.12, offset: 1 }
    ], {
      duration,
      easing: 'cubic-bezier(.35, 0, .75, .55)',
      fill: 'forwards'
    });
    animation.finished.then(() => flyer.remove()).catch(() => flyer.remove());
  }));
}

function addCart(id, sourceImage) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const c = cart.find(x => x.id === id),
        limit = (p.stock === undefined || p.stock === null || p.stock === '') ? Infinity : Math.max(0, Number(p.stock));
  if (limit <= 0) {
    say('This jewellery is currently out of stock.');
    return;
  }
  if (c) {
    if (c.qty >= limit) {
      say('Only ' + limit + ' item' + (limit === 1 ? '' : 's') + ' available.');
      return;
    }
    c.qty++;
  } else cart.push({ id, qty: 1 });
  animateProductToCart(sourceImage);
  saveCart();
  updateCartUI();
  const el = document.querySelector('.cart');
  el.classList.remove('bump');
  void el.offsetWidth;
  el.classList.add('bump');
  say(p.name + ' added to cart');
}

function restoreBuyNowCart() {
  if (buyNowOriginalCart === null) return;
  cart = buyNowOriginalCart;
  buyNowOriginalCart = null;
  saveCart();
  updateCartUI();
}

function buyNow(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  const limit = (p.stock === undefined || p.stock === null || p.stock === '') ? Infinity : Math.max(0, Number(p.stock));
  if (limit < 1) {
    say('This jewellery is currently out of stock.');
    return;
  }
  if (buyNowOriginalCart !== null) restoreBuyNowCart();
  buyNowOriginalCart = cart.map(x => ({ id: x.id, qty: x.qty }));
  cart = [{ id: p.id, qty: 1 }];
  openCo();
}

function openCart() {
  updateCartUI();
  $('cdOv').classList.add('open');
}

function closeCart() {
  $('cdOv').classList.remove('open');
}

document.querySelector('.cart').onclick = openCart;
$('cdX').onclick = closeCart;
$('cdOv').addEventListener('mousedown', e => {
  if (e.target === $('cdOv')) closeCart();
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeCart();
    closeCo();
  }
});
$('pmAdd').onclick = () => {
  if (curP) {
    addCart(curP.id, $('pmPic'));
    closeP();
  }
};
updateCartUI();

$('ctForm').addEventListener('submit', async e => {
  e.preventDefault();
  const n = $('ctName').value.trim(),
        ph = $('ctPh').value.replace(/[\s\-()]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, ''),
        m = $('ctMsg').value.trim(),
        er = $('ctErr');
  er.classList.remove('ct-ok');
  if (!n) { er.textContent = 'Please enter your name.'; return }
  if (!/^[6-9]\d{9}$/.test(ph)) { er.textContent = 'Please enter a valid 10-digit mobile number.'; return }
  if (m.length < 3) { er.textContent = 'Please type your question.'; return }
  er.textContent = '';
  const submitButton = e.submitter;
  if (submitButton) submitButton.disabled = true;
  try {
    await EJDatabase.createContactRequest({ name: n, phone: ph, message: m });
  } catch (error) {
    console.error('Unable to save contact question to Supabase.', error);
    er.textContent = 'We could not save your question. Please try again. ' + error.message;
    if (submitButton) submitButton.disabled = false;
    return;
  }
  const txt = '*New question - Elegance Jewellery website*\n\n*Name:* ' + n + '\n*Mobile:* +91 ' + ph + '\n\n*Question:*\n' + m;
  window.open('https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(txt), '_blank');
  er.classList.add('ct-ok');
  er.textContent = 'Opening WhatsApp \u2014 tap Send to deliver your question.';
  $('ctMsg').value = '';
  if (submitButton) submitButton.disabled = false;
});

const srch = $('srch'),
      srchQ = $('srchQ');

function openSrch() {
  srch.classList.add('open');
  setTimeout(() => srchQ.focus(), 250);
}

function closeSrch() {
  srch.classList.remove('open');
  srchQ.blur();
}

$('srchBtn').onclick = () => srch.classList.contains('open') ? closeSrch() : openSrch();
$('srchX').onclick = closeSrch;
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSrch();
});
document.addEventListener('mousedown', e => {
  if (srch.classList.contains('open') && !srch.contains(e.target) && !$('srchBtn').contains(e.target)) closeSrch();
});

function runSearch(q) {
  if (busy) {
    setTimeout(() => runSearch(q), 300);
    return;
  }
  sQ = q.trim();
  sCat = 'All';
  sMats.clear();
  sMax = MAXP;
  sSort = 'featured';
  $('stSort').value = 'featured';
  closeSrch();
  setActive(navLinks.find(a => a.textContent.trim() === 'Shop'));
  const toRes = () => {
    const y = document.querySelector('.st-main').getBoundingClientRect().top + scrollY - 20;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };
  if (view === 'store') {
    renderStore();
    toRes();
  } else {
    go('store');
    setTimeout(toRes, 1750);
  }
}

srch.addEventListener('submit', e => {
  e.preventDefault();
  runSearch(srchQ.value);
});
srch.querySelectorAll('.srch-tags button').forEach(b => b.onclick = () => {
  srchQ.value = b.textContent;
  runSearch(b.textContent);
});

const UPI_ID = 'pkawal255@oksbi',
      UPI_NAME = 'Kawal Preet';
const BIZ = { name: 'Elegance Jewellery', ph: '+91 70096 38561', mail: 'kawal.elegance.jewellery@gmail.com' };

function cartTotal() {
  return cart.reduce((a, c) => a + PRODUCTS.find(p => p.id === c.id).price * c.qty, 0);
}

function inWords(n) {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'],
        b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const two = x => x < 20 ? a[x] : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '');
  const three = x => (x > 99 ? a[Math.floor(x / 100)] + ' Hundred' + (x % 100 ? ' ' : '') : '') + (x % 100 ? two(x % 100) : '');
  if (!n) return 'Zero';
  let o = '';
  const cr = Math.floor(n / 1e7);
  n %= 1e7;
  const lk = Math.floor(n / 1e5);
  n %= 1e5;
  const th = Math.floor(n / 1e3);
  n %= 1e3;
  if (cr) o += three(cr) + ' Crore ';
  if (lk) o += two(lk) + ' Lakh ';
  if (th) o += two(th) + ' Thousand ';
  if (n) o += three(n);
  return o.trim();
}

let pendingCheckout = false;
const coOv = $('coOv'),
      invOv = $('invOv');
const payMode = () => document.querySelector('input[name=coPm]:checked').value;

function syncPay() {
  const u = payMode() === 'UPI';
  $('coUpi').classList.toggle('on', u);
  $('coGo').textContent = u ? 'I Have Paid - Place Order' : 'Place Order & Get Invoice';
}

function openCo() {
  if (!cart.length) return;
  if (!store.get('ej_session')) {
    pendingCheckout = true;
    closeCart();
    openLg();
    $('lgSub').textContent = 'Please login or create an account to place your order';
    return;
  }
  const t = cartTotal();
  $('coItems').innerHTML = cart.map(c => {
    const p = PRODUCTS.find(x => x.id === c.id);
    return '<div class="co-it"><span>' + esc(p.name) + '<small>' + esc(p.mat) + ' · Qty ' + c.qty + '</small></span><b>' + money(p.price * c.qty) + '</b></div>';
  }).join('');
  $('coSub').textContent = $('coTot').textContent = $('coAmt').textContent = money(t);
  $('coApp').href = 'upi://pay?pa=' + UPI_ID + '&pn=' + encodeURIComponent(UPI_NAME) + '&am=' + t + '&cu=INR&tn=' + encodeURIComponent('Elegance Jewellery order');
  const u = store.get('ej_session');
  if (u && !$('coName').value) $('coName').value = u.name || '';
  $('coErr').textContent = '';
  syncPay();
  closeCart();
  coOv.classList.add('open');
}

function closeCo() {
  coOv.classList.remove('open');
  restoreBuyNowCart();
}

$('cdOrder').onclick = openCo;
$('coX').onclick = closeCo;
coOv.addEventListener('mousedown', e => {
  if (e.target === coOv) closeCo();
});
document.querySelectorAll('input[name=coPm]').forEach(r => r.onchange = syncPay);
$('coCopy').onclick = () => {
  try { navigator.clipboard.writeText(UPI_ID) } catch (e) {}
  $('coCopy').textContent = 'Copied';
  setTimeout(() => $('coCopy').textContent = 'Copy', 1500);
};

let lastOrder = null;

function waText(o) {
  const L = ['*New Order ' + o.no + '* - Elegance Jewellery', '', '*Customer:* ' + o.name, '*Mobile:* +91 ' + o.ph, '*Address:* ' + o.addr + ', ' + o.city + ' - ' + o.pin, '', '*Items:*'];
  o.items.forEach((i, k) => L.push((k + 1) + '. ' + i.name + ' (' + i.mat + ') x ' + i.qty + ' - ' + money(i.price * i.qty)));
  L.push('', '*Total:* ' + money(o.total), '*Payment:* ' + (o.pay === 'UPI' ? 'UPI - Txn ID ' + o.utr + ' (please verify)' : 'Cash on Delivery'));
  return L.join('\n');
}

function invHtml(o) {
  const dt = new Date(o.ts),
        ds = dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  const rows = o.items.map((i, k) => '<tr><td>' + (k + 1) + '</td><td>' + esc(i.name) + '<small>' + esc(i.cat) + '</small></td><td>' + esc(i.mat) + '</td><td class="n">' + i.qty + '</td><td class="n">' + money(i.price) + '</td><td class="n">' + money(i.price * i.qty) + '</td></tr>').join('');
  const pay = o.pay === 'UPI'
    ? '<b>Payment:</b> UPI — Transaction ID <b>' + esc(o.utr) + '</b> (paid to ' + UPI_ID + ')<br><small>Status: Paid via UPI, subject to verification by the seller</small>'
    : '<b>Payment:</b> Cash on Delivery<br><small>Status: ' + money(o.total) + ' payable on delivery</small>';
  return '<div class="iv-top"><div><div class="iv-brand"><svg viewBox="0 0 90 74" fill="none" stroke="#b8863f" stroke-width="3" stroke-linejoin="round"><path d="M22 4h46l19 21L45 70 3 25z"/><path d="M3 25h84M32 4l-9 21 22 45 22-45-9-21"/></svg><div><b>Elegance</b><i>Jewellery</i></div></div><div class="iv-addr">' + BIZ.ph + ' · ' + BIZ.mail + '</div></div>'
    + '<div class="iv-title"><h2>INVOICE</h2><div>Invoice No: <b>' + o.no + '</b></div><div>Date: <b>' + ds + '</b></div></div></div>'
    + '<div class="iv-meta"><div><h6>Billed &amp; Shipped To</h6><p><b>' + esc(o.name) + '</b><br>' + esc(o.addr) + '<br>' + esc(o.city) + ' - ' + esc(o.pin) + '<br>Mobile: +91 ' + o.ph + '</p></div>'
    + '<div><h6>Payment Method</h6><p>' + (o.pay === 'UPI' ? 'UPI (QR / App)' : 'Cash on Delivery') + '</p></div></div>'
    + '<table class="iv-tbl"><thead><tr><th>#</th><th>Item</th><th>Material</th><th class="n">Qty</th><th class="n">Rate</th><th class="n">Amount</th></tr></thead><tbody>' + rows + '</tbody></table>'
    + '<div class="iv-sum"><div><span>Subtotal</span><span>' + money(o.total) + '</span></div><div><span>Delivery</span><span>Free</span></div><div class="g"><span>Total</span><span>' + money(o.total) + '</span></div></div>'
    + '<div class="iv-words">Amount in words: Rupees ' + inWords(o.total) + ' only</div>'
    + '<div class="iv-pay">' + pay + '</div>'
    + '<div class="iv-foot"><strong>Thank you for shopping with Elegance Jewellery</strong>Prices are inclusive of all taxes. For any query call ' + BIZ.ph + '. This is a computer-generated invoice.</div>';
}

$('coForm').addEventListener('submit', async e => {
  e.preventDefault();
  const er = $('coErr'),
        name = $('coName').value.trim(),
        ph = $('coPh').value.replace(/[\s\-()]/g, '').replace(/^(\+?91|0)(?=\d{10}$)/, ''),
        addr = $('coAd').value.trim(),
        city = $('coCity').value.trim(),
        pin = $('coPin').value.trim(),
        pay = payMode(),
        utr = $('coUtr').value.replace(/\s/g, '');

  if (!name) return er.textContent = 'Please enter your name.';
  if (!/^[6-9]\d{9}$/.test(ph)) return er.textContent = 'Please enter a valid 10-digit mobile number.';
  if (addr.length < 8) return er.textContent = 'Please enter your full delivery address.';
  if (!city) return er.textContent = 'Please enter your city.';
  if (!/^\d{6}$/.test(pin)) return er.textContent = 'Please enter a valid 6-digit pincode.';
  if (pay === 'UPI' && !/^[A-Za-z0-9]{10,25}$/.test(utr)) return er.textContent = 'Please enter the UPI transaction / reference ID from your payment app.';
  er.textContent = '';

  const sess = store.get('ej_session');
  if (!sess) {
    coOv.classList.remove('open');
    pendingCheckout = true;
    openLg();
    return;
  }

  const o = {
    no: '',
    uid: sess.id,
    ts: Date.now(),
    name, ph, addr, city, pin, pay,
    utr: pay === 'UPI' ? utr : '',
    total: cartTotal(),
    items: cart.map(c => {
      const p = PRODUCTS.find(x => x.id === c.id);
      return { name: p.name, cat: p.cat, mat: p.mat, price: p.price, qty: c.qty };
    })
  };
  const submitButton = e.submitter;
  if (submitButton) submitButton.disabled = true;
  try {
    const savedOrder = await EJDatabase.createOrder({
      customer_name: name,
      phone: ph,
      address: addr,
      city,
      pincode: pin,
      payment_method: pay,
      payment_reference: pay === 'UPI' ? utr : '',
      items: cart.map(item => ({ product_id: item.id, quantity: item.qty }))
    });
    o.id = savedOrder.id;
    o.no = savedOrder.order_no;
    o.total = Number(savedOrder.total);
    o.status = savedOrder.status;
    o.items = savedOrder.items.map(item => ({
      name: item.product_name,
      cat: item.category,
      mat: item.material,
      price: Number(item.unit_price),
      qty: Number(item.quantity)
    }));
  } catch (error) {
    console.error('Unable to save order to Supabase.', error);
    er.textContent = 'We could not save your order. Your cart is unchanged. Please try again. ' + error.message;
    if (submitButton) submitButton.disabled = false;
    return;
  }
  if (submitButton) submitButton.disabled = false;
  lastOrder = o;

  const hist = store.get('ej_orders') || [];
  hist.push(o);
  store.set('ej_orders', hist);

  o.items.forEach(i => {
    const p = PRODUCTS.find(x => x.name === i.name);
    if (p && p.stock !== undefined && p.stock !== null && p.stock !== '') p.stock = Math.max(0, Number(p.stock) - Number(i.qty || 0));
  });

  const savedAdmin = adminProductsForCheckout();
  if (savedAdmin.length) {
    try { localStorage.setItem('ej_admin_products', JSON.stringify(savedAdmin)) } catch (e) {}
  }

  cart = [];
  saveCart();
  updateCartUI();
  closeCo();
  showInvoice(o, true);
  window.open('https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(waText(o)), '_blank');
});

$('invWa').onclick = () => lastOrder && window.open('https://wa.me/' + WA_NUM + '?text=' + encodeURIComponent(waText(lastOrder)), '_blank');
$('invPrint').onclick = () => {
  const t = document.title;
  if (lastOrder) document.title = 'Invoice ' + lastOrder.no;
  window.print();
  setTimeout(() => document.title = t, 500);
};
$('invX').onclick = () => invOv.classList.remove('open');

function afterLogin() {
  if (pendingCheckout) {
    pendingCheckout = false;
    if (cart.length) openCo();
  }
  if (view === 'orders') renderOrders();
}

async function myOrders() {
  const rows = await EJDatabase.loadMyOrders();
  return rows.map(order => ({
    id: order.id,
    no: order.order_no,
    uid: store.get('ej_session')?.id,
    ts: new Date(order.created_at).getTime(),
    name: order.customer_name,
    ph: order.phone,
    addr: order.address,
    city: order.city,
    pin: order.pincode,
    pay: order.payment_method,
    utr: order.payment_reference || '',
    status: order.status,
    total: Number(order.total),
    items: (order.order_items || []).map(item => ({
      name: item.product_name,
      cat: item.products?.category || '',
      mat: item.material || '',
      img: item.products?.image_url || '',
      price: Number(item.unit_price),
      qty: Number(item.quantity)
    }))
  }));
}

async function renderOrders() {
  const u = store.get('ej_session'),
        L = $('moList');
  $('moHi').textContent = u ? 'Hello, ' + u.name : '';
  L.textContent = 'Loading your orders…';
  let list;
  try {
    list = await myOrders();
  } catch (error) {
    console.error('Unable to load the signed-in customer orders.', error);
    L.textContent = 'Your orders could not be loaded. ' + (error.message || 'Please try again.');
    say('Unable to load your orders.');
    return;
  }
  if (!list.length) {
    L.innerHTML = '<div class="mo-empty">You have not placed any orders yet.<br><a class="btn p" id="moShop">Start Shopping</a></div>';
    $('moShop').onclick = () => {
      setActive(navLinks[2]);
      go('store');
    };
    return;
  }
  L.innerHTML = '';
  list.forEach(o => {
    const d = new Date(o.ts),
          ds = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const img = item => {
      if (item.img) return item.img;
      const n = item.name;
      const p = PRODUCTS.find(x => x.name === n);
      return p ? p.img : '';
    };
    const c = document.createElement('article');
    c.className = 'mo-card';
    const canCancel = ['Placed', 'Pending'].includes(o.status);
    c.innerHTML = '<div class="mo-top"><div><div class="mo-no">' + esc(o.no) + '</div><div class="mo-dt">' + ds + '</div></div><span class="mo-st' + (o.status === 'Cancelled' ? ' cancelled' : o.pay === 'UPI' ? ' w' : '') + '">' + esc(o.status || 'Placed') + (o.pay === 'UPI' && o.status !== 'Cancelled' ? ' \u00b7 UPI verification pending' : '') + '</span></div>'
      + '<div class="mo-its">' + o.items.map(i => '<div class="mo-it"><img alt="" src="' + esc(img(i)) + '"><div><b>' + esc(i.name) + '</b><small>' + esc(i.mat) + ' \u00b7 Qty ' + i.qty + '</small></div><span>' + money(i.price * i.qty) + '</span></div>').join('') + '</div>'
      + '<div class="mo-bot"><div class="mo-pay">' + (o.pay === 'UPI' ? 'Paid by UPI' : 'Pay on delivery') + ' <b>' + money(o.total) + '</b></div><div class="mo-actions"><button type="button" data-invoice>View Invoice</button>' + (canCancel ? '<button type="button" class="mo-cancel" data-cancel>Cancel Order</button>' : '') + '</div></div>';
    c.querySelector('[data-invoice]').onclick = () => showInvoice(o, false);
    const cancelButton = c.querySelector('[data-cancel]');
    if (cancelButton) cancelButton.onclick = async () => {
      if (!confirm('Cancel order ' + o.no + '? This cannot be undone.')) return;
      cancelButton.disabled = true;
      cancelButton.textContent = 'Cancelling…';
      try {
        await EJDatabase.cancelOrder(o.id);
        const history = store.get('ej_orders') || [];
        const cachedOrder = history.find(order => order.no === o.no);
        if (cachedOrder) {
          cachedOrder.status = 'Cancelled';
          store.set('ej_orders', history);
        }
        say('Order ' + o.no + ' cancelled');
        await renderOrders();
      } catch (error) {
        console.error('Unable to cancel customer order.', error);
        say(error.message || 'Unable to cancel this order.');
        cancelButton.disabled = false;
        cancelButton.textContent = 'Cancel Order';
      }
    };
    L.appendChild(c);
  });
}

function showInvoice(o, fresh) {
  lastOrder = o;
  $('invPaper').innerHTML = invHtml(o);
  document.querySelector('.inv-ok').innerHTML = fresh ? '&#10003; Order placed successfully' : 'Invoice ' + o.no;
  invOv.classList.add('open');
  invOv.scrollTop = 0;
}

function goOrders() {
  if (!store.get('ej_session')) {
    openLg();
    $('lgSub').textContent = 'Please login to see your orders';
    return;
  }
  setActive($('navOrders'));
  go('orders');
}

$('lgOrders').onclick = () => {
  closeLg();
  goOrders();
};
$('invMo').onclick = () => {
  invOv.classList.remove('open');
  goOrders();
  if (view === 'orders') renderOrders();
};

function adminProductsForCheckout() {
  return PRODUCTS
    .filter(p => p.stock !== undefined && p.stock !== null && p.stock !== '')
    .filter(p => {
      const saved = (store.get('ej_admin_products') || []).some(x => String(x.id) === String(p.id));
      return saved;
    });
}

EJDatabase.loadProducts().then(rows => {
  rows.forEach(row => {
    const current = PRODUCTS.find(product => String(product.id) === String(row.id));
    const savedAttrs = Array.isArray(row.attributes) ? row.attributes : [];
    const fitAttribute = savedAttrs.find(attribute => Array.isArray(attribute) && attribute[0] === 'Image fit');
    const product = {
      id: Number(row.id),
      name: row.name,
      cat: row.category,
      mat: row.material,
      price: cataloguePrice(row.price, row.id),
      img: row.image_url,
      desc: row.description || (current && current.desc) || '',
      attrs: savedAttrs.length
        ? savedAttrs.filter(attribute => !(Array.isArray(attribute) && attribute[0] === 'Image fit'))
        : (current && current.attrs) || [],
      stock: catalogueStock(row.stock, row.id),
      fit: fitAttribute?.[1] === 'contain' ? 'contain' : 'cover'
    };
    if (current) Object.assign(current, product);
    else PRODUCTS.push(product);
  });
  MAXP = Math.min(MAX_PRODUCT_PRICE, Math.max(500, Math.ceil(Math.max(...PRODUCTS.map(product => Number(product.price) || 0)) / 500) * 500));
  sMax = MAXP;
  renderStore();
  if (view === 'shop') renderShop();
}).catch(error => {
  console.error('Unable to load the Supabase product catalogue.', error);
  say('Database catalogue unavailable; showing the saved catalogue.');
});