'use client';

import { useState } from 'react';

export default function KudosButton({
  activityId,
  count,
  mine,
}: {
  activityId: number;
  count: number;
  mine: boolean;
}) {
  const [state, setState] = useState({ count, mine });
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/kudos`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setState({ count: data.kudos, mine: data.mine });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className={`kudos-btn${state.mine ? ' mine' : ''}`} onClick={toggle}>
      🙌 {state.count > 0 ? state.count : 'Kudos'}
    </button>
  );
}
