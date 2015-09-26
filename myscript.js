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
$(document).ready(function() {
    document.getElementById("watch8-sentiment-actions").appendChild(btn);

});
