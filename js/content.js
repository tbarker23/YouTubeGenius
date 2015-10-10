/*
 * content_script.js  
 * Runs during normal browsing to inject code on to the page that the browser is
 * displaying.  Injects a button on to youtube.com pages that will use functionality
 * in background.js
 *
 * @author tbarker
 */
var linkIds = [];

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

function consolidateHtml(str) {
   var relevantHtml = str.substring(str.indexOf(" <div class=\"lyrics_container")+1);
   relevantHtml = relevantHtml.substring(0,relevantHtml.indexOf("<div class=\"song_footer\">"));
    return relevantHtml;

};

function annotationOnClick() {
   chrome.runtime.sendMessage({action: "getAnnotation", id: this.id}, function(response) {});
};

function addOnClicks(relevantHtml) {
   var html = $.parseHTML(relevantHtml);
   var links = $(".lyrics > p > *", html); 
   //iterate over links and add onclick and remove href to <a>
   for(i = 0; i < links.length; i++) {
       links[i].removeAttribute("href");
       links[i].id = links[i].getAttribute("data-id");
       linkIds.push(links[i].id);
       links[i].onclick = function() {
           annotationOnClick(this.id)
       };
    }
   return links;
};

function setUpListeners() {
    var i = 0;
    for(i = 0; i < linkIds.length; i++) {
        var anchor = document.getElementById(linkIds[i]);
        anchor.addEventListener('click', annotationOnClick, false);
    }
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("recieved event from Extension");
    var str = consolidateHtml(request.lyrics);
    var links = addOnClicks(str);
    var output = "";
    for(i = 0; i < links.length; i++) {
        output += links[i].outerHTML
    }
    document.getElementById("watch-discussion").innerHTML = "";
    document.getElementById("watch-discussion").innerHTML = output;
    setUpListeners();
    linkIds = [];
});
