/* API keys and such */
var ytAccessKey = "key=AIzaSyDSnJWsRh_7hetLxutrfffzDT6V71iX_4w";
var gAccessKey = "access_token=fW9FvH_s8IXkdHb_FusAmKV4jvSkyQJBvAKOXCrCuijTSoTEx8MxKlLWTqaj3opU";
var youtubeErrorMsg = "Uh-Oh! Looks like there is some problem with YouTube API request<br><br>Are you sure you're on a YouTube.com page?";
var geniusSongNotFound = "Uh-Oh! Looks like Genius.com doesn't have that track!";
var referenceTitle= "";

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
    var newTitle = vTitle.replace(/ *\([^)]*\) */g, ""); //removes parens and contents
    var newTitle = newTitle.replace(/ *\[.*\]* */g, ""); //removes squares and contents
    var newTitle = newTitle.replace(/ *\sx\s* */g, " "); //removes all ' x ' features
    var newTitle = newTitle.replace(/ *,.*\- /g, "-"); //replaces featurings with comms
    var newTitle = newTitle.replace(/ *ft.* */g, ""); //removes all ft. chars
    var newTitle = newTitle.replace(/ *featuring.* */g, ""); //removes all featuring's 
    return newTitle;
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
    var geniusSongNotFound = "Uh-Oh! Looks like Genius.com doesn't have that track!";
    var result = {};
    var i = 0;
    for(i = 0; i < resultSet.length; i++) {
        if(vidTitle.indexOf(resultSet[i].result.title) > -1){
            return resultSet[i].result.url;
        }
    }
    document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
};

/**
 * OpenTab - takes the data from genius.com and makes sure there is a result
 * then will execute a new tab/new window with the genius url.
 * @param data - JSON obj recieved from api.genius.com
 */
function openTab(data) {    
    if(data.response.hits.length == 0) {
        document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
    } else {
        var geniusUrl = coalesceGeniusResults(data.response.hits, referenceTitle);
        if(geniusUrl.length > 0) {
            document.getElementById('popup-body').style.display = 'none';
            
            chrome.windows.getCurrent(function(win) {
                chrome.windows.update(win.id, {width: screen.width*.5});
            }); 
           
            var geniusWin = window.open(geniusUrl, "Genius Lyrics", 
                    "height=100, width=100");
            
            geniusWin.resizeTo(screen.width*.5, screen.height);
            console.log(screen);
            geniusWin.moveBy(screen.width/2, 0);
            // chrome.tabs.create({url: geniusUrl});
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
        document.getElementById('statusMsg').innerHTML = youtubeErrorMsg;
    var vidTitle = data.items[0].snippet.title;
    referenceTitle = consolidateQuery(vidTitle); 
    console.log(referenceTitle);
    $.ajax({
        url: 'http://api.genius.com/search?q='+referenceTitle+"&"+gAccessKey,
        dataType: 'json',
        success: function(data) {
            openTab(data);
        },
        error: function(data) {
            document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
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
            document.getElementById('statusMsg').innerHTML = youtubeErrorMsg;
        }
    });
};

/**
 * Listens for the the popup.html has loaded.
 * This will fire when the button in the nav bar is clicked
 */
document.addEventListener('DOMContentLoaded', function() {
    window.PC = new PopupController();
});
