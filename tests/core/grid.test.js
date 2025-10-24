/**
 * Tests for grid geometry module
 */

import { describe, it, expect } from 'vitest';
import {
  ROW_COUNT,
  getRowLength,
  ROW_START,
  getPadIndex,
  getRowCol,
  getMidiNote,
  getCellCenter,
  getHexPoints,
  getViewBox
} from '../../src/core/grid.js';

describe('Grid Geometry', () => {
  describe('Row structure', () => {
    it('should have 11 rows', () => {
      expect(ROW_COUNT).toBe(11);
    });

    it('should return correct row lengths', () => {
      expect(getRowLength(0)).toBe(6); // Even row
      expect(getRowLength(1)).toBe(5); // Odd row
      expect(getRowLength(2)).toBe(6);
      expect(getRowLength(3)).toBe(5);
      expect(getRowLength(10)).toBe(6);
    });

    it('should have correct row start indexes', () => {
      // Row lengths: 6, 5, 6, 5, 6, 5, 6, 5, 6, 5, 6
      // Cumulative: 0, 6, 11, 17, 22, 28, 33, 39, 44, 50, 55
      expect(ROW_START).toEqual([0, 6, 11, 17, 22, 28, 33, 39, 44, 50, 55]);
    });
  });

  describe('Pad indexing', () => {
    it('should calculate pad index correctly', () => {
      expect(getPadIndex(0, 0)).toBe(0);
      expect(getPadIndex(0, 5)).toBe(5);
      expect(getPadIndex(1, 0)).toBe(6);   // Row 1 starts at 6
      expect(getPadIndex(1, 4)).toBe(10);  // Row 1: 6+4 = 10
      expect(getPadIndex(2, 0)).toBe(11);  // Row 2 starts at 11
    });

    it('should convert pad index back to row/col', () => {
      expect(getRowCol(0)).toEqual({ row: 0, col: 0 });
      expect(getRowCol(5)).toEqual({ row: 0, col: 5 });
      expect(getRowCol(6)).toEqual({ row: 1, col: 0 });
      expect(getRowCol(10)).toEqual({ row: 1, col: 4 });
      expect(getRowCol(11)).toEqual({ row: 2, col: 0 });
    });

    it('should maintain row/col consistency', () => {
      for (let row = 0; row < ROW_COUNT; row++) {
        for (let col = 0; col < getRowLength(row); col++) {
          const padIndex = getPadIndex(row, col);
          const recovered = getRowCol(padIndex);
          expect(recovered).toEqual({ row, col });
        }
      }
    });
  });

  describe('MIDI mapping', () => {
    it('should calculate MIDI notes with default base', () => {
      expect(getMidiNote(0, 0)).toBe(48); // C3
      expect(getMidiNote(0, 1)).toBe(49);
      expect(getMidiNote(1, 0)).toBe(54); // Row 1 starts at pad 6
    });

    it('should calculate MIDI notes with custom base', () => {
      expect(getMidiNote(0, 0, 60)).toBe(60); // C4
      expect(getMidiNote(0, 1, 60)).toBe(61);
      expect(getMidiNote(1, 0, 60)).toBe(66); // Row 1 starts at pad 6
    });
  });

  describe('Geometry calculations', () => {
    it('should calculate cell centers', () => {
      const center1 = getCellCenter(0, 0);
      expect(center1.x).toBe(48); // padding
      expect(center1.y).toBe(378); // (11-1)*33 + 48

      const center2 = getCellCenter(0, 1);
      expect(center2.x).toBe(86); // 48 + 38
    });

    it('should generate hex points', () => {
      const points = getHexPoints(100, 100, 22);
      expect(points).toContain('100,78'); // Top point
      expect(points).toContain('100,122'); // Bottom point
    });

    it('should generate correct viewBox', () => {
      const portraitVB = getViewBox('portrait');
      expect(portraitVB.width).toBeGreaterThan(0);
      expect(portraitVB.height).toBeGreaterThan(0);
      expect(portraitVB.viewBox).toContain('0 0');

      const landscapeVB = getViewBox('landscape');
      expect(landscapeVB.width).toBe(portraitVB.height);
      expect(landscapeVB.height).toBe(portraitVB.width);
    });
  });
});
