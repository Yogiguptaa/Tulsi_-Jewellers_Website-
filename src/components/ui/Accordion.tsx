"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";

export type AccordionItem = {
  id: string;
  question: string;
  answer: string;
};

/**
 * Disclosure list built on <details>-like behaviour but with controlled state so
 * the plus/minus icon and the panel stay in sync. Screen readers get
 * aria-expanded / aria-controls, and the answer is real text (never an image),
 * so it stays searchable and translatable.
 */
export default function Accordion({
  items,
  defaultOpenId = null,
  allowMultiple = false,
}: {
  items: AccordionItem[];
  defaultOpenId?: string | null;
  allowMultiple?: boolean;
}) {
  const [open, setOpen] = useState<string[]>(defaultOpenId ? [defaultOpenId] : []);

  const toggle = (id: string) =>
    setOpen((current) => {
      const isOpen = current.includes(id);
      if (isOpen) return current.filter((entry) => entry !== id);
      return allowMultiple ? [...current, id] : [id];
    });

  return (
    <div className="divide-y divide-gold/25 border-y border-gold/25">
      {items.map((item) => {
        const isOpen = open.includes(item.id);
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                onClick={() => toggle(item.id)}
                aria-expanded={isOpen}
                aria-controls={`panel-${item.id}`}
                id={`trigger-${item.id}`}
                className="flex w-full items-start justify-between gap-4 py-4 text-left hover:text-maroon"
              >
                <span className="font-[family-name:var(--font-display)] text-lg leading-snug">
                  {item.question}
                </span>
                <span
                  className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/50 text-maroon"
                  aria-hidden="true"
                >
                  {isOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                </span>
              </button>
            </h3>
            <div
              id={`panel-${item.id}`}
              role="region"
              aria-labelledby={`trigger-${item.id}`}
              hidden={!isOpen}
              className="pb-5 pr-8 text-sm leading-relaxed text-charcoal/75"
            >
              {item.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}
