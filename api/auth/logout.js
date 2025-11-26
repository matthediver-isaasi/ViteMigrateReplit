export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Clear auth cookie
  res.setHeader('Set-Cookie', 'memberId=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Strict');
  
  return res.json({ success: true });
}
