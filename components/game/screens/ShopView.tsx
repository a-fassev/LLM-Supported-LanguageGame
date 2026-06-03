import { cn } from "@/lib/utils";

const SHOP_PLACEHOLDER_ID = "shop-placeholder";

type ShopViewProps = {
  className?: string;
};

/** Room shop + preview shell; catalog and purchases wired in a later milestone. */
export function ShopView({ className }: ShopViewProps) {
  return (
    <section
      className={cn("flex min-h-0 flex-1 flex-col", className)}
      aria-labelledby={SHOP_PLACEHOLDER_ID}
    >
      <p id={SHOP_PLACEHOLDER_ID} className="text-base text-muted-foreground">
        Presto potrai arredare la tua stanza con le fette di pizza.
      </p>
    </section>
  );
}
