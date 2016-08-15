import React from 'react';
import * as firebase from 'firebase';
import treant from 'treant';

const firebaseConfig = {
  apiKey: "AIzaSyDzTLJhoMxTNBADq2AOB83rclB2KIrRcEU",
  authDomain: "chatbox-6e584.firebaseapp.com",
  databaseURL: "https://chatbox-6e584.firebaseio.com",
  storageBucket: "chatbox-6e584.appspot.com",
};
const firebaseApp = firebase.initializeApp(firebaseConfig);

class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      // the page is the screen we want to show the user, we will determine that
      // based on what user the firebase api returns to us.
      name: "Bob",
      newMessage: "",
      messages: []
    };

    this.messagesRef = firebaseApp.database().ref('messages');
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.listenForItems = this.listenForItems.bind(this);
    this.clearChat = this.clearChat.bind(this);
  }

  componentDidMount() {
    this.listenForItems(this.messagesRef);
  }

  handleNameChange(event) {
    this.setState({name: event.target.value});
  }

  handleMessageChange(event) {
    this.setState({newMessage: event.target.value});
  }

  clearChat(event) {
    this.messagesRef.remove();
  }

  listenForItems(messagesRef) {
    messagesRef.on('value', (snap) => {
      // get children as an array
      var newMessages = [];
      snap.forEach((child) => {
        newMessages.push({
          name: child.val().name,
          message: child.val().message,
          _key: child.key
        });
      });

      this.setState({
        messages: newMessages
      });
    });
  }

  handleKeyPress(event) {
    if (!this.state.name || !this.state.newMessage) {
      return;
    }
    if (event.key === 'Enter') {
      this.messagesRef.push({ name: this.state.name, message: this.state.newMessage });
      this.setState({newMessage: ""});
    }
  }

  render() {
    const messageDivs = this.state.messages.map((message) => {
      return <p key={message._key}>{message.name}: {message.message}</p>;
    });

    var data = {"uid":217,"nodes":[{"nid":1,"type":"WebGLRenderer","x":1385,"y":330,"fields":{"in":[{"name":"width","val":800},{"name":"height","val":600},{"name":"scene"},{"name":"camera"},{"name":"bg_color"},{"name":"postfx"},{"name":"shadowCameraNear","val":3},{"name":"shadowCameraFar","val":3000},{"name":"shadowMapWidth","val":512},{"name":"shadowMapHeight","val":512},{"name":"shadowMapEnabled","val":false},{"name":"shadowMapSoft","val":true}],"out":[]}},{"nid":14,"type":"ParticleSystem","x":771,"y":156,"fields":{"in":[{"name":"children"},{"name":"position"},{"name":"rotation"},{"name":"scale"},{"name":"doubleSided","val":false},{"name":"visible","val":true},{"name":"castShadow","val":false},{"name":"receiveShadow","val":false},{"name":"geometry"},{"name":"material"},{"name":"sortParticles","val":false}],"out":[{"name":"out"}]}},{"nid":27,"type":"Scene","x":1119,"y":271,"fields":{"in":[{"name":"children"},{"name":"position"},{"name":"rotation"},{"name":"scale"},{"name":"doubleSided","val":false},{"name":"visible","val":true},{"name":"castShadow","val":false},{"name":"receiveShadow","val":false}],"out":[{"name":"out"}]}},{"nid":37,"type":"Camera","x":840,"y":825,"fields":{"in":[{"name":"fov","val":50},{"name":"aspect","val":1},{"name":"near","val":0.1},{"name":"far","val":2000},{"name":"position"},{"name":"target"},{"name":"useTarget","val":false}],"out":[{"name":"out"}]}},{"nid":47,"type":"Merge","x":991,"y":251,"fields":{"in":[{"name":"in0"},{"name":"in1"},{"name":"in2","val":null},{"name":"in3","val":null},{"name":"in4","val":null},{"name":"in5"}],"out":[{"name":"out"}]}},{"nid":58,"type":"ParticleBasicMaterial","x":424,"y":184,"fields":{"in":[{"name":"opacity","val":1},{"name":"transparent","val":true},{"name":"depthTest","val":false},{"name":"alphaTest","val":0},{"name":"polygonOffset","val":false},{"name":"polygonOffsetFactor","val":0},{"name":"polygonOffsetUnits","val":0},{"name":"blending","val":1},{"name":"color"},{"name":"map"},{"name":"size","val":30},{"name":"sizeAttenuation","val":true},{"name":"vertexColors","val":false}],"out":[{"name":"out"}]}},{"nid":73,"type":"RandomCloudGeometry","x":538,"y":11,"fields":{"in":[{"name":"nbrParticles","val":2000},{"name":"radius","val":1000},{"name":"rndVelocity"},{"name":"linearVelocity"}],"out":[{"name":"out"}]}},{"nid":77,"type":"Vector3","x":698,"y":884,"fields":{"in":[{"name":"x","val":0},{"name":"y","val":200},{"name":"z","val":700}],"out":[{"name":"xyz"},{"name":"x","val":0},{"name":"y","val":200},{"name":"z","val":700}]}},{"nid":89,"type":"Texture","x":245,"y":292,"fields":{"in":[{"name":"image","val":"examples/textures/sprites/spark1.png"}],"out":[{"name":"out"}]}},{"nid":94,"type":"Number","x":219,"y":131,"fields":{"in":[{"name":"in","val":0}],"out":[{"name":"out","val":0}]}},{"nid":98,"type":"Color","x":246,"y":181,"fields":{"in":[{"name":"r","val":1},{"name":"g","val":1},{"name":"b","val":1}],"out":[{"name":"rgb"},{"name":"r","val":1},{"name":"g","val":1},{"name":"b","val":1}]}},{"nid":108,"type":"Number","x":389,"y":420,"fields":{"in":[{"name":"in","val":0}],"out":[{"name":"out","val":0}]}},{"nid":112,"type":"Number","x":219,"y":80,"fields":{"in":[{"name":"in","val":1}],"out":[{"name":"out","val":1}]}},{"nid":117,"type":"Vector3","x":427,"y":90,"fields":{"in":[{"name":"x","val":4},{"name":"y","val":0},{"name":"z","val":0}],"out":[{"name":"xyz"},{"name":"x","val":4},{"name":"y","val":0},{"name":"z","val":0}]}},{"nid":127,"type":"Vector3","x":426,"y":6,"fields":{"in":[{"name":"x","val":0.3},{"name":"y","val":1},{"name":"z","val":1}],"out":[{"name":"xyz"},{"name":"x","val":0.3},{"name":"y","val":1},{"name":"z","val":1}]}},{"nid":137,"type":"Merge","x":1234,"y":732,"fields":{"in":[{"name":"in0"},{"name":"in1"},{"name":"in2","val":null},{"name":"in3","val":null},{"name":"in4","val":null},{"name":"in5","val":null}],"out":[{"name":"out"}]}},{"nid":146,"type":"BloomPass","x":987,"y":928,"fields":{"in":[{"name":"strength","val":2.4},{"name":"kernelSize","val":25},{"name":"sigma","val":4},{"name":"resolution","val":256}],"out":[{"name":"out"}]}},{"nid":153,"type":"VignettePass","x":1052,"y":1021,"fields":{"in":[{"name":"offset","val":1.4},{"name":"darkness","val":1.2}],"out":[{"name":"out"}]}},{"nid":158,"type":"ParticleSystem","x":772,"y":476,"fields":{"in":[{"name":"children"},{"name":"position"},{"name":"rotation"},{"name":"scale"},{"name":"doubleSided","val":false},{"name":"visible","val":true},{"name":"castShadow","val":false},{"name":"receiveShadow","val":false},{"name":"geometry"},{"name":"material"},{"name":"sortParticles","val":false}],"out":[{"name":"out"}]}},{"nid":172,"type":"RandomCloudGeometry","x":478,"y":493,"fields":{"in":[{"name":"nbrParticles","val":2000},{"name":"radius","val":2000},{"name":"rndVelocity"},{"name":"linearVelocity"}],"out":[{"name":"out"}]}},{"nid":179,"type":"ParticleBasicMaterial","x":530,"y":624,"fields":{"in":[{"name":"opacity","val":1},{"name":"transparent","val":true},{"name":"depthTest","val":false},{"name":"alphaTest","val":0},{"name":"polygonOffset","val":false},{"name":"polygonOffsetFactor","val":0},{"name":"polygonOffsetUnits","val":0},{"name":"blending","val":1},{"name":"color"},{"name":"map"},{"name":"size","val":40},{"name":"sizeAttenuation","val":true},{"name":"vertexColors","val":false}],"out":[{"name":"out"}]}},{"nid":195,"type":"Texture","x":287,"y":768,"fields":{"in":[{"name":"image","val":"examples/textures/sprites/snowflake4.png"}],"out":[{"name":"out"}]}},{"nid":199,"type":"Number","x":335,"y":582,"fields":{"in":[{"name":"in","val":1}],"out":[{"name":"out","val":1}]}},{"nid":203,"type":"Number","x":334,"y":626,"fields":{"in":[{"name":"in","val":0}],"out":[{"name":"out","val":0}]}},{"nid":208,"type":"Color","x":384,"y":694,"fields":{"in":[{"name":"r","val":0.16862745098039217},{"name":"g","val":0.3333333333333333},{"name":"b","val":0.5803921568627451}],"out":[{"name":"rgb"},{"name":"r","val":0.16862745098039217},{"name":"g","val":0.3333333333333333},{"name":"b","val":0.5803921568627451}]}}],"connections":[{"id":46,"from_node":37,"from":"out","to_node":1,"to":"camera"},{"id":55,"from_node":47,"from":"out","to_node":27,"to":"children"},{"id":56,"from_node":37,"from":"out","to_node":47,"to":"in5"},{"id":57,"from_node":14,"from":"out","to_node":47,"to":"in0"},{"id":86,"from_node":77,"from":"xyz","to_node":37,"to":"position"},{"id":87,"from_node":73,"from":"out","to_node":14,"to":"geometry"},{"id":88,"from_node":58,"from":"out","to_node":14,"to":"material"},{"id":92,"from_node":89,"from":"out","to_node":58,"to":"map"},{"id":93,"from_node":27,"from":"out","to_node":1,"to":"scene"},{"id":97,"from_node":94,"from":"out","to_node":58,"to":"depthTest"},{"id":107,"from_node":98,"from":"rgb","to_node":58,"to":"color"},{"id":111,"from_node":108,"from":"out","to_node":14,"to":"sortParticles"},{"id":115,"from_node":112,"from":"out","to_node":58,"to":"transparent"},{"id":116,"from_node":94,"from":"out","to_node":58,"to":"alphaTest"},{"id":126,"from_node":117,"from":"xyz","to_node":73,"to":"linearVelocity"},{"id":136,"from_node":127,"from":"xyz","to_node":73,"to":"rndVelocity"},{"id":145,"from_node":137,"from":"out","to_node":1,"to":"postfx"},{"id":152,"from_node":146,"from":"out","to_node":137,"to":"in0"},{"id":157,"from_node":153,"from":"out","to_node":137,"to":"in1"},{"id":171,"from_node":158,"from":"out","to_node":47,"to":"in1"},{"id":178,"from_node":172,"from":"out","to_node":158,"to":"geometry"},{"id":194,"from_node":179,"from":"out","to_node":158,"to":"material"},{"id":198,"from_node":195,"from":"out","to_node":179,"to":"map"},{"id":202,"from_node":199,"from":"out","to_node":179,"to":"transparent"},{"id":206,"from_node":203,"from":"out","to_node":179,"to":"depthTest"},{"id":207,"from_node":203,"from":"out","to_node":179,"to":"alphaTest"},{"id":217,"from_node":208,"from":"rgb","to_node":179,"to":"color"}]}
;

    return (
      <div>
        <h2>Chat Application!!!</h2>
        <div>
          {messageDivs}
        </div>
        <label htmlFor="message">Message</label>
        <input
          id="message"
          type="text"
          value={this.state.newMessage}
          onChange={this.handleMessageChange}
          onKeyPress={this.handleKeyPress}
        />
        <br/>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={this.state.name}
          onChange={this.handleNameChange}
        />
        <br/>
        <button onClick={this.clearChat}>Clear Chat History</button>
        <ReactNodeGraph data = {data}/>
      </div>
    );
  }
}

export default App;
