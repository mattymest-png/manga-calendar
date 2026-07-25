export type PublisherSlug =
  | "viz"
  | "kodansha"
  | "yen-press"
  | "seven-seas"
  | "square-enix";

export interface Publisher {
  slug: PublisherSlug;
  name: string;
  shortName: string;
  color: string; // CSS var name
  site: string;
}

export const PUBLISHERS: Record<PublisherSlug, Publisher> = {
  viz: {
    slug: "viz",
    name: "Viz Media",
    shortName: "Viz",
    color: "var(--pub-viz)",
    site: "https://www.viz.com",
  },
  kodansha: {
    slug: "kodansha",
    name: "Kodansha USA",
    shortName: "Kodansha",
    color: "var(--pub-kodansha)",
    site: "https://kodansha.us",
  },
  "yen-press": {
    slug: "yen-press",
    name: "Yen Press",
    shortName: "Yen Press",
    color: "var(--pub-yen)",
    site: "https://yenpress.com",
  },
  "seven-seas": {
    slug: "seven-seas",
    name: "Seven Seas Entertainment",
    shortName: "Seven Seas",
    color: "var(--pub-sevenseas)",
    site: "https://sevenseasentertainment.com",
  },
  "square-enix": {
    slug: "square-enix",
    name: "Square Enix Manga",
    shortName: "Square Enix",
    color: "var(--pub-squareenix)",
    site: "https://square-enix-books.com",
  },
};

export const PUBLISHER_LIST = Object.values(PUBLISHERS);
