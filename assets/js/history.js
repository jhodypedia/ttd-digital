// assets/js/history.js
$(function(){
  if ($('#historyPage').length) loadHistory();

  async function loadHistory() {
    try {
      const deps = await $.ajax({ url: `${API_BASE_URL}/api/deposits`, method: 'GET', headers: authHeaders() });
      const muts = await $.ajax({ url: `${API_BASE_URL}/api/mutations`, method: 'GET', headers: authHeaders() });

      const $dlist = $('#depositsList').empty();
      deps.forEach(d => {
        const r = `<tr>
          <td>${d.deposit_id || d.depositId}</td>
          <td>${formatRupiah(d.amount)}</td>
          <td>${(d.kode_unik||'')}</td>
          <td>${d.status}</td>
          <td>${new Date(d.created_at||d.datetime||d.createdAt).toLocaleString()}</td>
        </tr>`;
        $dlist.append(r);
      });

      const $mlist = $('#mutationsList').empty();
      muts.forEach(m => {
        const r = `<tr>
          <td>${m.id || m.mutasi_id}</td>
          <td>${m.type}</td>
          <td>${formatRupiah(m.amount)}</td>
          <td>${formatRupiah(m.balance_after || m.balance)}</td>
          <td>${new Date(m.created_at||m.datetime).toLocaleString()}</td>
        </tr>`;
        $mlist.append(r);
      });

    } catch (err) {
      toastr.error('Gagal memuat history');
      console.error(err);
    }
  }
});
