import { describe, test, expect } from 'vitest'
import { createPostState } from './post-state.js'

describe('createPostState', () => {
  test('initializes with post data', () => {
    var state = createPostState({
      author: { name: 'johndoe', displayName: 'John Doe', verified: true, avatar: 'J' },
      content: 'Hello world',
      metrics: { likes: 42, comments: 5, shares: 3 },
      timestamp: '2h',
    })
    expect(state.getAuthor().name).toBe('johndoe')
    expect(state.getContent()).toBe('Hello world')
    expect(state.getMetrics().likes).toBe(42)
  })
})

describe('updateContent', () => {
  test('updates post text', () => {
    var state = createPostState({
      author: { name: 'a', displayName: 'A', verified: false, avatar: 'A' },
      content: 'Old',
      metrics: { likes: 0, comments: 0, shares: 0 },
      timestamp: '1h',
    })
    state.updateContent('New content')
    expect(state.getContent()).toBe('New content')
  })
})

describe('updateAuthor', () => {
  test('updates author fields', () => {
    var state = createPostState({
      author: { name: 'old', displayName: 'Old', verified: false, avatar: 'O' },
      content: 'test',
      metrics: { likes: 0, comments: 0, shares: 0 },
      timestamp: '1h',
    })
    state.updateAuthor({ displayName: 'New Name', verified: true })
    expect(state.getAuthor().displayName).toBe('New Name')
    expect(state.getAuthor().verified).toBe(true)
    expect(state.getAuthor().name).toBe('old')
  })
})

describe('updateMetrics', () => {
  test('updates specific metrics', () => {
    var state = createPostState({
      author: { name: 'a', displayName: 'A', verified: false, avatar: 'A' },
      content: 'test',
      metrics: { likes: 10, comments: 2, shares: 1 },
      timestamp: '1h',
    })
    state.updateMetrics({ likes: 999 })
    expect(state.getMetrics().likes).toBe(999)
    expect(state.getMetrics().comments).toBe(2)
  })
})

describe('updateTimestamp', () => {
  test('updates timestamp', () => {
    var state = createPostState({
      author: { name: 'a', displayName: 'A', verified: false, avatar: 'A' },
      content: 'test',
      metrics: { likes: 0, comments: 0, shares: 0 },
      timestamp: '1h',
    })
    state.updateTimestamp('3h')
    expect(state.getTimestamp()).toBe('3h')
  })
})
