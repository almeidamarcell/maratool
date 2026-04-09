/**
 * AI chat state management — pure logic, no DOM.
 * Used by ai-chat-engine.js for rendering, and testable independently.
 */
export function createAiChatState(config) {
  var model = config.model || config.defaultModel
  var messages = (config.defaultMessages || []).map(function (m) { return { id: m.id, role: m.role, text: m.text } })
  var nextMsgId = messages.length > 0 ? Math.max.apply(null, messages.map(function (m) { return m.id })) + 1 : 1

  return {
    getModel: function () { return model },
    setModel: function (name) { model = name },
    getMessages: function () { return messages.slice() },

    addMessage: function (opts) {
      var msg = { id: nextMsgId++, role: opts.role, text: opts.text }
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
  }
}
