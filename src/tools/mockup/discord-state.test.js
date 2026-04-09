import { describe, test, expect } from 'vitest'
import { createDiscordState } from './discord-state.js'

describe('createDiscordState', () => {
  test('initializes with default users and messages', () => {
    var state = createDiscordState({
      defaultUsers: [
        { id: 1, name: 'BotDev', color: '#5865F2', avatar: 'B' },
        { id: 2, name: 'You', color: '#57F287', avatar: 'Y' },
      ],
      defaultMessages: [
        { id: 1, text: 'Hello world', sender: 1, time: 'Today at 2:15 PM' },
      ],
    })
    expect(state.getUsers()).toHaveLength(2)
    expect(state.getMessages()).toHaveLength(1)
  })
})

describe('addMessage', () => {
  test('adds a message with auto id', () => {
    var state = createDiscordState({
      defaultUsers: [{ id: 1, name: 'A', color: '#fff', avatar: 'A' }],
      defaultMessages: [],
    })
    state.addMessage({ text: 'test', sender: 1, time: 'Today at 3:00 PM' })
    expect(state.getMessages()).toHaveLength(1)
    expect(state.getMessages()[0].id).toBe(1)
  })
})

describe('removeMessage', () => {
  test('removes by id', () => {
    var state = createDiscordState({
      defaultUsers: [{ id: 1, name: 'A', color: '#fff', avatar: 'A' }],
      defaultMessages: [
        { id: 1, text: 'First', sender: 1, time: '1:00' },
        { id: 2, text: 'Second', sender: 1, time: '1:01' },
      ],
    })
    state.removeMessage(1)
    expect(state.getMessages()).toHaveLength(1)
    expect(state.getMessages()[0].text).toBe('Second')
  })
})

describe('moveMessage', () => {
  test('swaps adjacent messages', () => {
    var state = createDiscordState({
      defaultUsers: [{ id: 1, name: 'A', color: '#fff', avatar: 'A' }],
      defaultMessages: [
        { id: 1, text: 'First', sender: 1, time: '1:00' },
        { id: 2, text: 'Second', sender: 1, time: '1:01' },
      ],
    })
    state.moveMessage(0, 'down')
    expect(state.getMessages().map(m => m.text)).toEqual(['Second', 'First'])
  })
})

describe('shouldCollapse', () => {
  test('consecutive messages from same user collapse', () => {
    var state = createDiscordState({
      defaultUsers: [{ id: 1, name: 'A', color: '#fff', avatar: 'A' }],
      defaultMessages: [
        { id: 1, text: 'First', sender: 1, time: '1:00' },
        { id: 2, text: 'Second', sender: 1, time: '1:01' },
      ],
    })
    expect(state.shouldCollapse(0)).toBe(false)
    expect(state.shouldCollapse(1)).toBe(true)
  })

  test('different senders do not collapse', () => {
    var state = createDiscordState({
      defaultUsers: [
        { id: 1, name: 'A', color: '#fff', avatar: 'A' },
        { id: 2, name: 'B', color: '#000', avatar: 'B' },
      ],
      defaultMessages: [
        { id: 1, text: 'From A', sender: 1, time: '1:00' },
        { id: 2, text: 'From B', sender: 2, time: '1:01' },
      ],
    })
    expect(state.shouldCollapse(1)).toBe(false)
  })
})
