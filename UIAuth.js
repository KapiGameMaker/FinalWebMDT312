function showLogin() {
    document.querySelector('.welcome-screen').style.display = 'none';
    document.querySelector('.register-screen').style.display = 'none';
    document.querySelector('.login-screen').style.display = 'block';
}

function showRegister() {
    document.querySelector('.welcome-screen').style.display = 'none';
    document.querySelector('.login-screen').style.display = 'none';
    document.querySelector('.register-screen').style.display = 'block';
}
