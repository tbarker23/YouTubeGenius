/*
 * content_script.js  
 * Runs during normal browsing to inject code on to the page that the browser is
 * displaying.  Injects a button on to youtube.com pages that will use functionality
 * in background.js
 *
 * @author tbarker
 */


/** 
 * Creates an instance of the genius button displayed below vid content
 * @constructor
 * @this {btn}
 * @author tbarker
 */
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

//add button to the page whenever DOM changes (ajax workaround from document.ready)
document.addEventListener("DOMSubtreeModified", function() {
        document.getElementById("watch8-sentiment-actions").appendChild(geniusBtn);
}, false);

document.addEventListener("DOMSubtreeModified", function() {
        //document.getElementById("watch-discussion").innerHTML = "";
}, false);


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("recieved event from Extension");
    console.log(request);
    document.getElementById("watch-discussion").innerHTML = "";
    document.getElementById("watch-discussion").innerHtml = request.lyrics;
});
