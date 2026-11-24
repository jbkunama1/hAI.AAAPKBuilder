const { AUTH_USER, AUTH_PASSWORD, PORT = '4173' } = process.env;
if (!AUTH_USER || !AUTH_PASSWORD) process.exit(1);
try {
  const response = await fetch(`http://127.0.0.1:${PORT}/api/health`, {
    headers: { Authorization: 'Basic ' + Buffer.from(`${AUTH_USER}:${AUTH_PASSWORD}`, 'utf8').toString('base64') },
    signal: AbortSignal.timeout(10000),
    redirect: 'error'
  });
  if (!response.ok) process.exit(1);
} catch { process.exit(1); }
