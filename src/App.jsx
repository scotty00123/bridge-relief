import { useState, useEffect } from "react";
import { Plus, ArrowRight, Wind, Banknote, Accessibility, Lock, LogOut, MessageCircle, Share2, Check, X } from "lucide-react";
import { supabase } from "./supabaseClient";
import "./App.css";

const ADMIN_PASSWORD = "Pressone00123";
const ORG_NAME = "Bridge Relief";
const ORG_TAGLINE = "Helping Hands Network · Lifeline Aid";
const ORG_EMAIL = "bridgerelief.help@gmail.com";
const AID_MIN = 5000;
const AID_MAX = 350000;

const REGIONS = [
  "Northeast US","Southeast US","Midwest US","Southwest US","West Coast US",
  "Alaska / Hawaii","Canada","UK & Ireland","Europe","Caribbean",
  "Central America","South America","Africa","Asia","Australia / Pacific"
];

const causeMeta = {
  nature: { label: "Natural disaster", icon: Wind, color: "#2f6f5e" },
  government: { label: "Policy / funding cut", icon: Banknote, color: "#9a5b2e" },
  disability: { label: "Disability support", icon: Accessibility, color: "#3a6ea5" },
};

function timeAgo(ts) {
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  return days + " days ago";
}

async function sendNotification(type, data) {
  try {
    await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, ...data })
    });
  } catch (e) {
    console.log("Notification error:", e);
  }
}

const LogoSVG = () => (
  <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="19" r="13" fill="#40916c"/>
    <ellipse cx="24" cy="19" rx="5.5" ry="13" fill="#2d6a4f"/>
    <line x1="11" y1="19" x2="37" y2="19" stroke="#95d5b2" strokeWidth="1.5"/>
    <line x1="24" y1="6" x2="24" y2="32" stroke="#95d5b2" strokeWidth="1.5"/>
    <path d="M13 35 Q24 28 35 35 Q35 45 24 45 Q13 45 13 35Z" fill="#b7e4c7"/>
    <path d="M19 38 Q24 34 29 38" stroke="#40916c" strokeWidth="1.2" fill="none"/>
  </svg>
);

function AboutModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: "600px" }}>
        <h2 className="form-heading">About Bridge Relief</h2>
        <p className="form-sub" style={{ fontStyle: "italic", color: "#2d6a4f" }}>Bridging the gap between need and hope since 2009</p>
        <p style={{ marginBottom: "16px", lineHeight: "1.7", color: "#333" }}>Bridge Relief is a humanitarian aid platform dedicated to connecting individuals and families in crisis with the support they need to rebuild their lives. What began as a small community initiative over 15 years ago has grown into a trusted global network that has helped over 30,000 people across the world.</p>
        <h3 style={{ color: "#1b4332", marginBottom: "8px", fontFamily: "Merriweather, serif" }}>Our Mission</h3>
        <p style={{ marginBottom: "16px", lineHeight: "1.7", color: "#333" }}>To ensure that no person facing hardship is left without a lifeline. We believe that every hand extended brings someone closer to hope.</p>
        <h3 style={{ color: "#1b4332", marginBottom: "8px", fontFamily: "Merriweather, serif" }}>What We Offer</h3>
        <ul style={{ marginBottom: "16px", paddingLeft: "20px", lineHeight: "2", color: "#333" }}>
          <li>🌪️ <strong>Disaster Relief</strong> — Support for those affected by natural disasters</li>
          <li>💼 <strong>Employment Crisis</strong> — Aid for those who have lost their income</li>
          <li>♿ <strong>Disability Support</strong> — Assistance for those with disability-related needs</li>
          <li>🏥 <strong>Medical Aid</strong> — Help for those facing urgent health challenges</li>
          <li>🏛️ <strong>Policy & Funding Cuts</strong> — Support for those affected by government changes</li>
        </ul>
        <h3 style={{ color: "#1b4332", marginBottom: "8px", fontFamily: "Merriweather, serif" }}>How It Works</h3>
        <p style={{ marginBottom: "16px", lineHeight: "1.7", color: "#333" }}>Submit your request confidentially. Our review team carefully evaluates every submission with dignity and care. Approved requests receive direct support and follow-up communication.</p>
        <h3 style={{ color: "#1b4332", marginBottom: "8px", fontFamily: "Merriweather, serif" }}>Our Promise</h3>
        <p style={{ marginBottom: "20px", lineHeight: "1.7", color: "#333" }}>Every request is reviewed privately. Your story stays safe with us. 🌿</p>
        <div className="form-actions">
          <button className="btn-primary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function RequestCard({ req, onOpenThread, onShare, isAdmin, unreadCount, myRequestId }) {
  const meta = causeMeta[req.cause];
  const Icon = meta.icon;
  const isMyRequest = myRequestId === req.id;
  return (
    <article className="card">
      <div className="card-top">
        <span className="tag" style={{ "--tag-color": meta.color }}>
          <Icon size={13} strokeWidth={2.25} />
          {meta.label}
        </span>
        <span className="location">{req.region}</span>
      </div>
      {req.status === "resolved" && <span className="resolved-badge"><Check size={12} /> Resolved</span>}
      {req.photoUrl && (
        <img src={req.photoUrl} alt={req.name} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", marginBottom: "8px", border: "2px solid #b7e4c7" }} />
      )}
      <h3 className="card-title">{req.title}</h3>
      <p className="card-name">— {req.name} · {timeAgo(req.createdAt)}</p>
      {req.age && <p style={{ fontSize: "0.8rem", color: "#666", marginBottom: "4px" }}>Age: {req.age} · {req.occupation} · {req.maritalStatus}</p>}
      <p className="card-story">{req.story}</p>
      <div className="requested-amount">
        Requested support: <strong>${req.needed.toLocaleString()}</strong>
      </div>
      <div className="card-actions-secondary">
        <button className="btn-thread" onClick={() => onShare(req)}>
          <Share2 size={15} /> Share
        </button>
        {(isAdmin || isMyRequest) && (
          <button className="btn-thread" onClick={() => onOpenThread(req)}>
            <MessageCircle size={15} />
            {isAdmin ? "Reply" : "Chat with us"}
            {unreadCount > 0 && <span className="unread-dot">{unreadCount}</span>}
          </button>
        )}
      </div>
    </article>
  );
}

function RequestForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "", region: REGIONS[0], cause: "nature", title: "", story: "",
    needed: "", contact: "", age: "", occupation: "", maritalStatus: "Single"
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  function update(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function handlePhoto(e) {
    const file = e.target.files[0];
    if (file) { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); }
  }

  async function handleSubmit() {
    if (!form.name || !form.title || !form.story || !form.needed || !form.contact) {
      setError("Fill in your name, contact info, a short title, your story, and the amount.");
      return;
    }
    const amount = Number(form.needed);
    if (!amount || amount < AID_MIN || amount > AID_MAX) {
      setError("Enter an amount between $" + AID_MIN.toLocaleString() + " and $" + AID_MAX.toLocaleString() + ".");
      return;
    }
    setError("");
    setSubmitting(true);

    let photoUrl = null;
    if (photoFile) {
      const fileName = Date.now() + "_" + photoFile.name;
      const { data: uploadData } = await supabase.storage.from("photos").upload(fileName, photoFile);
      if (uploadData) {
        const { data: urlData } = supabase.storage.from("photos").getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
    }

    await onSubmit({
      name: form.name, contact: form.contact, region: form.region,
      cause: form.cause, title: form.title, story: form.story,
      needed: amount, age: form.age, occupation: form.occupation,
      maritalStatus: form.maritalStatus, photoUrl
    });
    setSubmitting(false);
  }

  return (
    <div className="modal" onClick={e => e.stopPropagation()}>
      <h2 className="form-heading">Tell us what happened</h2>
      <p className="form-sub">Share enough that our team understands your situation. Your story and contact info stay private.</p>
      {error && <div className="form-error">{error}</div>}
      <div style={{ textAlign: "center", marginBottom: "16px" }}>
        <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "#d8f3dc", margin: "0 auto 8px", overflow: "hidden", border: "2px solid #b7e4c7", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {photoPreview ? <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: "2rem" }}>📷</span>}
        </div>
        <label style={{ cursor: "pointer", color: "#2d6a4f", fontSize: "0.85rem", fontWeight: "600" }}>
          Upload photo (optional)
          <input type="file" accept="image/*" onChange={handlePhoto} style={{ display: "none" }} />
        </label>
      </div>
      <label className="field"><span>Your name</span><input type="text" value={form.name} onChange={e => update("name", e.target.value)} /></label>
      <label className="field"><span>Contact info (email or phone – private)</span><input type="text" value={form.contact} onChange={e => update("contact", e.target.value)} /></label>
      <label className="field"><span>Age</span><input type="number" value={form.age} onChange={e => update("age", e.target.value)} placeholder="Your age" /></label>
      <label className="field"><span>Occupation / Employment status</span>
        <select value={form.occupation} onChange={e => update("occupation", e.target.value)}>
          <option value="">Select...</option>
          <option>Employed</option>
          <option>Unemployed</option>
          <option>Self-employed</option>
          <option>Retired</option>
          <option>Before retirement</option>
          <option>Student</option>
          <option>Unable to work due to disability</option>
          <option>Other</option>
        </select>
      </label>
      <label className="field"><span>Marital status</span>
        <select value={form.maritalStatus} onChange={e => update("maritalStatus", e.target.value)}>
          <option>Single</option>
          <option>Married</option>
          <option>Divorced</option>
          <option>Widowed</option>
          <option>Separated</option>
        </select>
      </label>
      <label className="field"><span>Region</span>
        <select value={form.region} onChange={e => update("region", e.target.value)}>
          {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>
      <label className="field"><span>What's affecting you?</span>
        <select value={form.cause} onChange={e => update("cause", e.target.value)}>
          <option value="nature">Natural disaster</option>
          <option value="government">Policy or funding cut</option>
          <option value="disability">Disability-related need</option>
        </select>
      </label>
      <label className="field"><span>Short title</span><input type="text" value={form.title} onChange={e => update("title", e.target.value)} /></label>
      <label className="field"><span>Your story</span><textarea rows={5} value={form.story} onChange={e => update("story", e.target.value)} /></label>
      <label className="field">
        <span>How much support are you requesting? (USD)</span>
        <input type="number" min={AID_MIN} max={AID_MAX} step="100" value={form.needed} onChange={e => update("needed", e.target.value)} />
        <span className="field-hint">We're able to provide between ${AID_MIN.toLocaleString()} and ${AID_MAX.toLocaleString()}.</span>
      </label>
      <div className="form-actions">
        <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" disabled={submitting} onClick={handleSubmit}>
          {submitting ? "Posting..." : "Post request"}
        </button>
      </div>
    </div>
  );
}

function ShareModal({ request, onClose }) {
  const [copied, setCopied] = useState("");
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const caption = request.title + " – " + request.name + " is requesting support ($" + request.needed.toLocaleString() + "). " + request.story.slice(0, 100) + "...";
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  function copy(text, label) {
    if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(text); setCopied(label); setTimeout(() => setCopied(""), 2000); }
  }
  function openFacebook() { window.open("https://www.facebook.com/sharer/sharer.php?u=" + encodeURIComponent(shareUrl), "_blank", "noopener,noreferrer"); }
  function openX() { window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(caption) + "&url=" + encodeURIComponent(shareUrl), "_blank", "noopener,noreferrer"); }
  async function nativeShare() { try { await navigator.share({ title: request.title, text: caption, url: shareUrl }); } catch {} }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="form-heading">Share this request</h2>
        <p className="form-sub">Help {request.name} reach more people.</p>
        <div className="share-options">
          <button className="share-btn fb" onClick={openFacebook}>Share to Facebook</button>
          <button className="share-btn x" onClick={openX}>Share to X (Twitter)</button>
          {canNativeShare && <button className="share-btn native" onClick={nativeShare}>More apps (Instagram, TikTok, WhatsApp...)</button>}
          <button className="share-btn copy" onClick={() => copy(shareUrl, "link")}>{copied === "link" ? "Link copied!" : "Copy link"}</button>
          <button className="share-btn copy" onClick={() => copy(caption, "caption")}>{copied === "caption" ? "Caption copied!" : "Copy caption"}</button>
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ThreadModal({ request, messages, isAdmin, onClose, onSend }) {
  const [text, setText] = useState("");
  async function send() { if (!text.trim()) return; await onSend(text.trim()); setText(""); }
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal thread-modal" onClick={e => e.stopPropagation()}>
        <h2 className="form-heading">{isAdmin ? "Reply to " + request.name : "Chat with us"}</h2>
        {isAdmin && (
          <div style={{ background: "#f0faf4", border: "1px solid #b7e4c7", borderRadius: "8px", padding: "12px", marginBottom: "16px", fontSize: "0.85rem", color: "#1b4332" }}>
            <strong>📋 Requester Details</strong>
            <p style={{ margin: "6px 0 2px" }}>📧 <strong>Contact:</strong> {request.contact}</p>
            {request.age && <p style={{ margin: "2px 0" }}>🎂 <strong>Age:</strong> {request.age}</p>}
            {request.occupation && <p style={{ margin: "2px 0" }}>💼 <strong>Occupation:</strong> {request.occupation}</p>}
            {request.maritalStatus && <p style={{ margin: "2px 0" }}>💍 <strong>Marital Status:</strong> {request.maritalStatus}</p>}
            <p style={{ margin: "2px 0" }}>🌍 <strong>Region:</strong> {request.region}</p>
            <p style={{ margin: "2px 0" }}>💰 <strong>Requested:</strong> ${request.needed.toLocaleString()}</p>
          </div>
        )}
        <div className="thread-messages">
          {messages.length === 0 && <p className="empty-thread">No messages yet.</p>}
          {messages.map(m => (
            <div key={m.id} className={"thread-msg " + (m.fromAdmin ? "from-admin" : "from-user")}>
              <span className="thread-sender">{m.fromAdmin ? "Bridge Relief Team" : request.name}</span>
              <p>{m.body}</p>
              <span className="thread-time">{timeAgo(m.createdAt)}</span>
            </div>
          ))}
        </div>
        <div className="thread-input">
          <input type="text" placeholder="Type a message..." value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} />
          <button className="btn-primary" onClick={send}>Send</button>
        </div>
        <div className="form-actions">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  function attempt() { if (pw === ADMIN_PASSWORD) { onLogin(); } else { setErr("Incorrect password."); } }
  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2 className="form-heading">Admin login</h2>
        {err && <div className="form-error">{err}</div>}
        <label className="field"><span>Password</span>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && attempt()} />
        </label>
        <div className="form-actions">
          <button className="btn-primary" onClick={attempt}>Login</button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [threadReq, setThreadReq] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [shareReq, setShareReq] = useState(null);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [filterCause, setFilterCause] = useState("all");
  const [filterRegion, setFilterRegion] = useState("all");
  const [filterStatus, setFilterStatus] = useState("open");
  const [myRequestId, setMyRequestId] = useState(() => {
    try { return localStorage.getItem("myRequestId") || null; } catch { return null; }
  });

  const showAdminButton = typeof window !== "undefined" && window.location.search.includes("admin");

  useEffect(() => { loadRequests(); }, []);

  async function loadRequests() {
    const { data } = await supabase.from("requests").select("*").order("createdAt", { ascending: false });
    if (data) setRequests(data);
    if (isAdmin) {
      const { data: msgs } = await supabase.from("messages").select("requestId, fromAdmin");
      if (msgs) {
        const counts = {};
        msgs.filter(m => !m.fromAdmin).forEach(m => { counts[m.requestId] = (counts[m.requestId] || 0) + 1; });
        setUnreadCounts(counts);
      }
    }
  }

  async function handleSubmit(data) {
    const { data: inserted, error } = await supabase.from("requests").insert([{ ...data, status: "open", createdAt: Date.now() }]).select();
    if (!error && inserted && inserted[0]) {
      const newId = inserted[0].id;
      setMyRequestId(newId);
      try { localStorage.setItem("myRequestId", newId); } catch {}
      setShowForm(false);
      setSubmitted(true);
      loadRequests();
      await sendNotification("new_request", { name: data.name, title: data.title, contact: data.contact });
    }
  }

  async function openThread(req) {
    setThreadReq(req);
    const { data } = await supabase.from("messages").select("*").eq("requestId", req.id).order("createdAt", { ascending: true });
    setThreadMessages(data || []);
  }

  async function sendMessage(body) {
    if (!threadReq) return;
    await supabase.from("messages").insert([{ requestId: threadReq.id, body, fromAdmin: isAdmin, createdAt: Date.now() }]);
    const { data } = await supabase.from("messages").select("*").eq("requestId", threadReq.id).order("createdAt", { ascending: true });
    setThreadMessages(data || []);
    if (isAdmin && threadReq.contact) {
      await sendNotification("admin_reply", { name: threadReq.name, contact: threadReq.contact });
    }
  }

  async function resolveRequest(req) {
    await supabase.from("requests").update({ status: "resolved" }).eq("id", req.id);
    loadRequests();
  }

  const filtered = requests.filter(r => {
    if (filterCause !== "all" && r.cause !== filterCause) return false;
    if (filterRegion !== "all" && r.region !== filterRegion) return false;
    if (filterStatus === "open" && r.status !== "open") return false;
    if (filterStatus === "resolved" && r.status !== "resolved") return false;
    return true;
  });

  return (
    <div className="app">
      <header className="header">
        <div className="header-inner">
          <div className="brand" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <LogoSVG />
            <div>
              <h1>{ORG_NAME}</h1>
              <p className="tagline">{ORG_TAGLINE}</p>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={() => setShowAbout(true)}>About</button>
            {isAdmin ? (
              <button className="btn-ghost" onClick={() => setIsAdmin(false)}><LogOut size={15} /> Sign out</button>
            ) : (
              showAdminButton && (
                <button className="btn-ghost" onClick={() => setShowAdminLogin(true)}><Lock size={15} /> Admin</button>
              )
            )}
            <button className="btn-primary" onClick={() => { setShowForm(true); setSubmitted(false); }}>
              🌿 Request aid
            </button>
          </div>
        </div>
      </header>

      <div className="hero">
        <h2>"Every hand extended brings someone closer to hope"</h2>
        <p>Submit your aid request confidentially. We review every submission with care and dignity.</p>
      </div>

      <main className="main">
        {submitted && (
          <div className="success-banner">
            <Check size={18} /> Your request was submitted! Our team will review it privately. You can now use the Chat button on your request to communicate with us. 🌿
          </div>
        )}

        <div className="filters">
          <select value={filterCause} onChange={e => setFilterCause(e.target.value)}>
            <option value="all">All causes</option>
            <option value="nature">Natural disaster</option>
            <option value="government">Policy / funding cut</option>
            <option value="disability">Disability support</option>
          </select>
          <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}>
            <option value="all">All regions</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="open">Open</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {filtered.length === 0 && (
          <div className="empty">
            <p>No requests match your filters.</p>
            <button className="btn-primary" onClick={() => { setShowForm(true); setSubmitted(false); }}>
              Be the first to post <ArrowRight size={15} />
            </button>
          </div>
        )}

        <div className="cards">
          {filtered.map(req => (
            <div key={req.id}>
              <RequestCard req={req} onOpenThread={openThread} onShare={setShareReq} isAdmin={isAdmin} unreadCount={unreadCounts[req.id] || 0} myRequestId={myRequestId} />
              {isAdmin && req.status === "open" && (
                <button className="btn-resolve" onClick={() => resolveRequest(req)}>
                  <Check size={13} /> Mark resolved
                </button>
              )}
            </div>
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>All requests are reviewed privately. Contact us: <a href={"mailto:" + ORG_EMAIL}>{ORG_EMAIL}</a></p>
      </footer>

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <RequestForm onSubmit={handleSubmit} onCancel={() => setShowForm(false)} />
        </div>
      )}
      {showAdminLogin && <AdminLogin onLogin={() => { setIsAdmin(true); setShowAdminLogin(false); loadRequests(); }} />}
      {threadReq && <ThreadModal request={threadReq} messages={threadMessages} isAdmin={isAdmin} onClose={() => setThreadReq(null)} onSend={sendMessage} />}
      {shareReq && <ShareModal request={shareReq} onClose={() => setShareReq(null)} />}
    </div>
  );
}
