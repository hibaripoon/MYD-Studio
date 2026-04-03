import { TaskStatus, PaymentStatus, getStatusLabel, getPaymentStatusLabel } from "@/lib/database";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const styles: Record<TaskStatus, string> = {
    pending: "bg-amber-50 text-amber-700 border border-amber-200",
    in_progress: "bg-blue-50 text-blue-700 border border-blue-200",
    review: "bg-purple-50 text-purple-700 border border-purple-200",
    done: "bg-green-50 text-green-700 border border-green-200",
    cancelled: "bg-gray-100 text-gray-500 border border-gray-200",
  };

  const dots: Record<TaskStatus, string> = {
    pending: "bg-amber-500",
    in_progress: "bg-blue-500",
    review: "bg-purple-500",
    done: "bg-green-500",
    cancelled: "bg-gray-400",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0",
        styles[status],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dots[status])} />
      {getStatusLabel(status)}
    </span>
  );
}

interface PaymentBadgeProps {
  status: PaymentStatus;
  className?: string;
}

export function PaymentBadge({ status, className }: PaymentBadgeProps) {
  const styles: Record<PaymentStatus, string> = {
    unpaid: "bg-red-50 text-red-700 border border-red-200",
    invoiced: "bg-blue-50 text-blue-700 border border-blue-200",
    partial: "bg-orange-50 text-orange-700 border border-orange-200",
    paid: "bg-green-50 text-green-700 border border-green-200",
  };

  const dots: Record<PaymentStatus, string> = {
    unpaid: "bg-red-500",
    invoiced: "bg-blue-500",
    partial: "bg-orange-500",
    paid: "bg-green-500",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex-shrink-0",
        styles[status],
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dots[status])} />
      {getPaymentStatusLabel(status)}
    </span>
  );
}
