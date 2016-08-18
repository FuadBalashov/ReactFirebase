import React from 'react';

const Input = React.createClass({
  propTypes: {
    label: React.PropTypes.string,
    value:  React.PropTypes.string,
    onChange:  React.PropTypes.func,
    onKeyPress:  React.PropTypes.func
  },
  render() {
    return (
      <div>
        <label htmlFor={this.props.label}>{this.props.label}</label>
        <input
          id={this.props.label}
          type="text"
          value={this.props.value}
          onChange={this.props.onChange}
          onKeyPress={this.props.onKeyPress}
        />
      </div>
    );
  }
});

export default Input;
