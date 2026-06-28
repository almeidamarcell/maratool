import { describe, it, expect } from 'vitest'
import { jsonToInsert } from './sql-insert-core.js'

describe('jsonToInsert', () => {
  it('generates INSERT from JSON array', () => {
    var rows = [{ id: 1, name: 'Ada' }, { id: 2, name: 'Bob' }]
    var sql = jsonToInsert('users', rows)
    expect(sql).toContain('INSERT INTO "users"')
    expect(sql).toContain('("id", "name")')
    expect(sql).toContain("(1, 'Ada')")
    expect(sql).toContain("(2, 'Bob')")
  })

  it('escapes single quotes in strings', () => {
    var sql = jsonToInsert('t', [{ note: "it's fine" }])
    expect(sql).toContain("'it''s fine'")
  })

  it('returns error for empty array', () => {
    expect(jsonToInsert('t', []).error).toBeTruthy()
  })

  it('returns error for invalid JSON string', () => {
    expect(jsonToInsert('t', '{bad').error).toBeTruthy()
  })
})
