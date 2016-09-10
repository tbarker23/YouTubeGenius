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
    btn.className = "like-button-renderer actionable";
    
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
   var relevantHtml = str.substring(str.indexOf("<lyrics *>")+1);
   relevantHtml = relevantHtml.substring(0,relevantHtml.indexOf("</lyrics>"));
    return relevantHtml;

}

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
}

/**
 * addOnClicks - will take in an html string and access the <a> links in the <p> section
 * will remove the href attribute and assign an ID based on the data-id.  
 * @param relevantHtml - html string of lyrics
 * @return links - DOM object of the relevanthtml with hrefs removed and ID added
 * @author tbarker
 */
function addOnClicks(relevantHtml) {
   var relHTML = relevantHtml.replace("<p>", "");
   relHTML = relHTML.replace("</p>", "");
   var html = $.parseHTML(relHTML);
   //console.log(relevantHtml);
   var links = $(".lyrics  ", html);
   console.log(links);
   //iterate over links and add onclick and remove href to <a>
   for(i = 0; i < links[0].children.length; i++) {
       if(links[0].children[i].tagName == 'A') {
       links[0].children[i].removeAttribute("href");
       links[0].children[i].id = links[0].children[i].getAttribute("data-id");
       linkIds.push(links[0].children[i].id);
       links[0].children[i].onclick = function() {
           annotationOnClick(this.id);
       };
     }
   }
   return links;
}

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
        $('#'+linkIds[i]).click(function() {
            annotationOnClick(this.id);
        });
    }
}

/**
 * createAnnnotationModal - Creates the DOM for the popup modal that wil display
 * the genius annotation for lyrics.
 * TODO Make this look better
 * @param annotationText innerHTML of annotation for relevant description
 * @author tbarker
 */
function createAnnotationModal(annotationText) {
    var overlay = (document.getElementById('overlay') !==  null ? 
        document.getElementById('overlay') : document.createElement('div'));
    overlay.id = "overlay";
    
    var innerDiv = document.createElement('div');
    var titleText = document.createElement('span');
    titleText.id = "titleText";
    var closeBtn = document.createElement('span');
    closeBtn.id = "closeBtn";
    
    var pTag = document.createElement('p');
    pTag.id = "annotationText";

    pTag.innerHTML = "";
    pTag.innerHTML = annotationText; 
    
    closeBtn.innerHTML = "X";
    titleText.innerHTML = "Genius.com Says: ";
    closeBtn.onclick = function() {
        var rehide = document.getElementById("overlay");
        var youtubePage = document.getElementById("page");
        youtubePage.style.opacity = "1";
        rehide.style.visibility = "hidden";
    };
    innerDiv.appendChild(titleText);
    innerDiv.appendChild(closeBtn);
    innerDiv.appendChild(pTag);
    overlay.appendChild(innerDiv);
    document.body.appendChild(overlay);
}

/**
 * addLyricsToPage - overlays the lyrics returned from the genius API on the comment
 * section of the YouTube page.  TODO if youtube layout changes watch-discussions will 
 * have to be changed to the new id of the new comment section.
 * @param lyrics innerHTML of lyric container from genius lyric page
 * @author tbarker
 */
function addLyricsToPage(lyrics) {
        var str = consolidateHtml(lyrics);
        //console.log(str);
        var links = addOnClicks(str);
        console.log(links);
        var output = "";
        links[0].id = "lyricsContainer";
        for(i = 0; i < links.length; i++) {
            output += links[i].outerHTML;
        }
        output = output;
        document.getElementById("watch-discussion").innerHTML = "";
        document.getElementById("watch-discussion").innerHTML = output;
        setUpListeners();
        linkIds = [];
}

/**
 * MAIN (listener for messages from background.js)
 * @author tbarker
 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("recieved event from Extension: " + request.action);
    if(request.action == "addLyrics2Page") {
      //console.log(request.lyrics);
        addLyricsToPage(request.lyrics);
    }
    else if(request.action == "populateModal") {
        createAnnotationModal(request.annotation); 
        
        var youtubePage = document.getElementById("page");
        youtubePage.style.opacity = "0.4";
        
        var overlay = document.getElementById("overlay");
        overlay.style.visibility = "visible";
    }
});
