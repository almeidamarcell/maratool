/**
 * Email state management — pure logic, no DOM.
 * Used by email-engine.js for rendering, and testable independently.
 */
export function createEmailState(config) {
  var fSrc = config.from || config.defaultFrom
  var from = { name: fSrc.name, email: fSrc.email, avatar: fSrc.avatar, color: fSrc.color }
  var to = config.to || config.defaultTo
  var subject = config.subject || config.defaultSubject
  var body = config.body || config.defaultBody
  var date = config.date || config.defaultDate
  var labels = (config.labels || config.defaultLabels || []).slice()

  return {
    getFrom: function () { return { name: from.name, email: from.email, avatar: from.avatar, color: from.color } },
    getTo: function () { return to },
    getSubject: function () { return subject },
    getBody: function () { return body },
    getDate: function () { return date },
    getLabels: function () { return labels.slice() },

    updateSubject: function (s) {
      subject = s
    },

    updateBody: function (b) {
      body = b
    },

    updateFrom: function (fields) {
      if (fields.name !== undefined) from.name = fields.name
      if (fields.email !== undefined) from.email = fields.email
    },

    updateLabels: function (arr) {
      labels = arr.slice()
    },
  }
}
