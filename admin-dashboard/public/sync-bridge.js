function relayToParent(key, value) {
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: 'ns-content-updated',
      key: key,
      value: value,
    }, '*');
  }
}

// Listen for messages from the admin dashboard (same origin)
window.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'ns-sync' && event.data.key) {
    // Read the current value from localStorage and relay it
    const value = localStorage.getItem(event.data.key);
    relayToParent(event.data.key, value);
  }
});

// Also watch for native localStorage changes in this origin
window.addEventListener('storage', (event) => {
  if (event.key && event.key.startsWith('ns_db_')) {
    relayToParent(event.key, event.newValue);
  }
});
