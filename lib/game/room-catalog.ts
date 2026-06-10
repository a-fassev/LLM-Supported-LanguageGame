export type RoomItem = {
  id: string;
  label: string;
  cost: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export const ROOM_CANVAS = {
  width: 1672,
  height: 941,
  aspectRatio: "16 / 9",
} as const;

export const ROOM_BACKGROUND_SRC = "/content-assets/room/final-room-teens.png";

export const ROOM_ITEMS: RoomItem[] = [
  { id: "window_view", label: "Vista su Bologna", cost: 60, x: 990, y: 68, width: 375, height: 430 },
  { id: "bedspread", label: "Copriletto", cost: 40, x: 92, y: 590, width: 620, height: 250 },
  { id: "city_poster", label: "Grande poster", cost: 40, x: 325, y: 125, width: 145, height: 245 },
  { id: "rug", label: "Tappeto", cost: 40, x: 675, y: 680, width: 390, height: 165 },
  { id: "pillow", label: "Cuscino", cost: 30, x: 78, y: 502, width: 300, height: 125 },
  { id: "big_shelf", label: "Grande mensola", cost: 30, x: 18, y: 88, width: 185, height: 182 },
  { id: "pinboard", label: "Bacheca", cost: 30, x: 468, y: 162, width: 120, height: 235 },
  { id: "pouf", label: "Pouf", cost: 30, x: 900, y: 602, width: 190, height: 135 },
  { id: "musicbox", label: "Cassa musicale", cost: 30, x: 220, y: 142, width: 100, height: 76 },
  { id: "headphones", label: "Lampada comodino", cost: 30, x: 345, y: 410, width: 128, height: 130 },
  { id: "pencil_cup", label: "Portapenne", cost: 15, x: 1538, y: 520, width: 95, height: 130 },
  { id: "notebook", label: "Quaderno", cost: 15, x: 1272, y: 660, width: 205, height: 78 },
  { id: "dvd_shelf", label: "Mensola con DVD", cost: 15, x: 1410, y: 170, width: 235, height: 115 },
  { id: "desk_lamp", label: "Lampada", cost: 15, x: 1390, y: 380, width: 190, height: 210 },
  { id: "ipad", label: "iPad", cost: 15, x: 1305, y: 535, width: 190, height: 130 },
  { id: "football_pennant", label: "Bandierina calcio", cost: 15, x: 1490, y: 300, width: 120, height: 165 },
];

export const ROOM_ITEM_IDS = new Set(ROOM_ITEMS.map((item) => item.id));

export function getRoomItem(itemId: string): RoomItem | null {
  return ROOM_ITEMS.find((item) => item.id === itemId) ?? null;
}
