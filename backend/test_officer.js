async function run() {
  const loginRes = await fetch('http://localhost:5001/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'officer@example.com', password: 'password123' })
  });
  const loginData = await loginRes.json();
  console.log('Login:', loginData);

  const token = loginData.token;

  const reqRes = await fetch('http://localhost:5001/api/v1/requirements', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const reqData = await reqRes.json();
  console.log('Requirements:', reqData);

  const shortRes = await fetch('http://localhost:5001/api/v1/shortlists', {
    headers: { 'Authorization': 'Bearer ' + token }
  });
  const shortData = await shortRes.json();
  console.log('Shortlists:', shortData);
}
run();
