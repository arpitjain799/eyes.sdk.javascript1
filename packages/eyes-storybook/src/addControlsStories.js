'use strict';

function addControlsStories(stories) {
    const storiesIncludingControls = stories.reduce((stories, story) => {
        const argTypes = story.parameters?.argTypes

        const controlsKeys = Object.keys(argTypes).filter((k) => argTypes[k].visualTest);
        
        if (controlsKeys) {
            let controlsStories = [];

            controlsKeys.forEach((key) => {
                argTypes[key].options.forEach((option) => {
                    let controlStory = JSON.parse(JSON.stringify(story));

                    // add validation
                    controlStory.parameters.eyes.controls = {
                        name: key,
                        value: option,
                    }

                    controlsStories.push(controlStory);
                })
            })

            return [...stories, ...controlsStories]

        } else {
            return [...stories, story];
        }
    }, [])

    return storiesIncludingControls;
}


module.exports = addControlsStories;