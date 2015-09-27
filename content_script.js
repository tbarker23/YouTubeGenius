    var btn = document.createElement("input");
    var btnUrl = chrome.extension.getURL("images/genius.png");
    console.log(btnUrl);
    btn.src =btnUrl;
    btn.type = "image";
    btn.style.width = "80px";
    btn.style.height = "20px";
    btn.onclick = function() {
        console.log("bout to send this message");  
        chrome.runtime.sendMessage({"action": "start"}, function(response) {
            console.log(response.farewell);
        });
    };

$('#body').bind('DOMSubtreeModified', function(){
    console.log("FIRE");
    document.getElementById("watch8-sentiment-actions").appendChild(btn);
}, false);
    
$(window).load(function() {
    console.log("window.load");
});
$(document).ready(function() {
    console.log("document ready");
});
    $(window).bind("load", function() {
        console.log("binding btn to youtube");
        document.getElementById("watch8-sentiment-actions").appendChild(btn);
        console.log("hello test");
    });
function createBtn() {
    $(window).bind("load", function() {
        console.log("binding btn to youtube");
        document.getElementById("watch8-sentiment-actions").appendChild(btn);

    });
}
