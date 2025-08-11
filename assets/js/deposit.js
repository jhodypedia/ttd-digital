// assets/js/deposit.js
$(function(){
  // if on deposit.html, populate user profile
  if ($('#depositPage').length) {
    loadProfile();
  }

  $('#createQRISForm').on('submit', function(e){
    e.preventDefault();
    const amount = Number($('#amount').val());
    if (!amount || amount <= 0) { toastr.error('Masukkan nominal valid'); return; }

    $.ajax({
      url: `${API_BASE_URL}/api/deposit`,
      method: 'POST',
      contentType: 'application/json',
      headers: authHeaders(),
      data: JSON.stringify({ amount }),
      success(res) {
        toastr.success('QRIS berhasil dibuat');
        // Expecting response: depositId, amount, qrImage (or qr_image), expiredAt/datetime
        const qr = res.qrImage || res.qr_image || res.qrimage || res.qr;
        const depositId = res.depositId || res.deposit_id;
        const amt = res.amount || res.total || amount;
        const dt = res.datetime || res.created_at || new Date().toISOString();

        $('#createQRISForm').hide();
        $('#qrisResult').show();
        $('#qrisImage').attr('src', qr);
        $('#qrisAmount').text(formatRupiah(amt));
        $('#qrisDepositId').text(depositId);
        $('#qrisDatetime').text(new Date(dt).toLocaleString());
        // start polling status every 5s
        startPollStatus(depositId);
      },
      error(err) {
        const msg = err.responseJSON?.error || 'Gagal membuat QRIS';
        toastr.error(msg);
      }
    });
  });

  // status polling
  let pollInterval = null;
  function startPollStatus(depositId) {
    if (pollInterval) clearInterval(pollInterval);
    pollInterval = setInterval(async () => {
      try {
        const res = await $.ajax({
          url: `${API_BASE_URL}/api/deposit/${depositId}`,
          method: 'GET',
          headers: authHeaders()
        });
        const status = (res.status || res.payment_status || res.paymentStatus || res.status_text || '').toLowerCase();
        if (status === 'success' || status === 'sukses') {
          toastr.success('Pembayaran terdeteksi: SUCCESS');
          clearInterval(pollInterval);
          $('#qrisResult .badge-status').remove();
          $('#qrisResult').append('<div class="badge bg-success mt-2">SUCCESS</div>');
        } else if (status === 'rejected' || status === 'reject') {
          toastr.error('Pembayaran ditolak oleh admin');
          clearInterval(pollInterval);
          $('#qrisResult').append('<div class="badge bg-danger mt-2">REJECTED</div>');
        } else {
          // still pending
          console.log('status pending');
        }
      } catch (e) {
        console.error('poll error', e);
      }
    }, 5000);
  }

  async function loadProfile() {
    try {
      const res = await $.ajax({ url: `${API_BASE_URL}/api/profile`, method: 'GET', headers: authHeaders() });
      $('#userName').text(res.username || res.email || 'User');
      $('#userBalance').text(formatRupiah(res.saldo || res.balance || 0));
    } catch (err) {
      console.error('load profile failed', err);
    }
  }
});
