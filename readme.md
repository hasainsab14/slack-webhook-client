# How to connect ODA to Slack

## Deploy the node app
 - go to the server and do git clone
 - run the following command
 ```
 $ npm install
 ```

## Create a channel on ODA
 - create a bot in ODA
 - go to settings > Channels
 - Click `Channel`
 - Enter a Slack for `Name`
 - Enter a description for `Description`
 - Select *Webhook* for `Channel Type`
 - Enter the ngrok url with the extension
   - Example https://06696d1d.ngrok.io/webhook/messages 
 - Select *Enabled* for `Channel Enabled`
 - copy the webhook url and the secret key
 - in the source code find the .env
 - replace the sample ODA_CHANNEL_URL with the webhook url
 - replace the sample ODA_SECRET_KEY with the secret key

## Create a Slack Application
 - go to api.slack.com/apps
 - click `Create New App`
 - select your workspace
 - go to Interactive Components
 - Enable and enter your ngrok URL + /interactive-components
    - example: https://xxxxxxxx.ngrok.io/interactive-components
 - save changes
 - go to OAuth & Permissions
 - go to scopes and enter *chat:write:bot* and *users:read*
 - save changes
 - go to Install App
 - Click install app
 - copy Bot User OAuth Access Token
 - paste the token in for Slack_TOKEN in the .env file
 - go to Basic Information > App Credentials
 - Copy the Verification Token and paste it in for SLACK_VERIFICATION in the .env file

# Run the File
 - go to the server and run the command
 ```
 $ node app.js
 ```
 - chat with the bot in Slack