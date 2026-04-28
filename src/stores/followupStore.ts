import { create } from "zustand";

export type FollowupKind = "drink" | "posture";

export interface Followup {
  id: number;
  kind: FollowupKind;
}

interface FollowupStore {
  items: Followup[];
  queue: (kind: FollowupKind) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useFollowupStore = create<FollowupStore>((set) => ({
  items: [],
  queue: (kind) =>
    set((s) => ({
      items: [...s.items, { id: nextId++, kind }],
    })),
  dismiss: (id) =>
    set((s) => ({
      items: s.items.filter((it) => it.id !== id),
    })),
}));
