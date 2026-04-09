import { describe, test, expect } from 'vitest'
import { createEmailState } from './email-state.js'

describe('createEmailState', () => {
  test('initializes with email data', () => {
    var state = createEmailState({
      from: { name: 'Alice Smith', email: 'alice@example.com', avatar: 'A', color: '#4285F4' },
      to: 'me',
      subject: 'Meeting Tomorrow',
      body: 'Hi, just confirming our meeting.',
      date: 'Apr 9, 2026, 10:30 AM',
      labels: ['Inbox'],
    })
    expect(state.getFrom().name).toBe('Alice Smith')
    expect(state.getSubject()).toBe('Meeting Tomorrow')
    expect(state.getBody()).toBe('Hi, just confirming our meeting.')
    expect(state.getLabels()).toEqual(['Inbox'])
  })
})

describe('updateSubject', () => {
  test('changes the subject', () => {
    var state = createEmailState({
      from: { name: 'A', email: 'a@b.com', avatar: 'A', color: '#000' },
      to: 'me', subject: 'Old', body: 'body', date: 'now', labels: [],
    })
    state.updateSubject('New Subject')
    expect(state.getSubject()).toBe('New Subject')
  })
})

describe('updateBody', () => {
  test('changes the body', () => {
    var state = createEmailState({
      from: { name: 'A', email: 'a@b.com', avatar: 'A', color: '#000' },
      to: 'me', subject: 'Sub', body: 'Old body', date: 'now', labels: [],
    })
    state.updateBody('New body content')
    expect(state.getBody()).toBe('New body content')
  })
})

describe('updateFrom', () => {
  test('updates sender fields', () => {
    var state = createEmailState({
      from: { name: 'Old', email: 'old@test.com', avatar: 'O', color: '#000' },
      to: 'me', subject: 'Sub', body: 'body', date: 'now', labels: [],
    })
    state.updateFrom({ name: 'New Sender', email: 'new@test.com' })
    expect(state.getFrom().name).toBe('New Sender')
    expect(state.getFrom().email).toBe('new@test.com')
    expect(state.getFrom().avatar).toBe('O')
  })
})

describe('updateLabels', () => {
  test('replaces labels array', () => {
    var state = createEmailState({
      from: { name: 'A', email: 'a@b.com', avatar: 'A', color: '#000' },
      to: 'me', subject: 'Sub', body: 'body', date: 'now', labels: ['Inbox'],
    })
    state.updateLabels(['Inbox', 'Important'])
    expect(state.getLabels()).toEqual(['Inbox', 'Important'])
  })
})
