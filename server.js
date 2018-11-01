const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

const AWS = require('aws-sdk/global');
const AWSIoTData = require('aws-iot-device-sdk');

AWS.config.region = 'us-east-1';
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: 'us-east-1:35299f6f-fa5f-49bf-b36d-4538cada935e'
});

const host = 'ahc4edec5fxm7-ats.iot.us-east-1.amazonaws.com';
const iotTopic = '$aws/things/deeplens_6U04ifMvRJGlPCtAPwVwdw/infer';

let detection = false;
let request = require('request');

let shadowListeners = (shadows) => {
  shadows.on('connect', () => {
    console.log('AWS connection established');
    shadows.subscribe(iotTopic);
  });
  shadows.on('reconnect', () => {
    // console.log('reconnect...');
  });
  shadows.on('message', (topic, message) => {
    // console.log('message:', topic, message.toString());
    let signal = JSON.parse(message);
    if (signal.hasOwnProperty('person')) {
      detection = (signal.person > 0.5) ? true : false;
    }
  });
};

let connectionToAWS = () => {
  let cognitoIdentity = new AWS.CognitoIdentity();
  AWS.config.credentials.get(function (err, data) {
    if (!err) {
      var params = {
        IdentityId: AWS.config.credentials.identityId
      };
      cognitoIdentity.getCredentialsForIdentity(params, function (err, data) {
        if (!err) {

          const shadows = AWSIoTData.device({
            region: AWS.config.region,
            host: host,
            clientId: 'mqtt-client-' + (Math.floor((Math.random() * 100000) + 1)),
            protocol: 'wss',
            maximumReconnectTimeMs: 8000,
            debug: true,
            accessKeyId: data.Credentials.AccessKeyId,
            secretKey: data.Credentials.SecretKey,
            sessionToken: data.Credentials.SessionToken
          });

          shadowListeners(shadows);
        } else {
          alert('error retrieving credentials: ' + err);
        }
      });
    } else {
      console.log('error retrieving identity:' + err);
      alert('error retrieving identity: ' + err);
    }
  });
};

let bodyParser = require('body-parser');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/test', (req, res) => {
  res.send('test connection is successful');
});

app.get('/person', (req, res) => {
  res.json({ 'detection': detection });
});

// slack bot conversations
app.post('/connection', (req, res) => {

  let payload = req.body;
  if (payload.event.type === 'app_mention') {
    if (payload.event.text.includes('ping pong') || payload.event.text.includes('table tennis')) {
      console.log('received message');
      // Make call to chat.postMessage using bot's token
      let response_text = (detection) ? 'I can see someone playing table tennis' : 'No one is playing table tennis';
      
      let postData = {
        token : 'xoxb-2608382544-468200448372-ebxjfUazOJNVZtU51YLQ0I4r',
        channel: '#pingpingping',
        text: response_text
      };

      var clientServerOptions = {
        uri: 'https://slack.com/api/chat.postMessage',
        body: JSON.stringify(postData),
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
            // 'Authorization': 'xoxb-2608382544-468200448372-ebxjfUazOJNVZtU51YLQ0I4r'
        }
      }

      request(clientServerOptions, function (error, response) {
        if (!error) {
          console.log('post success');
          res.sendStatus(200);
          res.json(response);
        } else {
          console.log('error:', error);
        }
      });
    }
  }
});

app.listen(port, () => {
  console.log('listening on port ' + port.toString() + '...');
});

connectionToAWS();
