/**
 * Discord state management — pure logic, no DOM.
 * Used by discord-engine.js for rendering, and testable independently.
 */
export function createDiscordState(config) {
  var users = config.defaultUsers.map(function (u) { return { id: u.id, name: u.name, color: u.color, avatar: u.avatar } })
  var messages = config.defaultMessages.map(function (m) { return { id: m.id, text: m.text, sender: m.sender, time: m.time } })
  var nextMsgId = messages.length > 0 ? Math.max.apply(null, messages.map(function (m) { return m.id })) + 1 : 1
  var nextUserId = Math.max.apply(null, users.map(function (u) { return u.id })) + 1

  return {
    getUsers: function () { return users.slice() },
    getMessages: function () { return messages.slice() },

    addMessage: function (opts) {
      var msg = { id: nextMsgId++, text: opts.text, sender: opts.sender, time: opts.time }
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

    addUser: function (name, color, avatar) {
      var user = { id: nextUserId++, name: name, color: color, avatar: avatar }
      users.push(user)
      return user
    },

    removeUser: function (id) {
      if (users.length <= 1) return
      users = users.filter(function (u) { return u.id !== id })
      messages = messages.filter(function (m) { return m.sender !== id })
    },

    shouldCollapse: function (index) {
      if (index <= 0) return false
      return messages[index].sender === messages[index - 1].sender
    },
  }
}
