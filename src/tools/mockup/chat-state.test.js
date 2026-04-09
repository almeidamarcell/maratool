import { describe, test, expect } from 'vitest'
import { createChatState } from './chat-state.js'

describe('createChatState', () => {
  test('initializes with default people and messages', () => {
    var state = createChatState({
      defaultPeople: [
        { id: 1, name: 'Sarah', color: '#128c7e' },
        { id: 2, name: 'You', color: '#25d366' },
      ],
      defaultMessages: [
        { id: 1, text: 'Hello', sender: 1, outgoing: false, time: '14:00' },
      ],
    })
    expect(state.getPeople()).toHaveLength(2)
    expect(state.getMessages()).toHaveLength(1)
    expect(state.getMessages()[0].text).toBe('Hello')
  })
})

describe('addMessage', () => {
  test('adds a message and increments id', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'Sarah', color: '#128c7e' }, { id: 2, name: 'You', color: '#25d366' }],
      defaultMessages: [],
    })
    state.addMessage({ text: 'Hi', sender: 2, outgoing: true, time: '14:01' })
    expect(state.getMessages()).toHaveLength(1)
    expect(state.getMessages()[0].text).toBe('Hi')
    expect(state.getMessages()[0].id).toBe(1)

    state.addMessage({ text: 'Hello', sender: 1, outgoing: false, time: '14:02' })
    expect(state.getMessages()).toHaveLength(2)
    expect(state.getMessages()[1].id).toBe(2)
  })
})

describe('removeMessage', () => {
  test('removes a message by id', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'A', color: '#000' }, { id: 2, name: 'You', color: '#000' }],
      defaultMessages: [
        { id: 1, text: 'First', sender: 1, outgoing: false, time: '14:00' },
        { id: 2, text: 'Second', sender: 2, outgoing: true, time: '14:01' },
        { id: 3, text: 'Third', sender: 1, outgoing: false, time: '14:02' },
      ],
    })
    state.removeMessage(2)
    expect(state.getMessages()).toHaveLength(2)
    expect(state.getMessages().map(m => m.text)).toEqual(['First', 'Third'])
  })
})

describe('reorderMessage', () => {
  test('moves a message up', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'A', color: '#000' }, { id: 2, name: 'You', color: '#000' }],
      defaultMessages: [
        { id: 1, text: 'First', sender: 1, outgoing: false, time: '14:00' },
        { id: 2, text: 'Second', sender: 2, outgoing: true, time: '14:01' },
        { id: 3, text: 'Third', sender: 1, outgoing: false, time: '14:02' },
      ],
    })
    state.moveMessage(1, 'up')
    var texts = state.getMessages().map(m => m.text)
    expect(texts).toEqual(['Second', 'First', 'Third'])
  })

  test('moves a message down', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'A', color: '#000' }, { id: 2, name: 'You', color: '#000' }],
      defaultMessages: [
        { id: 1, text: 'First', sender: 1, outgoing: false, time: '14:00' },
        { id: 2, text: 'Second', sender: 2, outgoing: true, time: '14:01' },
        { id: 3, text: 'Third', sender: 1, outgoing: false, time: '14:02' },
      ],
    })
    state.moveMessage(1, 'down')
    var texts = state.getMessages().map(m => m.text)
    expect(texts).toEqual(['First', 'Third', 'Second'])
  })

  test('does not move first message up', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'A', color: '#000' }, { id: 2, name: 'You', color: '#000' }],
      defaultMessages: [
        { id: 1, text: 'First', sender: 1, outgoing: false, time: '14:00' },
        { id: 2, text: 'Second', sender: 2, outgoing: true, time: '14:01' },
      ],
    })
    state.moveMessage(0, 'up')
    expect(state.getMessages().map(m => m.text)).toEqual(['First', 'Second'])
  })

  test('does not move last message down', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'A', color: '#000' }, { id: 2, name: 'You', color: '#000' }],
      defaultMessages: [
        { id: 1, text: 'First', sender: 1, outgoing: false, time: '14:00' },
        { id: 2, text: 'Second', sender: 2, outgoing: true, time: '14:01' },
      ],
    })
    state.moveMessage(1, 'down')
    expect(state.getMessages().map(m => m.text)).toEqual(['First', 'Second'])
  })
})

describe('addPerson', () => {
  test('adds a person with auto-incremented id', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'Sarah', color: '#128c7e' }, { id: 2, name: 'You', color: '#25d366' }],
      defaultMessages: [],
    })
    var person = state.addPerson('Alex', '#34b7f1')
    expect(person.id).toBe(3)
    expect(person.name).toBe('Alex')
    expect(state.getPeople()).toHaveLength(3)
  })
})

describe('removePerson', () => {
  test('removes a person and their messages', () => {
    var state = createChatState({
      defaultPeople: [
        { id: 1, name: 'Sarah', color: '#128c7e' },
        { id: 2, name: 'You', color: '#25d366' },
        { id: 3, name: 'Alex', color: '#34b7f1' },
      ],
      defaultMessages: [
        { id: 1, text: 'From Sarah', sender: 1, outgoing: false, time: '14:00' },
        { id: 2, text: 'From Alex', sender: 3, outgoing: false, time: '14:01' },
        { id: 3, text: 'From You', sender: 2, outgoing: true, time: '14:02' },
      ],
    })
    state.removePerson(3)
    expect(state.getPeople()).toHaveLength(2)
    expect(state.getMessages()).toHaveLength(2)
    expect(state.getMessages().map(m => m.text)).toEqual(['From Sarah', 'From You'])
  })

  test('cannot remove last non-You person', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'Sarah', color: '#128c7e' }, { id: 2, name: 'You', color: '#25d366' }],
      defaultMessages: [],
    })
    state.removePerson(1)
    expect(state.getPeople()).toHaveLength(2)
  })
})

describe('updateMessageText', () => {
  test('updates a message text by id', () => {
    var state = createChatState({
      defaultPeople: [{ id: 1, name: 'A', color: '#000' }, { id: 2, name: 'You', color: '#000' }],
      defaultMessages: [
        { id: 1, text: 'Original', sender: 1, outgoing: false, time: '14:00' },
      ],
    })
    state.updateMessageText(1, 'Updated')
    expect(state.getMessages()[0].text).toBe('Updated')
  })
})
