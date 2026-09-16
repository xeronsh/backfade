import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { label: string; to: string };
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="px-6 py-16 text-center">
      <h2 className="text-narrative font-semibold text-text-2">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-body text-text-3">
        {description}
      </p>
      {action ? (
        <ButtonLink to={action.to} className="mt-5">
          {action.label}
        </ButtonLink>
      ) : null}
    </Card>
  );
}
