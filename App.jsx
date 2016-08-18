import React from 'react';
import * as firebase from 'firebase';

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
      </div>
    );
  }
}

export default App;
