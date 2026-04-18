import { buildDateRange } from './date-range.util';

describe('buildDateRange', () => {
  it('retorna undefined quando não há datas', () => {
    expect(buildDateRange()).toBeUndefined();
    expect(buildDateRange(undefined, undefined)).toBeUndefined();
  });

  it('define apenas gte quando só startDate é fornecida', () => {
    const result = buildDateRange('2026-01-01');
    expect(result).toBeDefined();
    expect(result!.gte).toEqual(new Date('2026-01-01'));
    expect(result!.lte).toBeUndefined();
  });

  it('define lte às 23:59:59.999 quando só endDate é fornecida', () => {
    const result = buildDateRange(undefined, '2026-01-31');
    expect(result).toBeDefined();
    const end = result!.lte as Date;
    expect(end.getHours()).toBe(23);
    expect(end.getMinutes()).toBe(59);
    expect(end.getSeconds()).toBe(59);
    expect(end.getMilliseconds()).toBe(999);
  });

  it('define gte e lte quando ambas as datas são fornecidas', () => {
    const result = buildDateRange('2026-01-01', '2026-01-31');
    expect(result!.gte).toEqual(new Date('2026-01-01'));
    expect(result!.lte).toBeDefined();
  });

  it('lte inclui o dia inteiro (23:59:59.999)', () => {
    const result = buildDateRange('2026-06-01', '2026-06-15');
    const lte = result!.lte as Date;
    expect(lte.toISOString()).toContain('2026-06-15');
    expect(lte.getHours()).toBe(23);
  });
});
