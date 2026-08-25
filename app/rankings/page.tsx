"use client";

import { Fragment, useEffect, useState } from "react";

type Site = {
  domain: string;
  city: string;
  clicks: number;
  impressions: number;
  position: number | null;
  topQueries: { query: string; position: number; clicks: number; impressions: number }[];
};

type Data = { ok?: boolean; updated?: string; sites?: Site[]; error?: string };

const num = (n: number) => new Intl.NumberFormat("en-GB").format(n);

export default function RankingsPage() {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/rankings")
      .then((r) => r.json())
      .then((d: Data) => setData(d))
      .catch(() => setData({ error: "Failed to load rankings" }))
      .finally(() => setLoading(false));
  }, []);

  const sites = data?.sites ?? [];
  const totalClicks = sites.reduce((s, x) => s + x.clicks, 0);
  const totalImpr = sites.reduce((s, x) => s + x.impressions, 0);
  const withData = sites.filter((s) => s.impressions > 0).length;

  const card = (label: string, value: string) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", flex: 1, minWidth: 160 }}>
      <div style={{ fontSize: 12, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: "#111827", marginTop: 4 }}>{value}</div>
    </div>
  );

  return (
    <main style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 20px", fontFamily: "system-ui, -apple-system, Arial, sans-serif", color: "#111827" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Search Ranking Dashboard</h1>
      <p style={{ color: "#6b7280", marginTop: 6 }}>
        Google Search performance across all sites — last 28 days.
        {data?.updated ? ` Updated ${new Date(data.updated).toLocaleString("en-GB")}.` : ""}
      </p>

      {loading && <p style={{ marginTop: 24 }}>Loading rankings…</p>}

      {!loading && data?.error && (
        <div style={{ marginTop: 24, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: 16, color: "#991b1b" }}>
          {data.error}
        </div>
      )}

      {!loading && data?.ok && (
        <>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 24 }}>
            {card("Sites", num(sites.length))}
            {card("Sites with data", num(withData))}
            {card("Total clicks", num(totalClicks))}
            {card("Total impressions", num(totalImpr))}
          </div>

          {withData === 0 && (
            <div style={{ marginTop: 20, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 12, padding: 16, color: "#1e40af" }}>
              📊 No ranking data yet — the sites were recently added to Google Search Console. Google records
              search rankings over the coming weeks, so this dashboard will fill with real numbers as the sites
              gain visibility. Everything is connected and working.
            </div>
          )}

          <div style={{ marginTop: 24, background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ background: "#f9fafb", textAlign: "left", color: "#6b7280", fontSize: 12, textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>City / Site</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Avg position</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Clicks</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Impressions</th>
                  <th style={{ padding: "12px 16px" }}>Top keyword</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((s) => (
                  <Fragment key={s.domain}>
                    <tr
                      onClick={() => setOpen(open === s.domain ? null : s.domain)}
                      style={{ borderTop: "1px solid #f1f5f9", cursor: s.topQueries.length ? "pointer" : "default" }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600 }}>{s.city}</div>
                        <div style={{ fontSize: 12, color: "#9ca3af" }}>{s.domain}</div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 700 }}>
                        {s.position != null ? s.position : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{num(s.clicks)}</td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>{num(s.impressions)}</td>
                      <td style={{ padding: "12px 16px", color: "#374151" }}>
                        {s.topQueries[0] ? `${s.topQueries[0].query} (pos ${s.topQueries[0].position})` : "—"}
                      </td>
                    </tr>
                    {open === s.domain && s.topQueries.length > 0 && (
                      <tr>
                        <td colSpan={5} style={{ padding: "0 16px 12px 16px", background: "#fafafa" }}>
                          <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
                            <thead>
                              <tr style={{ color: "#9ca3af", textAlign: "left" }}>
                                <th style={{ padding: "6px 8px" }}>Keyword</th>
                                <th style={{ padding: "6px 8px", textAlign: "right" }}>Position</th>
                                <th style={{ padding: "6px 8px", textAlign: "right" }}>Clicks</th>
                                <th style={{ padding: "6px 8px", textAlign: "right" }}>Impressions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.topQueries.map((q, i) => (
                                <tr key={i}>
                                  <td style={{ padding: "6px 8px" }}>{q.query}</td>
                                  <td style={{ padding: "6px 8px", textAlign: "right" }}>{q.position}</td>
                                  <td style={{ padding: "6px 8px", textAlign: "right" }}>{num(q.clicks)}</td>
                                  <td style={{ padding: "6px 8px", textAlign: "right" }}>{num(q.impressions)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ color: "#9ca3af", fontSize: 12, marginTop: 12 }}>
            Click a row to see its top keywords. Lower position = higher on Google (1 = top).
          </p>
        </>
      )}
    </main>
  );
}
