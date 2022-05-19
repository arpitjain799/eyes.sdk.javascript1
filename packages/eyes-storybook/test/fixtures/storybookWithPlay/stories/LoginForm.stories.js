import React from 'react';
import { within, userEvent } from '@storybook/testing-library';

import { LoginForm } from './LoginForm';

// Function to emulate pausing between interactions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
const clickSubmitDelay = 1000;
export default {
  title: 'Examples/Login',
  component: LoginForm,
  args: {
    clickSubmitDelay
  },
};
const Template = (args) => <LoginForm {...args} />;
export const FilledForm = Template.bind({});
FilledForm.play = async ({ canvasElement }) => {
  // Starts querying the component from its root element
  const canvas = within(canvasElement);

  await userEvent.type(canvas.getByTestId('email'), 'email@example.com', {
    delay: 100,
  });
  await userEvent.type(canvas.getByTestId('password'), '12345678', {
    delay: 100,
  });
  await sleep(clickSubmitDelay);
  // See https://storybook.js.org/docs/react/essentials/actions#automatically-matching-args to learn how to setup logging in the Actions panel
  await userEvent.click(canvas.getByRole('button'));
};

