import { describe, test, expect } from 'vitest'
import { csvToSql, sqlToCsv, buildSelectQuery, erDiagramFromTables, mongoToSql } from './wave4-sql-ext-core.js'

describe('csvToSql', () => {
  test('generates insert statements', () => {
    const r = csvToSql('name,age\nAda,30', 'people')
    expect(r.sql).toContain("INSERT INTO people")
    expect(r.sql).toContain("'Ada'")
  })
})

describe('sqlToCsv', () => {
  test('extracts VALUES rows', () => {
    const r = sqlToCsv("INSERT INTO t VALUES ('a', '1');")
    expect(r.csv).toContain('col1,col2')
    expect(r.csv).toContain('a,1')
  })
})

describe('buildSelectQuery', () => {
  test('builds SELECT with WHERE', () => {
    expect(buildSelectQuery('users', ['id', 'name'], 'active = 1')).toContain('WHERE active = 1')
  })
})

describe('erDiagramFromTables', () => {
  test('outputs mermaid erDiagram', () => {
    const out = erDiagramFromTables([{ name: 'users', columns: [{ name: 'id', type: 'int' }] }])
    expect(out).toContain('erDiagram')
    expect(out).toContain('users')
  })
})

describe('mongoToSql', () => {
  test('flattens nested document', () => {
    const r = mongoToSql('{"name":"Ada","meta":{"age":30}}')
    expect(r.sql).toContain('meta_age')
  })
})
