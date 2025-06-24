export interface StickyNoteData {
  id: string;
  type: 'sticky-note';
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export interface ShapeData {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'arrow';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TextFieldData {
  id: string;
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface ImageElementData {
  id: string;
  type: 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
}

export interface DrawingData {
  id: string;
  type: 'drawing';
  x: number;
  y: number;
  points: number[];
  stroke: string;
  strokeWidth: number;
  tool: 'pen' | 'marker' | 'eraser';
}

export type CanvasElement = StickyNoteData | ShapeData | TextFieldData | ImageElementData | DrawingData;

export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  targetId: string | null;
  targetType: string | null;
}