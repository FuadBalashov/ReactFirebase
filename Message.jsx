import React from 'react';

const Message = React.createClass({
  render() {
    return <p key={this.props.message._key}>{this.props.message.name}: {this.props.message.message}</p>;
  }
});

export default Message;
