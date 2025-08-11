/* main.js - frontend single script for auth, deposit, history, profile, polling */
const API_BASE = "/api"; // <-- GANTI ke backend VPS kamu (no trailing slash)

$(function(){
  // handy
  function apiHeaders() {
    const k = localStorage.getItem('api_key');
    return k ? { 'x-api-key': k } : {};
  }
  function formatRp(n){ return n==null?'-':'Rp '+Number(n).toLocaleString('id-ID'); }
  function isLoggedIn(){ return !!localStorage.getItem('api_key'); }
  function requireLogin(redirectTo='/login'){ if(!isLoggedIn()){ window.location.href = redirectTo; return false;} return true; }

  // GLOBAL: logout button
  $('#btnLogout').on('click', ()=> {
    localStorage.removeItem('api_key');
    toastr.info('Anda telah logout');
    setTimeout(()=> location.href = '/login', 400);
  });

  // If on login page
  if ($('#loginForm').length){
    // auto redirect if already logged in
    if (isLoggedIn()) { window.location.href = '/'; return; }

    $('#loginForm').on('submit', function(e){
      e.preventDefault();
      const data = { email: $('#login_email').val(), password: $('#login_password').val() };
      $.ajax({
        url: `${API_BASE}/api/login`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success(res){
          const key = res.apikey || res.api_key || res.token;
          if (!key) { toastr.error('Response tidak mengandung api key'); return; }
          localStorage.setItem('api_key', key);
          toastr.success('Login berhasil');
          setTimeout(()=> location.href='/', 600);
        },
        error(err){
          const m = err.responseJSON?.message || err.responseText || 'Login gagal';
          toastr.error(m);
        }
      });
    });
  }

  // If on register page
  if ($('#registerForm').length){
    if (isLoggedIn()){ window.location.href = '/'; return; }
    $('#registerForm').on('submit', function(e){
      e.preventDefault();
      const data = {
        username: $('#reg_username').val(),
        email: $('#reg_email').val(),
        password: $('#reg_password').val(),
        activation_code: $('#reg_code').val()
      };
      $.ajax({
        url: `${API_BASE}/api/register`,
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify(data),
        success(res){ toastr.success(res.message || 'Register berhasil'); setTimeout(()=> location.href='/login',800); },
        error(err){ toastr.error(err.responseJSON?.message || 'Register gagal'); }
      });
    });
  }

  // If on index (dashboard)
  if ($('body').find('#welcomeName').length){
    if (!requireLogin('/login')) return;
    // load profile
    $.ajax({ url: `${API_BASE}/api/profile`, method: 'GET', headers: apiHeaders(),
      success(res){
        $('#welcomeName').text(res.username || res.email || 'User');
        $('#userName').text(res.username || res.email || '-');
        $('#userBalance').text(formatRp(res.saldo || res.balance || 0));
        $('#bigBalance').text(formatRp(res.saldo || res.balance || 0));
      },
      error(){ toastr.warning('Gagal memuat profil'); }
    });
  }

  // Deposit page
  if ($('#createQRISForm').length){
    if (!requireLogin('/login')) return;
    $('#createQRISForm').on('submit', function(e){
      e.preventDefault();
      const amount = Number($('#amount').val());
      if (!amount || amount < 100) { toastr.error('Masukkan nominal valid'); return; }
      $('#createQRISForm button').prop('disabled', true);
      $.ajax({
        url: `${API_BASE}/api/deposit`,
        method: 'POST',
        contentType: 'application/json',
        headers: apiHeaders(),
        data: JSON.stringify({ amount }),
        success(res){
          toastr.success('QRIS berhasil dibuat');
          const qr = res.qrImage || res.qr_image || res.qrimage || res.qr;
          const depositId = res.depositId || res.deposit_id || res.depositId;
          const amt = res.amount || res.total || amount;
          const exp = res.expired_at || res.expiredAt || res.expires;

          $('#qrisImage').attr('src', qr);
          $('#qrisAmount').text(formatRp(amt));
          $('#qrisDepositId').text(depositId);
          $('#qrisExpired').text(exp ? new Date(exp).toLocaleString() : '-');
          $('#qrisResult').show();
          // polling for status
          startPollDeposit(depositId);
        },
        error(err){ toastr.error(err.responseJSON?.message || 'Gagal membuat deposit'); },
        complete(){ $('#createQRISForm button').prop('disabled', false); }
      });
    });
  }

  // Poll deposit status
  let pollTimer = null;
  function startPollDeposit(depositId){
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(async ()=>{
      try{
        const res = await $.ajax({ url: `${API_BASE}/api/deposit/status/${depositId}`, method:'GET', headers: apiHeaders() });
        const status = (res.payment_status || res.status || '').toString().toLowerCase();
        if (status === 'success' || status === 'sukses'){
          toastr.success('Pembayaran terkonfirmasi');
          $('#qrisStatus').html('<span class="badge bg-success badge-status">SUCCESS</span>');
          clearInterval(pollTimer);
        } else if (status === 'rejected' || status === 'reject'){
          toastr.error('Pembayaran ditolak');
          $('#qrisStatus').html('<span class="badge bg-danger badge-status">REJECTED</span>');
          clearInterval(pollTimer);
        } else {
          $('#qrisStatus').html('<span class="badge bg-warning badge-status">PENDING</span>');
        }
      }catch(e){
        console.error('poll error', e);
      }
    }, 4000);
  }

  // Riwayat page
  if ($('#depositsList').length){
    if (!requireLogin('/login')) return;
    loadHistory();
  }
  function loadHistory(){
    $.when(
      $.ajax({ url: `${API_BASE}/api/deposits`, method: 'GET', headers: apiHeaders() }),
      $.ajax({ url: `${API_BASE}/api/mutations`, method: 'GET', headers: apiHeaders() })
    ).done(function(depsRes, mutsRes){
      const deps = depsRes[0] || depsRes;
      const muts = mutsRes[0] || mutsRes;
      const $d = $('#depositsList').empty();
      (deps || []).forEach(d=>{
        const tr = `<tr>
          <td>${d.deposit_id || d.depositId}</td>
          <td>${formatRp(d.amount)}</td>
          <td>${d.kode_unik||d.kodeUniq||''}</td>
          <td>${(d.status||'').toUpperCase()}</td>
          <td>${new Date(d.created_at||d.datetime||d.createdAt).toLocaleString()}</td>
        </tr>`;
        $d.append(tr);
      });
      const $m = $('#mutationsList').empty();
      (muts || []).forEach(m=>{
        const tr = `<tr>
          <td>${m.id||m.mutation_id||''}</td>
          <td>${m.type||m.tx_type||''}</td>
          <td>${formatRp(m.amount)}</td>
          <td>${formatRp(m.balance_after||m.balance)}</td>
          <td>${new Date(m.created_at||m.datetime||m.time).toLocaleString()}</td>
        </tr>`;
        $m.append(tr);
      });
    }).fail(function(){ toastr.error('Gagal memuat riwayat'); });
  }

  // Allow direct access to /login when user already logged in: redirect to dashboard
  if (window.location.pathname === '/login.html' || window.location.pathname === '/login'){
    if (isLoggedIn()) window.location.href = '/';
  }
  if (window.location.pathname === '/' || window.location.pathname === '/index.html'){
    if (!isLoggedIn()) window.location.href = '/login';
  }

}); // end ready
