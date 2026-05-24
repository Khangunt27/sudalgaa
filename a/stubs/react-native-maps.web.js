const React = require('react');
const { View } = require('react-native');

function MapView(props) {
  return React.createElement(View, { style: [ { backgroundColor: 'transparent', flex: 1 }, props.style ] }, props.children);
}

function Marker(props) {
  return React.createElement(View, props, props.children);
}

module.exports = {
  __esModule: true,
  default: MapView,
  Marker,
};


