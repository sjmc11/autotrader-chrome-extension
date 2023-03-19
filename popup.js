/**
 * Toggle enabled
 * @type {HTMLElement}
 */
const enabledCheckbox = document.getElementById('enabled');

enabledCheckbox.addEventListener('change', function() {
    chrome.storage.local.set({enabled: enabledCheckbox.checked});
});

chrome.storage.local.get('enabled', function(data) {
    enabledCheckbox.checked = data.enabled !== false;
});

// /**
//  * Handle reload btn
//  */
//
// const reloadBtn = document.getElementById('reloadBtn');
//
// enabledCheckbox.addEventListener('change', function() {
//     chrome.storage.local.set({enabled: enabledCheckbox.checked});
// });