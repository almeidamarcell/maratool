export function convertYamlToJson(yamlStr, jsYaml) {
  if (!yamlStr || !yamlStr.trim()) {
    return { result: null, error: 'Input is empty' }
  }
  try {
    var parsed = jsYaml.load(yamlStr)
    return { result: JSON.stringify(parsed, null, 2), error: null }
  } catch (e) {
    return { result: null, error: e.message || 'Invalid YAML' }
  }
}

export function convertJsonToYaml(jsonStr, jsYaml) {
  if (!jsonStr || !jsonStr.trim()) {
    return { result: null, error: 'Input is empty' }
  }
  try {
    var parsed = JSON.parse(jsonStr)
    return { result: jsYaml.dump(parsed), error: null }
  } catch (e) {
    return { result: null, error: e.message || 'Invalid JSON' }
  }
}
