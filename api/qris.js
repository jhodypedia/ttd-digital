export default async function handler(req, res) {
  // Log di console Vercel
  console.log("📥 Request diterima:", {
    method: req.method,
    headers: req.headers,
    body: req.body
  });

  // URL backend asli (IP & HTTP)
  const backendUrl = "http://151.240.0.221:3000/api/qris/listener";

  try {
    // Forward request ke backend asli
    const fetchRes = await fetch(backendUrl, {
      method: req.method,
      headers: {
        ...req.headers,
        host: undefined // hapus host header bawaan Vercel
      },
      body: req.method !== "GET" && req.method !== "HEAD"
        ? JSON.stringify(req.body)
        : undefined
    });

    const data = await fetchRes.text();

    // Log respons di console Vercel
    console.log("📤 Response dari backend:", data);

    // Kirim balik ke client (Android)
    res.status(fetchRes.status).send(data);

  } catch (err) {
    console.error("❌ Error forwarding:", err);
    res.status(500).json({ error: "Gagal menghubungi backend" });
  }
}
