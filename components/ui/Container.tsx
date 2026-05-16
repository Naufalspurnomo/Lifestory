import { cn } from "../../lib/utils";
import type { ElementType, ReactNode } from "react";

type ContainerProps = {
  as?: ElementType;
  className?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
};

const sizeMap: Record<NonNullable<ContainerProps["size"]>, string> = {
  sm: "max-w-3xl",
  md: "max-w-5xl",
  lg: "max-w-6xl",
  xl: "max-w-[1320px]",
};

export function Container({
  as,
  className,
  children,
  size = "lg",
}: ContainerProps) {
  const Tag = (as ?? "div") as ElementType;
  return (
    <Tag
      className={cn(
        "mx-auto w-full px-6",
        sizeMap[size],
        className
      )}
    >
      {children}
    </Tag>
  );
}
