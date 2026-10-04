const React = require('react');
const { Pressable, View } = require('react-native');

const FlashList = React.forwardRef((props, ref) => {
  React.useImperativeHandle(ref, () => ({
    scrollToTop() {},
  }));

  const data = props.data ?? [];

  return React.createElement(
    View,
    null,
    data.map((item, index) =>
      React.createElement(
        View,
        { key: props.keyExtractor(item, index) },
        props.renderItem({ item, index }),
      ),
    ),
    props.ListFooterComponent ?? null,
    React.createElement(Pressable, {
      testID: 'list-end',
      onPress: () => {
        if (props.onEndReached) {
          props.onEndReached();
        }
      },
    }),
  );
});

module.exports = { FlashList };
