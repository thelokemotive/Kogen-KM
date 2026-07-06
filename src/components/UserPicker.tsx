'use client';

import { useEffect, useMemo, useState } from 'react';

interface PickUser {
  id: number;
  display_name: string;
  email: string;
  role: string;
}

/**
 * Search-and-tick athlete picker used by staff for bulk logging and photo
 * tagging. Renders checkboxes (multi) or radios (single) inside the parent form.
 */
export default function UserPicker({ multi, name }: { multi: boolean; name: string }) {
  const [users, setUsers] = useState<PickUser[]>([]);
  const [q, setQ] = useState('');
  const [checked, setChecked] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .catch(() => setUsers([]));
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter(
      (u) => u.display_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    );
  }, [users, q]);

  function toggle(id: number) {
    setChecked((prev) => {
      const next = new Set(multi ? prev : []);
      if (prev.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllVisible() {
    setChecked(new Set(filtered.map((u) => u.id)));
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {multi && (
          <>
            <button type="button" className="btn btn-sm" onClick={selectAllVisible}>
              All
            </button>
            <button type="button" className="btn btn-sm" onClick={() => setChecked(new Set())}>
              None
            </button>
          </>
        )}
      </div>
      {multi && (
        <p className="tiny muted" style={{ margin: '0 0 6px' }}>
          {checked.size} selected
        </p>
      )}
      <div
        style={{
          maxHeight: 260,
          overflowY: 'auto',
          border: '1px solid var(--line)',
          borderRadius: 10,
          padding: 6,
          background: '#fff',
        }}
      >
        {filtered.map((u) => (
          <label
            key={u.id}
            className="row"
            style={{ padding: '6px 8px', cursor: 'pointer', fontWeight: 500 }}
          >
            <input
              type={multi ? 'checkbox' : 'radio'}
              name={name}
              value={u.id}
              checked={checked.has(u.id)}
              onChange={() => toggle(u.id)}
              style={{ width: 'auto' }}
            />
            <span>
              {u.display_name}
              {u.role !== 'STUDENT' && <span className="chip staff" style={{ marginLeft: 6 }}>Staff</span>}
            </span>
            <span className="tiny muted" style={{ marginLeft: 'auto' }}>
              {u.email}
            </span>
          </label>
        ))}
        {filtered.length === 0 && <p className="small muted center">No one found.</p>}
      </div>
    </div>
  );
}
