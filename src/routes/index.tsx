import { createFileRoute } from "@tanstack/react-router";
import { Experience } from "../game/Experience";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "ChainQuest — A Cinematic 3D Journey Through Bitcoin & Blockchain" },
      { name: "description", content: "Scroll through an interactive 3D film that teaches wallets, transactions, mining, hashing and blockchains — then prove it in the final challenge." },
      { property: "og:title", content: "ChainQuest — Learn Blockchain Through a 3D Film" },
      { property: "og:description", content: "Follow one Bitcoin from wallet to network to block to chain in a scroll-driven 3D learning adventure." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Experience,
});
