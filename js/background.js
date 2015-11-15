/* API keys and such */
var youtubeApiUrl = "https://www.googleapis.com/youtube/v3/videos?id=";
var geniusApiUrl = "http://api.genius.com/search?q=";
var geniusAnnotationUrl = "http://api.genius.com/annotations/";
var ytAccessKey = "key=AIzaSyDSnJWsRh_7hetLxutrfffzDT6V71iX_4w";
var gAccessKey = "access_token=fW9FvH_s8IXkdHb_FusAmKV4jvSkyQJBvAKOXCrCuijTSoTEx8MxKlLWTqaj3opU";
/* Global Error Messages */
var youtubeErrorMsg = "Uh-Oh! Looks like there is some problem with YouTube API request<br><br>Are you sure you're on a YouTube.com page?";
var geniusSongNotFound = "Uh-Oh! Looks like Genius.com doesn't have that track!";

var referenceTitle= ""; //title derived from youtube snippet title after consolidation
var geniusWinId = -1; //TODO populate same window that is created initially
var populatePref = ""; //default setting newTab ['newTab' || 'newWin']

/*Getter and Setter for preference for popup.js reference */
function setPref(str) {
    console.log(str);
    populatePref = str;
}
function getPref() {
    return populatePref;
}

/**
 * PopupController - main controller of the extension.  invoked from button click in content.js
 * @author tbarker
 */
var PopupController = function() {
    getUrl(function(url){
        getYoutubeInfo(url, function(youtubeInfo) {
            getGeniusInfo(youtubeInfo, function(geniusInfo) {
                openTab(geniusInfo);
            });           
        });
    });
};


/**
 * getUrl takes in a callback function and returns the current active tab's url
 * @param {object} callback function that will handle the url returned
 * @author tbarker
 */
function getUrl(callback) {
    var url = chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, 
            function(tabs) {
                var tab = tabs[0];
                var url = tab.url;
                callback(url);
    });
}

/**
 * getYouTubeInfo - executes the api call to googleapis.com (youtube) after getting
 * the video id from the url parameters passed in.
 * @param {string} - url string from the current tab gotten from getUrl()
 * @author tbarker
 */
var getYoutubeInfo=function(url, callback) {
    var videoId = url.split("v=")[1];
    $.ajax({
        url: youtubeApiUrl + videoId + '&' 
        + ytAccessKey +'&part=snippet,contentDetails,statistics,status',
        dataType: 'json', 
        success: function(data) {
            callback(data);
        },
        error: function(data) {
            alert(youtubeErrorMsg);
        }
    });
};

/**
 * getGeniusInfo - executes the api call to api.genius.com with the title information
 * pulled from api.google.com (youtube)
 * @param {object} data JSON obj recieved from youtube api api.google.com
 * @author - tbarker
 */
function getGeniusInfo(data, callback) {
    //console.log(data); //info from youtube api
    if(data.items.length === 0)
        alert(youtubeErrorMsg);
    var vidTitle = data.items[0].snippet.title;
    referenceTitle = consolidateQuery(vidTitle);
    console.log(referenceTitle);
    $.ajax({
        url: geniusApiUrl + referenceTitle + "&" + gAccessKey,
        dataType: 'json',
        success: function(data) {
            callback(data);
        },
        error: function(data) {
            alert(geniusSongNotFound);
            //document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
        }
    });        
        
}

/**
 * OpenTab - takes the data from genius.com and makes sure there is a result
 * then will execute a new tab/new window with the genius url.
 * @param {object} data JSON obj recieved from api.genius.com
 */
function openTab(data) {
    if(data.response.hits.size === 0) {
        alert(geniusSongNotFound);
    } else {
        var geniusUrl = coalesceGeniusResults(data.response.hits, referenceTitle);
        if(populatePref == "newWin") {
            if(geniusUrl !== null) {
                chrome.windows.getCurrent(function(win) {
                    chrome.windows.update(win.id, {width: screen.width * 0.5});
                });
                
                chrome.windows.create({
                    url: geniusUrl, 
                    left: screen.width, 
                    width: screen.width * 0.5, 
                    height: screen.height }, function(data){
                        geniusWinId = data.id;
                });
            } 
        } else if(populatePref == "inPage") {
            if(geniusUrl !== null) {
               $.ajax({url: geniusUrl, 
                       success: function(data) {
                           var i = 0;
                           var geniusHtml = data;
                           chrome.tabs.query({active: true, currentWindow: true}, 
                               function(tabs) {
                                   chrome.tabs.sendMessage(tabs[0].id, 
                                       {action: "addLyrics2Page", lyrics:  geniusHtml},
                                       function(response) {
                                       });
                               });
                       }
               }); 
            }
        } else {
            if(geniusUrl !== null) {
                chrome.tabs.create({url: geniusUrl});
            }
        }
    }
}

function annotationOnClick(id) {
    alert(id);
}

/**
 * consolidateQuery - will take in the title of a youtube content video and strip out
 * all of the useless junk including [ 'ft.', 'featuring, '[*]', '(*)', ' x ', and ','
 * @param {string} vTitle title string from YouTube
 * @author tbarker
 */
function consolidateQuery(vTitle) {
    if(vTitle.indexOf("-") > -1) {
        var str = vTitle.split('-');
        var artistInfo = str[0];
        var trackInfo = str[1];

        artistInfo = artistInfo.replace(/\([^)]*\)/g, ""); //({})'s
        artistInfo = artistInfo.replace(/\[.*\]/g, ""); //[{}]
        artistInfo = artistInfo.replace(/\sx\s*/g, " "); //' x ' features
        artistInfo = artistInfo.replace(/ *,.*\- /g, "-"); //,'s
        artistInfo = artistInfo.replace(/ft. +[A-z ]*/g, ""); //ft. {}'s
        artistInfo = artistInfo.replace(/ *featuring.* */g, ""); //featuring's
        artistInfo = artistInfo.replace(/HD [A-z\u00C0-\u017F, ]*/g, ""); //HD's
        artistInfo = artistInfo.replace(/\+ [A-z\u00C0-\u017F, ]*/g, "");//+{}'s
        
        trackInfo = trackInfo.replace(/\([^)]*\)/g, ""); //({})'s
        trackInfo = trackInfo.replace(/\[.*\]/g, ""); //[{}]'s
        trackInfo = trackInfo.replace(/\sx\s*/g, " "); //' x ' features's
        trackInfo = trackInfo.replace(/ *,.*\- /g, "-"); //,{}'s
        trackInfo = trackInfo.replace(/ft. +[A-z\u00C0-\u017F, ]*/g, ""); //ft. {}'s
        trackInfo = trackInfo.replace(/ *featuring.* */g, ""); //featuring's
        trackInfo = trackInfo.replace(/HD [A-z\u00C0-\u017F, ]*/g, " ");//HD's
        trackInfo = trackInfo.replace(/\+ [A-z\u00C0-\u017F, ]*/g, "");//+{}'s
        console.log("consolidateQuery \t artistInfo = " + artistInfo 
                + "\t trackInfo =" + trackInfo); 
        return artistInfo + trackInfo;
    } else {
        //for weird videos without the - separating artist/title
        vTitle = vTitle.replace(/\([^)]*\)/g, ""); //({})'s
        vTitle = vTitle.replace(/\[.*\]/g, ""); //[{}]'s
        vTitle = vTitle.replace(/\sx\s*/g, " "); //' x ' features
        vTitle = vTitle.replace(/ *,.*\- /g, "-"); //,{}'s
        vTitle = vTitle.replace(/ft. +[A-z\u00C0-\u017F,]*/g, ""); //ft. {}'
        vTitle = vTitle.replace(/ *featuring.* */g, ""); //featuring's
        vTitle = vTitle.replace(/HD [A-z\u00C0-\u017F, ]*/g, ""); //HD's
        vTitle = vTitle.replace(/\+ [A-z\u00C0-\u017F, ]*/g, "");//+{}'s

        return vTitle;
    } 

}

/*coalesceGeniusResults -  will take the JSON result set returned from the genius
 * API.  This function primarily is a check for 'New Music Day' results and simply gets
 * then next list item (generally but not always correct) which seems to be the actual
 * content lyrics
 * @param {object} resultSet JSON results from the genius API call
 * @param {string} vidTitle the title of the youtube video  
 * @author tbarker
 */
function coalesceGeniusResults(resultSet, vidTitle) {
    var result = {};
    var i = 0;
    console.log(resultSet); //results returned from genius api
    if(resultSet.length > 0) {
        for(i = 0; i < resultSet.length; i++) {
            if(vidTitle.toLowerCase().indexOf(resultSet[i].result.title.toLowerCase()) 
                    > -1){
                return resultSet[i].result.url;
            }
        }    
        return resultSet[0].result.url;
    } else {
        alert(geniusSongNotFound);
    }
}

/**
 * getAnnotation - uses the genius API to get a specific annotation based on the id 
 * passed in.  the id is derived from the onclick in the content script from the 
 * lryics displayed on the page.
 * @param id id of annotation 
 * @author tbarker
 */
function getAnnotation(id) {
    $.ajax({
        url: geniusAnnotationUrl + id + "?" + gAccessKey,
        dataType: 'json',
        success: function(data) {
            console.log(data);
            var annotations = data.response.annotation.body.dom.children;
            var html = "";
            console.log(annotations);
            for(var i=0; i < annotations.length; i++) {
                if(annotations[i].tag == "p") {
                    html += "<" + annotations[i].tag + ">";
                    for(var j=0; j < annotations[i].children.length; j++) {
                        if(typeof annotations[i].children[j] != "object") 
                        html += annotations[i].children[j];
                    }
                    if(Array.isArray(annotations[i].children)) {
                      for(var k=0; k < annotations[i].children.length; k++) {
                        if(annotations[i].children[k].tag == "img") {
                          html += "<img style=\"width: 200px;\" src=\"" + annotations[i].children[k].attributes.src + "\" />";
                        }
                      }
                    }
                    html += "<" + annotations[i].tag + "/>";
                }
            }
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id,
                                        {action: "populateModal", annotation: html},
                                        function(response) {}
                                        );
            });
        },
        error: function(data) {
            alert(geniusSongNotFound);
        }
    });
}    

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("recieved event from geniusBtn: " + request.action);
    if(request.action == "getAnnotation") {
        console.log(request.id);
        getAnnotation(request.id);
    } else {
        window.PC = new PopupController();
    }
});
