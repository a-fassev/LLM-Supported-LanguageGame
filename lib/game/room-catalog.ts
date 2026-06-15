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
  { id: "bedspread", label: "Copriletto", cost: 40, x: 80, y: 550, width: 690, height: 300 },
  { id: "city_poster", label: "Grande poster", cost: 40, x: 325, y: 125, width: 145, height: 245 },
  { id: "rug", label: "Tappeto", cost: 40, x: 650, y: 655, width: 440, height: 205 },
  { id: "pillow", label: "Cuscino", cost: 30, x: 66, y: 482, width: 335, height: 150 },
  { id: "big_shelf", label: "Grande mensola", cost: 30, x: 18, y: 110, width: 220, height: 170 },
  { id: "pinboard", label: "Bacheca", cost: 30, x: 468, y: 162, width: 120, height: 235 },
  { id: "pouf", label: "Pouf", cost: 30, x: 880, y: 585, width: 220, height: 155 },
  { id: "musicbox", label: "Cassa musicale", cost: 30, x: 220, y: 142, width: 100, height: 76 },
  { id: "headphones", label: "Lampada comodino", cost: 30, x: 345, y: 410, width: 128, height: 130 },
  { id: "pencil_cup", label: "Portapenne", cost: 15, x: 1518, y: 495, width: 125, height: 155 },
  { id: "notebook", label: "Quaderno", cost: 15, x: 1245, y: 642, width: 255, height: 100 },
  { id: "dvd_shelf", label: "Mensola con DVD", cost: 15, x: 1385, y: 150, width: 270, height: 135 },
  { id: "desk_lamp", label: "Lampada", cost: 15, x: 1390, y: 380, width: 190, height: 210 },
  { id: "ipad", label: "iPad", cost: 15, x: 1305, y: 535, width: 190, height: 130 },
  { id: "football_pennant", label: "Bandierina calcio", cost: 15, x: 1490, y: 300, width: 120, height: 165 },
];

export const ROOM_ITEM_IDS = new Set(ROOM_ITEMS.map((item) => item.id));

export function getRoomItem(itemId: string): RoomItem | null {
  return ROOM_ITEMS.find((item) => item.id === itemId) ?? null;
}
