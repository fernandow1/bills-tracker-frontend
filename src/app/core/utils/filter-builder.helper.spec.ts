import { describe, it, expect } from 'vitest';
import {
  buildFilterString,
  buildFilterStrings,
  buildFilterParams,
  createFilter,
} from './filter-builder.helper';
import { FilterOperator } from './filter-operators.types';

describe('filter-builder.helper', () => {
  describe('createFilter', () => {
    it('should create filter with EQUALS operator by default', () => {
      const filter = createFilter('name', 'John');

      expect(filter).toEqual({
        field: 'name',
        operator: FilterOperator.EQUALS,
        value: 'John',
      });
    });

    it('should create filter with specified operator', () => {
      const filter = createFilter('idShop', [1, 2, 3], FilterOperator.IN);

      expect(filter).toEqual({
        field: 'idShop',
        operator: FilterOperator.IN,
        value: [1, 2, 3],
      });
    });

    it('should handle numeric values', () => {
      const filter = createFilter('age', 25, FilterOperator.GREATER_THAN);

      expect(filter).toEqual({
        field: 'age',
        operator: FilterOperator.GREATER_THAN,
        value: 25,
      });
    });

    it('should handle boolean values', () => {
      const filter = createFilter('active', true);

      expect(filter).toEqual({
        field: 'active',
        operator: FilterOperator.EQUALS,
        value: true,
      });
    });

    it('should handle null values', () => {
      const filter = createFilter('deletedAt', null, FilterOperator.IS_NULL);

      expect(filter).toEqual({
        field: 'deletedAt',
        operator: FilterOperator.IS_NULL,
        value: null,
      });
    });
  });

  describe('buildFilterString', () => {
    it('should build filter string with EQUALS operator', () => {
      const filter = createFilter('name', 'John');
      const result = buildFilterString(filter);

      expect(result).toBe('name.eq.John');
    });

    it('should build filter string with IN operator', () => {
      const filter = createFilter('idShop', [1, 2, 3], FilterOperator.IN);
      const result = buildFilterString(filter);

      expect(result).toBe('idShop.in.1,2,3');
    });

    it('should build filter string with LIKE operator', () => {
      const filter = createFilter('email', '@gmail.com', FilterOperator.LIKE);
      const result = buildFilterString(filter);

      expect(result).toBe('email.like.@gmail.com');
    });

    it('should build filter string with GREATER_THAN operator', () => {
      const filter = createFilter('price', 100, FilterOperator.GREATER_THAN);
      const result = buildFilterString(filter);

      expect(result).toBe('price.gt.100');
    });

    it('should build filter string with LESS_THAN_OR_EQUAL operator', () => {
      const filter = createFilter('stock', 50, FilterOperator.LESS_THAN_OR_EQUAL);
      const result = buildFilterString(filter);

      expect(result).toBe('stock.lte.50');
    });

    it('should build filter string with NOT_EQUALS operator', () => {
      const filter = createFilter('status', 'inactive', FilterOperator.NOT_EQUALS);
      const result = buildFilterString(filter);

      expect(result).toBe('status.ne.inactive');
    });

    it('should build filter string with NOT_IN operator', () => {
      const filter = createFilter('category', [1, 5, 9], FilterOperator.NOT_IN);
      const result = buildFilterString(filter);

      expect(result).toBe('category.nin.1,5,9');
    });

    it('should build filter string with STARTS_WITH operator', () => {
      const filter = createFilter('name', 'John', FilterOperator.STARTS_WITH);
      const result = buildFilterString(filter);

      expect(result).toBe('name.starts.John');
    });

    it('should build filter string with ENDS_WITH operator', () => {
      const filter = createFilter('email', '.com', FilterOperator.ENDS_WITH);
      const result = buildFilterString(filter);

      expect(result).toBe('email.ends..com');
    });

    it('should build filter string with NOT_LIKE operator', () => {
      const filter = createFilter('description', 'spam', FilterOperator.NOT_LIKE);
      const result = buildFilterString(filter);

      expect(result).toBe('description.nlike.spam');
    });

    it('should build filter string with BETWEEN operator', () => {
      const filter = createFilter('price', [10, 100], FilterOperator.BETWEEN);
      const result = buildFilterString(filter);

      expect(result).toBe('price.between.10,100');
    });

    it('should build filter string with IS_NULL operator without value', () => {
      const filter = createFilter('deletedAt', null, FilterOperator.IS_NULL);
      const result = buildFilterString(filter);

      expect(result).toBe('deletedAt.null');
    });

    it('should build filter string with IS_NOT_NULL operator without value', () => {
      const filter = createFilter('createdAt', null, FilterOperator.IS_NOT_NULL);
      const result = buildFilterString(filter);

      expect(result).toBe('createdAt.nnull');
    });

    it('should handle boolean values', () => {
      const filter = createFilter('active', true);
      const result = buildFilterString(filter);

      expect(result).toBe('active.eq.true');
    });

    it('should handle numeric zero', () => {
      const filter = createFilter('count', 0);
      const result = buildFilterString(filter);

      expect(result).toBe('count.eq.0');
    });

    it('should throw error for null value with non-null operators', () => {
      const filter = createFilter('name', null);

      expect(() => buildFilterString(filter)).toThrow(
        'Filter value cannot be null or undefined for operator eq'
      );
    });

    it('should throw error for undefined value', () => {
      const filter = { field: 'name', operator: FilterOperator.EQUALS, value: undefined as any };

      expect(() => buildFilterString(filter)).toThrow(
        'Filter value cannot be null or undefined for operator eq'
      );
    });

    it('should throw error for empty array', () => {
      const filter = createFilter('ids', [], FilterOperator.IN);

      expect(() => buildFilterString(filter)).toThrow(
        'Filter value array cannot be empty for operator in'
      );
    });

    it('should handle array with single value', () => {
      const filter = createFilter('id', [42], FilterOperator.IN);
      const result = buildFilterString(filter);

      expect(result).toBe('id.in.42');
    });

    it('should handle mixed type arrays', () => {
      const filter = createFilter('items', [1, 'text', true], FilterOperator.IN);
      const result = buildFilterString(filter);

      expect(result).toBe('items.in.1,text,true');
    });
  });

  describe('buildFilterStrings', () => {
    it('should build multiple filter strings', () => {
      const filters = [
        createFilter('idShop', [1, 2, 3], FilterOperator.IN),
        createFilter('status', 'active'),
        createFilter('price', 100, FilterOperator.GREATER_THAN),
      ];

      const result = buildFilterStrings(filters);

      expect(result).toEqual(['idShop.in.1,2,3', 'status.eq.active', 'price.gt.100']);
    });

    it('should handle empty array', () => {
      const result = buildFilterStrings([]);

      expect(result).toEqual([]);
    });

    it('should handle single filter', () => {
      const filters = [createFilter('name', 'John')];
      const result = buildFilterStrings(filters);

      expect(result).toEqual(['name.eq.John']);
    });
  });

  describe('buildFilterParams', () => {
    it('should build filter params with AND operator by default', () => {
      const filters = [
        createFilter('idShop', [1, 2, 3], FilterOperator.IN),
        createFilter('status', 'active'),
      ];

      const result = buildFilterParams(filters);

      expect(result).toEqual({
        filter: 'idShop.in.1,2,3.and.status.eq.active',
      });
    });

    it('should build filter params with OR operator', () => {
      const filters = [createFilter('status', 'active'), createFilter('status', 'pending')];

      const result = buildFilterParams(filters, 'filter', 'or');

      expect(result).toEqual({
        filter: 'status.eq.active.or.status.eq.pending',
      });
    });

    it('should use custom filter key', () => {
      const filters = [createFilter('name', 'John')];

      const result = buildFilterParams(filters, 'search');

      expect(result).toEqual({
        search: 'name.eq.John',
      });
    });

    it('should return empty object for empty filters', () => {
      const result = buildFilterParams([]);

      expect(result).toEqual({});
    });

    it('should handle single filter', () => {
      const filters = [createFilter('name', 'John')];
      const result = buildFilterParams(filters);

      expect(result).toEqual({
        filter: 'name.eq.John',
      });
    });

    it('should handle multiple filters with different operators', () => {
      const filters = [
        createFilter('price', 100, FilterOperator.GREATER_THAN),
        createFilter('stock', 10, FilterOperator.LESS_THAN_OR_EQUAL),
        createFilter('category', [1, 2], FilterOperator.IN),
      ];

      const result = buildFilterParams(filters);

      expect(result).toEqual({
        filter: 'price.gt.100.and.stock.lte.10.and.category.in.1,2',
      });
    });

    it('should handle complex OR filters', () => {
      const filters = [
        createFilter('name', 'Product%', FilterOperator.LIKE),
        createFilter('description', 'special%', FilterOperator.LIKE),
        createFilter('tags', 'featured', FilterOperator.LIKE),
      ];

      const result = buildFilterParams(filters, 'q', 'or');

      expect(result).toEqual({
        q: 'name.like.Product%.or.description.like.special%.or.tags.like.featured',
      });
    });
  });
});
