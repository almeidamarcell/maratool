import { describe, it, expect } from 'vitest'
import { jsonToCreateTable } from './sql-create-table-core.js'

describe('jsonToCreateTable', () => {
  it('infers column types from sample row', () => {
    var sql = jsonToCreateTable('users', [{ id: 1, name: 'Ada', active: true }])
    expect(sql).toContain('CREATE TABLE "users"')
    expect(sql).toContain('"id" INTEGER')
    expect(sql).toContain('"name" TEXT')
    expect(sql).toContain('"active" BOOLEAN')
  })

  it('supports explicit column type map', () => {
    var sql = jsonToCreateTable('events', { created_at: 'TIMESTAMP', payload: 'JSONB' })
    expect(sql).toContain('"created_at" TIMESTAMP')
    expect(sql).toContain('"payload" JSONB')
  })

  it('returns error for empty object', () => {
    expect(jsonToCreateTable('t', {}).error).toBeTruthy()
  })
})
