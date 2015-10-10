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

/**
 * consolidateHtml - takes in a string of html gotten from curl on genius lyric page
 * and splices out only the lyrics section defined by content between .lyrics_container
 * and .song_footer
 * @param str string of html
 * @return relevantHtml spliced html of lyrics content
 * @author tbarker
 */
function consolidateHtml(str) {
   var relevantHtml = str.substring(str.indexOf(" <div class=\"lyrics_container")+1);
   relevantHtml = relevantHtml.substring(0,relevantHtml.indexOf("<div class=\"song_footer\">"));
    return relevantHtml;

};

/**
 * annotationOnClick - onclick handler for all the links in the lyrics returned 
 * will send a message to the background page which will handle the api call to genius
 * based on the id of the annotation.
 * @author tbarker
 */
function annotationOnClick(id) {
    console.log("about to send getAnnotation: " + id);
   chrome.runtime.sendMessage({action: "getAnnotation", id: id}, 
           function(response) {});
};

/**
 * addOnClicks - will take in an html string and access the <a> links in the <p> section
 * will remove the href attribute and assign an ID based on the data-id.  
 * @param relevantHtml - html string of lyrics
 * @return links - DOM object of the relevanthtml with hrefs removed and ID added
 * @author tbarker
 */
function addOnClicks(relevantHtml) {
   var html = $.parseHTML(relevantHtml);
   var links = $(".lyrics > p ", html);
  console.log(links); 
   //iterate over links and add onclick and remove href to <a>
   for(i = 0; i < links[0].children.length; i++) {
       if(links[0].children[i].tagName == 'A') {
       links[0].children[i].removeAttribute("href");
       links[0].children[i].id = links[0].children[i].getAttribute("data-id");
       linkIds.push(links[0].children[i].id);
       links[0].children[i].onclick = function() {
           annotationOnClick(this.id)
       };
    }
   }
   return links;
};

/**
 * setUpListeners - adds the annotationOnClick function to each of the <a>
 * tags encountered in the genius lyrics.  this will be used instead of the href
 * genius uses to bring up the annotations
 * @return void
 * @author tbarker
 */
function setUpListeners() {
    var i = 0;
    for(i = 0; i < linkIds.length; i++) {
        var anchor = document.getElementById(linkIds[i]);
        //console.log(anchor);
        console.log($('#'+linkIds[i]));
        $('#'+linkIds[i]).click(function() {
            annotationOnClick(this.id);
        });
        //anchor.addEventListener('click', annotationOnClick(linkIds[i]), false);
        }
    
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("recieved event from Extension: " + request.action);
    if(request.action == "addLyrics2Page") {
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
    }
    else if(request.action == "populateModal") {
        alert(request.annotation);
    }
});
