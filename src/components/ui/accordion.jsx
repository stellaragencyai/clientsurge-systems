import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

/** @typedef {import("react").ComponentPropsWithoutRef<typeof AccordionPrimitive.Item> & { children?: import("react").ReactNode, className?: string }} AccordionItemProps */
/** @typedef {import("react").ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger> & { children?: import("react").ReactNode, className?: string }} AccordionTriggerProps */
/** @typedef {import("react").ComponentPropsWithoutRef<typeof AccordionPrimitive.Content> & { children?: import("react").ReactNode, className?: string }} AccordionContentProps */

const Accordion = AccordionPrimitive.Root

/** @type {import("react").ForwardRefExoticComponent<AccordionItemProps & import("react").RefAttributes<HTMLDivElement>>} */
const AccordionItem = React.forwardRef(
  /**
   * @param {AccordionItemProps} props
   * @param {import("react").ForwardedRef<HTMLDivElement>} ref
   */
  function AccordionItem({ className, ...props }, ref) {
    return <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
  }
)
AccordionItem.displayName = "AccordionItem"

/** @type {import("react").ForwardRefExoticComponent<AccordionTriggerProps & import("react").RefAttributes<HTMLButtonElement>>} */
const AccordionTrigger = React.forwardRef(
  /**
   * @param {AccordionTriggerProps} props
   * @param {import("react").ForwardedRef<HTMLButtonElement>} ref
   */
  function AccordionTrigger({ className, children, ...props }, ref) {
    return (
      <AccordionPrimitive.Header className="flex">
        <AccordionPrimitive.Trigger
          ref={ref}
          className={cn(
            "flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180",
            className
          )}
          {...props}>
          {children}
          <ChevronDown
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
    )
  }
)
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

/** @type {import("react").ForwardRefExoticComponent<AccordionContentProps & import("react").RefAttributes<HTMLDivElement>>} */
const AccordionContent = React.forwardRef(
  /**
   * @param {AccordionContentProps} props
   * @param {import("react").ForwardedRef<HTMLDivElement>} ref
   */
  function AccordionContent({ className, children, ...props }, ref) {
    return (
      <AccordionPrimitive.Content
        ref={ref}
        className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
        {...props}>
        <div className={cn("pb-4 pt-0", className)}>{children}</div>
      </AccordionPrimitive.Content>
    )
  }
)
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
