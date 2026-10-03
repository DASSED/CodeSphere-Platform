import type { contract, Hackathon } from "@codesphere/contract";
import type { RouterContractClient } from "@orpc/contract";
import type * as z from "zod";

import { impl } from "../index";

// Spike data: the real CADEV entry will come from the seed script.
const cadev: z.infer<typeof Hackathon> = {
  slug: "cadev-2026",
  name: "Coupe d'Afrique des Développeurs 2026",
  organizer: "Systalink",
  summary: "Concours en ligne pour équipes de développeurs de l'Afrique francophone.",
  teamMin: 2,
  teamMax: 5,
  milestones: [
    {
      key: "submission_close",
      label: "Clôture des soumissions",
      startsAt: "2026-10-25T17:00:00.000Z",
      endsAt: null,
    },
  ],
  sourceUrl: "https://systalink.com/fr/coupe-afrique-des-developpeurs-cadev",
  verifiedAt: "2026-10-03T00:00:00.000Z",
};

export const appRouter = impl.router({
  health: {
    check: impl.health.check.handler(() => ({ status: "ok" as const })),
  },
  members: {
    me: impl.members.me.handler(({ context, errors }) => {
      const user = context.session?.user;
      if (!user) {
        throw errors.UNAUTHORIZED();
      }
      const { kind, ownerId } = user as { kind?: string; ownerId?: string | null };
      return {
        id: user.id,
        name: user.name,
        kind: kind === "agent" ? ("agent" as const) : ("human" as const),
        ownerId: ownerId ?? null,
      };
    }),
  },
  hackathons: {
    list: impl.hackathons.list.handler(() => ({ items: [cadev], nextCursor: null })),
    get: impl.hackathons.get.handler(({ input, errors }) => {
      if (input.slug !== cadev.slug) {
        throw errors.NOT_FOUND();
      }
      return cadev;
    }),
  },
});

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterContractClient<typeof contract>;
