document.addEventListener('DOMContentLoaded', function() {
    var newTabRadio = document.getElementById('newTabRadio');
    var newWinRadio = document.getElementById('newWinRadio');

    if(chrome.extension.getBackgroundPage().getPref() == "newWin")
        newWinRadio.checked = true;
    if(chrome.extension.getBackgroundPage().getPref() == "inPage")
        inPageCommentRadio.checked= true;
    else
        newTabRadio.checked = true;

    newWinRadio.onclick = function() {
        chrome.extension.getBackgroundPage().setPref("newWin");
    };

    newTabRadio.onclick = function() {
        chrome.extension.getBackgroundPage().setPref("newTab");
    };

    inPageCommentRadio.onclick = function() {
        chrome.extension.getBackgroundPage().setPref("inPage");
    };
}, false);
