// assets/js/auth.js
$(function(){
  // Register
  $('#registerForm').on('submit', function(e){
    e.preventDefault();
    const data = {
      username: $('#reg_username').val(),
      email: $('#reg_email').val(),
      password: $('#reg_password').val(),
      activation_code: $('#reg_code').val()
    };
    $.ajax({
      url: `${API_BASE_URL}/api/register`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success(res) {
        toastr.success(res.message || 'Register berhasil');
        setTimeout(()=> window.location.href = '/login.html', 1200);
      },
      error(err) {
        const msg = err.responseJSON?.error || err.responseJSON?.message || 'Register gagal';
        toastr.error(msg);
      }
    });
  });

  // Login
  $('#loginForm').on('submit', function(e){
    e.preventDefault();
    const data = {
      email: $('#login_email').val(),
      password: $('#login_password').val()
    };
    $.ajax({
      url: `${API_BASE_URL}/api/login`,
      method: 'POST',
      contentType: 'application/json',
      data: JSON.stringify(data),
      success(res) {
        // server returns apikey in property apikey
        const key = res.apikey || res.api_key || res.token;
        if (!key) {
          toastr.error('Response login tidak mengandung api key');
          return;
        }
        localStorage.setItem('api_key', key);
        toastr.success('Login berhasil');
        setTimeout(()=> window.location.href = '/index.html', 800);
      },
      error(err) {
        const msg = err.responseJSON?.error || 'Login gagal';
        toastr.error(msg);
      }
    });
  });

  // Logout button
  $('#btnLogout').on('click', function(){
    localStorage.removeItem('api_key');
    window.location.href = '/login.html';
  });

});
