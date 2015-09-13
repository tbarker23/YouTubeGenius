/**
 * getUrl takes in a callback function and returns the current active tab's url
 * @params callback
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
 * @params vTitle - title string from YouTube
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
 * @params resultSet - JSON results from the genius API call 
 * @author tbarker
 */
function coalesceGeniusResults(resultSet) {
    var result = {};
    var i = 0;
    if(resultSet[0].result.title.indexOf("New Music") > -1) {
        return resultSet[1].result.url;
    } else {
        return resultSet[0].result.url;
    }
};

/**
 * Listens for the the popup.html has loaded.
 * This will fire when the button in the nav bar is clicked
 */
document.addEventListener('DOMContentLoaded', function() {
    var ytAccessKey = "key=AIzaSyDSnJWsRh_7hetLxutrfffzDT6V71iX_4w";
    var gAccessKey = "access_token=fW9FvH_s8IXkdHb_FusAmKV4jvSkyQJBvAKOXCrCuijTSoTEx8MxKlLWTqaj3opU";
    var youtubeErrorMsg = "Uh-Oh! Looks like there is some problem with YouTube API request<br><br>Are you sure you're on a YouTube.com page?";
    var geniusSongNotFound = "Uh-Oh! Looks like Genius.com doesn't have that track!";

    getUrl(function(url) {
    var videoId = url.split("v=")[1];

    $.ajax({
        url: 'https://www.googleapis.com/youtube/v3/videos?id='+videoId+'&'+ytAccessKey+'&part=snippet,contentDetails,statistics,status',
        dataType: 'json', 
        success: function(data) {
            if(data.items.length == 0)
                document.getElementById('statusMsg').innerHTML = youtubeErrorMsg;
            var vidTitle = data.items[0].snippet.title;
            vidTitle = consolidateQuery(vidTitle); 
            console.log(vidTitle);
            $.ajax({
                url: 'http://api.genius.com/search?q='+vidTitle+"&"+gAccessKey,
                dataType: 'json',
                success: function(data) {
                    console.log(data);
                    if(data.response.hits.length == 0) {
                        console.log("here");
                        document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
                    } else {
                        var geniusUrl = coalesceGeniusResults(data.response.hits);
                        console.log(geniusUrl); 
                        document.getElementById('gLink').setContent = geniusUrl;
                        chrome.tabs.create({url: geniusUrl});
                    }
                },
                error: function(data) {
                    document.getElementById('statusMsg').innerHTML = geniusSongNotFound;
                }
            });        
        },
        error: function(data) {
            document.getElementById('statusMsg').innerHTML = youtubeErrorMsg;
        }
    });
});
});
