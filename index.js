'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const rp = require('request-promise');

const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');
const { Carousel } = require('actions-on-google');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

const imageUrl = 'https://developers.google.com/actions/images/badges/XPM_BADGING_GoogleAssistant_VER.png';
const imageUrl2 = 'https://lh3.googleusercontent.com/Nu3a6F80WfixUqf_ec_vgXy_c0-0r4VLJRXjVFF_X_CIilEu8B9fT35qyTEj_PEsKw';
const linkUrl = 'https://assistant.google.com/';
const API_KEY = '157f9eb7';

const server = express();

server.use(bodyParser.urlencoded({
  extended: true
}));
server.use(bodyParser.json());

server.post('/dialog-flow-fulfillment', (request, response) => {
  const agent = new WebhookClient({ request, response });

  function googleAssistantOther(agent) {
    // Get Actions on Google library conv instance
    let conv = agent.conv();
    // Use Actions on Google library to add responses
    conv.ask('Please choose an item:');
    conv.ask(new Carousel({
      title: 'Google Assistant',
      items: {
        'WorksWithGoogleAssistantItemKey': {
          title: 'Works With the Google Assistant',
          description: 'If you see this logo, you know it will work with the Google Assistant.',
          image: {
            url: imageUrl,
            accessibilityText: 'Works With the Google Assistant logo',
          },
        },
        'GoogleHomeItemKey': {
          title: 'Google Home',
          description: 'Google Home is a powerful speaker and voice Assistant.',
          image: {
            url: imageUrl2,
            accessibilityText: 'Google Home'
          },
        },
      },
    }));
    // Add Actions on Google library responses to your agent's response
    agent.add(conv);
  }

  function welcome(agent) {
    agent.add(`Welcome to my agent!`);
  }

  function fallback(agent) {
    agent.add(`I didn't understand`);
    agent.add(`I'm sorry, can you try again?`);
  }

  function other(agent) {




    const movieToSearch = request.body.queryResult.parameters.movie || 'The Godfather';
    console.log(`Others: Got request for ${movieToSearch}`);
    console.log(`Getting data for: ${request.body.queryResult.parameters.movie || 'the requested movie'}`);

    const options = {
      uri: 'https://www.omdbapi.com/',
      json: true,
      qs: {
        t: movieToSearch,
        apikey: API_KEY
      }
    };

    return rp(options)
      .then((movie) => {
        console.log(`Got Movie Details from OMDb`);
        const responseDataToSend = `${movie.Title} is a ${movie.Actors} starer ${movie.Genre} movie, released in ${movie.Year}. It was directed by ${movie.Director}`;
        console.log(`Generated response as ${responseDataToSend}`);
        agent.add(responseDataToSend);
        console.log(`Added response to agent`);
      }, (error) => {
        console.log(`Got an error as ${error}`);
        agent.add(`Sorry bout that! An error prevented getting data for: ${request.body.queryResult.parameters.movie || 'the requested movie'}`);
      })
      .catch(function (err) {
        console.log(`Caught an err as ${err}`);
        agent.add(err);
      });




    // agent.add(`This message is from Dialogflow's Cloud Functions for Firebase editor!`);
    // const newCard = new Card({
    //     title: `Title: this is a card title`,
    //     imageUrl: imageUrl,
    //     text: `This is the body text of a card.  You can even use line\n  breaks and emoji! 💁`,
    //     buttonText: 'This is a button',
    //     buttonUrl: linkUrl
    // });
    // // newCard.setPlatform('facebook');
    // agent.add(newCard);
    // agent.add(new Suggestion(`Quick Reply`));
    // agent.add(new Suggestion(`Suggestion`));
    // agent.setContext({ name: 'weather', lifespan: 2, parameters: { city: 'Rome' }});
  }

  // Run the proper handler based on the matched Dialogflow intent
  let intentMap = new Map();
  intentMap.set('Default Welcome Intent', welcome);
  intentMap.set('Default Fallback Intent', fallback);
  if (agent.requestSource === agent.ACTIONS_ON_GOOGLE) {
    intentMap.set(null, googleAssistantOther);
  } else {
    intentMap.set(null, await other);
  }
  agent.handleRequest(intentMap);
});

server.listen((process.env.PORT || 8000), () => {
  console.log("Server is up and running...");
});
