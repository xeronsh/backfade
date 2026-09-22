import { useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/backfade/EmptyState";
import { ThesisPost } from "@/components/backfade/ThesisPost";
import { Metric, MetricGroup } from "@/components/data";
import { PageContainer, PageSection, SplitLayout } from "@/components/layout";
import { Alert } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FilterBar } from "@/components/ui/filter-bar";
import { useLeaderboard, useTheses } from "@/features/thesis/hooks";
import { formatAmount, formatError, shortAddress } from "@/lib/format";

type Filter = "all" | "open" | "resolved";

export default function Feed() {
  const [filter, setFilter] = useState<Filter>("all");
  const theses = useTheses();
  const leaderboard = useLeaderboard();
  const data = theses.data ?? [];
  const openCount = data.filter((thesis) => thesis.state === "OPEN").length;
  const visible = data.filter((thesis) => {
    if (filter === "open") return thesis.state === "OPEN";
    if (filter === "resolved")
      return thesis.state === "SETTLED" || thesis.state === "CANCELLED";
    return true;
  });

  return (
    <PageContainer>
      {theses.error ? (
        <Alert
          title="Feed unavailable"
          description={formatError(
            theses.error,
            "en",
            "Chain data could not be read.",
          )}
        />
      ) : null}
      <SplitLayout
        main={
          <PageSection
            title="Thesis feed"
            action={
              <FilterBar
                label="Feed filter"
                options={[
                  { id: "all", label: "All" },
                  { id: "open", label: "Open" },
                  { id: "resolved", label: "Resolved" },
                ]}
                value={filter}
                onChange={setFilter}
              />
            }
          >
            {theses.isLoading ? (
              <p className="text-body text-text-2">Loading the Thesis feed…</p>
            ) : null}
            {!theses.isLoading && !theses.error ? (
              visible.length === 0 ? (
                <EmptyState
                  title="No Theses yet"
                  description="Creators bond a Thesis. Challengers put money behind disagreement. Verified price feeds settle the argument."
                  action={{ label: "Post a Thesis", to: "/post" }}
                />
              ) : (
                <div className="grid gap-4">
                  {visible.map((thesis) => (
                    <ThesisPost key={thesis.address} thesis={thesis} />
                  ))}
                </div>
              )
            ) : null}
          </PageSection>
        }
        aside={
          <>
            <PageSection title="Network">
              <Card>
                <CardContent className="pt-4">
                  <MetricGroup columns={2}>
                    <Metric label="Theses" value={data.length} />
                    <Metric
                      label="Open now"
                      value={openCount}
                      tone="brand"
                    />
                  </MetricGroup>
                </CardContent>
              </Card>
            </PageSection>
            <PageSection
              title="Track records"
              action={
                <Link
                  to="/leaderboard"
                  className="font-mono text-meta uppercase tracking-label text-brand hover:text-brand-hover"
                >
                  View all →
                </Link>
              }
            >
              <Card>
                <CardHeader>
                  <h2 className="text-narrative font-semibold">Realized P&L</h2>
                </CardHeader>
                <CardContent className="pt-4">
                  {leaderboard.isLoading ? (
                    <p className="text-body text-text-2">Loading…</p>
                  ) : null}
                  <ol className="grid gap-3">
                    {leaderboard.data?.slice(0, 5).map((entry, index) => (
                      <li
                        key={entry.address}
                        className="flex items-baseline gap-3 border-b border-border pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="font-mono text-meta text-text-3">
                          #{index + 1}
                        </span>
                        <Link
                          to={`/profile/${entry.address}`}
                          className="min-w-0 flex-1 truncate text-body text-text-1 hover:text-brand"
                        >
                          {shortAddress(entry.address)}
                        </Link>
                        <span
                          className="font-mono text-meta text-brand"
                          data-financial
                        >
                          {formatAmount(entry.pnl)} USDG
                        </span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            </PageSection>
          </>
        }
        asidePosition="sticky"
        gap="loose"
      />
    </PageContainer>
  );
}
