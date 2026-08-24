"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Panel, PanelTitle } from "@/components/dashboard/Panel";
import type { AdminDonationRow } from "@/lib/admin/donations";

type Overview = {
  disasterUpdatedAt: string | null;
  donationHealth: {
    totalVerified: number;
    needsReview: number;
    unhealthy: number;
    lastCheckedAt: string | null;
  };
  sources: Array<{
    id: string;
    name: string;
    sourceType: string;
    active: boolean;
    latestUpdateAt: string | null;
    latestMetricAt: string | null;
  }>;
};

type Organization = {
  id: string;
  name: string;
  shortDescription: string | null;
  active: boolean;
  sortOrder: number;
};

type AuditEntry = {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  created_at: string;
};

const tabs = [
  "overview",
  "donations",
  "organizations",
  "metrics",
  "audit",
] as const;

type Tab = (typeof tabs)[number];

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [overview, setOverview] = useState<Overview | null>(null);
  const [donations, setDonations] = useState<AdminDonationRow[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [metricsJson, setMetricsJson] = useState("");
  const [metricsResult, setMetricsResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadOverview = useCallback(async () => {
    const response = await fetch("/api/admin/overview");
    if (!response.ok) throw new Error("Failed to load overview");
    setOverview((await response.json()) as Overview);
  }, []);

  const loadDonations = useCallback(async () => {
    const response = await fetch("/api/admin/donations");
    if (!response.ok) throw new Error("Failed to load donations");
    const data = (await response.json()) as { donations: AdminDonationRow[] };
    setDonations(data.donations);
  }, []);

  const loadOrganizations = useCallback(async () => {
    const response = await fetch("/api/admin/organizations");
    if (!response.ok) throw new Error("Failed to load organizations");
    const data = (await response.json()) as { organizations: Organization[] };
    setOrganizations(data.organizations);
  }, []);

  const loadAudit = useCallback(async () => {
    const response = await fetch("/api/admin/audit");
    if (!response.ok) throw new Error("Failed to load audit log");
    const data = (await response.json()) as { entries: AuditEntry[] };
    setAudit(data.entries);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.all([
          loadOverview(),
          loadDonations(),
          loadOrganizations(),
          loadAudit(),
        ]);
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load admin data",
        );
      }
    })();
  }, [loadAudit, loadDonations, loadOrganizations, loadOverview]);

  async function handleLogout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  async function runDonationAction(id: string, action: string) {
    setBusyId(id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/donations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Action failed");
      }
      await Promise.all([loadDonations(), loadOverview(), loadAudit()]);
    } catch (actionError) {
      setError(
        actionError instanceof Error ? actionError.message : "Action failed",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function saveOrganization(org: Organization) {
    setBusyId(org.id);
    setError(null);
    try {
      const response = await fetch(`/api/admin/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shortDescription: org.shortDescription,
          active: org.active,
        }),
      });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error ?? "Save failed");
      }
      await loadAudit();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function importMetrics(event: React.FormEvent) {
    event.preventDefault();
    setMetricsResult(null);
    setError(null);
    try {
      const body = JSON.parse(metricsJson) as unknown;
      const response = await fetch("/api/admin/metrics/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        inserted?: number;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }
      setMetricsResult(`Inserted ${data.inserted ?? 0} metric row(s).`);
      await Promise.all([loadOverview(), loadAudit()]);
    } catch (importError) {
      setError(
        importError instanceof Error ? importError.message : "Import failed",
      );
    }
  }

  return (
    <div className="mx-auto flex h-dvh max-w-5xl flex-col gap-4 overflow-hidden p-4 md:p-6">
      <header className="flex shrink-0 items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Help Colombia Admin</h1>
          <p className="text-sm text-muted-foreground">
            Post-MVP internal console — not linked from the public dashboard.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm text-foreground hover:bg-muted"
        >
          Sign out
        </button>
      </header>

      <nav className="flex shrink-0 flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`cursor-pointer rounded-md px-3 py-1.5 text-sm capitalize ${
              tab === item
                ? "bg-primary text-primary-foreground"
                : "border border-border text-foreground hover:bg-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </nav>

      {error ? (
        <p className="shrink-0 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto pb-6">
        {tab === "overview" && overview ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Panel>
              <PanelTitle>Disaster freshness</PanelTitle>
              <p className="text-sm text-muted-foreground">
                Last published disaster update:{" "}
                <span className="text-foreground">
                  {formatWhen(overview.disasterUpdatedAt)}
                </span>
              </p>
            </Panel>
            <Panel>
              <PanelTitle>Donation health</PanelTitle>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>
                  Verified destinations:{" "}
                  <span className="text-foreground">
                    {overview.donationHealth.totalVerified}
                  </span>
                </li>
                <li>
                  Needs review:{" "}
                  <span className="text-foreground">
                    {overview.donationHealth.needsReview}
                  </span>
                </li>
                <li>
                  Unhealthy:{" "}
                  <span className="text-foreground">
                    {overview.donationHealth.unhealthy}
                  </span>
                </li>
                <li>
                  Last health check:{" "}
                  <span className="text-foreground">
                    {formatWhen(overview.donationHealth.lastCheckedAt)}
                  </span>
                </li>
              </ul>
            </Panel>
            <Panel className="md:col-span-2">
              <PanelTitle>Sources</PanelTitle>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-2 pr-3">Source</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Active</th>
                      <th className="py-2 pr-3">Latest update</th>
                      <th className="py-2">Latest metric</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.sources.map((source) => (
                      <tr key={source.id} className="border-b border-border/60">
                        <td className="py-2 pr-3 font-medium text-foreground">
                          {source.name}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {source.sourceType}
                        </td>
                        <td className="py-2 pr-3">
                          {source.active ? "Yes" : "No"}
                        </td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {formatWhen(source.latestUpdateAt)}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {formatWhen(source.latestMetricAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          </div>
        ) : null}

        {tab === "donations" ? (
          <Panel>
            <PanelTitle>Donation destinations</PanelTitle>
            <div className="space-y-4">
              {donations.map((row) => (
                <article
                  key={row.id}
                  className="rounded-md border border-border p-3"
                >
                  <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-medium text-foreground">
                        {row.organizationName}
                      </h3>
                      <a
                        href={row.destinationUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline-offset-2 hover:underline"
                      >
                        {row.destinationUrl}
                      </a>
                    </div>
                    <div className="flex flex-wrap gap-1 text-xs">
                      <span className="rounded bg-muted px-2 py-0.5">
                        {row.verificationStatus}
                      </span>
                      <span className="rounded bg-muted px-2 py-0.5">
                        {row.healthStatus}
                      </span>
                      {row.needsReview ? (
                        <span className="rounded bg-destructive/15 px-2 py-0.5 text-destructive">
                          needs review
                        </span>
                      ) : null}
                      {!row.isEnabled ? (
                        <span className="rounded bg-muted px-2 py-0.5">disabled</span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    Host: {row.approvedHostname}
                    {row.healthDetail ? ` · ${row.healthDetail}` : ""}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "verify",
                        "reject",
                        "enable",
                        "disable",
                        "clear_review",
                      ] as const
                    ).map((action) => (
                      <button
                        key={action}
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => void runDonationAction(row.id, action)}
                        className="cursor-pointer rounded border border-border px-2 py-1 text-xs capitalize hover:bg-muted disabled:opacity-50"
                      >
                        {action.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        ) : null}

        {tab === "organizations" ? (
          <Panel>
            <PanelTitle>Organizations</PanelTitle>
            <div className="space-y-4">
              {organizations.map((org, index) => (
                <article
                  key={org.id}
                  className="rounded-md border border-border p-3"
                >
                  <h3 className="mb-2 font-medium text-foreground">{org.name}</h3>
                  <label className="mb-2 block">
                    <span className="mb-1 block text-xs text-muted-foreground">
                      Short description
                    </span>
                    <textarea
                      value={org.shortDescription ?? ""}
                      onChange={(event) => {
                        const next = [...organizations];
                        next[index] = {
                          ...org,
                          shortDescription: event.target.value,
                        };
                        setOrganizations(next);
                      }}
                      rows={2}
                      className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                    />
                  </label>
                  <label className="mb-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={org.active}
                      onChange={(event) => {
                        const next = [...organizations];
                        next[index] = { ...org, active: event.target.checked };
                        setOrganizations(next);
                      }}
                    />
                    Active on dashboard
                  </label>
                  <button
                    type="button"
                    disabled={busyId === org.id}
                    onClick={() => void saveOrganization(org)}
                    className="cursor-pointer rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground disabled:opacity-50"
                  >
                    Save
                  </button>
                </article>
              ))}
            </div>
          </Panel>
        ) : null}

        {tab === "metrics" ? (
          <Panel>
            <PanelTitle>Manual metrics import</PanelTitle>
            <p className="mb-3 text-sm text-muted-foreground">
              Append-only JSON import (UNGRD or similar). See{" "}
              <code className="text-xs">scripts/examples/ungrd-metrics-import.json</code>.
            </p>
            <form onSubmit={(event) => void importMetrics(event)}>
              <textarea
                value={metricsJson}
                onChange={(event) => setMetricsJson(event.target.value)}
                rows={14}
                placeholder='{"disasterSlug":"...","metrics":[...]}'
                className="mb-3 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-xs"
                required
              />
              <button
                type="submit"
                className="cursor-pointer rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
              >
                Import metrics
              </button>
            </form>
            {metricsResult ? (
              <p className="mt-3 text-sm text-foreground">{metricsResult}</p>
            ) : null}
          </Panel>
        ) : null}

        {tab === "audit" ? (
          <Panel>
            <PanelTitle>Audit trail</PanelTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">When</th>
                    <th className="py-2 pr-3">Action</th>
                    <th className="py-2 pr-3">Entity</th>
                    <th className="py-2">ID</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((entry) => (
                    <tr key={entry.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-muted-foreground">
                        {formatWhen(entry.created_at)}
                      </td>
                      <td className="py-2 pr-3 font-medium text-foreground">
                        {entry.action}
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {entry.entity_type}
                      </td>
                      <td className="py-2 font-mono text-xs text-muted-foreground">
                        {entry.entity_id ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        ) : null}
      </div>
    </div>
  );
}
