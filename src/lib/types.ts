export type BlockedSlot = {
  id: string;
  date: string;
  duration: number | null;
  allDay: boolean;
  reason: string | null;
  createdAt: string;
};
