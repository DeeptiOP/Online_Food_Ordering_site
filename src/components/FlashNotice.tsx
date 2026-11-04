"use client";

import { useEffect, useState } from "react";

export default function FlashNotice() {
  const [notice, setNotice] = useState("");
  const [type, setType] = useState("info");

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const message = query.get("notice");
    if (!message) return;
    setNotice(message);
    setType(query.get("type") || "info");
  }, []);

  if (!notice) return null;
  return (
    <div className={`alert alert-${type}`} role="status" aria-live="polite">
      {notice}
      <button type="button" className="notice-dismiss" aria-label="Dismiss message" onClick={() => setNotice("")}>×</button>
    </div>
  );
}
