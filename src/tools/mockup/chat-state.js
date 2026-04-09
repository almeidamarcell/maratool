/**
 * Chat state management — pure logic, no DOM.
 * Used by chat-engine.js for rendering, and testable independently.
 */
export function createChatState(config) {
  var people = config.defaultPeople.map(function (p) { return { id: p.id, name: p.name, color: p.color } })
  var messages = config.defaultMessages.map(function (m) { return { id: m.id, text: m.text, sender: m.sender, outgoing: m.outgoing, time: m.time } })
  var nextMsgId = messages.length > 0 ? Math.max.apply(null, messages.map(function (m) { return m.id })) + 1 : 1
  var nextPersonId = Math.max.apply(null, people.map(function (p) { return p.id })) + 1

  return {
    getPeople: function () { return people.slice() },
    getMessages: function () { return messages.slice() },

    addMessage: function (opts) {
      var msg = { id: nextMsgId++, text: opts.text, sender: opts.sender, outgoing: opts.outgoing, time: opts.time }
      messages.push(msg)
      return msg
    },

    removeMessage: function (id) {
      messages = messages.filter(function (m) { return m.id !== id })
    },

    moveMessage: function (index, direction) {
      if (direction === 'up' && index > 0) {
        var tmp = messages[index]
        messages[index] = messages[index - 1]
        messages[index - 1] = tmp
      } else if (direction === 'down' && index < messages.length - 1) {
        var tmp2 = messages[index]
        messages[index] = messages[index + 1]
        messages[index + 1] = tmp2
      }
    },

    updateMessageText: function (id, text) {
      var msg = messages.find(function (m) { return m.id === id })
      if (msg) msg.text = text
    },

    addPerson: function (name, color) {
      var person = { id: nextPersonId++, name: name, color: color }
      people.push(person)
      return person
    },

    removePerson: function (id) {
      var nonYou = people.filter(function (p) { return p.name !== 'You' })
      if (nonYou.length <= 1 && nonYou[0] && nonYou[0].id === id) return
      people = people.filter(function (p) { return p.id !== id })
      messages = messages.filter(function (m) { return m.sender !== id })
    },
  }
}
