import React, { useState, useEffect, useRef } from "react";
import { Plus, Check, X, ListTodo, StickyNote, Trash2, CalendarPlus, Users, AtSign, Pencil, ClipboardPaste, Search, Download, AlertCircle, Upload } from "lucide-react";

const fontStyle = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@300;400;500;600&display=swap');

body { font-family: 'Inter', sans-serif; }
.font-display { font-family: 'Fraunces', serif; font-optical-sizing: auto; }
.font-italic-serif { font-family: 'Fraunces', serif; font-style: italic; }

::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #d6cfc2; border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: #b8ae9c; }
`;

const STORAGE_KEYS = {
  tasks: "assistant:tasks",
  notes: "assistant:notes",
  contacts: "assistant:contacts",
};

export default function App() {
  const [tab, setTab] = useState("tasks");

  // Manual event form state
  const [showEventForm, setShowEventForm] = useState(false);
  const todayISO = new Date().toISOString().slice(0, 10);
  const [eventDraft, setEventDraft] = useState({
    title: "",
    date: todayISO,
    time: "10:00",
    duration: 60,
    location: "",
    guests: [],
  });

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [justAddedTask, setJustAddedTask] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editTaskText, setEditTaskText] = useState("");

  // Notes state
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState("");

  // Contacts state
  const [contacts, setContacts] = useState([]);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [editingContactId, setEditingContactId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [importSummary, setImportSummary] = useState(null); // null | { imported, dupSkipped, invalidSkipped, error? }
  const csvFileInputRef = useRef(null);

  // --- Load persisted data on mount ---
  useEffect(() => {
    try {
      const t = localStorage.getItem(STORAGE_KEYS.tasks);
      const n = localStorage.getItem(STORAGE_KEYS.notes);
      const c = localStorage.getItem(STORAGE_KEYS.contacts);
      if (t !== null) setTasks(JSON.parse(t));
      if (n !== null) setNotes(JSON.parse(n));
      if (c !== null) setContacts(JSON.parse(c));
    } catch (e) {
      console.error("Load error", e);
    }
  }, []);

  // Save helpers — keep saving/saved/error UX; quota errors can still throw
  const [saveStatus, setSaveStatus] = useState(null); // null | "saving" | "saved" | "error:<msg>"
  const persist = (key, value) => {
    try {
      setSaveStatus("saving");
      localStorage.setItem(key, JSON.stringify(value));
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus((s) => (s === "saved" ? null : s)), 1500);
    } catch (e) {
      setSaveStatus(`error:${e?.message || "unknown"}`);
    }
  };
  const saveTasks = (next) => {
    setTasks(next);
    persist(STORAGE_KEYS.tasks, next);
  };
  const saveNotes = (next) => {
    setNotes(next);
    persist(STORAGE_KEYS.notes, next);
  };
  const saveContacts = (next) => {
    setContacts(next);
    persist(STORAGE_KEYS.contacts, next);
  };

  // Export contacts as a downloadable file — safety net
  const exportContacts = () => {
    const text = contacts.map((c) => `${c.name}, ${c.email}`).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // --- Tasks ---
  const addTask = () => {
    const t = newTask.trim();
    if (!t) return;
    const task = { id: Date.now(), text: t, done: false, ts: Date.now() };
    saveTasks([task, ...tasks]);
    setNewTask("");
    setJustAddedTask(task);
  };
  const toggleTask = (id) =>
    saveTasks(tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeTask = (id) => saveTasks(tasks.filter((t) => t.id !== id));
  const startEditTask = (t) => {
    setEditingTaskId(t.id);
    setEditTaskText(t.text);
  };
  const saveEditTask = () => {
    const text = editTaskText.trim();
    if (!text) return;
    saveTasks(tasks.map((t) => (t.id === editingTaskId ? { ...t, text } : t)));
    setEditingTaskId(null);
    setEditTaskText("");
  };
  const cancelEditTask = () => {
    setEditingTaskId(null);
    setEditTaskText("");
  };

  // --- Notes ---
  const addNote = () => {
    const n = newNote.trim();
    if (!n) return;
    saveNotes([{ id: Date.now(), text: n, ts: Date.now() }, ...notes]);
    setNewNote("");
  };
  const removeNote = (id) => saveNotes(notes.filter((n) => n.id !== id));

  // --- Contacts ---
  const addContact = () => {
    const name = newContactName.trim();
    const email = newContactEmail.trim();
    if (!name || !email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    saveContacts([{ id: Date.now(), name, email }, ...contacts]);
    setNewContactName("");
    setNewContactEmail("");
  };
  const removeContact = (id) => saveContacts(contacts.filter((c) => c.id !== id));
  const startEdit = (c) => {
    setEditingContactId(c.id);
    setEditName(c.name);
    setEditEmail(c.email);
  };
  const saveEdit = () => {
    const name = editName.trim();
    const email = editEmail.trim();
    if (!name || !email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    saveContacts(contacts.map((c) => (c.id === editingContactId ? { ...c, name, email } : c)));
    setEditingContactId(null);
  };
  const cancelEdit = () => setEditingContactId(null);

  const parseBulkContacts = (text) => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const out = [];
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const line of lines) {
      let name = "";
      let email = "";
      // "Name <email>"
      let m = line.match(/^(.+?)\s*<([^>]+)>\s*$/);
      if (m) {
        name = m[1].trim().replace(/^["']|["']$/g, "");
        email = m[2].trim();
      } else {
        // "Name, email" or "Name;email" or tab-separated
        m = line.match(/^(.+?)\s*[,;\t]\s*(\S+@\S+)\s*$/);
        if (m) {
          name = m[1].trim().replace(/^["']|["']$/g, "");
          email = m[2].trim();
        } else if (emailRe.test(line)) {
          email = line;
          name = line.split("@")[0];
        }
      }
      if (name && emailRe.test(email)) out.push({ name, email });
    }
    return out;
  };

  const runBulkImport = () => {
    const parsed = parseBulkContacts(bulkText);
    if (parsed.length === 0) return;
    const existing = new Set(contacts.map((c) => c.email.toLowerCase()));
    const fresh = parsed.filter((p) => !existing.has(p.email.toLowerCase()));
    const now = Date.now();
    const next = [
      ...fresh.map((p, i) => ({ id: now + i, name: p.name, email: p.email })),
      ...contacts,
    ];
    saveContacts(next);
    setBulkText("");
    setShowBulkImport(false);
  };

  // CSV contact import — accepts common name/email column headers (Google, Outlook, Apple, etc.)
  const handleImportCSV = async (file) => {
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length < 2) {
        setImportSummary({ error: "Couldn't parse the file. Make sure it's a valid CSV with a header row." });
        return;
      }
      const header = rows[0].map((h) => (h || "").trim().toLowerCase());
      const findCol = (candidates) => {
        for (const label of candidates) {
          const idx = header.indexOf(label.toLowerCase());
          if (idx !== -1) return idx;
        }
        return -1;
      };
      const emailIdx = findCol([
        "e-mail 1 - value", "email", "e-mail", "email address", "e-mail address",
        "primary email", "email 1", "work email", "home email",
      ]);
      const nameIdx = findCol(["name", "full name", "display name", "contact name"]);
      const givenIdx = findCol(["given name", "first name"]);
      const familyIdx = findCol(["family name", "last name", "surname"]);

      if (emailIdx === -1) {
        setImportSummary({ error: "This CSV doesn't have an email column. Expected a header like Email or E-mail 1 - Value." });
        return;
      }
      if (nameIdx === -1 && givenIdx === -1 && familyIdx === -1) {
        setImportSummary({ error: "This CSV doesn't have a name column. Expected Name, Full Name, or Given/Family Name." });
        return;
      }

      const existing = new Set(contacts.map((c) => c.email.toLowerCase()));
      const pending = new Set();
      const fresh = [];
      let dupSkipped = 0;
      let invalidSkipped = 0;
      const now = Date.now();

      for (let r = 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.every((c) => (c || "").trim() === "")) continue;

        const emailRaw = row[emailIdx] ? row[emailIdx].trim() : "";
        // Some exports stuff multiple emails into one cell joined by " ::: " (Google) or ";" (Outlook)
        const email = emailRaw.split(/\s*(?::::|;)\s*/)[0].trim();
        if (!email || !emailRe.test(email)) {
          invalidSkipped++;
          continue;
        }
        const emailKey = email.toLowerCase();
        if (existing.has(emailKey) || pending.has(emailKey)) {
          dupSkipped++;
          continue;
        }

        let name = nameIdx >= 0 && row[nameIdx] ? row[nameIdx].trim() : "";
        if (!name) {
          const given = givenIdx >= 0 && row[givenIdx] ? row[givenIdx].trim() : "";
          const family = familyIdx >= 0 && row[familyIdx] ? row[familyIdx].trim() : "";
          name = [given, family].filter(Boolean).join(" ").trim();
        }
        if (!name) name = email.split("@")[0];

        fresh.push({ id: now + fresh.length, name, email });
        pending.add(emailKey);
      }

      if (fresh.length > 0) {
        saveContacts([...contacts, ...fresh]);
      }
      setImportSummary({ imported: fresh.length, dupSkipped, invalidSkipped });
    } catch (e) {
      console.error("CSV import error", e);
      setImportSummary({ error: "Couldn't parse the file. Make sure it's a valid CSV with a header row." });
    }
  };

  // Cross-script normalizer: Greek → Latin, strip diacritics, lowercase
  // Lets "stella" match "Στέλλα" and vice versa
  const GREEK_TO_LATIN = {
    α: "a", β: "v", γ: "g", δ: "d", ε: "e", ζ: "z",
    η: "i", θ: "th", ι: "i", κ: "k", λ: "l", μ: "m",
    ν: "n", ξ: "x", ο: "o", π: "p", ρ: "r",
    σ: "s", ς: "s", τ: "t", υ: "y", φ: "f",
    χ: "ch", ψ: "ps", ω: "o",
  };
  const normalizeForSearch = (s) => {
    const base = (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    let out = "";
    for (const ch of base) out += GREEK_TO_LATIN[ch] ?? ch;
    return out;
  };

  const filteredContacts = (() => {
    const q = normalizeForSearch(contactSearch.trim());
    if (!q) return contacts;
    return contacts.filter(
      (c) => normalizeForSearch(c.name).includes(q) || normalizeForSearch(c.email).includes(q)
    );
  })();

  const formatTime = (ts) => {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Detect contact names mentioned in a task text
  const findMatchingContacts = (text) => {
    if (!text || contacts.length === 0) return [];
    const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const matched = [];
    for (const c of contacts) {
      const nameNorm = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      // First name or full name — match any whitespace-separated token
      const tokens = nameNorm.split(/\s+/).filter((t) => t.length >= 3);
      for (const tok of tokens) {
        const esc = tok.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(
          `(?<![\\p{L}\\p{N}])${esc}[\\p{L}]{0,3}(?![\\p{L}\\p{N}])`,
          "u"
        );
        if (re.test(norm)) {
          matched.push(c);
          break;
        }
      }
    }
    return matched;
  };
  const gcalUrl = (ev) => {
    const toGcal = (iso) => {
      const d = new Date(iso);
      if (isNaN(d)) return "";
      return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    };
    const start = toGcal(ev.start);
    const endIso = ev.end || new Date(new Date(ev.start).getTime() + 60 * 60 * 1000).toISOString();
    const end = toGcal(endIso);
    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: ev.title || "",
      dates: `${start}/${end}`,
    });
    if (ev.description) params.set("details", ev.description);
    if (ev.location) params.set("location", ev.location);
    if (ev.guests && ev.guests.length > 0) {
      params.set("add", ev.guests.join(","));
    }
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const formatEventTime = (ev) => {
    const s = new Date(ev.start);
    const e = ev.end ? new Date(ev.end) : new Date(s.getTime() + 60 * 60 * 1000);
    if (isNaN(s)) return "";
    const dateStr = s.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
    const timeStr = `${s.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${e.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
    return `${dateStr} · ${timeStr}`;
  };

  const tabs = [
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "notes", label: "Notes", icon: StickyNote },
    { id: "people", label: "People", icon: Users },
  ];

  const openTasks = tasks.filter((t) => !t.done).length;

  return (
    <div className="min-h-screen w-full" style={{ background: "#f5f1e8" }}>
      <style>{fontStyle}</style>

      {/* Decorative grain overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="max-w-2xl mx-auto px-5 py-8 relative">
        {/* Header */}
        <header className="mb-10">
          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase" style={{ color: "#9a8f7a" }}>
                Personal · Assistant
              </p>
              <h1 className="font-display text-4xl mt-1 leading-none" style={{ color: "#2b2820", fontWeight: 400 }}>
                Good <span className="font-italic-serif">{greeting()}</span>.
              </h1>
            </div>
            {openTasks > 0 && tab !== "tasks" && (
              <button
                onClick={() => setTab("tasks")}
                className="text-xs px-3 py-1.5 rounded-full transition"
                style={{ background: "#2b2820", color: "#f5f1e8" }}
              >
                {openTasks} open
              </button>
            )}
          </div>
        </header>

        {/* Tab bar */}
        <nav className="flex gap-1 mb-6 p-1 rounded-full" style={{ background: "#ebe4d3" }}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full text-sm transition-all"
                style={{
                  background: active ? "#f5f1e8" : "transparent",
                  color: active ? "#2b2820" : "#7a7260",
                  boxShadow: active ? "0 1px 3px rgba(43,40,32,0.08)" : "none",
                  fontWeight: active ? 500 : 400,
                }}
              >
                <Icon size={15} strokeWidth={1.8} />
                {t.label}
              </button>
            );
          })}
        </nav>

        {/* TASKS */}
        {tab === "tasks" && (
          <section>
            <div className="flex gap-2 mb-5">
              <input
                value={newTask}
                onChange={(e) => setNewTask(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addTask()}
                placeholder="Add a task…"
                className="flex-1 px-4 py-3 rounded-2xl outline-none text-[15px]"
                style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              />
              <button
                onClick={addTask}
                disabled={!newTask.trim()}
                className="w-11 h-11 rounded-full flex items-center justify-center transition disabled:opacity-30"
                style={{ background: "#2b2820", color: "#f5f1e8" }}
              >
                <Plus size={18} strokeWidth={2} />
              </button>
            </div>

            {justAddedTask && (
              <div
                className="mb-5 px-4 py-3 rounded-2xl flex items-center justify-between gap-3"
                style={{ background: "#2b2820", color: "#f5f1e8" }}
              >
                <span className="text-sm flex-1 truncate">
                  <span className="font-italic-serif" style={{ opacity: 0.7 }}>Added.</span>{" "}
                  Schedule it?
                </span>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => {
                      const parsed = parseDateFromText(justAddedTask.text);
                      const matched = findMatchingContacts(justAddedTask.text);
                      setEventDraft({
                        title: justAddedTask.text,
                        date: parsed.date || todayISO,
                        time: parsed.time || "10:00",
                        duration: 60,
                        location: "",
                        guests: matched.map((c) => c.email),
                      });
                      setShowEventForm(true);
                      setJustAddedTask(null);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "#f5f1e8", color: "#2b2820" }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setJustAddedTask(null)}
                    className="text-xs px-3 py-1.5 rounded-full"
                    style={{ background: "transparent", color: "#f5f1e8", border: "1px solid #5a5448" }}
                  >
                    No
                  </button>
                </div>
              </div>
            )}

            {tasks.length === 0 && (
              <p className="text-center py-16 font-italic-serif text-xl" style={{ color: "#9a8f7a" }}>
                Nothing on the list.
              </p>
            )}

            <ul className="space-y-2">
              {tasks.map((t) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-3 px-4 py-3 rounded-xl transition"
                  style={{
                    background: t.done ? "transparent" : "#fbf8f0",
                    border: `1px solid ${t.done ? "transparent" : "#e8e1cf"}`,
                  }}
                >
                  <button
                    onClick={() => toggleTask(t.id)}
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition"
                    style={{
                      border: `1.5px solid ${t.done ? "#2b2820" : "#b8ae9c"}`,
                      background: t.done ? "#2b2820" : "transparent",
                    }}
                  >
                    {t.done && <Check size={12} strokeWidth={3} style={{ color: "#f5f1e8" }} />}
                  </button>
                  {editingTaskId === t.id ? (
                    <>
                      <input
                        value={editTaskText}
                        onChange={(e) => setEditTaskText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveEditTask();
                          else if (e.key === "Escape") cancelEditTask();
                        }}
                        placeholder="Task…"
                        className="flex-1 min-w-0 px-3 py-1.5 rounded-lg outline-none text-[15px]"
                        style={{ background: "#f5f1e8", border: "1px solid #e8e1cf", color: "#2b2820" }}
                        autoFocus
                      />
                      <button
                        onClick={saveEditTask}
                        disabled={!editTaskText.trim()}
                        className="transition disabled:opacity-30"
                        style={{ color: "#2b2820" }}
                        title="Save"
                      >
                        <Check size={16} strokeWidth={2} />
                      </button>
                      <button
                        onClick={cancelEditTask}
                        className="transition"
                        style={{ color: "#9a8f7a" }}
                        title="Cancel"
                      >
                        <X size={16} strokeWidth={1.8} />
                      </button>
                    </>
                  ) : (
                    <>
                      <span
                        className="flex-1 text-[15px]"
                        style={{
                          color: t.done ? "#9a8f7a" : "#2b2820",
                          textDecoration: t.done ? "line-through" : "none",
                        }}
                      >
                        {t.text}
                      </span>
                      {!t.done && (
                        <button
                          onClick={() => {
                            const parsed = parseDateFromText(t.text);
                            const matched = findMatchingContacts(t.text);
                            setEventDraft({
                              title: t.text,
                              date: parsed.date || todayISO,
                              time: parsed.time || "10:00",
                              duration: 60,
                              location: "",
                              guests: matched.map((c) => c.email),
                            });
                            setShowEventForm(true);
                          }}
                          className="opacity-60 hover:opacity-100 transition"
                          style={{ color: "#7a7260" }}
                          title="Schedule this"
                        >
                          <CalendarPlus size={15} strokeWidth={1.8} />
                        </button>
                      )}
                      <button
                        onClick={() => startEditTask(t)}
                        style={{ color: "#7a7260" }}
                        title="Edit"
                      >
                        <Pencil size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={() => removeTask(t.id)}
                        style={{ color: "#9a8f7a" }}
                        title="Delete"
                      >
                        <X size={16} strokeWidth={1.8} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* NOTES */}
        {tab === "notes" && (
          <section>
            <div className="mb-5">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) addNote();
                }}
                placeholder="Capture a thought… (⌘+Enter to save)"
                rows={3}
                className="w-full px-4 py-3 rounded-2xl outline-none text-[15px] resize-none"
                style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={addNote}
                  disabled={!newNote.trim()}
                  className="text-sm px-4 py-1.5 rounded-full transition disabled:opacity-30"
                  style={{ background: "#2b2820", color: "#f5f1e8" }}
                >
                  Save note
                </button>
              </div>
            </div>

            {notes.length === 0 && (
              <p className="text-center py-16 font-italic-serif text-xl" style={{ color: "#9a8f7a" }}>
                No notes yet.
              </p>
            )}

            <div className="space-y-3">
              {notes.map((n) => (
                <div
                  key={n.id}
                  className="group p-4 rounded-xl relative"
                  style={{ background: "#fbf8f0", border: "1px solid #e8e1cf" }}
                >
                  <p className="text-[15px] leading-relaxed whitespace-pre-wrap" style={{ color: "#2b2820" }}>
                    {n.text}
                  </p>
                  <div className="flex justify-between items-center mt-3 pt-3" style={{ borderTop: "1px solid #ebe4d3" }}>
                    <span className="text-xs" style={{ color: "#9a8f7a" }}>
                      {formatTime(n.ts)}
                    </span>
                    <button
                      onClick={() => removeNote(n.id)}
                      style={{ color: "#9a8f7a" }}
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* PEOPLE */}
        {tab === "people" && (
          <section>
            {saveStatus && saveStatus.startsWith("error:") && (
              <div
                className="mb-4 px-4 py-3 rounded-2xl flex items-start gap-2"
                style={{ background: "#fdecea", border: "1px solid #f5c1ba", color: "#8b2215" }}
              >
                <AlertCircle size={16} strokeWidth={1.8} className="mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <strong>Save failed:</strong> {saveStatus.slice(6)}
                  <br />
                  <span className="text-xs">Use Export below to back up your data.</span>
                </div>
              </div>
            )}
            {saveStatus === "saved" && (
              <div
                className="mb-4 px-4 py-2 rounded-full inline-flex items-center gap-2 text-xs"
                style={{ background: "#2b2820", color: "#f5f1e8" }}
              >
                <Check size={12} strokeWidth={2.5} /> Saved
              </div>
            )}
            <div className="flex items-start justify-between gap-3 mb-4">
              <p className="text-sm flex-1" style={{ color: "#7a7260" }}>
                Add people you mention often. They'll be auto-detected in tasks and added as calendar guests.
              </p>
              <div className="flex flex-wrap gap-2 justify-end flex-shrink-0">
                {contacts.length > 0 && (
                  <button
                    onClick={exportContacts}
                    className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition"
                    style={{ background: "#ebe4d3", color: "#2b2820" }}
                    title="Export contacts as backup"
                  >
                    <Download size={12} strokeWidth={1.8} />
                    Export
                  </button>
                )}
                <button
                  onClick={() => setShowBulkImport(true)}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition"
                  style={{ background: "#ebe4d3", color: "#2b2820" }}
                >
                  <ClipboardPaste size={12} strokeWidth={1.8} />
                  Paste list
                </button>
                <button
                  onClick={() => csvFileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-full transition"
                  style={{ background: "#ebe4d3", color: "#2b2820" }}
                  title="Import contacts from a CSV file"
                >
                  <Upload size={12} strokeWidth={1.8} />
                  Import CSV
                </button>
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportCSV(file);
                    e.target.value = "";
                  }}
                />
              </div>
            </div>
            <div className="space-y-2 mb-5">
              <input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="Name"
                className="w-full px-4 py-3 rounded-2xl outline-none text-[15px]"
                style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              />
              <div className="flex gap-2">
                <input
                  value={newContactEmail}
                  onChange={(e) => setNewContactEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addContact()}
                  placeholder="email@example.com"
                  type="email"
                  className="flex-1 px-4 py-3 rounded-2xl outline-none text-[15px]"
                  style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
                />
                <button
                  onClick={addContact}
                  disabled={!newContactName.trim() || !newContactEmail.trim()}
                  className="w-11 h-11 rounded-full flex items-center justify-center transition disabled:opacity-30"
                  style={{ background: "#2b2820", color: "#f5f1e8" }}
                >
                  <Plus size={18} strokeWidth={2} />
                </button>
              </div>
            </div>

            {contacts.length > 3 && (
              <div
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl mb-3"
                style={{ background: "#fbf8f0", border: "1px solid #e8e1cf" }}
              >
                <Search size={14} strokeWidth={1.8} style={{ color: "#9a8f7a" }} />
                <input
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search contacts…"
                  className="flex-1 bg-transparent outline-none text-sm"
                  style={{ color: "#2b2820" }}
                />
                {contactSearch && (
                  <button onClick={() => setContactSearch("")} style={{ color: "#9a8f7a" }}>
                    <X size={14} strokeWidth={1.8} />
                  </button>
                )}
              </div>
            )}

            {contacts.length === 0 && (
              <p className="text-center py-16 font-italic-serif text-xl" style={{ color: "#9a8f7a" }}>
                No people yet.
              </p>
            )}
            {contacts.length > 0 && filteredContacts.length === 0 && (
              <p className="text-center py-8 text-sm" style={{ color: "#9a8f7a" }}>
                No matches for "{contactSearch}"
              </p>
            )}

            <ul className="space-y-2">
              {filteredContacts.map((c) => (
                <li
                  key={c.id}
                  className="group px-4 py-3 rounded-xl"
                  style={{ background: "#fbf8f0", border: "1px solid #e8e1cf" }}
                >
                  {editingContactId === c.id ? (
                    <div className="space-y-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Name"
                        className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                        style={{ background: "#f5f1e8", border: "1px solid #e8e1cf", color: "#2b2820" }}
                        autoFocus
                      />
                      <input
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                        placeholder="email@example.com"
                        type="email"
                        className="w-full px-3 py-2 rounded-lg outline-none text-sm"
                        style={{ background: "#f5f1e8", border: "1px solid #e8e1cf", color: "#2b2820" }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={cancelEdit}
                          className="text-xs px-3 py-1.5 rounded-full transition"
                          style={{ background: "transparent", color: "#7a7260", border: "1px solid #d6cfc2" }}
                        >
                          Cancel
                        </button>
                        <button
                          onClick={saveEdit}
                          disabled={!editName.trim() || !editEmail.trim()}
                          className="text-xs px-3 py-1.5 rounded-full transition disabled:opacity-30"
                          style={{ background: "#2b2820", color: "#f5f1e8" }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-base leading-tight" style={{ color: "#2b2820" }}>
                          {c.name}
                        </p>
                        <p className="text-xs truncate" style={{ color: "#7a7260" }}>
                          {c.email}
                        </p>
                      </div>
                      <button
                        onClick={() => startEdit(c)}
                        className="flex-shrink-0"
                        style={{ color: "#7a7260" }}
                        title="Edit"
                      >
                        <Pencil size={14} strokeWidth={1.8} />
                      </button>
                      <button
                        onClick={() => removeContact(c.id)}
                        className="flex-shrink-0"
                        style={{ color: "#9a8f7a" }}
                        title="Delete"
                      >
                        <Trash2 size={14} strokeWidth={1.8} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <footer className="mt-12 text-center">
          <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#b8ae9c" }}>
            saved locally · across sessions
          </p>
        </footer>
      </div>

      {/* Global event form modal */}
      {showEventForm && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(43,40,32,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowEventForm(false)}
        >
          <div
            className="w-full max-w-md p-5 rounded-2xl"
            style={{ background: "#f5f1e8", border: "1px solid #d6cfc2" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#9a8f7a" }}>
                New calendar event
              </p>
              <button onClick={() => setShowEventForm(false)} style={{ color: "#7a7260" }}>
                <X size={16} />
              </button>
            </div>
            <input
              value={eventDraft.title}
              onChange={(e) => setEventDraft({ ...eventDraft, title: e.target.value })}
              placeholder="Title"
              className="w-full px-3 py-2.5 rounded-lg text-[15px] mb-2 outline-none"
              style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              autoFocus
            />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <input
                type="date"
                value={eventDraft.date}
                onChange={(e) => setEventDraft({ ...eventDraft, date: e.target.value })}
                className="px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              />
              <input
                type="time"
                value={eventDraft.time}
                onChange={(e) => setEventDraft({ ...eventDraft, time: e.target.value })}
                className="px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <select
                value={eventDraft.duration}
                onChange={(e) => setEventDraft({ ...eventDraft, duration: Number(e.target.value) })}
                className="px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
              <input
                value={eventDraft.location}
                onChange={(e) => setEventDraft({ ...eventDraft, location: e.target.value })}
                placeholder="Location"
                className="px-3 py-2.5 rounded-lg text-sm outline-none"
                style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              />
            </div>

            {/* Guests */}
            <div className="mb-3">
              <p className="text-[10px] tracking-[0.2em] uppercase mb-2 flex items-center gap-1.5" style={{ color: "#9a8f7a" }}>
                <AtSign size={11} strokeWidth={1.8} />
                Guests
              </p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {eventDraft.guests.map((email) => {
                  const c = contacts.find((x) => x.email === email);
                  return (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                      style={{ background: "#ebe4d3", color: "#2b2820" }}
                    >
                      {c ? c.name : email}
                      <button
                        onClick={() =>
                          setEventDraft({
                            ...eventDraft,
                            guests: eventDraft.guests.filter((e) => e !== email),
                          })
                        }
                        style={{ color: "#7a7260" }}
                      >
                        <X size={11} strokeWidth={2} />
                      </button>
                    </span>
                  );
                })}
              </div>
              {contacts.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    if (e.target.value && !eventDraft.guests.includes(e.target.value)) {
                      setEventDraft({
                        ...eventDraft,
                        guests: [...eventDraft.guests, e.target.value],
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#7a7260" }}
                >
                  <option value="">+ Add a guest…</option>
                  {contacts
                    .filter((c) => !eventDraft.guests.includes(c.email))
                    .map((c) => (
                      <option key={c.id} value={c.email}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                </select>
              )}
            </div>

            <button
              disabled={!eventDraft.title.trim() || !eventDraft.date || !eventDraft.time}
              onClick={() => {
                const start = `${eventDraft.date}T${eventDraft.time}:00`;
                const end = new Date(
                  new Date(start).getTime() + eventDraft.duration * 60 * 1000
                ).toISOString();
                const url = gcalUrl({
                  title: eventDraft.title,
                  start,
                  end,
                  location: eventDraft.location,
                  guests: eventDraft.guests,
                });
                window.open(url, "_blank", "noopener");
                setShowEventForm(false);
                setEventDraft({ title: "", date: todayISO, time: "10:00", duration: 60, location: "", guests: [] });
              }}
              className="w-full py-3 rounded-full text-sm transition disabled:opacity-30"
              style={{ background: "#2b2820", color: "#f5f1e8" }}
            >
              Open in Google Calendar
            </button>
          </div>
        </div>
      )}
      {/* Bulk import modal */}
      {showBulkImport && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(43,40,32,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setShowBulkImport(false)}
        >
          <div
            className="w-full max-w-md p-5 rounded-2xl"
            style={{ background: "#f5f1e8", border: "1px solid #d6cfc2" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#9a8f7a" }}>
                Paste contacts
              </p>
              <button onClick={() => setShowBulkImport(false)} style={{ color: "#7a7260" }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-xs mb-3 leading-relaxed" style={{ color: "#7a7260" }}>
              One contact per line. Accepts:
              <br />
              <span className="font-italic-serif">Name, email</span> &nbsp;·&nbsp;
              <span className="font-italic-serif">Name &lt;email&gt;</span> &nbsp;·&nbsp;
              <span className="font-italic-serif">just@email.com</span>
            </p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={"Jane Doe, jane@example.com\nJohn Smith <john@example.com>\ncontact@example.com"}
              rows={8}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none mb-3 resize-none font-mono"
              style={{ background: "#fbf8f0", border: "1px solid #e8e1cf", color: "#2b2820" }}
              autoFocus
            />
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs" style={{ color: "#9a8f7a" }}>
                {parseBulkContacts(bulkText).length} valid
              </p>
              <button
                onClick={runBulkImport}
                disabled={parseBulkContacts(bulkText).length === 0 || saveStatus === "saving"}
                className="px-5 py-2.5 rounded-full text-sm transition disabled:opacity-30"
                style={{ background: "#2b2820", color: "#f5f1e8" }}
              >
                {saveStatus === "saving" ? "Saving…" : "Import"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Import summary modal */}
      {importSummary && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
          style={{ background: "rgba(43,40,32,0.4)", backdropFilter: "blur(4px)" }}
          onClick={() => setImportSummary(null)}
        >
          <div
            className="w-full max-w-md p-5 rounded-2xl"
            style={{ background: "#f5f1e8", border: "1px solid #d6cfc2" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: "#9a8f7a" }}>
                {importSummary.error ? "Import failed" : "Import complete"}
              </p>
              <button onClick={() => setImportSummary(null)} style={{ color: "#7a7260" }}>
                <X size={16} />
              </button>
            </div>
            <div className="text-sm space-y-1.5" style={{ color: "#2b2820" }}>
              {importSummary.error ? (
                <p>{importSummary.error}</p>
              ) : (
                <>
                  <p>
                    <span className="font-display text-base">{importSummary.imported}</span>{" "}
                    {importSummary.imported === 1 ? "contact imported" : "contacts imported"}.
                  </p>
                  {importSummary.dupSkipped > 0 && (
                    <p style={{ color: "#7a7260" }}>
                      {importSummary.dupSkipped} duplicate{importSummary.dupSkipped === 1 ? "" : "s"} skipped.
                    </p>
                  )}
                  {importSummary.invalidSkipped > 0 && (
                    <p style={{ color: "#7a7260" }}>
                      {importSummary.invalidSkipped} row{importSummary.invalidSkipped === 1 ? "" : "s"} with missing/invalid email skipped.
                    </p>
                  )}
                </>
              )}
            </div>
            <button
              onClick={() => setImportSummary(null)}
              className="w-full mt-4 py-2.5 rounded-full text-sm transition"
              style={{ background: "#2b2820", color: "#f5f1e8" }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "evening";
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}

// Minimal RFC 4180-style CSV parser. Handles quoted fields, escaped quotes (""),
// commas inside quotes, and CRLF/LF line endings. Strips a leading UTF-8 BOM.
function parseCSV(text) {
  if (!text) return [];
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch === "\r") {
        // swallow; \n handles the row break
      } else {
        field += ch;
      }
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// Natural language date/time extraction (Greek + English)
function parseDateFromText(text) {
  if (!text) return { date: null, time: null };

  // Normalize: lowercase + strip diacritics (handles Greek accents + Latin)
  const norm = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let remainder = ` ${norm} `;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const addDays = (d, n) => {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
  };
  const dateFromDayMonth = (day, month) => {
    const y = today.getFullYear();
    const candidate = new Date(y, month, day);
    candidate.setHours(0, 0, 0, 0);
    return candidate < today ? new Date(y + 1, month, day) : candidate;
  };
  const nextDayOfWeek = (dayNum) => {
    const diff = ((dayNum - today.getDay()) + 7) % 7;
    return addDays(today, diff === 0 ? 7 : diff);
  };

  // Unicode-aware word boundary: char before/after must NOT be letter or digit (any script)
  const wb = (pattern) =>
    new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})(?![\\p{L}\\p{N}])`, "u");

  let date = null;

  // 1. Relative day words
  if (wb("σημερα|today|tonight|αποψε").test(remainder)) {
    date = new Date(today);
  } else if (wb("αυριο|tomorrow").test(remainder)) {
    date = addDays(today, 1);
  } else if (wb("μεθαυριο|day after tomorrow").test(remainder)) {
    date = addDays(today, 2);
  }

  // 2. Day-of-week
  if (!date) {
    const dayMap = {
      δευτερα: 1, monday: 1, mon: 1,
      τριτη: 2, tuesday: 2, tue: 2, tues: 2,
      τεταρτη: 3, wednesday: 3, wed: 3,
      πεμπτη: 4, thursday: 4, thu: 4, thurs: 4,
      παρασκευη: 5, friday: 5, fri: 5,
      σαββατο: 6, saturday: 6, sat: 6,
      κυριακη: 0, sunday: 0, sun: 0,
    };
    for (const [name, num] of Object.entries(dayMap)) {
      const re = wb(name);
      if (re.test(remainder)) {
        date = nextDayOfWeek(num);
        remainder = remainder.replace(re, " ");
        break;
      }
    }
  }

  // 3. "<day> <month>" or "<month> <day>" (Greek + English)
  const months = {
    ιανουαριου: 0, ιανουαριος: 0, january: 0, jan: 0,
    φεβρουαριου: 1, φεβρουαριος: 1, february: 1, feb: 1,
    μαρτιου: 2, μαρτιος: 2, march: 2, mar: 2,
    απριλιου: 3, απριλιος: 3, april: 3, apr: 3,
    μαιου: 4, μαιος: 4, may: 4,
    ιουνιου: 5, ιουνιος: 5, june: 5, jun: 5,
    ιουλιου: 6, ιουλιος: 6, july: 6, jul: 6,
    αυγουστου: 7, αυγουστος: 7, august: 7, aug: 7,
    σεπτεμβριου: 8, σεπτεμβριος: 8, september: 8, sep: 8, sept: 8,
    οκτωβριου: 9, οκτωβριος: 9, october: 9, oct: 9,
    νοεμβριου: 10, νοεμβριος: 10, november: 10, nov: 10,
    δεκεμβριου: 11, δεκεμβριος: 11, december: 11, dec: 11,
  };
  if (!date) {
    const monthNames = Object.keys(months).sort((a, b) => b.length - a.length).join("|");
    const re1 = new RegExp(
      `(?<![\\p{L}\\p{N}])(\\d{1,2})\\s+(${monthNames})(?![\\p{L}\\p{N}])`,
      "u"
    );
    let m = remainder.match(re1);
    if (m) {
      date = dateFromDayMonth(parseInt(m[1], 10), months[m[2]]);
      remainder = remainder.replace(m[0], " ");
    } else {
      const re2 = new RegExp(
        `(?<![\\p{L}\\p{N}])(${monthNames})\\s+(\\d{1,2})(?![\\p{L}\\p{N}])`,
        "u"
      );
      m = remainder.match(re2);
      if (m) {
        date = dateFromDayMonth(parseInt(m[2], 10), months[m[1]]);
        remainder = remainder.replace(m[0], " ");
      }
    }
  }

  // 4. Numeric DD/MM or DD-MM (European order, optional year)
  if (!date) {
    const m = remainder.match(/\b(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?\b/);
    if (m) {
      const day = parseInt(m[1], 10);
      const month = parseInt(m[2], 10) - 1;
      if (day >= 1 && day <= 31 && month >= 0 && month <= 11) {
        if (m[3]) {
          const y = m[3].length === 2 ? 2000 + parseInt(m[3], 10) : parseInt(m[3], 10);
          date = new Date(y, month, day);
        } else {
          date = dateFromDayMonth(day, month);
        }
        remainder = remainder.replace(m[0], " ");
      }
    }
  }

  // --- Time extraction on remaining text ---
  let time = null;
  let tm = remainder.match(/\b(\d{1,2})[:.](\d{2})\b/);
  if (tm) {
    const h = parseInt(tm[1], 10);
    const mm = parseInt(tm[2], 10);
    if (h >= 0 && h < 24 && mm >= 0 && mm < 60) time = `${pad(h)}:${pad(mm)}`;
  }
  if (!time) {
    const am = remainder.match(/\b(\d{1,2})\s*(am|pm)\b/);
    if (am) {
      let h = parseInt(am[1], 10);
      if (am[2] === "pm" && h < 12) h += 12;
      if (am[2] === "am" && h === 12) h = 0;
      if (h >= 0 && h < 24) time = `${pad(h)}:00`;
    }
  }
  if (!time) {
    const re = new RegExp(
      `(?<![\\p{L}\\p{N}])(?:at|στις)\\s+(\\d{1,2})(?![:.\\d])(?![\\p{L}\\p{N}])`,
      "u"
    );
    const at = remainder.match(re);
    if (at) {
      const h = parseInt(at[1], 10);
      if (h >= 0 && h < 24) time = `${pad(h)}:00`;
    }
  }

  return { date: date ? fmtDate(date) : null, time };
}
