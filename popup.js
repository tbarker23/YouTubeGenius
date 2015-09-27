document.addEventListener('DOMContentLoaded', function() {
    var newTabRadio = document.getElementById('newTabRadio');
    var newWinRadio = document.getElementById('newWinRadio');

    newWinRadio.onclick = function() {
        chrome.extension.getBackgroundPage().setPref("newWin");
    };

    newTabRadio.onclick = function() {
        chrome.extension.getBackgroundPage().setPref("newTab");
    };
}, false);
