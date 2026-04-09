/**
 * Social post state management — pure logic, no DOM.
 * Used by post-engine.js for rendering, and testable independently.
 */
export function createPostState(config) {
  var src = config.author || config.defaultAuthor
  var author = { name: src.name, displayName: src.displayName, verified: src.verified, avatar: src.avatar }
  var content = config.content || config.defaultContent
  var mSrc = config.metrics || config.defaultMetrics
  var metrics = { likes: mSrc.likes, comments: mSrc.comments, shares: mSrc.shares }
  var timestamp = config.timestamp || config.defaultTimestamp

  return {
    getAuthor: function () { return { name: author.name, displayName: author.displayName, verified: author.verified, avatar: author.avatar } },
    getContent: function () { return content },
    getMetrics: function () { return { likes: metrics.likes, comments: metrics.comments, shares: metrics.shares } },
    getTimestamp: function () { return timestamp },

    updateContent: function (text) {
      content = text
    },

    updateAuthor: function (fields) {
      if (fields.name !== undefined) author.name = fields.name
      if (fields.displayName !== undefined) author.displayName = fields.displayName
      if (fields.verified !== undefined) author.verified = fields.verified
      if (fields.avatar !== undefined) author.avatar = fields.avatar
    },

    updateMetrics: function (fields) {
      if (fields.likes !== undefined) metrics.likes = fields.likes
      if (fields.comments !== undefined) metrics.comments = fields.comments
      if (fields.shares !== undefined) metrics.shares = fields.shares
    },

    updateTimestamp: function (ts) {
      timestamp = ts
    },
  }
}
