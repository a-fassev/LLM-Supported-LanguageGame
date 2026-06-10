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
  width: 1448,
  height: 1086,
  aspectRatio: "4 / 3",
} as const;

export const ROOM_BACKGROUND_SRC = "/content-assets/room/final-room-teens.png";

export const ROOM_ITEMS: RoomItem[] = [
  { id: "window_view", label: "Vista su Bologna", cost: 60, x: 862, y: 35, width: 390, height: 492 },
  { id: "bedspread", label: "Copriletto", cost: 40, x: 180, y: 665, width: 450, height: 250 },
  { id: "city_poster", label: "Grande poster", cost: 40, x: 258, y: 135, width: 148, height: 278 },
  { id: "rug", label: "Tappeto", cost: 40, x: 595, y: 770, width: 465, height: 280 },
  { id: "pillow", label: "Cuscino", cost: 30, x: 45, y: 545, width: 330, height: 150 },
  { id: "big_shelf", label: "Grande mensola", cost: 30, x: 0, y: 172, width: 260, height: 188 },
  { id: "pinboard", label: "Bacheca", cost: 30, x: 405, y: 200, width: 124, height: 238 },
  { id: "pouf", label: "Pouf", cost: 30, x: 780, y: 642, width: 245, height: 150 },
  { id: "musicbox", label: "Cassa musicale", cost: 30, x: 440, y: 538, width: 145, height: 105 },
  { id: "headphones", label: "Cuffie", cost: 30, x: 345, y: 520, width: 110, height: 120 },
  { id: "pencil_cup", label: "Portapenne", cost: 15, x: 1358, y: 620, width: 90, height: 150 },
  { id: "notebook", label: "Quaderno", cost: 15, x: 1085, y: 780, width: 215, height: 85 },
  { id: "dvd_shelf", label: "Mensola con DVD", cost: 15, x: 1284, y: 218, width: 164, height: 122 },
  { id: "desk_lamp", label: "Lampada", cost: 15, x: 1205, y: 485, width: 230, height: 155 },
  { id: "ipad", label: "iPad", cost: 15, x: 1155, y: 640, width: 230, height: 155 },
  { id: "football_pennant", label: "Bandierina calcio", cost: 15, x: 1335, y: 355, width: 113, height: 135 },
];

export const ROOM_ITEM_IDS = new Set(ROOM_ITEMS.map((item) => item.id));

export function getRoomItem(itemId: string): RoomItem | null {
  return ROOM_ITEMS.find((item) => item.id === itemId) ?? null;
}
