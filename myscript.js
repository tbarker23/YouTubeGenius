var btn = document.createElement("input");
var btnUrl = chrome.extension.getURL("images/ill.jpg");
console.log(btnUrl);
btn.src =btnUrl;
btn.type = "image";
btn.onclick = function() {
    console.log("bout to send this message");  
    chrome.runtime.sendMessage({"action": "start"}, function(response) {
        console.log(response.farewell);
    });
};
$(document).ready(function() {
    document.getElementById("watch8-sentiment-actions").appendChild(btn);

});
