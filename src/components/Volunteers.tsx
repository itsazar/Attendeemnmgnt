"use client";

import { useEffect, useState, useRef } from "react";

type Volunteer = {
  id: string;
  name: string;
  phoneNumber?: string | null;
  email?: string | null;
  joinedAt: string;
};

export default function Volunteers() {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [success, setSuccess] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/blocklist/volunteers");
      if (!res.ok) throw new Error("Failed to load volunteers");
      const data = await res.json();
      setVolunteers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
      fetchVolunteers();
    }, []);

    const formRef = useRef<HTMLFormElement | null>(null);
    const tableRef = useRef<HTMLDivElement | null>(null);
    const [showForm, setShowForm] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (phoneNumber && !/^[0-9+()\-\s]{6,20}$/.test(phoneNumber.trim())) {
      setError("Phone number must be 6-20 characters and contain only digits, spaces, dashes, parentheses, or plus signs.");
      return;
    }
      const trimmedName = name.trim();
      const trimmedPhoneNumber = phoneNumber.trim() || null;
      const trimmedEmail = email.trim() || null;
      const finalJoinedAt = joinedAt || undefined;
      const payload = {
        name: trimmedName,
        phoneNumber: trimmedPhoneNumber,
        email: trimmedEmail,
        joinedAt: finalJoinedAt,
      };
      setError("Please enter a valid email address (e.g., user@example.com)");
      return;
    }
    // Basic phone validation (digits, spaces, dashes allowed)
    if (phoneNumber && !/^[0-9+()\-\s]{6,20}$/.test(phoneNumber.trim())) {
      setError("Phone number must be 6-20 characters and contain only digits, spaces, dashes, parentheses, or plus signs.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = { name: name.trim(), phoneNumber: phoneNumber.trim() || null, email: email.trim() || null, joinedAt: joinedAt || undefined };
      const res = await fetch("/api/blocklist/volunteers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Failed to add volunteer");
      }
      const created = await res.json();
      setVolunteers((s) => [created, ...s]);
      setSuccess("Volunteer added");
      setTimeout(() => setSuccess(null), 3000);
      setName("");
      setPhoneNumber("");
      setEmail("");
      setJoinedAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm("Remove this volunteer?")) return;
    try {
      const res = await fetch(`/api/blocklist/volunteers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove volunteer");
      setVolunteers((s) => s.filter((v) => v.id !== id));
      setSuccess("Volunteer removed");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <div className="volunteers-module">
      <div className="section-header">
        <h3>Volunteers</h3>
        <span className="muted">Manage volunteers supporting events</span>
      </div>

      <div className="volunteer-controls" style={{ display: 'flex', gap: 8, marginTop: 12, marginBottom: 12 }}>
        <input
          aria-label="Search volunteers"
          placeholder="Search name, email or phone"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ flex: 1 }}
        />
        <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
        </select>
      </div>

      <div className="table-wrapper" ref={tableRef}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}>Loading...</td></tr>
            ) : (() => {
              const q = searchTerm.trim().toLowerCase();
              const filtered = volunteers.filter((v) => {
                if (!q) return true;
                return (
                  v.name.toLowerCase().includes(q) ||
                  (v.email ?? "").toLowerCase().includes(q) ||
                  (v.phoneNumber ?? "").toLowerCase().includes(q)
                );
              });

              filtered.sort((a, b) => {
                const ta = new Date(a.joinedAt).getTime();
                const tb = new Date(b.joinedAt).getTime();
                return sortOrder === "newest" ? tb - ta : ta - tb;
              });

              return filtered.length ? (
                filtered.map((v) => (
                  <tr key={v.id}>
                    <td>{v.name}</td>
                    <td>{v.phoneNumber ?? "—"}</td>
                    <td>{v.email ?? "—"}</td>
                    <td>{new Date(v.joinedAt).toLocaleDateString()}</td>
                    <td>
                      <button className="danger" onClick={() => handleRemove(v.id)}>Remove</button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5}>No volunteers found</td></tr>
              );
            })()}
          </tbody>
        </table>
      </div>

      {/* add form below the list (collapsible) */}
      <div style={{ marginTop: 12 }}>
        <button
          type="button"
          className="secondary-btn"
          onClick={() => {
            setShowForm((s) => !s);
            if (!showForm) setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth" }), 60);
          }}
        >
          {showForm ? "Hide Add Volunteer" : "Add Volunteer"}
        </button>
      </div>

      <form ref={formRef} onSubmit={handleAdd} className="volunteer-form" style={{ marginTop: 16, display: showForm ? "block" : "none" }}>
        <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} required />
        <input placeholder="Phone number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="date" placeholder="Joined at" value={joinedAt} onChange={(e) => setJoinedAt(e.target.value)} />
        <button type="submit" disabled={submitting}>{submitting ? "Adding..." : "Add Volunteer"}</button>
      </form>

      {error && <div className="message error" style={{ marginTop: 12 }}>{error}</div>}
      {success && <div className="message success" style={{ marginTop: 12 }}>{success}</div>}
    </div>
  );
}
