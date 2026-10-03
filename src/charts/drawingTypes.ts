export type DrawingToolType =
  | 'cursor'
  | 'trendline'
  | 'horizontal'
  | 'vertical'
  | 'ray'
  | 'support'
  | 'resistance'
  | 'fibonacci'
  | 'fib_extension'
  | 'rectangle'
  | 'channel'
  | 'price_range'
  | 'measure';

export interface Point {
  x: number; // pixel coordinate
  y: number; // pixel coordinate
  time?: number; // timestamp in seconds
  price?: number; // price level
}

export interface DrawingItem {
  id: string;
  toolType: DrawingToolType;
  points: Point[];
  color: string;
  lineWidth: number;
  isCompleted: boolean;
  text?: string;
}
