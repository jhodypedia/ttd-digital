// assets/js/common.js
const apiKey = () => localStorage.getItem('api_key') || null;

function authHeaders() {
  const k = apiKey();
  return k ? { 'x-api-key': k } : {};
}

function formatRupiah(n) {
  if (n == null) return '-';
  return 'Rp ' + Number(n).toLocaleString('id-ID');
}

// global ajax setup to include API_BASE_URL if using relative url (not used here)
