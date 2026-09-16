import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; to: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="empty-state border-border px-6 py-16 text-center">
      <h2 className="text-lg font-semibold text-text-2">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-text-3">{description}</p>
      {action ? (
        <Link
          to={action.to}
          className={cn(buttonVariants({ variant: "primary" }), "mt-5")}
        >
          {action.label}
        </Link>
      ) : null}
    </Card>
  );
}
