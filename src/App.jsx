import { useState, useEffect } from "react";
import { Plus, ArrowRight, Wind, Banknote, Accessibility, Lock, LogOut, MessageCircle, Share2, Mail, X, Send, Check } from "lucide-react";
import { supabase } from "./supabaseClient";

const ADMIN_PASSWORD = "Pressone00123";

const ORG_NAME = "Bridge Relief";
const ORG_TAGLINE = "Helping Hands Network · Lifeline Aid";

// TODO: replace with your real contact email
const ORG_EMAIL = "help@yourorganization.org";

const AID_MIN = 5000;
const AID_MAX = 350000;

const REGIONS = [
  "Northeast US", "Southeast US", "Midwest US", "Southwest US", "West Coast US",
  "Alaska / Hawaii", "Canada", "UK & Ireland", "Europe", "Caribbean",
  "Central America", "South America", "Africa", "Asia", "Australia / Pacific", "Other"
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

function RequestCard({ req, onOpenThread, onShare, isAdmin, unreadCount }) {
  const meta = causeMeta[req.cause];
  const Icon = meta.icon;
  return (
    <article className="card">
      <div className="card-top">
        <span className="tag" style={{ "--tag-color": meta.color }}>
          <Icon size={14} strokeWidth={2.25} />
          {meta.label}
        </span>
        <span className="location">{req.region}</span>
      </div>
      {req.status === "resolved" && <span className="resolved-badge"><Check size={12} /> Marked resolved</span>}
      <h3 className="card-title">{req.title}</h3>
      <p className="card-name">— {req.name} · {timeAgo(req.createdAt)}</p>
      <p className="card-story">{req.story}</p>
      <div className="requested-amount">
        Requested support: <strong>${req.needed.toLocaleString()}</strong>
      </div>
      <div className="card-actions-secondary">
        <button className="btn-thread" onClick={() => onShare(req)}>
          <Share2 size={16} /> Share
        </button>
        <button className="btn-thread" onClick={() => onOpenThread(req)}>
          <MessageCircle size={16} />
          {isAdmin ? "Reply" : "Chat with us"}
          {unreadCount > 0 && <span className="unread-dot">{unreadCount}</span>}
        </button>
      </div>
    </article>
  );
}

function RequestForm({ onSubmit, onCancel }) {
  const [form, setForm] = useState({
    name: "", region: REGIONS[0], cause: "nature", title: "", story: "", needed: "", contact: "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.title || !form.story || !form.needed || !form.contact) {
      setError("Fill in your name, contact info, a short title, your story, and the amount you're requesting.");
      return;
    }
    const amount = Number(form.needed);
    if (!amount || amount < AID_MIN || amount > AID_MAX) {
      setError(Enter an amount between $${AID_MIN.toLocaleString()} and $${AID_MAX.toLocaleString()}.);
      return;
    }
    setError("");
    setSubmitting(true);
    await onSubmit({
      name: form.name,
      contact: form.contact,
      region: form.region,
      cause: form.cause,
      title: form.title,
      story: form.story,
      needed: amount,
    });
    setSubmitting(false);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <h2 className="form-heading">Tell us what happened</h2>
      <p className="form-sub">
        Share enough that our team understands your situation. Your story and region are shown publicly; your contact info and exact details are only visible to our team.
      </p>

      {error && <div className="form-error">{error}</div>}

      <label className="field">
        <span>Your name</span>
        <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Jordan Hayes" />
      </label>

      <label className="field">
        <span>Contact info (email or phone — private)</span>
        <input type="text" value={form.contact} onChange={(e) => update("contact", e.target.value)} placeholder="you@example.com" />
      </label>

      <label className="field">
        <span>Region</span>
        <select value={form.region} onChange={(e) => update("region", e.target.value)}>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </label>

      <label className="field">
        <span>What's affecting you?</span>
        <select value={form.cause} onChange={(e) => update("cause", e.target.value)}>
          <option value="nature">Natural disaster</option>
          <option value="government">Policy or funding cut</option>
          <option value="disability">Disability-related need</option>
        </select>
      </label>

      <label className="field">
        <span>Short title</span>
        <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Lost income after benefits were cut" maxLength={80} />
      </label>

      <label className="field">
        <span>Your story</span>
        <textarea rows={5} value={form.story} onChange={(e) => update("story", e.target.value)} placeholder="What happened, and what would this support help with?" />
      </label>

      <label className="field">
        <span>How much support are you requesting? (USD)</span>
        <input type="number" min={AID_MIN} max={AID_MAX} step="100" value={form.needed} onChange={(e) => update("needed", e.target.value)} placeholder="15000" />
        <span className="field-hint">We're able to provide between ${AID_MIN.toLocaleString()} and ${AID_MAX.toLocaleString()}, depending on the situation.</span>
      </label>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={submitting}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Posting..." : "Post request"}
        </button>
      </div>
    </form>
  );
}

function ShareModal({ request, onClose }) {
  const [copied, setCopied] = useState("");
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const caption = ${request.title} — ${request.name} is requesting support (${request.region}). Take a look and see how you can help: ${shareUrl};
  const canNativeShare = typeof navigator !== "undefined" && !!navigator.share;

  function copy(text, label) {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 2000);
    }
  }

  function openFacebook() {
    const url = https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)};
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function openX() {
    const url = https://twitter.com/intent/tweet?text=${encodeURIComponent(caption)};
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function nativeShare() {
    try {
      await navigator.share({ title: request.title, text: caption, url: shareUrl });
    } catch {
      // user cancelled or share failed silently
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="form-heading">Share this request</h2>
        <p className="form-sub">Help {request.name} reach more people.</p>

        <div className="share-options">
          <button className="share-btn fb" onClick={openFacebook}>Share to Facebook</button>
          <button className="share-btn x" onClick={openX}>Share to X (Twitter)</button>
          {canNativeShare && (
            <button className="share-btn native" onClick={nativeShare}>
              More apps (Instagram, TikTok, WhatsApp...)
            </button>
          )}
          <button className="share-btn copy" onClick={() => copy(shareUrl, "link")}>
            {copied === "link" ? "Link copied!" : "Copy link"}
          </button>
          <button className="share-btn copy" onClick={() => copy(caption, "caption")}>
            {copied === "caption" ? "Caption copied!" : "Copy caption for Instagram / TikTok"}
          </button>
        </div>

        <p className="share-note">
          Instagram and TikTok don't let other sites post directly with a link. Copy the caption above and paste it into your post, story, or video description.
        </p>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

function ThreadModal({ request, messages, isAdmin, onClose, onSend }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    await onSend(request.id, text.trim(), isAdmin ? "admin" : "requester");
    setText("");
    setSending(false);
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="thread-head">
          <div>
            <h2 className="form-heading">{request.title}</h2>
            <p className="form-sub" style={{ margin: 0 }}>
              {isAdmin
                ? Private chat with ${request.name}
                : "Chat with our team before we follow up by email"}
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="thread-messages">
          {messages.length === 0 && (
            <p className="thread-empty">
              {isAdmin
                ? "No messages yet. Send a note to start the conversation."
                : "No messages yet. Send us a note and our team will reply here."}
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={bubble ${m.from === "admin" ? "bubble-admin" : "bubble-requester"}}>
              <span className="bubble-from">{m.from === "admin" ? ORG_NAME : request.name}</span>
              <p>{m.text}</p>
              <span className="bubble-time">{new Date(m.ts).toLocaleString()}</span>
            </div>
          ))}
        </div>

        <form className="thread-input" onSubmit={submit}>
          <input
            type="text"
            placeholder={isAdmin ? "Reply to this person..." : "Type a message..."}
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={sending}
          />
          <button type="submit" className="icon-btn primary" disabled={sending}><Send size={16} /></button>
        </form>
      </div>
    </div>
  );
}

function AdminLogin({ onLogin, onClose }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  function submit(e) {
    e.preventDefault();
    if (pw === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError("Incorrect password.");
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2 className="form-heading">Owner login</h2>
        <p className="form-sub">Enter the admin password to manage requests and reply to people.</p>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={submit}>
          <label className="field">
            <span>Password</span>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          </label>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary">Log in</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function App() {
  const [requests, setRequests] = useState([]);
  const [threads, setThreads] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [threadTarget, setThreadTarget] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filter, setFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.title = ORG_NAME;
    }
  }, []);

  // Load requests + messages from Supabase on mount
  useEffect(() => {
    async function load() {
      const { data: reqData, error: reqError } = await supabase
        .from("requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (reqError) {
        setLoadError(true);
      } else if (reqData) {
        setRequests(
          reqData.map((r) => ({
            id: r.id,
            name: r.name,
            contact: r.contact,
            region: r.region,
            cause: r.cause,
            title: r.title,
            story: r.story,
            needed: r.needed,
            status: r.status,
            createdAt: new Date(r.created_at).getTime(),
          }))
        );
      }

      const { data: msgData, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (!msgError && msgData) {
        const grouped = {};
        msgData.forEach((m) => {
          if (!grouped[m.request_id]) grouped[m.request_id] = [];
          grouped[m.request_id].push({
            id: m.id,
            text: m.text,
            from: m.sender,
            ts: new Date(m.created_at).getTime(),
          });
        });
        setThreads(grouped);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleNewRequest(req) {
    const { data, error } = await supabase
      .from("requests")
      .insert({
        name: req.name,
        contact: req.contact,
        region: req.region,
        cause: req.cause,
        title: req.title,
        story: req.story,
        needed: req.needed,
        status: "open",
      })
      .select()
      .single();

    if (error || !data) {
      alert("Something went wrong submitting your request. Please try again.");
      return;
    }

    setRequests((r) => [
      {
        id: data.id,
        name: data.name,
        contact: data.contact,
        region: data.region,
        cause: data.cause,
        title: data.title,
        story: data.story,
        needed: data.needed,
        status: data.status,
        createdAt: new Date(data.created_at).getTime(),
      },
      ...r,
    ]);
    setShowForm(false);
  }

  async function handleSend(reqId, text, from) {
    const { data, error } = await supabase
      .from("messages")
      .insert({ request_id: reqId, text, sender: from })
      .select()
      .single();

    if (error || !data) return;

    setThreads((t) => {
      const existing = t[reqId] || [];
      return {
        ...t,
        [reqId]: [...existing, { id: data.id, text: data.text, from: data.sender, ts: new Date(data.created_at).getTime() }],
      };
    });
  }

  async function toggleResolved(reqId) {
    const current = requests.find((r) => r.id === reqId);
    if (!current) return;
    const newStatus = current.status === "resolved" ? "open" : "resolved";

    const { error } = await supabase
      .from("requests")
      .update({ status: newStatus })
      .eq("id", reqId);

    if (error) return;

    setRequests((rs) => rs.map((r) => (r.id === reqId ? { ...r, status: newStatus } : r)));
  }

  const visible = requests.filter((r) => {
    if (filter !== "all" && r.cause !== filter) return false;
    if (regionFilter !== "all" && r.region !== regionFilter) return false;
    return true;
  });

  const usedRegions = REGIONS.filter((r) => requests.some((req) => req.region === r));

  return (
    <div className="app">
      <header className="hero">
        <div className="hero-inner">
          <div className="brand">
            <span className="brand-name">{ORG_NAME}</span>
            <span className="brand-tagline">{ORG_TAGLINE}</span>
          </div>
          <div className="hero-topbar">
            <span className="eyebrow">Apply for support — our team reviews every request</span>
            {isAdmin ? (
              <button className="admin-pill" onClick={() => setIsAdmin(false)}>
                <LogOut size={14} /> Log out (owner)
              </button>
            ) : (
              <button className="admin-pill" onClick={() => setShowLogin(true)}>
                <Lock size={14} /> Owner login
              </button>
            )}
          </div>
          <h1 className="hero-title">
            Real help, <span className="accent">reviewed by real people.</span>
          </h1>
          <p className="hero-sub">
            If you've been affected by a natural disaster, a sudden loss of government support, or a disability-related need, tell us what's going on. Our team reviews every request directly and can provide support between ${AID_MIN.toLocaleString()} and ${AID_MAX.toLocaleString()}.
          </p>
          <div className="hero-actions">
            <button className="btn-primary large" onClick={() => setShowForm(true)}>
              <Plus size={18} /> Post your situation
            </button>
            <a className="btn-text" href="#requests">
              See open requests <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

      <div className="email-banner">
        <Mail size={16} />
        <span>
          Prefer email? Reach the {ORG_NAME} team directly at <a href={mailto:${ORG_EMAIL}}>{ORG_EMAIL}</a> — we'll also chat with you here first before any email follow-up.
        </span>
      </div>

      {loading && (
        <div className="info-banner">
          Loading requests…
        </div>
      )}

      {loadError && (
        <div className="save-warning">
          Couldn't connect to the database. Check your internet connection and reload the page.
        </div>
      )}

      <main id="requests" className="main">
        <div className="main-head">
          <h2 className="section-title">Support requests</h2>
          <div className="filters">
            <button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>All</button>
            <button className={filter === "nature" ? "active" : ""} onClick={() => setFilter("nature")}>
              <Wind size={14} /> Natural disaster
            </button>
            <button className={filter === "government" ? "active" : ""} onClick={() => setFilter("government")}>
              <Banknote size={14} /> Policy / funding cut
            </button>
            <button className={filter === "disability" ? "active" : ""} onClick={() => setFilter("disability")}>
              <Accessibility size={14} /> Disability support
            </button>
          </div>
        </div>

        <div className="region-filter">
          <span>Region:</span>
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}>
            <option value="all">All regions</option>
            {usedRegions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        {!loading && visible.length === 0 ? (
          <div className="empty">
            Nothing here yet for this filter. Be the first to post — your situation
            could be the one our team can help with next.
          </div>
        ) : (
          <div className="grid">
            {visible.map((req) => (
              <div key={req.id} className="card-wrap">
                <RequestCard
                  req={req}
                  onOpenThread={(r) => setThreadTarget(r)}
                  onShare={(r) => setShareTarget(r)}
                  isAdmin={isAdmin}
                  unreadCount={(threads[req.id] || []).length}
                />
                {isAdmin && (
                  <button className="resolve-toggle" onClick={() => toggleResolved(req.id)}>
                    {req.status === "resolved" ? "Mark as open" : "Mark resolved"}
                  </button>
                )}
                {isAdmin && req.contact && (
                  <div className="admin-contact">Contact: {req.contact}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Every request is reviewed by our team. We'll chat with you here, and may follow up by email to discuss next steps.</p>
      </footer>

      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <RequestForm onSubmit={handleNewRequest} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {shareTarget && (
        <ShareModal request={shareTarget} onClose={() => setShareTarget(null)} />
      )}

      {threadTarget && (
        <ThreadModal
          request={threadTarget}
          messages={threads[threadTarget.id] || []}
          isAdmin={isAdmin}
          onClose={() => setThreadTarget(null)}
          onSend={handleSend}
        />
      )}

      {showLogin && (
        <AdminLogin onLogin={() => { setIsAdmin(true); setShowLogin(false); }} onClose={() => setShowLogin(false)} />
      )}

      <style>{`
        * { box-sizing: border-box; }
        .app {
          font-family: 'Source Sans Pro', system-ui, -apple-system, sans-serif;
          background: #f7f4ee;
          color: #2b2a28;
          min-height: 100vh;
        }

        .hero {
          background: linear-gradient(135deg, #1f3d36 0%, #2f6f5e 60%, #3c8a73 100%);
          color: #f7f4ee;
          padding: 32px 24px 80px;
        }
        .hero-inner { max-width: 760px; margin: 0 auto; }
        .brand { display: flex; flex-direction: column; gap: 2px; margin-bottom: 18px; }
        .brand-name {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700; font-size: 1.5rem; letter-spacing: 0.01em; color: #f7f4ee;
        }
        .brand-tagline { font-size: 0.8rem; color: #cfe4dc; letter-spacing: 0.03em; }
        .hero-topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
        .eyebrow {
          font-family: Georgia, 'Times New Roman', serif;
          font-style: italic;
          font-size: 0.95rem;
          letter-spacing: 0.04em;
          opacity: 0.85;
        }
        .admin-pill {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(247,244,238,0.12);
          border: 1px solid rgba(247,244,238,0.3);
          color: #f7f4ee;
          padding: 6px 12px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
        }
        .admin-pill:hover { background: rgba(247,244,238,0.2); }
        .hero-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-weight: 700;
          font-size: clamp(2rem, 5vw, 3.2rem);
          line-height: 1.15;
          margin: 16px 0 20px;
        }
        .accent { color: #f2c879; }
        .hero-sub {
          font-size: 1.05rem;
          line-height: 1.6;
          max-width: 540px;
          opacity: 0.92;
          margin-bottom: 32px;
        }
        .hero-actions { display: flex; align-items: center; gap: 24px; flex-wrap: wrap; }

        .btn-primary {
          background: #f2c879;
          color: #1f3d36;
          border: none;
          font-weight: 700;
          font-size: 1rem;
          padding: 12px 22px;
          border-radius: 8px;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .btn-primary:hover { background: #f7d896; transform: translateY(-1px); }
        .btn-primary:disabled, .btn-secondary:disabled { opacity: 0.6; cursor: default; }
        .btn-primary.large { padding: 14px 26px; font-size: 1.05rem; }
        .btn-primary:focus-visible, .btn-secondary:focus-visible, .btn-text:focus-visible,
        .btn-thread:focus-visible, .icon-btn:focus-visible,
        .admin-pill:focus-visible { outline: 3px solid #f2c879; outline-offset: 2px; }

        .btn-text {
          color: #f7f4ee;
          font-weight: 600;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border-bottom: 1px solid rgba(247,244,238,0.4);
          padding-bottom: 2px;
        }
        .btn-text:hover { border-color: #f2c879; color: #f2c879; }

        .email-banner {
          background: #fff; border-bottom: 1px solid #e8e2d4;
          text-align: center; padding: 14px 24px; font-size: 0.9rem; color: #5b5648;
          display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap;
        }
        .email-banner a { color: #2f6f5e; font-weight: 700; text-decoration: none; border-bottom: 1px solid #2f6f5e; }
        .email-banner a:hover { color: #1f3d36; border-color: #1f3d36; }

        .save-warning {
          background: #fbeae6; color: #9a3b2e; text-align: center;
          padding: 10px 16px; font-size: 0.85rem; border-bottom: 1px solid #f3c9c0;
        }
        .info-banner {
          background: #eef5f1; color: #2f6f5e; text-align: center;
          padding: 10px 16px; font-size: 0.85rem; border-bottom: 1px solid #cfe4dc;
        }

        .main { max-width: 1080px; margin: 0 auto; padding: 56px 24px 40px; }
        .main-head {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 16px; margin-bottom: 16px;
        }
        .section-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.8rem;
          font-weight: 700;
          color: #1f3d36;
          margin: 0;
        }
        .filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .filters button {
          display: inline-flex; align-items: center; gap: 6px;
          background: #fff;
          border: 1px solid #ddd6c7;
          color: #5b5648;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .filters button.active { background: #2f6f5e; color: #fff; border-color: #2f6f5e; }

        .region-filter {
          display: flex; align-items: center; gap: 10px; margin-bottom: 28px;
          font-size: 0.85rem; font-weight: 600; color: #5b5648;
        }
        .region-filter select {
          border: 1px solid #ddd6c7; border-radius: 8px; padding: 6px 10px;
          background: #fff; font-size: 0.85rem; color: #2b2a28;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 24px;
        }

        .card-wrap { display: flex; flex-direction: column; gap: 8px; }

        .card {
          background: #fff;
          border: 1px solid #e8e2d4;
          border-radius: 14px;
          padding: 22px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .card-top { display: flex; justify-content: space-between; align-items: center; }
        .tag {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;
          color: var(--tag-color);
          background: color-mix(in srgb, var(--tag-color) 12%, white);
          padding: 4px 10px; border-radius: 999px;
        }
        .location { font-size: 0.8rem; color: #8a8474; }
        .resolved-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.75rem; font-weight: 700; color: #2f6f5e;
          background: #e7f1ec; padding: 3px 8px; border-radius: 999px; align-self: flex-start;
        }
        .card-title {
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 1.2rem; margin: 0; color: #1f3d36; line-height: 1.3;
        }
        .card-name { font-size: 0.85rem; color: #8a8474; margin: -4px 0 0; }
        .card-story { font-size: 0.92rem; line-height: 1.55; color: #4a463c; flex-grow: 1; }

        .requested-amount {
          font-size: 0.9rem; color: #5b5648;
          background: #f7f4ee; border-radius: 8px; padding: 8px 12px;
        }
        .requested-amount strong { color: #1f3d36; font-size: 1rem; }

        .card-actions-secondary { display: flex; gap: 8px; }
        .btn-thread {
          position: relative;
          background: #fbf9f4; color: #5b5648; border: 1px solid #ddd6c7;
          padding: 10px 14px; border-radius: 8px; font-weight: 700; cursor: pointer;
          display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem;
          flex: 1; justify-content: center;
        }
        .btn-thread:hover { background: #f0ece0; }
        .unread-dot {
          background: #c0563f; color: #fff; font-size: 0.7rem; font-weight: 700;
          border-radius: 999px; padding: 0 5px; min-width: 16px; text-align: center;
        }

        .share-options { display: flex; flex-direction: column; gap: 8px; margin-bottom: 12px; }
        .share-btn {
          border: 1px solid #ddd6c7; border-radius: 8px; padding: 10px 14px;
          font-weight: 700; font-size: 0.9rem; cursor: pointer; text-align: left;
          background: #fbf9f4; color: #2b2a28;
        }
        .share-btn:hover { background: #f0ece0; }
        .share-btn.fb { background: #e7f0fb; border-color: #c9ddf5; color: #1d4d8c; }
        .share-btn.fb:hover { background: #d9e9fb; }
        .share-btn.x { background: #eef0f2; border-color: #d6dbe0; color: #1c1f23; }
        .share-btn.x:hover { background: #e2e6ea; }
        .share-btn.native { background: #f1ece0; border-color: #e3d8c2; color: #6b4f1f; }
        .share-btn.native:hover { background: #ece4d2; }
        .share-note { font-size: 0.8rem; color: #8a8474; line-height: 1.5; margin: 0 0 16px; }

        .resolve-toggle, .admin-contact {
          font-size: 0.78rem; font-weight: 600; color: #5b5648;
          background: #fff; border: 1px solid #ddd6c7; border-radius: 8px;
          padding: 6px 10px; text-align: center; cursor: pointer;
        }
        .admin-contact { cursor: default; color: #8a8474; }
        .resolve-toggle:hover { background: #f0ece0; }

        .empty {
          background: #fff; border: 1px dashed #ddd6c7; border-radius: 12px;
          padding: 32px; text-align: center; color: #8a8474; font-size: 0.95rem;
        }

        .footer { text-align: center; padding: 32px 24px 48px; color: #8a8474; font-size: 0.85rem; }

        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(31,61,54,0.5);
          display: flex; align-items: center; justify-content: center;
          padding: 16px; z-index: 50;
        }
        .modal {
          background: #fff; border-radius: 16px; padding: 28px;
          max-width: 460px; width: 100%; max-height: 90vh; overflow-y: auto;
          display: flex; flex-direction: column;
        }

        .form-heading { font-family: Georgia, 'Times New Roman', serif; font-size: 1.4rem; color: #1f3d36; margin: 0 0 6px; }
        .form-sub { font-size: 0.9rem; color: #6b6658; margin: 0 0 18px; line-height: 1.5; }
        .form-error {
          background: #fbeae6; color: #9a3b2e; border: 1px solid #f3c9c0;
          padding: 10px 12px; border-radius: 8px; font-size: 0.85rem; margin-bottom: 14px;
        }
        .field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; font-size: 0.85rem; font-weight: 600; color: #3a362e; }
        .field input, .field textarea, .field select {
          font-family: inherit; font-size: 0.95rem; font-weight: 400;
          border: 1px solid #ddd6c7; border-radius: 8px; padding: 10px 12px;
          background: #fbf9f4; color: #2b2a28;
        }
        .field input:focus, .field textarea:focus, .field select:focus {
          outline: 2px solid #2f6f5e; outline-offset: 1px; background: #fff;
        }
        .field-hint { font-size: 0.78rem; font-weight: 400; color: #8a8474; line-height: 1.4; }

        .form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
        .btn-secondary {
          background: transparent; border: 1px solid #ddd6c7; color: #5b5648;
          padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer;
        }
        .btn-secondary:hover { background: #f7f4ee; }

        .thread-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .icon-btn {
          background: #fbf9f4; border: 1px solid #ddd6c7; border-radius: 8px;
          padding: 8px; cursor: pointer; color: #5b5648; display: flex;
        }
        .icon-btn:hover { background: #f0ece0; }
        .icon-btn.primary { background: #2f6f5e; color: #fff; border-color: #2f6f5e; }
        .icon-btn.primary:hover { background: #1f3d36; }

        .thread-messages {
          display: flex; flex-direction: column; gap: 10px;
          max-height: 280px; overflow-y: auto; margin-bottom: 14px; padding-right: 4px;
        }
        .thread-empty { font-size: 0.88rem; color: #8a8474; text-align: center; padding: 24px 0; }
        .bubble {
          padding: 10px 12px; border-radius: 10px; font-size: 0.9rem; max-width: 85%;
          display: flex; flex-direction: column; gap: 2px;
        }
        .bubble p { margin: 0; line-height: 1.45; }
        .bubble-from { font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; opacity: 0.7; }
        .bubble-time { font-size: 0.7rem; opacity: 0.55; align-self: flex-end; }
        .bubble-admin { background: #2f6f5e; color: #fff; align-self: flex-start; }
        .bubble-requester { background: #fbf9f4; color: #2b2a28; border: 1px solid #e8e2d4; align-self: flex-end; }

        .thread-input { display: flex; gap: 8px; }
        .thread-input input {
          flex: 1; border: 1px solid #ddd6c7; border-radius: 8px; padding: 10px 12px;
          font-size: 0.9rem; background: #fbf9f4; color: #2b2a28; font-family: inherit;
        }
        .thread-input input:focus { outline: 2px solid #2f6f5e; outline-offset: 1px; background: #fff; }

        @media (prefers-reduced-motion: reduce) {
          .btn-primary { transition: none; }
        }
      `}</style>
    </div>
  );
}
