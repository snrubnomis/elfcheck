/*eslint-env node*/
var express = require('express');
var cfenv = require('cfenv');
var _ = require('lodash');

// Twitter
var TwitterPackage = require('twitter');
var secret = {
  consumer_key: 'kRwNBpPdAuZBg2x03PNTGrgEs',
  consumer_secret: 'AQ1rXOeVLwjcWzSw5lbIkOjMzzJaNvyh3Ejww1CLfXrs053SBF',
  access_token_key: '795966157991923712-yCWF9AdvIxbMnlcFBjDLpBcrX4SUiKo',
  access_token_secret: 'Rdw3R4EtcaLyHmw9uUEORPJfTBlcBz3pdyaP0WcOIelEO'
}
var twitter = new TwitterPackage(secret);

// Watson Tone Analyzer
var watson = require('watson-developer-cloud');
var tone_analyzer = watson.tone_analyzer({
  username: '83db3fbe-1356-412f-88f5-80dd2896cc8e',
  password: '7bMW3QqRVe8T',
  version: 'v3',
  version_date: '2016-05-19 '
});

// Watson Personality Insights
var PersonalityInsightsV3 = require('watson-developer-cloud/personality-insights/v3');
var personality_insights = new PersonalityInsightsV3({
  username: 'db174a3e-ad5a-4da5-882d-c00abd37926c',
  password: 'yHi6kOdw5Jpi',
  version_date: '2016-10-19'
});

// Watson Conversation
var ConversationV1 = require('watson-developer-cloud/conversation/v1');
var conversation = new ConversationV1({
  username: 'eab9ddce-8725-4f70-b20f-736dc20ba9fe',
  password: 'KhZ34fo0QoX0',
  version_date: '2016-07-01'
});


// create a new express server
var app = express();
// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));
// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();
// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});

var musicMap = {
  consumption_preferences_music_rap : "rap",
  consumption_preferences_music_country : "country",
  consumption_preferences_music_r_b : "R&B",
  consumption_preferences_music_hip_hop : "hip hop",
  consumption_preferences_music_latin : "latin",
  consumption_preferences_music_rock : "rock",
  consumption_preferences_music_classical : "classical"
};

var movieMap = {
  consumption_preferences_movie_romance : "romance",
  consumption_preferences_movie_adventure : "adventure",
  consumption_preferences_movie_horror : "horror",
  consumption_preferences_movie_musical : "musical",
  consumption_preferences_movie_historical : "historical",
  consumption_preferences_movie_science_fiction : "science fiction",
  consumption_preferences_movie_war : "war",
  consumption_preferences_movie_drama : "drama",
  consumption_preferences_movie_action : "action",
  consumption_preferences_movie_documentary : "documentary"
};

function getPreferences (personality) {
  var context = {};
  var environmentalPrefs = _.find(personality.consumption_preferences, {consumption_preference_category_id : "consumption_preferences_environmental_concern"}).consumption_preferences;
  context.likesEnvironment = _.find(environmentalPrefs, {consumption_preference_id : "consumption_preferences_concerned_environment"}).score === 1;
  console.log("environment: " + context.likesEnvironment);

  var entrepreneurshipPrefs = _.find(personality.consumption_preferences, {consumption_preference_category_id : "consumption_preferences_entrepreneurship"}).consumption_preferences;
  context.likesEntrepreneurship = _.find(entrepreneurshipPrefs, {consumption_preference_id : "consumption_preferences_start_business"}).score === 1;
  console.log("entrepreneurship: " + context.likesEntrepreneurship);

  var shoppingPrefs = _.find(personality.consumption_preferences, {consumption_preference_category_id : "consumption_preferences_shopping"}).consumption_preferences;
  context.likesClothes = _.find(shoppingPrefs, {consumption_preference_id : "consumption_preferences_clothes_style"}).score === 1;
  console.log("clothes: " + context.likesClothes);

  var activityPrefs = _.find(personality.consumption_preferences, {consumption_preference_category_id : "consumption_preferences_health_and_activity"}).consumption_preferences;
  context.likesOutdoor = _.find(activityPrefs, {consumption_preference_id : "consumption_preferences_outdoor"}).score === 1;
  context.likesSports = _.find(activityPrefs, {consumption_preference_id : "consumption_preferences_adventurous_sports"}).score === 1;
  context.likesGym = _.find(activityPrefs, {consumption_preference_id : "consumption_preferences_gym_membership"}).score === 1;
  context.likesEatingOut = _.find(activityPrefs, {consumption_preference_id : "consumption_preferences_eat_out"}).score === 1;
  console.log("outdoor/sports/gym/eating out: " + context.likesOutdoor, context.likesSports, context.likesGym, context.likesEatingOut);

  var bookPrefs = _.find(personality.consumption_preferences, {consumption_preference_category_id : "consumption_preferences_reading"}).consumption_preferences;
  context.likesReading = _.find(bookPrefs, {consumption_preference_id : "consumption_preferences_read_frequency"}).score === 1 ||
                     _.find(bookPrefs, {consumption_preference_id : "consumption_preferences_read_motive_enjoyment"}).score === 1;
  context.likesReadingMagazines = _.find(bookPrefs, {consumption_preference_id : "consumption_preferences_books_entertainment_magazines"}).score === 1;
  context.likesReadingFinance = _.find(bookPrefs, {consumption_preference_id : "consumption_preferences_books_financial_investing"}).score === 1;
  context.likesReadingBiographies = _.find(bookPrefs, {consumption_preference_id : "consumption_preferences_books_autobiographies"}).score === 1;
  context.likesReadingNonFiction = _.find(bookPrefs, {consumption_preference_id : "consumption_preferences_books_non_fiction"}).score === 1;
  console.log("reading/magazines/finance/bios/nonfiction: " + context.likesReading, context.likesReadingMagazines, context.likesReadingFinance, context.likesReadingBiographies, context.likesReadingNonFiction);

  var musicPrefs = _.find(personality.consumption_preferences, {consumption_preference_category_id : "consumption_preferences_music"}).consumption_preferences;
  var favouriteMusic = _.find(musicPrefs, {score : 1});
  console.log(favouriteMusic);
  if (favouriteMusic) {
    context.favouriteMusic = musicMap[favouriteMusic.consumption_preference_id];
  }
  context.likesLiveMusic = _.find(musicPrefs, {consumption_preference_id : "consumption_preferences_music_live_event"}).score === 1;
  context.likesPlayingMusic = _.find(musicPrefs, {consumption_preference_id : "consumption_preferences_music_playing"}).score === 1;
  console.log("fav music: " + context.favouriteMusic);
  console.log("live music/playing music: " + context.likesLiveMusic, context.likesPlayingMusic);

  var moviePrefs = _.find(personality.consumption_preferences, {consumption_preference_category_id : "consumption_preferences_movie"}).consumption_preferences;
  var favouriteMovie = _.find(moviePrefs, {score : 1});
  if (favouriteMovie) {
    context.favouriteMovie = movieMap[favouriteMovie.consumption_preference_id];
  }
  console.log("fav movie: " + context.favouriteMovie);

  return context;
}


// Track messages referencing the bot
twitter.stream('statuses/filter', {track: '@elfcheck'},
  function (stream) {
    stream.on('data', function (tweet) {
      console.log(tweet.text);

      // Check for other twitter username
      var twitterUser;
      var otherPerson;
      var usernames = tweet.text.match(/@\w+/g);
      for (var i = 0; i < usernames.length; i++) {
        if (usernames[i] != '@elfcheck') {
          twitterUser = usernames[i].substring(1);
          otherPerson = twitterUser;
          console.log("TWITTER USERNAME = " + twitterUser);
          break;
        }
      }

      if (!twitterUser) {
        twitterUser = tweet.user.screen_name;
      }

      // Get user's timeline
      console.log("GETTING TIMELINE FOR " + twitterUser);
      twitter.get('statuses/user_timeline', { screen_name : twitterUser},
        function (error, response) {
          var allText = ""
          var timeline = response;
          for (var i = 0; i < timeline.length; i++) {
            allText += timeline[i].text + '\n';
          }

          // Analyze tone of tweets
          console.log("ANALYZING TONE");
          tone_analyzer.tone({ text: allText },
            function(err, tone) {
              var naughty = false;
              if (err) {
                console.log(err);
              } else {
                // console.log(JSON.stringify(tone, null, 2));
                var tones = tone.document_tone.tone_categories[0].tones;
                for (var i = 0; i < tones.length; i++) {
                  if (tones[i].tone_id == "anger" && tones[i].score > 0.3) {
                    naughty = true;
                  }
                  if (tones[i].tone_id == "disgust" && tones[i].score > 0.3) {
                    naughty = true;
                  }
                  if (tones[i].tone_id == "sadness" && tones[i].score > 0.45) {
                    naughty = true;
                  }
                }
              }

              // Personality
              personality_insights.profile({ text: allText, consumption_preferences: true },
                function (err, response) {
                  if (err) {
                    console.log('error:', err);
                  } else {
                    // console.log(JSON.stringify(response.consumption_preferences, null, 2));
                    var context = getPreferences(response);

                    // Conversation
                    console.log("CONVERSATION");
                    console.log("TWEET: " + tweet.text);
                    context.name = '@' + tweet.user.screen_name;
                    if (otherPerson) {
                      context.otherPerson = '@' + otherPerson;
                    }
                    context.naughty = naughty;
                    var message = {
                      input: { text: tweet.text },
                      workspace_id: '93430f5f-462f-4041-87e8-ad2ddcbb274c',
                      context : context
                    };
                    console.log("INPUT: " + message.input.text);
                    conversation.message(message,
                      function(err, convoResponse) {
                        if (err) {
                          console.error(err);
                        } else {
                          console.log(convoResponse);
                          console.log(convoResponse.output);
                          // Post a response
                          console.log("POSTING RESPONSE");
                          var statusResponse = {
                            status : convoResponse.output.text[0],
                            in_reply_to_status_id : tweet.id_str
                          }
                          console.log(statusResponse.status);
                          twitter.post('statuses/update', statusResponse,
                            function (error, tweetReply, tweetResponse) {
                              if (error) {
                                console.log(error);
                              } else {
                                console.log("TWEET SUCCESSFUL");
                              }
                            }
                          );
                        }
                      }
                   ); // CONVERSATION
                  }
              });  // PERSONALITY
            }
          ); // TONE
        }
      ); // TWITTER TIMELINE
    });

    // Handle errors from the stream
    stream.on('error', function (error) {
      console.log(error);
    });
  }
);
