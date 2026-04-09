import { describe, test, expect } from 'vitest'
import { createAiChatState } from './ai-chat-state.js'

describe('createAiChatState', () => {
  test('initializes with model and messages', () => {
    var state = createAiChatState({
      model: 'GPT-4o',
      defaultMessages: [
        { id: 1, role: 'user', text: 'Hello' },
        { id: 2, role: 'assistant', text: 'Hi there!' },
      ],
    })
    expect(state.getModel()).toBe('GPT-4o')
    expect(state.getMessages()).toHaveLength(2)
  })
})

describe('addMessage', () => {
  test('adds user and assistant messages', () => {
    var state = createAiChatState({ model: 'GPT-4o', defaultMessages: [] })
    state.addMessage({ role: 'user', text: 'Question' })
    state.addMessage({ role: 'assistant', text: 'Answer' })
    expect(state.getMessages()).toHaveLength(2)
    expect(state.getMessages()[0].role).toBe('user')
    expect(state.getMessages()[1].role).toBe('assistant')
  })
})

describe('removeMessage', () => {
  test('removes by id', () => {
    var state = createAiChatState({
      model: 'GPT-4o',
      defaultMessages: [
        { id: 1, role: 'user', text: 'Q1' },
        { id: 2, role: 'assistant', text: 'A1' },
        { id: 3, role: 'user', text: 'Q2' },
      ],
    })
    state.removeMessage(2)
    expect(state.getMessages()).toHaveLength(2)
    expect(state.getMessages().map(m => m.text)).toEqual(['Q1', 'Q2'])
  })
})

describe('moveMessage', () => {
  test('reorders messages', () => {
    var state = createAiChatState({
      model: 'GPT-4o',
      defaultMessages: [
        { id: 1, role: 'user', text: 'First' },
        { id: 2, role: 'assistant', text: 'Second' },
        { id: 3, role: 'user', text: 'Third' },
      ],
    })
    state.moveMessage(2, 'up')
    expect(state.getMessages().map(m => m.text)).toEqual(['First', 'Third', 'Second'])
  })
})

describe('updateMessageText', () => {
  test('updates text by id', () => {
    var state = createAiChatState({
      model: 'GPT-4o',
      defaultMessages: [{ id: 1, role: 'user', text: 'Original' }],
    })
    state.updateMessageText(1, 'Updated')
    expect(state.getMessages()[0].text).toBe('Updated')
  })
})

describe('setModel', () => {
  test('changes the model name', () => {
    var state = createAiChatState({ model: 'GPT-4o', defaultMessages: [] })
    state.setModel('GPT-4o mini')
    expect(state.getModel()).toBe('GPT-4o mini')
  })
})
