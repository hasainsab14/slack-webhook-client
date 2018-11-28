require('dotenv').config();

const axios = require('axios');
const bodyParser = require('body-parser');
const express = require('express');
const RtmClient = require('@slack/client').RtmClient;
const RTM_EVENTS = require('@slack/client').RTM_EVENTS;
const qs = require('querystring');
const webhook = require('./webhookUtil');


const PORT = process.env.PORT;
const channelUrl = process.env.IBCS_CHANNEL_URL;
const IBCS_SECRET_KEY = process.env.IBCS_SECRET_KEY;
const SLACK_TOKEN = process.env.SLACK_TOKEN;
const SLACK_VERIFICATION_TOKEN= process.env.SLACK_VERIFICATION_TOKEN;

var channel;
var SlackUserId;
var SlackBotId;


// start the Real time messaging
var rtm = new RtmClient(SLACK_TOKEN);
rtm.start();

var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
var urlencodedParser = bodyParser.urlencoded({extended: false});

//for default page
app.get('/', (req, res) => {
    res.send('<h2>Welcome to the Slack Webhook for IBCS</h2><p>please read the'+
    'readme file thats included in the source code</p>');
});

/*
    RTM Listener
    when user sends a direct message to the bot initiate a conversation
    with IBCS and send messsage to IBCS
*/
rtm.on(RTM_EVENTS.MESSAGE, (message) => {
    console.log("\nStart of RTM");
    console.log("userid: ", SlackUserId);
    console.log("channel: ", channel);
    console.log("message from slack: ", message);

    //if message came from bot then exit
    if(message.bot_id){
        SlackBotId = message.bot_id;
        return; 
    }

    SlackUserId = message.user;
    channel = message.channel;
    
    //Send the Messsage to IBCS
    webhook.messageToBot(channelUrl, IBCS_SECRET_KEY, SlackUserId, message.text, (err) =>{
        if(err){
            console.log("\nerror from IBCS:", err);
        }
    });
    
    console.log("\nEnd of RTM");
    console.log("userid: ", SlackUserId);
    console.log("channel: ", channel);
    console.log("bot id: ", SlackBotId);
    console.log("message to IBCS: ", message.text);
});

/* 
    IBCS Webhook listner
    When message is sent from IBCS, package the message and send it to Slack
*/
app.post('/webhook/messages', bodyParser.json(), (req, res) =>{
        // when IBCS sends a message to this REST call forward it to Slack channel
        // basic template for message
        var message = {
            token: SLACK_TOKEN,
            as_user: true,
            link_names:true,
        };

        response = req.body.text;
        console.log("\nresponse from IBCS");
        console.log("text: ", response);
        console.log("User id: ", req.body.userId);
        


        if(req.body.choices){
            //if there are options from IBCS format the message for slack
            //delete after test
            choices = req.body.choices;
            console.log("choices: ", req.body.choices);
            
            message.channel = channel;
            message.text = response;

            message.attachments = choices.map( (choice) =>{
                var attachment = {
                    fallback: "asdf",
                    callback_id: "asd",
                    color: "#3AA3E3",
                    attachment_type: "default",
                    actions: [{
                        name: choice,
                        text: choice,
                        type: 'button',
                        value: choice
                    }]
                }
                return attachment;
            });

            console.log("message to Slack from IBCS");
            console.log("message: ", message.attachments[0].actions);

            // Prep the JSON message to be sent to Slack
            message.attachments = JSON.stringify(message.attachments);
            const params = qs.stringify(message);
            
            // Send the Message to Slack
            axios.post('https://slack.com/api/chat.postMessage',  params)
            .then((result) =>{
                //console.log("result from slack interactive message:", result.data);
            })
            .catch((err)=>{
                console.log("error from Slack Interactive message: ", err);
            });
            
        } else {
            //if the message from IBCS is a simple message then forward to slack
                
            //check verification token
                //TODO
            //else send to slack
            
            // Prep the JSON message to be sent to Slack
            message.channel = channel;
            message.text = response;
            const params = qs.stringify(message);

            console.log("message to Slack from IBCS");
            console.log("message: ", message);
            
            // Send the Message to Slack
            axios.post('https://slack.com/api/chat.postMessage',  params)
            .then((result) =>{
                //console.log("result from slack interactive message:", result.data);
            })
            .catch((err)=>{
                console.log("error from Slack Interactive message: ", err);
            });
        }
        
        //send okay to IBCS
        res.sendStatus(200);
});


/* 
    Slacks Redirect URL for Buttons
    When we get a response back from an interactive message
*/
app.post('/interactive-messages', (req, res) => {
    const { actions, token} = JSON.parse(req.body.payload);
    
    console.log("\ninteractive messages");
    console.log("message from Slack after button: ", req.body.payload);
    
    // Check if the token provided is verifed
    if( token === SLACK_VERIFICATION_TOKEN){
        const response = actions[0].name;
        console.log("choice response from IBCS", response);

        // Send the Message to IBCS
        webhook.messageToBot(channelUrl, IBCS_SECRET_KEY, SlackUserId, response, (err) =>{
            if(err){
                console.log(err);
            }
        });
        res.send("");
    } else {res.sendStatus(500);}
});


// deploy express server and listen on port
app.listen(PORT || process.env.port, function(){
    console.log(`app running on ${PORT}`)
});