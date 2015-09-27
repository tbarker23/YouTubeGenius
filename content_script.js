function createBtn() {   
    var btn = document.createElement("input");
    btn.type = "image";
    var btnUrl = chrome.extension.getURL("images/genius.png");
    btn.src = btnUrl;
    
    //style it
    btn.style.width = "80px";
    btn.style.height = "20px";
    
    //give the btn some functionality
    btn.onclick = function() {
        chrome.runtime.sendMessage({"action": "start"}, function(response) {
        });
    };
    return btn;
}

var geniusBtn = createBtn();

document.addEventListener("DOMSubtreeModified", function() {
    var timeout = setTimeout(function() {
        document.getElementById("watch8-sentiment-actions").appendChild(geniusBtn);
    }, 500);
}, false);
