import { create } from "zustand";

export interface Followup {
  id: number;
  kind: "drink" | "posture";
  title: string;
  body: string;
}

interface FollowupStore {
  items: Followup[];
  queue: (item: Omit<Followup, "id">) => void;
  dismiss: (id: number) => void;
}

let nextId = 1;

export const useFollowupStore = create<FollowupStore>((set) => ({
  items: [],
  queue: (item) =>
    set((s) => ({
      items: [...s.items, { ...item, id: nextId++ }],
    })),
  dismiss: (id) =>
    set((s) => ({
      items: s.items.filter((it) => it.id !== id),
    })),
}));
