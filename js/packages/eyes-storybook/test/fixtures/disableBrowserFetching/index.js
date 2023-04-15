/* eslint-disable */
import React from 'react';
import {storiesOf} from '@storybook/react';

storiesOf('disable browser fetching', module).add('page', () => {
  return (
    <div class="hasImg" style={{width: '200px', height: '200px'}}>
      Should have an image here (If SDK can fetch it).
    </div>
  );
});
