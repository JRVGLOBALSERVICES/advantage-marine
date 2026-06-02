"use client";

// Source: Aceternity UI "Apple Cards Carousel" (apple-cards-carousel)
// https://ui.aceternity.com/components/apple-cards-carousel — license: free personal & commercial.
// Re-themed to the Advantage Marine cream+teal system. Stripped of @tabler/icons-react
// (inline SVG instead — no icon lib allowed), next/image (plain <img>), and dark-mode classes.
// useOutsideClick inlined to avoid an extra hooks file. Detail-panel removed in favour of an
// editorial info layer baked into each card; expandable overlay kept for the summary read.

import React, {
  useEffect,
  useRef,
  useState,
  createContext,
  useContext,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export type FanCard = {
  title: string;
  src: string; // real image path from public/media/<section>/
  category: string;
  summary: string;
};

function useOutsideClick(
  ref: React.RefObject<HTMLDivElement>,
  callback: () => void,
) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) return;
      callback();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, callback]);
}

const CarouselContext = createContext<{
  onCardClose: (index: number) => void;
  currentIndex: number;
}>({
  onCardClose: () => {},
  currentIndex: 0,
});

function Arrow({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden
    >
      {dir === "left" ? (
        <>
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </>
      ) : (
        <>
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </>
      )}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export function FanCardsCarousel({
  items,
  initialScroll = 0,
}: {
  items: FanCard[];
  initialScroll?: number;
}) {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const checkScrollability = useCallback(() => {
    if (!carouselRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

  useEffect(() => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft = initialScroll;
      checkScrollability();
    }
  }, [initialScroll, checkScrollability]);

  const scrollLeft = () =>
    carouselRef.current?.scrollBy({ left: -360, behavior: "smooth" });
  const scrollRight = () =>
    carouselRef.current?.scrollBy({ left: 360, behavior: "smooth" });

  const handleCardClose = (index: number) => {
    if (!carouselRef.current) return;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const cardWidth = isMobile ? 240 : 384;
    const gap = isMobile ? 16 : 24;
    carouselRef.current.scrollTo({
      left: (cardWidth + gap) * (index + 1),
      behavior: "smooth",
    });
    setCurrentIndex(index);
  };

  return (
    <CarouselContext.Provider value={{ onCardClose: handleCardClose, currentIndex }}>
      <div className="relative w-full">
        <div
          className="flex w-full overflow-x-scroll overscroll-x-auto scroll-smooth py-6 [scrollbar-width:none] md:py-10 [&::-webkit-scrollbar]:hidden"
          ref={carouselRef}
          onScroll={checkScrollability}
        >
          <div className="mx-auto flex max-w-7xl flex-row justify-start gap-4 px-4 md:gap-6">
            {items.map((card, index) => (
              <motion.div
                key={`fan-card-${index}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "120px" }}
                transition={{ duration: 0.5, delay: 0.08 * index, ease: EASE }}
                className="rounded-2xl last:pr-[5%] md:last:pr-[20%]"
              >
                <Card card={card} index={index} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="mr-2 mt-2 flex justify-end gap-2 md:mr-6">
          <button
            type="button"
            aria-label="Previous"
            className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors disabled:opacity-35"
            style={{
              borderColor: "var(--color-rule)",
              color: "var(--color-ink)",
              background: "var(--color-paper-2)",
            }}
            onClick={scrollLeft}
            disabled={!canScrollLeft}
          >
            <Arrow dir="left" />
          </button>
          <button
            type="button"
            aria-label="Next"
            className="flex h-11 w-11 items-center justify-center rounded-full border transition-colors disabled:opacity-35"
            style={{
              borderColor: "var(--color-rule)",
              color: "var(--color-ink)",
              background: "var(--color-paper-2)",
            }}
            onClick={scrollRight}
            disabled={!canScrollRight}
          >
            <Arrow dir="right" />
          </button>
        </div>
      </div>
    </CarouselContext.Provider>
  );
}

function Card({ card, index }: { card: FanCard; index: number }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { onCardClose } = useContext(CarouselContext);

  const handleClose = useCallback(() => {
    setOpen(false);
    onCardClose(index);
  }, [index, onCardClose]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.body.style.overflow = open ? "hidden" : "auto";
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, handleClose]);

  useOutsideClick(containerRef, handleClose);

  return (
    <>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 h-screen overflow-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="fixed inset-0 h-full w-full backdrop-blur-md"
              style={{
                background: "color-mix(in oklch, var(--color-ink) 55%, transparent)",
              }}
            />
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.4, ease: EASE }}
              ref={containerRef}
              className="relative z-[60] mx-auto my-10 h-fit max-w-3xl rounded-3xl border p-6 md:p-10"
              style={{
                background: "var(--color-paper-2)",
                borderColor: "var(--color-rule)",
              }}
            >
              <button
                type="button"
                aria-label="Close"
                className="sticky top-0 ml-auto flex h-9 w-9 items-center justify-center rounded-full"
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-accent-ink)",
                }}
                onClick={handleClose}
              >
                <CloseIcon />
              </button>
              <p
                className="eyebrow mt-2"
                style={{ color: "var(--color-accent)" }}
              >
                {card.category}
              </p>
              <h3
                className="font-display mt-3 leading-[1.1]"
                style={{ fontSize: "var(--text-h2)", color: "var(--color-ink)" }}
              >
                {card.title}
              </h3>
              <div className="mt-6 overflow-hidden rounded-2xl">
                <img
                  src={card.src}
                  alt={card.title}
                  className="h-auto w-full object-cover"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <p
                className="mt-6"
                style={{
                  color: "color-mix(in oklch, var(--color-ink) 70%, transparent)",
                }}
              >
                {card.summary}
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative z-10 flex h-80 w-60 flex-col items-start justify-end overflow-hidden rounded-2xl border text-left md:h-[34rem] md:w-96"
        style={{
          borderColor: "var(--color-rule)",
          background: "var(--color-paper-3)",
        }}
      >
        <img
          src={card.src}
          alt={card.title}
          className="absolute inset-0 z-10 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.04]"
          loading="lazy"
          decoding="async"
        />
        {/* ink scrim, bottom-anchored — keeps Cinzel title legible without a dark surface */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-3/5"
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--color-ink) 78%, transparent), transparent)",
          }}
        />
        <div className="relative z-30 p-6 md:p-8">
          <p
            className="eyebrow"
            style={{ color: "var(--color-accent-ink)" }}
          >
            {card.category}
          </p>
          <p
            className={cn("font-display mt-2 max-w-xs leading-[1.1] [text-wrap:balance]")}
            style={{ fontSize: "var(--text-h3)", color: "var(--color-accent-ink)" }}
          >
            {card.title}
          </p>
        </div>
      </button>
    </>
  );
}

export default FanCardsCarousel;
