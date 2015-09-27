/* API keys and such */
var ytAccessKey = "key=AIzaSyDSnJWsRh_7hetLxutrfffzDT6V71iX_4w";
var gAccessKey = "access_token=fW9FvH_s8IXkdHb_FusAmKV4jvSkyQJBvAKOXCrCuijTSoTEx8MxKlLWTqaj3opU";
var youtubeErrorMsg = "Uh-Oh! Looks like there is some problem with YouTube API request<br><br>Are you sure you're on a YouTube.com page?";
var geniusSongNotFound = "Uh-Oh! Looks like Genius.com doesn't have that track!";
var referenceTitle= "";
var geniusWinId = -1;
var populatePref = "";
var PopupController = function() {
    getUrl(function(url){
        getYoutubeInfo(url)
    });
};


/**
 * getUrl takes in a callback function and returns the current active tab's url
 * @param callback
 * @author tbarker
 */
function getUrl(callback) {
    var url = chrome.tabs.query({'active': true, 'lastFocusedWindow': true}, 
            function(tabs) {
                var tab = tabs[0];
                var url = tab.url;
                callback(url);
    });
};

/**
 * consolidateQuery - will take in the title of a youtube content video and strip out
 * all of the useless junk including [ 'ft.', 'featuring, '[*]', '(*)', ' x ', and ','
 * @param vTitle - title string from YouTube
 * @author tbarker
 */
function consolidateQuery(vTitle) {
    if(vTitle.indexOf("-") > -1) {
        var str = vTitle.split('-');
        var artistInfo = str[0];
        var trackInfo = str[1];

        console.log(str);
        var artistInfo = artistInfo.replace(/ *\([^)]*\) */g, ""); //removes parens and content
        var artistInfo = artistInfo.replace(/ *\[.*\]* */g, ""); //removes squares and contents
        var artistInfo = artistInfo.replace(/ *\sx\s* */g, " "); //removes all ' x ' features
        var artistInfo = artistInfo.replace(/ *,.*\- /g, "-"); //replaces featurings with comms
        var artistInfo = artistInfo.replace(/ *ft.* */g, ""); //removes all ft. chars
        var artistInfo = artistInfo.replace(/ *featuring.* */g, ""); //removes all featuring's
        var artistInfo = artistInfo.replace(/ *HD* */g, ""); 
        
        var trackInfo = trackInfo.replace(/ *\([^)]*\) */g, ""); //removes parens and contents
        var trackInfo = trackInfo.replace(/ *\[.*\]* */g, ""); //removes squares and contents
        var trackInfo = trackInfo.replace(/ *\sx\s* */g, " "); //removes all ' x ' features
        var trackInfo = trackInfo.replace(/ *,.*\- /g, "-"); //replaces featurings with comms
        var trackInfo = trackInfo.replace(/ *ft.* */g, ""); //removes all ft. chars
        var trackInfo = trackInfo.replace(/ *featuring.* */g, ""); //removes all featuring's
        var trackInfo = trackInfo.replace(/HD/g, " ");
        console.log("consolidateQuery \t artistInfo = " + artistInfo 
                + "\t trackInfo =" + trackInfo); 
        return artistInfo + trackInfo;
    } else {
        //for weird videos without the - separating artist/title
        var vTitle = vTitle.replace(/ *\([^)]*\) */g, ""); //removes parens and content
        var vTitle = vTitle.replace(/ *\[.*\]* */g, ""); //removes squares and contents
        var vTitle = vTitle.replace(/ *\sx\s* */g, " "); //removes all ' x ' features
        var vTitle = vTitle.replace(/ *,.*\- /g, "-"); //replaces featurings with comms
        var vTitle = vTitle.replace(/ *ft.* */g, ""); //removes all ft. chars
        var vTitle = vTitle.replace(/ *featuring.* */g, ""); //removes all featuring's
        var vTitle = vTitle.replace(/ *HD* */g, "");

        return vTitle;
    } 

}

/*coalesceGeniusResults -  will take the JSON result set returned from the genius
 * API.  This function primarily is a check for 'New Music Day' results and simply gets
 * then next list item (generally but not always correct) which seems to be the actual
 * content lyrics
 * @param resultSet - JSON results from the genius API call
 * @param vidTitle - the title of the youtube video  
 * @author tbarker
 */
function coalesceGeniusResults(resultSet, vidTitle) {
    var result = {};
    var i = 0;
    console.log(resultSet);
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
        //document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
    }
};

/**
 * OpenTab - takes the data from genius.com and makes sure there is a result
 * then will execute a new tab/new window with the genius url.
 * @param data - JSON obj recieved from api.genius.com
 */
function openTab(data) {
    console.log("opening tab" + populatePref);
    if(data.response.hits.size == 0) {
        alert(geniusSongNotFound);
        console.log("bad");
        //document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
    } else {
        var geniusUrl = coalesceGeniusResults(data.response.hits, referenceTitle);
        if(populatePref == "newWin") {
            if(geniusUrl != null) {
                chrome.windows.getCurrent(function(win) {
                    chrome.windows.update(win.id, {width: screen.width*.5});
                });
                
                chrome.windows.create({
                    url: geniusUrl, 
                    left: screen.width, 
                    width: screen.width*.5, 
                    height: screen.height }, function(data){
                        geniusWinId = data.id;
                        console.log(geniusWinId);
                });
            } 
        } else {
                console.log("correct stuff here");
                chrome.tabs.create({url: geniusUrl});
        }
    }
};


/**
 * getGeniusInfo - executes the api call to api.genius.com with the title information
 * pulled from api.google.com (youtube)
 * @param data - JSON obj recieved from youtube api api.google.com
 * @author - tbarker
 */
function getGeniusInfo(data) {
    if(data.items.length == 0)
        alert(youtubeErrorMsg);
        //document.getElementById('statusMsg').innerHTML = youtubeErrorMsg;
    var vidTitle = data.items[0].snippet.title;
    referenceTitle = consolidateQuery(vidTitle);
    $.ajax({
        url: 'http://api.genius.com/search?q='+referenceTitle+"&"+gAccessKey,
        dataType: 'json',
        success: function(data) {
            openTab(data);
        },
        error: function(data) {
            alert(geniusSongNotFound);
            //document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
        }
    });        
        
};

/**
 * getYouTubeInfo - executes the api call to googleapis.com (youtube) after getting
 * the video id from the url parameters passed in.
 * @param url - url string from the current tab gotten from getUrl()
 * @author tbarker
 */
var getYoutubeInfo=function(url) {
    var videoId = url.split("v=")[1];

    $.ajax({
        url: 'https://www.googleapis.com/youtube/v3/videos?id='+videoId+'&'+ytAccessKey+'&part=snippet,contentDetails,statistics,status',
        dataType: 'json', 
        success: function(data) {
            getGeniusInfo(data);
        },
        error: function(data) {
            alert(youtubeErrorMsg);
            //document.getElementById('statusMsg').innerHTML = youtubeErrorMsg;
        }
    });
};

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("recieved event from geniusBtn");
    console.log(window.populatePref);
    window.PC = new PopupController();
});

function setPref(str) {
    populatePref = str;
};
