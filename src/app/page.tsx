/**
 * demoattendee — src/app/page.tsx
 *
 * Brief: Main dashboard client page with import, attendance, and reports UI.
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildWorkbookFromRows, bufferToArrayBuffer } from "@/lib/excel";
import Volunteers from "@/components/Volunteers";

type Summary = {
  totalParticipants: number;
  totalAttended: number;
  totalNoShows: number;
  totalBlocklisted: number;
  noShowPercentage: number;
  totalEvents: number;
};

type EventHistoryRow = {
  id: string;
  name: string;
  eventDate: string;
  totalParticipants: number;
  attended: number;
  noShows: number;
  flagged: number;
};

type ParticipantListItem = {
  fullName: string;
  email: string;
  company?: string | null;
  city?: string | null;
};

type NoShowHistoryRow = {
  id: string;
  recordedAt: string;
  participant: ParticipantListItem;
  event: { name: string; eventDate: string };
};

type BlocklistRow = {
  id: string;
  totalNoShows: number;
  firstNoShowAt: string | null;
  participant: ParticipantListItem;
  firstNoShowEvent?: { name: string } | null;
};

type ImportResult = {
  summary: {
    totalImported: number;
    newParticipants: number;
    updatedParticipants: number;
    flaggedNoShows: number;
    flaggedBlocklisted: number;
    normalParticipants?: number;
  };
  flaggedParticipants: (ParticipantListItem & {
    wasNoShow: boolean;
    isBlocklisted: boolean;
  })[];
  normalParticipants?: ParticipantListItem[];
  noShowParticipants?: ParticipantListItem[];
  blocklistedParticipants?: ParticipantListItem[];
};

type AttendanceSummary = {
  summary: {
    totalAttendedMarked: number;
    totalNoShowsMarked: number;
    totalBlocklisted: number;
    missingParticipants: string[];
  };
};

const formatDate = (input: string) => {
  const date = new Date(input);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const IconDashboard = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 20v-3.5" />
    <path d="M10 20V10" />
    <path d="M15 20V6" />
    <path d="M20 20v-7" />
    <path d="M4 20h17" />
  </svg>
);

const IconImport = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5v9" />
    <path d="M8.5 10.5 12 14l3.5-3.5" />
    <path d="M5 17h14" />
    <path d="M6.5 19h11" />
  </svg>
);

const IconEvents = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="6" width="16" height="14" rx="2" />
    <path d="M8 3v4" />
    <path d="M16 3v4" />
    <path d="M4 10h16" />
    <path d="M9 14h2" />
    <path d="M13 14h2" />
  </svg>
);

const IconHistory = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 12a7 7 0 1 1 1.8 4.7" />
    <path d="M5 12H2" />
    <path d="M12 8v5l3 2" />
  </svg>
);

const IconBlocklist = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="8" />
    <path d="m8 8 8 8" />
  </svg>
);

/**
 * Dashboard home component (client).
 */
export default function Home() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [eventHistory, setEventHistory] = useState<EventHistoryRow[]>([]);
  const [noShowHistory, setNoShowHistory] = useState<NoShowHistoryRow[]>([]);
  const [blocklist, setBlocklist] = useState<BlocklistRow[]>([]);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const [attendanceResult, setAttendanceResult] =
    useState<AttendanceSummary | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [selectedAttendanceEvent, setSelectedAttendanceEvent] =
    useState<string>("");

  const [downloadKey, setDownloadKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<"email" | "company" | "city">(
    "email",
  );
  const [eventSort, setEventSort] = useState<
    "eventDate" | "attended" | "noShows"
  >("eventDate");
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "import" | "events" | "history" | "blocklist" | "volunteers"
  >("dashboard");
  const [blocklistView, setBlocklistView] = useState<"list" | "volunteers">("list");

  const refreshOverview = useCallback(async () => {
    try {
      setLoadingOverview(true);
      setOverviewError(null);
      console.log("Fetching /api/overview...");
      const response = await fetch("/api/overview");
      console.log("Response status:", response.status, response.ok);
      const responseText = await response.text();
      console.log("Response text length:", responseText.length);
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = {
            error:
              responseText ||
              `Failed to load dashboard data (${response.status})`,
          };
        }
        throw new Error(
          errorData.error ||
            `Failed to load dashboard data (${response.status})`,
        );
      }
      const data = JSON.parse(responseText);
      console.log("Data received:", data);
      if (!data.summary) {
        throw new Error("Invalid response: missing summary data");
      }
      setSummary(data.summary);
      setEventHistory(data.eventHistory || []);
      setNoShowHistory(data.noShowHistory || []);
      setBlocklist(data.blocklist || []);
      if (
        !selectedAttendanceEvent &&
        data.eventHistory &&
        data.eventHistory.length
      ) {
        setSelectedAttendanceEvent(data.eventHistory[0].id);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unable to load dashboard";
      console.error("Error loading overview:", error);
      setOverviewError(errorMessage);
    } finally {
      setLoadingOverview(false);
    }
  }, [selectedAttendanceEvent]);

  useEffect(() => {
    refreshOverview();
  }, [refreshOverview]);

  const handleImport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setImportLoading(true);
    setImportResult(null);
    setOverviewError(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch("/api/events/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Import failed" }));
        const errorMessage = errorData.error || errorData.message || `Import failed (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setImportResult({
        summary: data.summary,
        flaggedParticipants: data.flaggedParticipants || [],
        normalParticipants: data.normalParticipants || [],
        noShowParticipants: data.noShowParticipants || [],
        blocklistedParticipants: data.blocklistedParticipants || [],
      });

      if (form) form.reset();

      try {
        await refreshOverview();
      } catch (refreshError) {
        console.warn("Failed to refresh overview after import:", refreshError);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unable to import participants";
      console.error("Import error:", error);
      setOverviewError(errorMessage);
    } finally {
      setImportLoading(false);
    }
  };

  const handleDownload = async (
    url: string,
    options: RequestInit,
    filename: string,
    key: string,
  ) => {
    try {
      setDownloadKey(key);
      const response = await fetch(url, options);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Download failed");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const tempLink = document.createElement("a");
      tempLink.href = objectUrl;
      tempLink.download = filename;
      tempLink.click();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setOverviewError(
        error instanceof Error ? error.message : "Unable to download file",
      );
    } finally {
      setDownloadKey(null);
    }
  };

  const filteredNoShows = useMemo(() => {
    if (!searchQuery) return noShowHistory;
    const query = searchQuery.toLowerCase();
    return noShowHistory.filter((entry) => {
      const value = (entry.participant[searchField] ?? "").toLowerCase();
      return value.includes(query);
    });
  }, [noShowHistory, searchQuery, searchField]);

  const filteredBlocklist = useMemo(() => {
    if (!searchQuery) return blocklist;
    const query = searchQuery.toLowerCase();
    return blocklist.filter((entry) => {
      const value = (entry.participant[searchField] ?? "").toLowerCase();
      return value.includes(query);
    });
  }, [blocklist, searchQuery, searchField]);

  const sortedEventHistory = useMemo(() => {
    const cloned = [...eventHistory];
    return cloned.sort((a, b) => {
      if (eventSort === "eventDate") {
        return (
          new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime()
        );
      }
      if (eventSort === "attended") {
        return b.attended - a.attended;
      }
      return b.noShows - a.noShows;
    });
  }, [eventHistory, eventSort]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } catch (error) {
      console.error("Logout error:", error);
      setIsLoggingOut(false);
    }
  };

  const handleAttendance = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedAttendanceEvent) {
      setAttendanceResult(null);
      setOverviewError("Please select an event before uploading attendance");
      return;
    }

    setAttendanceLoading(true);
    setAttendanceResult(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch(`/api/events/${selectedAttendanceEvent}/attendance`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Attendance update failed" }));
        throw new Error(err.error ?? "Attendance update failed");
      }

      const data = await response.json();
      setAttendanceResult(data);

      if (form) form.reset();
      await refreshOverview();
    } catch (error) {
      setOverviewError(error instanceof Error ? error.message : "Unable to record attendance");
    } finally {
      setAttendanceLoading(false);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar Navigation */}
      <aside className={`sidebar tab-${activeTab}`}>
        <div className="sidebar-header">
          <img
            src="/assets/logo.png"
            alt="VolunteerGelp"
            className="sidebar-logo"
            onError={(e) => {
              // fallback to text if image fails
              const el = e.currentTarget as HTMLImageElement;
              el.style.display = "none";
              const header = el.parentElement;
              if (header) {
                const h = document.createElement("h1");
                h.textContent = "Event Management";
                header.insertBefore(h, el);
              }
            }}
          />
          <p className="muted">Admin Dashboard</p>
        </div>
        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="nav-icon">
              <IconDashboard />
            </span>
            <span className="nav-label">Dashboard</span>
          </button>
          <button
            className={`nav-item ${activeTab === "import" ? "active" : ""}`}
            onClick={() => setActiveTab("import")}
          >
            <span className="nav-icon">
              <IconImport />
            </span>
            <span className="nav-label">Import & Attendance</span>
          </button>
          <button
            className={`nav-item ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            <span className="nav-icon">
              <IconEvents />
            </span>
            <span className="nav-label">Event History</span>
          </button>
          <button
            className={`nav-item ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <span className="nav-icon">
              <IconHistory />
            </span>
            <span className="nav-label">No-Show History</span>
          </button>
          <button
            className={`nav-item ${activeTab === "blocklist" ? "active" : ""}`}
            onClick={() => setActiveTab("blocklist")}
          >
            <span className="nav-icon">
              <IconBlocklist />
            </span>
            <span className="nav-label">Blocklist</span>
          </button>
          <button
            className={`nav-item ${activeTab === "volunteers" ? "active" : ""}`}
            onClick={() => setActiveTab("volunteers")}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-label">Volunteers</span>
          </button>
          <div className="sidebar-footer">
            <button
              className="nav-item logout-button"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              <span className="nav-icon">🚪</span>
              <span className="nav-label">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className={`dashboard-content tab-${activeTab}`}>
        <div className="page">
          {overviewError && (
            <div className="message error">
              <strong>Heads up:</strong> {overviewError}
            </div>
          )}

          {/* Dashboard Tab - Summary with Visual Charts */}
          {activeTab === "dashboard" && (
            <section className="section">
              <div className="section-header">
                <h2>TechNexus Dashboard Overview</h2>
                <span className="muted">
                  {loadingOverview
                    ? "Syncing latest data..."
                    : "Live analytics across all events"}
                </span>
              </div>
              {summary ? (
                <>
                  <div className="card-grid">
                    <div className="stat-card">
                      <span>Total Participants</span>
                      <strong>{summary.totalParticipants}</strong>
                    </div>
                    <div className="stat-card">
                      <span>Total Attended</span>
                      <strong>{summary.totalAttended}</strong>
                    </div>
                    <div className="stat-card">
                      <span>Total No-Shows</span>
                      <strong>{summary.totalNoShows}</strong>
                    </div>
                    <div className="stat-card">
                      <span>Blocklisted</span>
                      <strong>{summary.totalBlocklisted}</strong>
                    </div>
                    <div className="stat-card">
                      <span>No-Show %</span>
                      <strong>{summary.noShowPercentage}%</strong>
                    </div>
                    <div className="stat-card">
                      <span>Events Recorded</span>
                      <strong>{summary.totalEvents}</strong>
                    </div>
                  </div>

                  {/* Visual Charts */}
                  <div className="charts-container">
                    <div className="chart-card">
                      <h3>Attendance Distribution</h3>
                      <div className="chart-bar-container">
                        <div className="chart-bar-item">
                          <div className="chart-bar-label">
                            <span>Attended</span>
                            <span>{summary.totalAttended}</span>
                          </div>
                          <div className="chart-bar">
                            <div
                              className="chart-bar-fill attended"
                              style={{
                                width: `${
                                  summary.totalAttended + summary.totalNoShows >
                                  0
                                    ? (summary.totalAttended /
                                        (summary.totalAttended +
                                          summary.totalNoShows)) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                        <div className="chart-bar-item">
                          <div className="chart-bar-label">
                            <span>No-Shows</span>
                            <span>{summary.totalNoShows}</span>
                          </div>
                          <div className="chart-bar">
                            <div
                              className="chart-bar-fill no-show"
                              style={{
                                width: `${
                                  summary.totalAttended + summary.totalNoShows >
                                  0
                                    ? (summary.totalNoShows /
                                        (summary.totalAttended +
                                          summary.totalNoShows)) *
                                      100
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="chart-card">
                      <h3>No-Show Rate</h3>
                      <div className="chart-circle-container">
                        <div className="chart-circle">
                          <svg
                            viewBox="0 0 120 120"
                            className="chart-circle-svg"
                          >
                            <circle
                              cx="60"
                              cy="60"
                              r="50"
                              fill="none"
                              stroke="rgba(59, 130, 246, 0.2)"
                              strokeWidth="10"
                            />
                            <circle
                              cx="60"
                              cy="60"
                              r="50"
                              fill="none"
                              stroke={
                                summary.noShowPercentage > 20
                                  ? "#ef4444"
                                  : summary.noShowPercentage > 10
                                    ? "#f59e0b"
                                    : "#10b981"
                              }
                              strokeWidth="10"
                              strokeDasharray={`${(summary.noShowPercentage / 100) * 314} 314`}
                              strokeDashoffset="78.5"
                              transform="rotate(-90 60 60)"
                              className="chart-circle-progress"
                            />
                          </svg>
                          <div className="chart-circle-text">
                            <strong>{summary.noShowPercentage}%</strong>
                            <span>No-Show Rate</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="chart-card">
                      <h3>Participant Status</h3>
                      <div className="chart-pie-container">
                        <div className="chart-pie-item">
                          <div
                            className="chart-pie-color"
                            style={{ background: "#10b981" }}
                          />
                          <div className="chart-pie-info">
                            <span>Active</span>
                            <strong>
                              {summary.totalParticipants -
                                summary.totalBlocklisted}
                            </strong>
                          </div>
                        </div>
                        <div className="chart-pie-item">
                          <div
                            className="chart-pie-color"
                            style={{ background: "#ef4444" }}
                          />
                          <div className="chart-pie-info">
                            <span>Blocklisted</span>
                            <strong>{summary.totalBlocklisted}</strong>
                          </div>
                        </div>
                        <div className="chart-pie-item">
                          <div
                            className="chart-pie-color"
                            style={{ background: "#3b82f6" }}
                          />
                          <div className="chart-pie-info">
                            <span>Total</span>
                            <strong>{summary.totalParticipants}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <p className="muted">Loading summary...</p>
              )}
            </section>
          )}

          {/* Import & Attendance Tab */}
          {activeTab === "import" && (
            <>
              <section className="section">
                <div className="section-header">
                  <h2>Confirmed List Import</h2>
                  <span className="muted">
                    Upload the confirmed attendee spreadsheet
                  </span>
                </div>
                <form onSubmit={handleImport}>
                  <div className="form-grid">
                    <label>
                      Event Name
                      <input
                        type="text"
                        name="eventName"
                        placeholder="Tech Meetup - July"
                        required
                        minLength={3}
                        title="Event name must be at least 3 characters"
                      />
                    </label>
                    <label>
                      Event Date
                      <input type="date" name="eventDate" required />
                    </label>
                    <label>
                      Confirmed Participants Excel
                      <input
                        type="file"
                        name="confirmedFile"
                        accept=".xlsx,.xls"
                        required
                      />
                    </label>
                  </div>
                  <button type="submit" disabled={importLoading}>
                    {importLoading ? "Importing..." : "Import Participants"}
                  </button>
                </form>
                {importResult && (
                  <div
                    className="message success"
                    style={{ marginTop: "1rem" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "0.5rem",
                        flexWrap: "wrap",
                        gap: "0.5rem",
                      }}
                    >
                      <div>
                        <strong>Import summary:</strong> Imported{" "}
                        {importResult.summary.totalImported} rows ·{" "}
                        {importResult.summary.newParticipants} new ·{" "}
                        {importResult.summary.normalParticipants ?? 0} normal ·{" "}
                        {importResult.summary.flaggedNoShows} previous no-shows
                        · {importResult.summary.flaggedBlocklisted} blocklisted.
                      </div>
                      <button
                        type="button"
                        className="secondary-btn"
                        onClick={() => {
                          // Combine all participants with their categories
                          const normal = (
                            importResult.normalParticipants || []
                          ).map((p) => ({
                            "Full Name": p.fullName,
                            Email: p.email,
                            Company: p.company ?? "",
                            City: p.city ?? "",
                            Category: "Normal",
                            "Previous No-Show": "No",
                            Blocklisted: "No",
                          }));
                          const noShows = (
                            importResult.noShowParticipants || []
                          ).map((p) => ({
                            "Full Name": p.fullName,
                            Email: p.email,
                            Company: p.company ?? "",
                            City: p.city ?? "",
                            Category: "Previous No-Show",
                            "Previous No-Show": "Yes",
                            Blocklisted: "No",
                          }));
                          const blocklisted = (
                            importResult.blocklistedParticipants || []
                          ).map((p) => ({
                            "Full Name": p.fullName,
                            Email: p.email,
                            Company: p.company ?? "",
                            City: p.city ?? "",
                            Category: "Blocklisted",
                            "Previous No-Show": "Yes",
                            Blocklisted: "Yes",
                          }));

                          const allParticipants = [
                            ...normal,
                            ...noShows,
                            ...blocklisted,
                          ];

                          console.log("Exporting participants:", {
                            normal: normal.length,
                            noShows: noShows.length,
                            blocklisted: blocklisted.length,
                            total: allParticipants.length,
                          });

                          if (allParticipants.length === 0) {
                            alert("No participants to export");
                            return;
                          }

                          try {
                            const buffer = buildWorkbookFromRows(
                              "all_participants",
                              allParticipants,
                            );
                            const arrayBuffer = bufferToArrayBuffer(buffer);
                            const objectUrl = URL.createObjectURL(
                              new Blob([arrayBuffer], {
                                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                              }),
                            );
                            const tempLink = document.createElement("a");
                            tempLink.href = objectUrl;
                            tempLink.download = `all_participants_${new Date().toISOString().split("T")[0]}.xlsx`;
                            tempLink.click();
                            URL.revokeObjectURL(objectUrl);
                          } catch (error) {
                            console.error("Export error:", error);
                            alert(
                              "Failed to export participants. Check console for details.",
                            );
                          }
                        }}
                        style={{ whiteSpace: "nowrap" }}
                      >
                        Export All Participants
                      </button>
                    </div>
                    <div style={{ marginTop: "0.75rem" }}>
                      {importResult.normalParticipants &&
                        importResult.normalParticipants.length > 0 && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <p>
                              <strong>
                                Normal Participants (
                                {importResult.normalParticipants.length}):
                              </strong>
                            </p>
                            <ul>
                              {importResult.normalParticipants.map(
                                (participant) => (
                                  <li key={participant.email}>
                                    {participant.fullName} ({participant.email})
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      {importResult.noShowParticipants &&
                        importResult.noShowParticipants.length > 0 && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <p>
                              <strong>
                                Previous No-Shows (
                                {importResult.noShowParticipants.length}):
                              </strong>
                            </p>
                            <ul>
                              {importResult.noShowParticipants.map(
                                (participant) => (
                                  <li key={participant.email}>
                                    {participant.fullName} ({participant.email})
                                    • Previous No-Show
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                      {importResult.blocklistedParticipants &&
                        importResult.blocklistedParticipants.length > 0 && (
                          <div style={{ marginBottom: "0.75rem" }}>
                            <p>
                              <strong>
                                Blocklisted (
                                {importResult.blocklistedParticipants.length}):
                              </strong>
                            </p>
                            <ul>
                              {importResult.blocklistedParticipants.map(
                                (participant) => (
                                  <li key={participant.email}>
                                    {participant.fullName} ({participant.email})
                                    • Blocklisted
                                  </li>
                                ),
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </div>
                )}
              </section>

              <section className="section">
                <div className="section-header">
                  <h2>Attendance Upload</h2>
                  <span className="muted">
                    Mark attended, no-show, and blocklisted lists after the
                    event
                  </span>
                </div>
                <form onSubmit={handleAttendance}>
                  <div className="form-grid">
                    <label>
                      Event
                      <select
                        value={selectedAttendanceEvent}
                        onChange={(event) =>
                          setSelectedAttendanceEvent(event.target.value)
                        }
                        required
                      >
                        <option value="" disabled>
                          Select event
                        </option>
                        {eventHistory.map((event) => (
                          <option key={event.id} value={event.id}>
                            {event.name} — {formatDate(event.eventDate)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Attended List
                      <input
                        type="file"
                        name="attendedFile"
                        accept=".xlsx,.xls"
                      />
                    </label>
                    <label>
                      No-Show List
                      <input
                        type="file"
                        name="noShowFile"
                        accept=".xlsx,.xls"
                      />
                    </label>
                    <label>
                      Blocklisted List
                      <input
                        type="file"
                        name="blocklistedFile"
                        accept=".xlsx,.xls"
                      />
                    </label>
                  </div>
                  <button type="submit" disabled={attendanceLoading}>
                    {attendanceLoading
                      ? "Recording attendance..."
                      : "Update Attendance"}
                  </button>
                </form>
                {attendanceResult && (
                  <div
                    className="message success"
                    style={{ marginTop: "1rem" }}
                  >
                    <strong>Attendance recorded.</strong> Marked{" "}
                    {attendanceResult.summary.totalAttendedMarked} attendees,{" "}
                    {attendanceResult.summary.totalNoShowsMarked} no-shows, and{" "}
                    {attendanceResult.summary.totalBlocklisted} blocklisted.
                    {attendanceResult.summary.missingParticipants.length >
                      0 && (
                      <div style={{ marginTop: "0.5rem" }}>
                        <span>Missing emails:</span>{" "}
                        {attendanceResult.summary.missingParticipants.join(
                          ", ",
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>
            </>
          )}

          {/* Event History Tab */}
          {activeTab === "events" && (
            <section className="section">
              <div className="section-header">
                <h2>Event History</h2>
                <div className="actions">
                  <label>
                    Sort by
                    <select
                      style={{ marginLeft: "0.5rem" }}
                      value={eventSort}
                      onChange={(event) =>
                        setEventSort(event.target.value as typeof eventSort)
                      }
                    >
                      <option value="eventDate">Event Date</option>
                      <option value="attended">Attended</option>
                      <option value="noShows">No-Shows</option>
                    </select>
                  </label>
                </div>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Attended</th>
                      <th>No-Shows</th>
                      <th>Flagged</th>
                      <th>Exports</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedEventHistory.map((event) => (
                      <tr key={event.id}>
                        <td>{event.name}</td>
                        <td>{formatDate(event.eventDate)}</td>
                        <td>{event.totalParticipants}</td>
                        <td>
                          <span className="status-pill attended">
                            {event.attended}
                          </span>
                        </td>
                        <td>
                          <span className="status-pill no-show">
                            {event.noShows}
                          </span>
                        </td>
                        <td>{event.flagged}</td>
                        <td>
                          <div className="actions">
                            <button
                              type="button"
                              className="secondary-btn"
                              disabled={downloadKey !== null}
                              onClick={() =>
                                handleDownload(
                                  "/api/export/confirmed",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ eventId: event.id }),
                                  },
                                  `${event.name.replace(/\s+/g, "_")}_filtered_confirmed.xlsx`,
                                  `confirmed-${event.id}`,
                                )
                              }
                            >
                              {downloadKey === `confirmed-${event.id}`
                                ? "Preparing..."
                                : "Filtered Confirmed"}
                            </button>
                            <button
                              type="button"
                              className="secondary-btn"
                              disabled={downloadKey !== null}
                              onClick={() =>
                                handleDownload(
                                  "/api/export/no-show",
                                  {
                                    method: "POST",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({ eventId: event.id }),
                                  },
                                  `${event.name.replace(/\s+/g, "_")}_no_show_report.xlsx`,
                                  `noshow-${event.id}`,
                                )
                              }
                            >
                              {downloadKey === `noshow-${event.id}`
                                ? "Preparing..."
                                : "No-Show Report"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Volunteers management (moved to its own tab) */}
            </section>
          )}

          {/* No-Show History Tab */}
          {activeTab === "history" && (
            <section className="section">
              <div className="section-header">
                <h2>Global No-Show History</h2>
              </div>
              <div className="filters">
                <input
                  type="search"
                  placeholder={`Search by ${searchField}`}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <select
                  value={searchField}
                  onChange={(event) =>
                    setSearchField(event.target.value as typeof searchField)
                  }
                >
                  <option value="email">Email</option>
                  <option value="company">Company</option>
                  <option value="city">City</option>
                </select>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>City</th>
                      <th>Event</th>
                      <th>Recorded On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredNoShows.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.participant.fullName}</td>
                        <td>{entry.participant.email}</td>
                        <td>{entry.participant.company ?? "—"}</td>
                        <td>{entry.participant.city ?? "—"}</td>
                        <td>{entry.event.name}</td>
                        <td>{formatDate(entry.recordedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Blocklist Tab */}
          {activeTab === "blocklist" && (
            <section className="section">
              <div className="section-header">
                <h2>Permanent Blocklist</h2>
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={downloadKey !== null}
                  onClick={() =>
                    handleDownload(
                      "/api/export/blocklist",
                      { method: "GET" },
                      "global_blocklist.xlsx",
                      "blocklist",
                    )
                  }
                >
                  {downloadKey === "blocklist"
                    ? "Preparing..."
                    : "Export Blocklist"}
                </button>
              </div>
              <div className="filters">
                <input
                  type="search"
                  placeholder={`Search by ${searchField}`}
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
                <select
                  value={searchField}
                  onChange={(event) =>
                    setSearchField(event.target.value as typeof searchField)
                  }
                >
                  <option value="email">Email</option>
                  <option value="company">Company</option>
                  <option value="city">City</option>
                </select>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Participant</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>City</th>
                      <th>Total Missed Events</th>
                      <th>First Event</th>
                      <th>First No-Show Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBlocklist.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.participant.fullName}</td>
                        <td>{entry.participant.email}</td>
                        <td>{entry.participant.company ?? "—"}</td>
                        <td>{entry.participant.city ?? "—"}</td>
                        <td>{entry.totalNoShows}</td>
                        <td>{entry.firstNoShowEvent?.name ?? "—"}</td>
                        <td>
                          {entry.firstNoShowAt
                            ? formatDate(entry.firstNoShowAt)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* Volunteers Tab */}
          {activeTab === "volunteers" && (
            <section className="section">
              <div className="section-header">
                <h2>Volunteers</h2>
                <span className="muted">Manage volunteers supporting events</span>
              </div>
              <div style={{ marginTop: 12 }}>
                <Volunteers />
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
