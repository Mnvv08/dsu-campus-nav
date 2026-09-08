var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.js
var MODEL = "claude-haiku-4-5-20251001";
var ALLOWED = [
  "https://mnvv08.github.io",
  "http://localhost:5173"
];
var MAX_MESSAGE = 500;
var MAX_TURNS = 12;
var WINDOW_MS = 6e4;
var PER_WINDOW = 15;
var hits = /* @__PURE__ */ new Map();
function rateLimited(ip) {
  const now = Date.now();
  const rec = hits.get(ip);
  if (!rec || now - rec.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 });
    return false;
  }
  rec.count += 1;
  return rec.count > PER_WINDOW;
}
__name(rateLimited, "rateLimited");
function cors(origin) {
  const allow = ALLOWED.includes(origin) ? origin : ALLOWED[0];
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}
__name(cors, "cors");
var json = /* @__PURE__ */ __name((body, status, headers) => new Response(JSON.stringify(body), {
  status,
  headers: { "Content-Type": "application/json", ...headers }
}), "json");
function buildSystem(places) {
  const lines = places.map((p) => {
    const bits = [p.name];
    if (p.aliases?.length) bits.push(`also called ${p.aliases.join(", ")}`);
    bits.push(`category: ${p.category}`);
    bits.push(`at ${p.lat},${p.lng}`);
    if (p.confidence !== "confirmed") bits.push("UNVERIFIED location");
    if (p.notes) bits.push(p.notes);
    if (p.units?.length) {
      bits.push(
        "inside: " + p.units.map((u) => `${u.name} (floor ${u.floor ?? 0})`).join("; ")
      );
    }
    return "- " + bits.join(" | ");
  });
  return `You help people find their way around the Dayananda Sagar University campus at Devarakaggalahalli, Harohalli, Kanakapura Road, Bengaluru. The campus is about 162 acres, so walking distances are long and the difference between two buildings can be a ten-minute walk.

Places on the map:
${lines.join("\n")}

Rules you must follow:

1. Only describe places from the list above. If someone asks about somewhere not listed, say plainly that it is not on the map yet and suggest they ask at the main gate. Never invent a building, a location, a direction, or a floor.
2. If a place is marked UNVERIFIED, say so when you point someone to it.
3. Reply in the same language the person wrote in. If they write in Kannada, reply in Kannada; Hindi, reply in Hindi; the same for Tamil, Telugu, Malayalam, Marathi, Gujarati, Bengali, Urdu, English or anything else. Match their script too, including romanised Indian languages.
4. Keep answers short. Two or three sentences. Someone is reading this while standing outside with a bag.
5. You do not know class timings, fees, staff names, admission requirements, or anything not in the list. Say so and point them to the university office rather than guessing.
6. For a medical emergency, tell them to contact campus security immediately rather than walking anywhere.

Be warm and practical. Most people asking are new here and slightly lost.`;
}
__name(buildSystem, "buildSystem");
var index_default = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") ?? "";
    const headers = cors(origin);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (request.method !== "POST") {
      return json({ error: "Use POST." }, 405, headers);
    }
    if (!ALLOWED.includes(origin)) {
      return json({ error: "Not an allowed origin." }, 403, headers);
    }
    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    if (rateLimited(ip)) {
      return json({ error: "Too many messages. Wait a minute." }, 429, headers);
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Malformed request." }, 400, headers);
    }
    const { messages, places } = body;
    if (!Array.isArray(messages) || !messages.length) {
      return json({ error: "No messages sent." }, 400, headers);
    }
    if (!Array.isArray(places)) {
      return json({ error: "No place data sent." }, 400, headers);
    }
    const trimmed = messages.slice(-MAX_TURNS).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content ?? "").slice(0, MAX_MESSAGE)
    }));
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 400,
          system: buildSystem(places),
          messages: trimmed
        })
      });
      if (!res.ok) {
        return json({ error: "The assistant is unavailable right now." }, 502, headers);
      }
      const data = await res.json();
      const reply = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text).join("\n").trim();
      return json({ reply }, 200, headers);
    } catch {
      return json({ error: "The assistant could not be reached." }, 502, headers);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
