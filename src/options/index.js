const options = { system: null, store: null }

export const setOptions = (key, value) => {
  Object.defineProperty(options, key, {
    value,
    configurable: false,
    writable: false
  })
}

export default options