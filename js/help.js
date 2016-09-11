document.addEventListener('DOMContentLoaded', function() {
if(chrome.extension.getBackgroundPage().getPref() == "newWin")
        newWinRadio.checked = true;
    else if(chrome.extension.getBackgroundPage().getPref() == "inPage")
        inPageCommentRadio.checked= true;
    else
        newTabRadio.checked = true;
});