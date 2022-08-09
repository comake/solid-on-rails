import type { EntitySchemaColumnOptions, ColumnType } from 'typeorm';

/**
 * A base schema to be used to add standard id, created_at, and updated_at columns to all tables.
 */
export const baseColumnSchemaPart = {
  id: {
    type: Number,
    primary: true,
    generated: true,
  } as EntitySchemaColumnOptions,
  createdAt: {
    name: 'created_at',
    type: 'timestamp with time zone' as ColumnType,
    createDate: true,
  } as EntitySchemaColumnOptions,
  updatedAt: {
    name: 'updated_at',
    type: 'timestamp with time zone' as ColumnType,
    updateDate: true,
  } as EntitySchemaColumnOptions,
};
