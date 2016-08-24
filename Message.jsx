import React from 'react';
import * as emoji from 'node-emoji';

const Message = React.createClass({
  render() {
    const emojifiedString = emoji.emojify(this.props.message.message);
    return <p key={this.props.message._key}>{this.props.message.name}: {emojifiedString}</p>;
  }
});

export default Message;
